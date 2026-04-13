// src/hooks/useProfile.ts — TanStack Query hook for user profile
// Provides cached profile data (niche, intent, tier) separate from auth state.
// AuthContext still handles session/auth state changes; this hook caches profile reads.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export interface UserProfile {
  id: string;
  subscription_status: string;
  beta_access: boolean;
  niche: string | null;
  intent: string | null;
  analyses_used_this_month: number;
  analyses_reset_date: string | null;
  onboarding_completed: boolean;
}

export const PROFILE_QUERY_KEY = ["profile"] as const;

async function fetchProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, subscription_status, beta_access, niche, intent, analyses_used_this_month, analyses_reset_date, onboarding_completed")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/**
 * Cached user profile from Supabase.
 * Refetches on mount and when user changes.
 *
 * Usage:
 *   const { data: profile } = useProfile();
 *   profile?.niche // "ecommerce" | null
 */
export function useProfile() {
  const { user } = useAuth();

  return useQuery<UserProfile>({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}
