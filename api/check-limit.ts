// api/check-limit.ts — Auth + Gemini rate-limit gate
// Browser calls this BEFORE starting any Gemini analysis.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { createClient } from "@supabase/supabase-js";

const FREE_ANALYSES_LIMIT = 3;
const RATE: { freeLimit: number; proLimit: number; windowSeconds: number } = {
  freeLimit: 20,
  proLimit: 60,
  windowSeconds: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1. Verify auth
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // 2. Rate limit
  const rl = await checkRateLimit("check-limit", user.id, user.isPro, RATE);
  if (!rl.allowed) {
    return res.status(429).json({
      error: "RATE_LIMITED",
      resetAt: rl.resetAt,
      allowed: false,
      reason: "Too many requests — please wait before trying again.",
    });
  }

  // 3. Usage limit (free tier only)
  if (!user.isPro) {
    const supabase = createClient(
      (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)!,
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)!,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("analyses_used_this_month, analyses_reset_date")
      .eq("id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    let used = profile?.analyses_used_this_month ?? 0;

    // Reset counter if month has rolled over
    if (profile?.analyses_reset_date) {
      const resetDate = new Date(profile.analyses_reset_date);
      resetDate.setMonth(resetDate.getMonth() + 1);
      if (today >= resetDate.toISOString().split("T")[0]) {
        await supabase
          .from("profiles")
          .update({ analyses_used_this_month: 0, analyses_reset_date: today })
          .eq("id", user.id);
        used = 0;
      }
    }

    if (used >= FREE_ANALYSES_LIMIT) {
      return res.status(200).json({
        allowed: false,
        reason: "LIMIT_REACHED",
        used,
        limit: FREE_ANALYSES_LIMIT,
      });
    }
  }

  return res.status(200).json({ allowed: true });
}
