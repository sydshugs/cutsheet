// usage.ts — Free tier usage count and Pro status (localStorage)

export const USAGE_KEY = "cutsheet-usage-count";
export const PRO_KEY = "cutsheet-pro";
const FREE_LIMIT = 3;

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

export function isPro(): boolean {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
    return localStorage.getItem(PRO_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPro(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(PRO_KEY, "true");
    } else {
      localStorage.removeItem(PRO_KEY);
    }
  } catch {}
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
