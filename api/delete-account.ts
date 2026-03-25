// api/delete-account.ts — GDPR account deletion endpoint
// Deletes all user data (analyses, profile) then removes the auth user.
// Uses SUPABASE_SERVICE_ROLE_KEY for admin.deleteUser — never exposed to client.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth, handlePreflight, checkRateLimit } from "./_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Rate limit: 3 attempts per hour to prevent abuse
    const rl = await checkRateLimit("delete-account", user.id, user.tier, { freeLimit: 3, proLimit: 3, windowSeconds: 3600 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[delete-account] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Delete user data in dependency order: analyses → profiles → auth user
    const { error: analysesErr } = await supabaseAdmin.from("analyses").delete().eq("user_id", user.id);
    if (analysesErr) {
      console.error("[delete-account] Failed to delete analyses:", analysesErr.message);
      // Continue — don't block account deletion for data cleanup failure
    }

    const { error: profileErr } = await supabaseAdmin.from("profiles").delete().eq("id", user.id);
    if (profileErr) {
      console.error("[delete-account] Failed to delete profile:", profileErr.message);
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authErr) {
      console.error("[delete-account] Failed to delete auth user:", authErr.message);
      return res.status(500).json({ error: "Failed to delete account. Please contact support." });
    }

    console.info("[delete-account] Successfully deleted user %s", user.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[delete-account] Unhandled error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
}
