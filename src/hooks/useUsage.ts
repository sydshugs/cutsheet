// useUsage.ts — React hook for usage count and Pro status
import { useState, useEffect, useCallback } from "react";
import * as usage from "../utils/usage";

export function useUsage() {
  const [count, setCount] = useState(usage.getUsageCount);
  const [pro, setProState] = useState(usage.isPro);

  const refresh = useCallback(() => {
    setCount(usage.getUsageCount());
    setProState(usage.isPro());
  }, []);

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
    FREE_LIMIT: usage.FREE_LIMIT,
  };
}
