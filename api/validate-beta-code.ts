// api/validate-beta-code.ts
// POST { code: string } — checks a beta code is valid and unused.
// No auth required. No DB writes. Used by the public /access page.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { handlePreflight } from "./_lib/auth";

export const maxDuration = 10;

// 10 attempts per IP per hour — prevents brute-forcing beta codes
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "3600 s"),
  analytics: false,
  prefix: "cutsheet:validate-beta-code",
});

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  const rl = await ratelimit.limit(ip);
  if (!rl.success) {
    return res.status(429).json({ valid: false, error: "Too many attempts. Please try again later." });
  }

  try {
    const { code } = req.body ?? {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ valid: false, error: "code is required" });
    }

    const normalized = code.toUpperCase().trim().slice(0, 32);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("beta_codes")
      .select("id, used")
      .eq("code", normalized)
      .eq("used", false)
      .single();

    if (error || !data) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error("[validate-beta-code] error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ valid: false, error: "Validation failed. Please try again." });
  }
}
