// api/_lib/auth.ts — Shared auth + rate-limit helper for all Claude endpoints

import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface AuthedUser {
  id: string;
  isPro: boolean;
}

export interface RateLimitConfig {
  freeLimit: number;
  proLimit: number;
  windowSeconds: number;
}

// ─── SUPABASE ADMIN CLIENT ───────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── AUTH VERIFICATION ───────────────────────────────────────────────────────

/**
 * Verify the Bearer token from the Authorization header and return the user.
 * Returns null if invalid (caller must respond 401).
 */
export async function verifyAuth(req: VercelRequest): Promise<AuthedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseAdmin();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get subscription status
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    isPro: profile?.subscription_status === "pro",
  };
}

// ─── RATE LIMITING ───────────────────────────────────────────────────────────

/**
 * Apply a tiered sliding-window rate limit.
 * Returns { allowed: true } or { allowed: false, resetAt: ISO string }.
 */
export async function checkRateLimit(
  endpoint: string,
  userId: string,
  isPro: boolean,
  config: RateLimitConfig
): Promise<{ allowed: boolean; resetAt?: string }> {
  const limit = isPro ? config.proLimit : config.freeLimit;
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${config.windowSeconds} s`),
    analytics: false,
    prefix: `cutsheet:${endpoint}`,
  });

  const tier = isPro ? "pro" : "free";
  const { success, reset } = await ratelimit.limit(`${tier}:${userId}`);
  if (!success) {
    return { allowed: false, resetAt: new Date(reset).toISOString() };
  }
  return { allowed: true };
}

// ─── CORS HELPER ─────────────────────────────────────────────────────────────

export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN ?? "https://cutsheet.xyz");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

// ─── PREFLIGHT HANDLER ───────────────────────────────────────────────────────

export function handlePreflight(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
