// src/lib/benchmarks.ts — Niche × platform benchmark lookup
// Replaces generic platform averages when user's niche is known from onboarding.
// Falls back to platformBenchmarks.ts when niche is null or unrecognized.

import { getBenchmark as getPlatformBenchmark } from "./platformBenchmarks";

// ── Types ────────────────────────────────────────────────────────────────────

export interface NicheBenchmark {
  ctr: { low: number; avg: number; high: number };
  hookRate: { avg: number } | null;
  cpm: { avg: number };
}

/** Legacy shape consumed by BenchmarkBadge — kept for compatibility */
export interface BenchmarkResult {
  averageScore: number;
  sampleLabel: string;
  percentile?: number;
  source: "static" | "aggregate";
}

// ── Niche × Platform data ────────────────────────────────────────────────────

export const NICHE_BENCHMARKS: Record<string, Record<string, NicheBenchmark>> = {
  "Ecommerce / DTC": {
    Meta:    { ctr: { low: 1.5, avg: 2.1, high: 3.2 }, hookRate: { avg: 32 }, cpm: { avg: 14 } },
    TikTok:  { ctr: { low: 0.8, avg: 1.4, high: 2.5 }, hookRate: { avg: 28 }, cpm: { avg: 9 } },
    Google:  { ctr: { low: 2.0, avg: 3.5, high: 6.0 }, hookRate: null,        cpm: { avg: 38 } },
    YouTube: { ctr: { low: 0.3, avg: 0.6, high: 1.2 }, hookRate: { avg: 45 }, cpm: { avg: 11 } },
    general: { ctr: { low: 1.2, avg: 1.9, high: 3.0 }, hookRate: { avg: 30 }, cpm: { avg: 13 } },
  },
  SaaS: {
    Meta:    { ctr: { low: 0.7, avg: 1.0, high: 1.8 }, hookRate: { avg: 22 }, cpm: { avg: 22 } },
    TikTok:  { ctr: { low: 0.4, avg: 0.8, high: 1.5 }, hookRate: { avg: 20 }, cpm: { avg: 12 } },
    Google:  { ctr: { low: 2.5, avg: 4.2, high: 7.5 }, hookRate: null,        cpm: { avg: 55 } },
    YouTube: { ctr: { low: 0.2, avg: 0.4, high: 0.9 }, hookRate: { avg: 35 }, cpm: { avg: 18 } },
    general: { ctr: { low: 0.6, avg: 0.9, high: 1.6 }, hookRate: { avg: 21 }, cpm: { avg: 26 } },
  },
  Agency: {
    Meta:    { ctr: { low: 0.9, avg: 1.4, high: 2.5 }, hookRate: { avg: 27 }, cpm: { avg: 16 } },
    TikTok:  { ctr: { low: 0.6, avg: 1.1, high: 2.0 }, hookRate: { avg: 25 }, cpm: { avg: 10 } },
    Google:  { ctr: { low: 2.2, avg: 3.8, high: 6.5 }, hookRate: null,        cpm: { avg: 42 } },
    YouTube: { ctr: { low: 0.25, avg: 0.5, high: 1.0 }, hookRate: { avg: 40 }, cpm: { avg: 13 } },
    general: { ctr: { low: 0.8, avg: 1.3, high: 2.2 }, hookRate: { avg: 26 }, cpm: { avg: 17 } },
  },
  "Creator / Content": {
    Meta:    { ctr: { low: 0.5, avg: 0.9, high: 1.8 }, hookRate: { avg: 35 }, cpm: { avg: 8 } },
    TikTok:  { ctr: { low: 1.0, avg: 2.0, high: 4.0 }, hookRate: { avg: 42 }, cpm: { avg: 6 } },
    YouTube: { ctr: { low: 0.4, avg: 0.9, high: 2.0 }, hookRate: { avg: 55 }, cpm: { avg: 7 } },
    general: { ctr: { low: 0.7, avg: 1.4, high: 2.8 }, hookRate: { avg: 40 }, cpm: { avg: 7 } },
  },
};

