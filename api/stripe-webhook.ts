// api/stripe-webhook.ts — Stripe webhook: update subscription_status in Supabase
//
// Events handled:
//   checkout.session.completed      → set 'pro' or 'team' based on price ID
//   customer.subscription.deleted   → revert to 'free'
//   customer.subscription.updated   → sync past_due / paused states
//
// Raw body is read directly from the stream (Vercel does not auto-parse bodies
// for plain serverless functions), which is required for Stripe signature verification.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  // ── Verify Stripe signature ───────────────────────────────────────────────
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    console.error("[stripe-webhook] Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
    return res.status(400).json({ error: "Configuration error" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await getRawBody(req), sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // ── Handle events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.client_reference_id;
        if (!userId) {
          console.error(
            "[stripe-webhook] No client_reference_id on session:",
            session.id
          );
          break;
        }

        // Determine tier by matching the purchased price ID
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 1 }
        );
        const priceId = lineItems.data[0]?.price?.id ?? null;
        const isTeam = priceId === process.env.STRIPE_TEAM_PRICE_ID;
        const newStatus = isTeam ? "team" : "pro";

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: newStatus,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("[stripe-webhook] DB update failed:", error);
          return res.status(500).json({ error: "DB update failed" });
        }

        console.log(`[stripe-webhook] ${userId} → ${newStatus}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "free",
            stripe_subscription_id: null,
            subscription_updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("[stripe-webhook] Failed to downgrade:", error);
          return res.status(500).json({ error: "DB update failed" });
        }

        console.log(`[stripe-webhook] customer ${customerId} → free`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Sync degraded states to free so feature gates fire correctly
        if (
          sub.status === "past_due" ||
          sub.status === "paused" ||
          sub.status === "unpaid"
        ) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "free",
              subscription_updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          console.log(
            `[stripe-webhook] customer ${customerId} → free (${sub.status})`
          );
        }
        break;
      }

      default:
        // Silently ignore unhandled events
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    // Return 500 so Stripe retries delivery
    return res.status(500).json({ error: "Handler failed" });
  }
}
