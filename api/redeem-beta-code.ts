// api/redeem-beta-code.ts
// POST { code: string } — validates and redeems a beta access code.
// Auth required. Rate limited to 5 attempts per user per hour.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

export const maxDuration = 10;

// 5 attempts/hour for all tiers — beta gate is not tier-gated
const RATE = { freeLimit: 5, proLimit: 5, windowSeconds: 3600 };

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rl = await checkRateLimit("redeem_beta_code", user.id, user.tier, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "Too many attempts. Try again later.", resetAt: rl.resetAt });
    }

    const { code } = req.body ?? {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code is required" });
    }

    // Normalize: uppercase + trim + cap length (CUTSHEET-XXXX is 13 chars)
    const normalized = code.toUpperCase().trim().slice(0, 32);

    const supabase = getSupabaseAdmin();

    // Look up an unused matching code
    const { data: betaCode, error: lookupError } = await supabase
      .from("beta_codes")
      .select("id, used")
      .eq("code", normalized)
      .eq("used", false)
      .single();

    if (lookupError || !betaCode) {
      return res.status(400).json({ error: "Invalid or already used code" });
    }

    // Mark code as used — re-check used = false to prevent double-redemption under race
    const { error: markError } = await supabase
      .from("beta_codes")
      .update({ used: true, used_by: user.id })
      .eq("id", betaCode.id)
      .eq("used", false);

    if (markError) {
      console.error("[redeem-beta-code] failed to mark code used:", markError.message);
      return res.status(500).json({ error: "Redemption failed. Please try again." });
    }

    // Grant beta_access on the user's profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ beta_access: true })
      .eq("id", user.id);

    if (profileError) {
      // Code is consumed — be transparent so support can manually grant access
      console.error("[redeem-beta-code] failed to grant beta_access:", profileError.message);
      return res.status(500).json({
        error: "Code accepted but access grant failed. Contact support with your code.",
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[redeem-beta-code] error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Redemption failed. Please try again." });
  }
}
