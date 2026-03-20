// api/batch-feature-limits.ts — Batch credit check for multiple features in one request
// Accepts POST { features: string[], increment?: boolean }
// Returns { results: Record<string, FeatureLimitResult> }
//
// This avoids the N+1 problem of calling /api/check-feature-limit once per feature.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  verifyAuth,
  handlePreflight,
  isProOrTeam,
  type SubscriptionTier,
} from "./_lib/auth";

// ─── LIMIT TABLES ────────────────────────────────────────────────────────────

const FREE_DAILY_LIMITS: Record<string, number> = {
  analyze: 3,
  fixIt: 1,
  policyCheck: 1,
  deconstruct: 1,
  brief: 2,
  visualize: 0,
  script: 0,
};

const PRO_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 10,
  script: 10,
  fixIt: 20,
  policyCheck: 30,
  deconstruct: 20,
  brief: 20,
};

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

function getYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getLimitForTier(tier: SubscriptionTier, feature: string): number {
  if (tier === "team") return TEAM_MONTHLY_LIMITS[feature] ?? 0;
  if (tier === "pro") return PRO_MONTHLY_LIMITS[feature] ?? 0;
  return FREE_DAILY_LIMITS[feature] ?? 0;
}

interface FeatureLimitResult {
  allowed: boolean;
  remaining: number | null;
  limit: number;
  used?: number;
  reason?: string;
  resetAt?: string;
  feature: string;
  tier?: string;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Single auth check for the entire batch
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { features, increment = false } = req.body ?? {};
  if (!Array.isArray(features) || features.length === 0) {
    return res.status(400).json({ error: "features must be a non-empty array of strings" });
  }
  if (features.length > 20) {
    return res.status(400).json({ error: "Maximum 20 features per batch request" });
  }

  const results: Record<string, FeatureLimitResult> = {};

  // For Pro/Team monthly checks, we can batch Redis reads with mget
  const isFree = !isProOrTeam(user.tier);

  if (isFree && !increment) {
    // Free tier, check-only: just report limits (no Redis needed for peek)
    for (const feature of features) {
      const limit = getLimitForTier(user.tier, feature);
      if (limit === 0) {
        results[feature] = {
          allowed: false,
          reason: "TIER_BLOCKED",
          feature,
          tier: user.tier,
          limit: 0,
          remaining: 0,
        };
      } else {
        // For free tier peek, we can't cheaply check the sliding window without
        // hitting Redis per-feature, so report allowed with null remaining
        results[feature] = { allowed: true, remaining: null, limit, feature };
      }
    }
    return res.status(200).json({ results });
  }

  if (isFree && increment) {
    // Free tier with increment: must use Ratelimit per feature (sliding window)
    const redis = Redis.fromEnv();
    for (const feature of features) {
      const limit = getLimitForTier(user.tier, feature);
      if (limit === 0) {
        results[feature] = {
          allowed: false,
          reason: "TIER_BLOCKED",
          feature,
          tier: user.tier,
          limit: 0,
          remaining: 0,
        };
        continue;
      }
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, "86400 s"),
        prefix: `cutsheet:daily:${feature}`,
      });
      const { success, remaining, reset } = await ratelimit.limit(user.id);
      if (!success) {
        results[feature] = {
          allowed: false,
          reason: "DAILY_LIMIT_REACHED",
          remaining: 0,
          limit,
          resetAt: new Date(reset).toISOString(),
          feature,
        };
      } else {
        results[feature] = { allowed: true, remaining, limit, feature };
      }
    }
    return res.status(200).json({ results });
  }

  // ── Pro/Team tier ──────────────────────────────────────────────────────────
  const redis = Redis.fromEnv();
  const month = getYearMonth();

  // Build Redis keys for all features at once
  const keysAndFeatures: { key: string; feature: string; limit: number }[] = [];
  for (const feature of features) {
    const limit = getLimitForTier(user.tier, feature);

    // Handle special cases immediately
    if (limit === 0) {
      results[feature] = {
        allowed: false,
        reason: "TIER_BLOCKED",
        feature,
        tier: user.tier,
        limit: 0,
        remaining: 0,
      };
      continue;
    }
    if (limit === Infinity) {
      results[feature] = { allowed: true, remaining: Infinity, limit: Infinity, feature };
      continue;
    }

    keysAndFeatures.push({
      key: `credit:${user.tier}:${user.id}:${feature}:${month}`,
      feature,
      limit,
    });
  }

  if (keysAndFeatures.length === 0) {
    return res.status(200).json({ results });
  }

  if (!increment) {
    // Check-only: batch read all keys with mget
    const keys = keysAndFeatures.map((k) => k.key);
    const values = await redis.mget<(number | null)[]>(...keys);

    for (let i = 0; i < keysAndFeatures.length; i++) {
      const { feature, limit } = keysAndFeatures[i];
      const current = values[i] ?? 0;
      results[feature] = {
        allowed: current < limit,
        remaining: Math.max(limit - current, 0),
        used: current,
        limit,
        feature,
      };
    }
  } else {
    // Increment: must do per-feature INCR (no batch atomic increment)
    for (const { key, feature, limit } of keysAndFeatures) {
      const current = await redis.incr(key);
      if (current === 1) {
        const now = new Date();
        const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        const ttl = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
        await redis.expire(key, ttl);
      }
      if (current > limit) {
        await redis.decr(key);
        results[feature] = {
          allowed: false,
          reason: "MONTHLY_LIMIT_REACHED",
          remaining: 0,
          used: limit,
          limit,
          feature,
          tier: user.tier,
        };
      } else {
        results[feature] = {
          allowed: true,
          remaining: Math.max(limit - current, 0),
          used: current,
          limit,
          feature,
        };
      }
    }
  }

  return res.status(200).json({ results });
}
