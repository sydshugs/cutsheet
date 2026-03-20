// useUsage.ts — React hook for subscription tier and usage count
// Syncs subscription_status from Supabase into localStorage on mount + auth changes
import { useState, useEffect, useCallback } from "react";
import * as usage from "../utils/usage";
import type { SubscriptionTier } from "../utils/usage";
import { supabase } from "../lib/supabase";

export function useUsage() {
  const [count, setCount] = useState(usage.getUsageCount);
  const [tier, setTierState] = useState<SubscriptionTier>(usage.getSubscriptionTier);

  const refresh = useCallback(() => {
    setCount(usage.getUsageCount());
    setTierState(usage.getSubscriptionTier());
  }, []);

  // Sync tier from Supabase profiles table
  const syncTierFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();

      const rawStatus = data?.subscription_status ?? 'free';
      const newTier: SubscriptionTier =
        rawStatus === 'team' ? 'team' : rawStatus === 'pro' ? 'pro' : 'free';

      usage.setSubscriptionTier(newTier);
      setTierState(newTier);
    } catch {
      // Silent — keep localStorage value as fallback
    }
  }, []);

  // Sync on mount
  useEffect(() => {
    syncTierFromSupabase();
  }, [syncTierFromSupabase]);

  // Sync on auth state changes (login, token refresh, sign out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          syncTierFromSupabase();
        } else {
          usage.setSubscriptionTier('free');
          setTierState('free');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [syncTierFromSupabase]);

  // Listen for cross-tab localStorage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === usage.USAGE_KEY ||
        e.key === usage.PRO_KEY ||
        e.key === usage.TIER_KEY
      ) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const increment = useCallback(() => {
    const next = usage.incrementUsage();
    setCount(next);
    return next;
  }, []);

  const setPro = useCallback((value: boolean) => {
    usage.setPro(value);
    setTierState(usage.getSubscriptionTier());
  }, []);

  const isPro = tier === 'pro' || tier === 'team';

  return {
    usageCount: count,
    tier,
    isPro,
    isTeam: tier === 'team',
    canAnalyze: usage.canAnalyze(),
    isAtLimit: usage.isAtLimit(),
    increment,
    setPro,
    refresh,
    /** @deprecated alias for syncTierFromSupabase */
    syncProFromSupabase: syncTierFromSupabase,
    FREE_LIMIT: usage.FREE_LIMIT,
  };
}
