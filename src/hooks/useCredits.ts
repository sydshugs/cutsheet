// src/hooks/useCredits.ts — TanStack Query hook for credit status
// Replaces manual useState + useEffect credit-fetching patterns.
// Provides automatic caching, background refetch, and stale-while-revalidate.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCreditStatus, type FeatureLimitResult } from "../services/usageService";
import { useAuth } from "../context/AuthContext";

export type CreditStatus = Record<string, FeatureLimitResult>;

export const CREDITS_QUERY_KEY = ["credits"] as const;

/**
 * Fetch all feature credits in one batch call.
 * Returns cached data while refetching in background.
 *
 * Usage:
 *   const { data: credits, isLoading } = useCredits();
 *   credits?.visualize?.remaining // number | null
 */
export function useCredits() {
  const { user } = useAuth();

  return useQuery<CreditStatus>({
    queryKey: CREDITS_QUERY_KEY,
    queryFn: fetchCreditStatus,
    enabled: !!user,
    // Credits change after mutations — keep stale time short
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Imperatively invalidate credit cache after a mutation consumes a credit.
 * Call this after any successful API call that deducts credits.
 *
 * Usage:
 *   const invalidateCredits = useInvalidateCredits();
 *   // after successful visualize call:
 *   invalidateCredits();
 */
export function useInvalidateCredits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
}
