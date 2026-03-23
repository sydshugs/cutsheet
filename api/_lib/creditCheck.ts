// api/_lib/creditCheck.ts — Shared monthly credit check for Pro/Team features
//
// Reusable by any endpoint that needs to enforce per-feature monthly limits.
// Free tier is expected to be blocked at the endpoint level (403 PRO_REQUIRED).

import { Redis } from "@upstash/redis";
import type { SubscriptionTier } from "./auth";

// Monthly limits for Pro tier
const PRO_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 10,
  visualize_video: 5,
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
  visualize_video: 15,
  script: 25,
  fixIt: 50,
  policyCheck: 75,
  deconstruct: 50,
  brief: 50,
};

function getMonthTTL(): number {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
}

function getYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getFeatureLimit(tier: SubscriptionTier, feature: string): number {
  if (tier === "team") return TEAM_MONTHLY_LIMITS[feature] ?? 0;
  if (tier === "pro") return PRO_MONTHLY_LIMITS[feature] ?? 0;
  return 0; // free tier has no monthly credits
}

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  reason?: string;
}

/**
 * Check and optionally consume one monthly credit for a feature.
 * Returns { allowed, remaining, used, limit }.
 */
export async function checkFeatureCredit(
  userId: string,
  tier: SubscriptionTier,
  feature: string,
  increment = true,
): Promise<CreditCheckResult> {
  // Dev bypass: skip credit checks in local development (never runs on Vercel)
  if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === undefined) {
    return { allowed: true, remaining: 999, used: 0, limit: 999 };
  }

  const limit = getFeatureLimit(tier, feature);

  // Unlimited (e.g., analyze for Pro/Team)
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, used: 0, limit: Infinity };
  }

  // Feature blocked on this tier
  if (limit === 0) {
    return { allowed: false, remaining: 0, used: 0, limit: 0, reason: "TIER_BLOCKED" };
  }

  const redis = Redis.fromEnv();
  const month = getYearMonth();
  const key = `credit:${tier}:${userId}:${feature}:${month}`;

  if (increment) {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, getMonthTTL());
    }
    if (current > limit) {
      await redis.decr(key);
      return { allowed: false, remaining: 0, used: limit, limit, reason: "MONTHLY_LIMIT_REACHED" };
    }
    return { allowed: true, remaining: Math.max(limit - current, 0), used: current, limit };
  }

  // Check-only
  const current = (await redis.get<number>(key)) ?? 0;
  return {
    allowed: current < limit,
    remaining: Math.max(limit - current, 0),
    used: current,
    limit,
  };
}
