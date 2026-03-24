// src/lib/platformBenchmarks.ts — Platform-specific benchmark data
// Used by PredictedPerformance and the Gemini prediction prompt.
// All values are Ecommerce / DTC industry averages sourced from
// platform ad benchmarks reports (2024–2025).

export const PLATFORM_BENCHMARKS = {
  meta:           { label: 'Meta',           ctrRange: '0.8–1.5%', ctrAvg: 1.25, cvrRange: '1.5–3.5%', hookRetentionRange: '55–70%',  creativeFatigue: '~3–5d',  vertical: 'Ecommerce / DTC avg' },
  instagram:      { label: 'Instagram',      ctrRange: '0.5–1.2%', ctrAvg: 0.90, cvrRange: '1.0–2.5%', hookRetentionRange: '50–65%',  creativeFatigue: '~3–5d',  vertical: 'Ecommerce / DTC avg' },
  tiktok:         { label: 'TikTok',         ctrRange: '1.5–3.0%', ctrAvg: 2.10, cvrRange: '0.5–1.5%', hookRetentionRange: '60–75%',  creativeFatigue: '~1–3d',  vertical: 'Ecommerce / DTC avg' },
  pinterest:      { label: 'Pinterest',      ctrRange: '0.2–0.5%', ctrAvg: 0.35, cvrRange: '0.8–2.0%', hookRetentionRange: '40–55%',  creativeFatigue: '~7–14d', vertical: 'Ecommerce / DTC avg' },
  youtube:        { label: 'YouTube',        ctrRange: '0.3–0.7%', ctrAvg: 0.50, cvrRange: '0.5–1.5%', hookRetentionRange: '30–50%',  creativeFatigue: '~5–7d',  vertical: 'Ecommerce / DTC avg' },
  google_display: { label: 'Google Display', ctrRange: '0.30–0.57%', ctrAvg: 0.46, cvrRange: '0.5–1.5%', hookRetentionRange: null,       creativeFatigue: '~5–14d', vertical: 'Google Display Network avg' },
} as const;

// ── Display format-specific benchmarks ──────────────────────────────────────

export const DISPLAY_FORMAT_BENCHMARKS: Record<string, { ctrRange: string; ctrAvg: number }> = {
  '300x250': { ctrRange: '0.35–0.60%', ctrAvg: 0.46 },
  '728x90':  { ctrRange: '0.20–0.40%', ctrAvg: 0.28 },
  '160x600': { ctrRange: '0.20–0.35%', ctrAvg: 0.25 },
  '300x600': { ctrRange: '0.30–0.55%', ctrAvg: 0.40 },
  '320x50':  { ctrRange: '0.30–0.50%', ctrAvg: 0.38 },
  '320x100': { ctrRange: '0.25–0.45%', ctrAvg: 0.33 },
  '970x250': { ctrRange: '0.25–0.45%', ctrAvg: 0.35 },
  '336x280': { ctrRange: '0.35–0.60%', ctrAvg: 0.46 },
  default:   { ctrRange: '0.30–0.57%', ctrAvg: 0.46 },
};

export const DISPLAY_EXTRA = {
  cpmRange: '$0.50–$12',
  viewabilityAvg: '65%',
} as const;

export type PlatformKey = keyof typeof PLATFORM_BENCHMARKS;

export type PlatformBenchmark = (typeof PLATFORM_BENCHMARKS)[PlatformKey];

/** Look up benchmark data for a platform string. Falls back to Meta if not found. */
export function getBenchmark(platform: string | undefined): PlatformBenchmark {
  if (!platform) return PLATFORM_BENCHMARKS.meta;
  const key = platform.toLowerCase().replace(/\s+/g, '_') as PlatformKey;
  return PLATFORM_BENCHMARKS[key] ?? PLATFORM_BENCHMARKS.meta;
}

/** Get display-specific benchmark by ad size string (e.g. "300x250"). */
export function getDisplayBenchmark(adSize: string | undefined) {
  const base = PLATFORM_BENCHMARKS.google_display;
  const sizeKey = adSize && Object.keys(DISPLAY_FORMAT_BENCHMARKS).find(k => adSize.includes(k));
  const format = DISPLAY_FORMAT_BENCHMARKS[sizeKey ?? 'default'];
  return { ...base, ...format, ...DISPLAY_EXTRA };
}