// ── Niche alias map — normalize onboarding niche names to lookup keys ────────

const NICHE_ALIASES: Record<string, string> = {
  "ecommerce": "Ecommerce / DTC",
  "ecommerce / dtc": "Ecommerce / DTC",
  "e-commerce": "Ecommerce / DTC",
  "dtc": "Ecommerce / DTC",
  "d2c": "Ecommerce / DTC",
  "direct to consumer": "Ecommerce / DTC",
  "saas": "SaaS",
  "software": "SaaS",
  "b2b": "SaaS",
  "b2b saas": "SaaS",
  "tech": "SaaS",
  "agency": "Agency",
  "creator / content": "Creator / Content",
  "creator": "Creator / Content",
  "content": "Creator / Content",
  "content creator": "Creator / Content",
};

function resolveNicheKey(niche: string): string | null {
  if (!niche) return null;
  // Direct match first
  if (NICHE_BENCHMARKS[niche]) return niche;
  // Alias match
  const lower = niche.toLowerCase().trim();
  const aliased = NICHE_ALIASES[lower];
  if (aliased && NICHE_BENCHMARKS[aliased]) return aliased;
  return null;
}

// ── Platform alias map ───────────────────────────────────────────────────────

const PLATFORM_ALIASES: Record<string, string> = {
  meta: "Meta",
  facebook: "Meta",
  instagram: "Meta",
  tiktok: "TikTok",
  google: "Google",
  "google display": "Google",
  youtube: "YouTube",
};

function resolvePlatformKey(platform: string): string {
  if (!platform) return "general";
  // Direct match
  const lower = platform.toLowerCase().trim();
  return PLATFORM_ALIASES[lower] ?? platform;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Get niche-specific benchmark. Returns null if niche is unknown or 'Other'. */
export function getNicheBenchmark(
  niche: string | null | undefined,
  platform: string | null | undefined
): NicheBenchmark | null {
  if (!niche) return null;
  const nicheKey = resolveNicheKey(niche);
  if (!nicheKey) return null;
  const nicheData = NICHE_BENCHMARKS[nicheKey];
  const platformKey = resolvePlatformKey(platform ?? "");
  return nicheData[platformKey] ?? nicheData["general"] ?? null;
}

/** Short niche label for UI — "DTC", "SaaS", "Agency", "Creator" */
export function getNicheShortLabel(niche: string | null | undefined): string | null {
  if (!niche) return null;
  const nicheKey = resolveNicheKey(niche);
  if (!nicheKey) return null;
  const SHORT_LABELS: Record<string, string> = {
    "Ecommerce / DTC": "DTC",
    SaaS: "SaaS",
    Agency: "Agency",
    "Creator / Content": "Creator",
  };
  return SHORT_LABELS[nicheKey] ?? null;
}

/**
 * Get niche-aware benchmark for ScoreCard display.
 * Falls back to platform-only averages from platformBenchmarks.ts when niche is unknown.
 */
export function getNicheAwareBenchmark(
  niche: string | null | undefined,
  platform: string | null | undefined,
  adType: "video" | "static" = "video"
): BenchmarkResult {
  const nicheKey = niche ? resolveNicheKey(niche) : null;
  const nicheBench = nicheKey ? getNicheBenchmark(niche, platform) : null;

  if (nicheBench && nicheKey) {
    const shortLabel = getNicheShortLabel(niche) ?? nicheKey;
    const platformLabel = resolvePlatformKey(platform ?? "") === "general"
      ? ""
      : ` ${resolvePlatformKey(platform ?? "")}`;
    return {
      averageScore: 6.5, // scoring-scale avg (preserved for BenchmarkBadge)
      sampleLabel: `${shortLabel}${platformLabel} ${adType} ads`,
      source: "static",
    };
  }

  // Fallback: platform-only benchmark from platformBenchmarks.ts
  const platBench = getPlatformBenchmark(platform ?? undefined);
  return {
    averageScore: 6.5,
    sampleLabel: `${platBench.label} ${adType} ads`,
    source: "static",
  };
}
