// usage.ts — Subscription tier and free-tier usage count (localStorage)

export const USAGE_KEY = "cutsheet-usage-count";
export const PRO_KEY = "cutsheet-pro";   // legacy — kept for backwards compat reads
export const TIER_KEY = "cutsheet-tier";
const FREE_LIMIT = 3;

export type SubscriptionTier = 'free' | 'pro' | 'team';

// ─── USAGE COUNT (free tier) ──────────────────────────────────────────────────

export function getUsageCount(): number {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function incrementUsage(): number {
  const next = getUsageCount() + 1;
  try {
    localStorage.setItem(USAGE_KEY, String(next));
  } catch {}
  return next;
}

// ─── SUBSCRIPTION TIER ───────────────────────────────────────────────────────

export function getSubscriptionTier(): SubscriptionTier {
  try {
    // DEV bypass — treat as Pro so all features work locally
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return 'pro';
    const stored = localStorage.getItem(TIER_KEY) as SubscriptionTier | null;
    if (stored === 'pro' || stored === 'team') return stored;
    // Backwards compat: legacy PRO_KEY
    if (localStorage.getItem(PRO_KEY) === 'true') return 'pro';
    return 'free';
  } catch {
    return 'free';
  }
}

export function setSubscriptionTier(tier: SubscriptionTier): void {
  try {
    localStorage.setItem(TIER_KEY, tier);
    // Keep legacy PRO_KEY in sync
    if (tier === 'pro' || tier === 'team') {
      localStorage.setItem(PRO_KEY, 'true');
    } else {
      localStorage.removeItem(PRO_KEY);
    }
  } catch {}
}

/** @deprecated Use setSubscriptionTier */
export function setPro(value: boolean): void {
  setSubscriptionTier(value ? 'pro' : 'free');
}

// ─── DERIVED HELPERS ─────────────────────────────────────────────────────────

export function isPro(): boolean {
  const t = getSubscriptionTier();
  return t === 'pro' || t === 'team';
}

export function isTeam(): boolean {
  return getSubscriptionTier() === 'team';
}

export function canAnalyze(): boolean {
  if (isPro()) return true;
  return getUsageCount() < FREE_LIMIT;
}

export function isAtLimit(): boolean {
  if (isPro()) return false;
  return getUsageCount() >= FREE_LIMIT;
}

export { FREE_LIMIT };
