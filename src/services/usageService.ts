// usageService.ts — Supabase-backed analysis usage tracking
import { supabase } from "../lib/supabase";

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
