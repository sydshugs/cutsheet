// usageService.ts — Supabase-backed analysis usage tracking + per-feature limit client
import { supabase } from "../lib/supabase";

// ─── TIER CONSTANTS (mirrors api/check-feature-limit.ts) ─────────────────────

export type SubscriptionTier = 'free' | 'pro' | 'team';

export const FREE_DAILY_LIMITS: Record<string, number> = {
  analyze: 3,
  fixIt: 1,
  policyCheck: 1,
  deconstruct: 1,
  brief: 2,
  visualize: 0, // blocked on free
  script: 0,    // blocked on free
};

export const PRO_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 10,
  script: 10,
  fixIt: 20,
  policyCheck: 30,
  deconstruct: 20,
  brief: 20,
};

export const TEAM_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 25,
  script: 25,
  fixIt: 50,
  policyCheck: 75,
  deconstruct: 50,
  brief: 50,
};

export interface FeatureLimitResult {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  reason?: string;
  resetAt?: string;
  tier?: string;
}

/**
 * Check (and optionally consume) a feature credit via /api/check-feature-limit.
 * @param feature   e.g. 'visualize' | 'script' | 'fixIt' | 'policyCheck' | 'deconstruct' | 'brief' | 'analyze'
 * @param increment true = consume a credit; false = peek only. Default: true
 */
export const checkFeatureLimit = async (
  feature: string,
  increment = true
): Promise<FeatureLimitResult> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { allowed: false, remaining: null, limit: null, reason: "NOT_AUTHENTICATED" };
  }

  try {
    const response = await fetch('/api/check-feature-limit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feature, increment }),
    });

    if (!response.ok) {
      console.error('[usageService] check-feature-limit error:', response.status);
      return { allowed: false, remaining: null, limit: null, reason: 'API_ERROR' };
    }

    return response.json() as Promise<FeatureLimitResult>;
  } catch (err) {
    console.error('[usageService] checkFeatureLimit fetch failed:', err);
    return { allowed: false, remaining: null, limit: null, reason: 'NETWORK_ERROR' };
  }
};

export const checkAnalysisLimit = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "subscription_status, analyses_used_this_month, analyses_reset_date"
    )
    .eq("id", user.id)
    .single();

  if (!profile) return true; // allow if no profile found

  // Pro users have unlimited
  if (profile.subscription_status === "pro") return true;

  // Reset counter if new month
  const today = new Date().toISOString().split("T")[0];
  const resetDate = profile.analyses_reset_date;
  if (resetDate) {
    const resetDateObj = new Date(resetDate);
    resetDateObj.setMonth(resetDateObj.getMonth() + 1);
    const nextReset = resetDateObj.toISOString().split("T")[0];
    if (today >= nextReset) {
      await supabase
        .from("profiles")
        .update({
          analyses_used_this_month: 0,
          analyses_reset_date: today,
        })
        .eq("id", user.id);
      return true;
    }
  }

  // Check limit
  return (profile.analyses_used_this_month || 0) < 3;
};

export const incrementAnalysisCount = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("analyses_used_this_month, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.subscription_status === "pro") return;

  await supabase
    .from("profiles")
    .update({
      analyses_used_this_month:
        (profile.analyses_used_this_month || 0) + 1,
    })
    .eq("id", user.id);
};

export const getUsageInfo = async (): Promise<{
  used: number;
  limit: number;
  isPro: boolean;
}> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { used: 0, limit: 3, isPro: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, analyses_used_this_month")
    .eq("id", user.id)
    .single();

  if (!profile) return { used: 0, limit: 3, isPro: false };

  return {
    used: profile.analyses_used_this_month || 0,
    limit: 3,
    isPro: profile.subscription_status === "pro",
  };
};
