// api/check-feature-limit.ts — Per-feature monthly credit check + increment
// Free tier:   daily sliding-window limits via Upstash Ratelimit
// Pro/Team:    monthly fixed credits via Redis INCR with month-aligned TTL
//
// POST { feature: string, increment?: boolean }
// → { allowed, remaining, limit, used?, reason?, resetAt?, tier }

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  verifyAuth,
  handlePreflight,
  checkRateLimit,
  isProOrTeam,
  type SubscriptionTier,
} from "./_lib/auth";

// ─── LIMIT TABLES ────────────────────────────────────────────────────────────

// Daily limits for free tier (sliding window, 86400s). 0 = blocked on free.
const FREE_DAILY_LIMITS: Record<string, number> = {
  analyze: 3,
  fixIt: 1,
  policyCheck: 1,
  deconstruct: 1,
  brief: 2,
  visualize: 0,
  script: 0,
};

// Monthly limits for Pro tier
const PRO_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 10,
  script: 10,
  fixIt: 20,
  policyCheck: 30,
  deconstruct: 20,
  brief: 20,
};

// Monthly limits for Team tier
const TEAM_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 25,
  script: 25,
  fixIt: 50,
  policyCheck: 75,
  deconstruct: 50,
  brief: 50,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Seconds until midnight UTC on the first day of next month. */
function getMonthTTL(): number {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
}

function getYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getLimitForTier(tier: SubscriptionTier, feature: string): number {
  if (tier === "team") return TEAM_MONTHLY_LIMITS[feature] ?? 0;
  if (tier === "pro") return PRO_MONTHLY_LIMITS[feature] ?? 0;
  return FREE_DAILY_LIMITS[feature] ?? 0;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("check-feature-limit", user.id, user.tier, { freeLimit: 60, proLimit: 60, windowSeconds: 60 });
  if (!rl.allowed) return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });

  const { feature, increment = true } = req.body ?? {};
  if (!feature || typeof feature !== "string") {
    return res.status(400).json({ error: "feature is required" });
  }

  const limit = getLimitForTier(user.tier, feature);

  // Feature blocked on this tier (limit === 0)
  if (limit === 0) {
    return res.status(200).json({
      allowed: false,
      reason: "TIER_BLOCKED",
      feature,
      tier: user.tier,
      limit: 0,
      remaining: 0,
    });
  }

  // Unlimited (e.g., analyze for Pro/Team) — skip Redis entirely
  if (limit === Infinity) {
    return res.status(200).json({ allowed: true, remaining: Infinity, limit: Infinity, feature });
  }

  // ── Free tier: daily sliding window ──────────────────────────────────────
  if (!isProOrTeam(user.tier)) {
    try {
      const ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, "86400 s"),
        prefix: `cutsheet:daily:${feature}`,
      });

      if (increment) {
        const { success, remaining, reset } = await ratelimit.limit(user.id);
        if (!success) {
          return res.status(200).json({
            allowed: false,
            reason: "DAILY_LIMIT_REACHED",
            remaining: 0,
            limit,
            resetAt: new Date(reset).toISOString(),
          });
        }
        return res.status(200).json({ allowed: true, remaining, limit, feature });
      }

      // Check-only (no increment): just report allowed
      return res.status(200).json({ allowed: true, remaining: null, limit, feature });
    } catch (err) {
      console.error(`[check-feature-limit] Redis error for ${feature}:`, err);
      // Fail open — don't block users because Redis is down
      return res.status(200).json({ allowed: true, remaining: null, limit, feature });
    }
  }

  // ── Pro/Team tier: monthly credits via Redis INCR ─────────────────────────
  try {
    const redis = Redis.fromEnv();
    const month = getYearMonth();
    const key = `credit:${user.tier}:${user.id}:${feature}:${month}`;

    if (increment) {
      const current = await redis.incr(key);
      // Set TTL only on first write this month
      if (current === 1) {
        await redis.expire(key, getMonthTTL());
      }
      if (current > limit) {
        await redis.decr(key); // undo the over-increment
        return res.status(200).json({
          allowed: false,
          reason: "MONTHLY_LIMIT_REACHED",
          remaining: 0,
          used: limit,
          limit,
          feature,
          tier: user.tier,
        });
      }
      return res.status(200).json({
        allowed: true,
        remaining: Math.max(limit - current, 0),
        used: current,
        limit,
        feature,
      });
    }

    // Check-only (no increment)
    const current = (await redis.get<number>(key)) ?? 0;
    return res.status(200).json({
      allowed: current < limit,
      remaining: Math.max(limit - current, 0),
      used: current,
      limit,
      feature,
    });
  } catch (err) {
    console.error(`[check-feature-limit] Redis error for ${feature}:`, err);
    // Fail open — don't block users because Redis is down
    return res.status(200).json({ allowed: true, remaining: null, limit, feature });
  }
}
