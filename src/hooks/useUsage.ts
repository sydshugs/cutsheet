// useUsage.ts — React hook for usage count and Pro status
// Syncs subscription_status from Supabase into localStorage on mount + auth changes
import { useState, useEffect, useCallback } from "react";
import * as usage from "../utils/usage";
import { supabase } from "../lib/supabase";

export function useUsage() {
  const [count, setCount] = useState(usage.getUsageCount);
  const [pro, setProState] = useState(usage.isPro);

  const refresh = useCallback(() => {
    setCount(usage.getUsageCount());
    setProState(usage.isPro());
  }, []);

  // Fetch subscription_status from Supabase and sync to localStorage
  const syncProFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();

      const isProInDb = data?.subscription_status === "pro";
      usage.setPro(isProInDb);
      setProState(isProInDb);
    } catch {
      // Silent — keep localStorage value as fallback
    }
  }, []);

  // Sync on mount
  useEffect(() => {
    syncProFromSupabase();
  }, [syncProFromSupabase]);

  // Sync on auth state changes (login, token refresh, sign out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          syncProFromSupabase();
        } else {
          // Signed out — clear pro status
          usage.setPro(false);
          setProState(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [syncProFromSupabase]);

  // Listen for cross-tab localStorage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === usage.USAGE_KEY || e.key === usage.PRO_KEY) refresh();
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
    setProState(usage.isPro());
  }, []);

  return {
    usageCount: count,
    isPro: pro,
    canAnalyze: usage.canAnalyze(),
    isAtLimit: usage.isAtLimit(),
    increment,
    setPro,
    refresh,
    syncProFromSupabase,
    FREE_LIMIT: usage.FREE_LIMIT,
  };
}
