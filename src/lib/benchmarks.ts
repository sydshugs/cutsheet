// src/lib/benchmarks.ts — Niche × platform benchmark lookup
// Replaces generic platform averages when user's niche is known from onboarding.
// Falls back to platformBenchmarks.ts when niche is null or unrecognized.
//
// Last verified: April 2026
// Sources: WordStream 2025, focus-digital 2025/2026, Triple Whale 2025,
//   Databox 2025, Lebesgue 2025/2026, AdBacklog 2025, Statista, Varos,
//   Meta/TikTok/YouTube business centers
//
// Update cadence: verify quarterly against published reports.
// If a benchmark drifts >30% from published data, update immediately.
//
// Notes on "Google" platform: these represent Google Search Ads benchmarks.
// Google Display Network has much lower CTRs (~0.46% avg) and CPMs (~$3 avg).
// The predict-performance.ts fallback uses Display benchmarks for unrecognized niches.

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
  // Sources: WordStream 2025 (Meta), Triple Whale 2025 (Meta DTC), Lebesgue 2025 (TikTok),
  //   WordStream 2025 (Google Search), Store Growers 2025 (YouTube)
  "Ecommerce / DTC": {
    Meta:    { ctr: { low: 1.5, avg: 2.1, high: 3.2 }, hookRate: { avg: 32 }, cpm: { avg: 14 } },
    TikTok:  { ctr: { low: 0.8, avg: 1.4, high: 2.5 }, hookRate: { avg: 28 }, cpm: { avg: 9 } },
    Google:  { ctr: { low: 2.0, avg: 3.5, high: 6.0 }, hookRate: null,        cpm: { avg: 38 } },
    YouTube: { ctr: { low: 0.3, avg: 0.6, high: 1.2 }, hookRate: { avg: 45 }, cpm: { avg: 11 } },
    general: { ctr: { low: 1.2, avg: 1.9, high: 3.0 }, hookRate: { avg: 30 }, cpm: { avg: 13 } },
  },
  // Sources: WordStream 2025 (Meta), AdBacklog 2025 (TikTok), WordStream 2025 (Google Search),
  //   AdBacklog 2025 (YouTube — B2B CTR ~0.28%)
  SaaS: {
    Meta:    { ctr: { low: 0.7, avg: 1.0, high: 1.8 }, hookRate: { avg: 22 }, cpm: { avg: 22 } },
    TikTok:  { ctr: { low: 0.4, avg: 0.8, high: 1.5 }, hookRate: { avg: 20 }, cpm: { avg: 12 } },
    Google:  { ctr: { low: 2.5, avg: 4.2, high: 7.5 }, hookRate: null,        cpm: { avg: 55 } },
    YouTube: { ctr: { low: 0.2, avg: 0.4, high: 0.9 }, hookRate: { avg: 35 }, cpm: { avg: 18 } },
    general: { ctr: { low: 0.6, avg: 0.9, high: 1.6 }, hookRate: { avg: 21 }, cpm: { avg: 26 } },
  },
  // Sources: blended from SaaS + Ecommerce ranges (agency clients span verticals)
  Agency: {
    Meta:    { ctr: { low: 0.9, avg: 1.4, high: 2.5 }, hookRate: { avg: 27 }, cpm: { avg: 16 } },
    TikTok:  { ctr: { low: 0.6, avg: 1.1, high: 2.0 }, hookRate: { avg: 25 }, cpm: { avg: 10 } },
    Google:  { ctr: { low: 2.2, avg: 3.8, high: 6.5 }, hookRate: null,        cpm: { avg: 42 } },
    YouTube: { ctr: { low: 0.25, avg: 0.5, high: 1.0 }, hookRate: { avg: 40 }, cpm: { avg: 13 } },
    general: { ctr: { low: 0.8, avg: 1.3, high: 2.2 }, hookRate: { avg: 26 }, cpm: { avg: 17 } },
  },
  // Sources: TikTok Business Center 2025 (organic-style paid), Lebesgue 2025 (TikTok CPM),
  //   Store Growers 2025 (YouTube CPM $5-10 range)
  "Creator / Content": {
    Meta:    { ctr: { low: 0.5, avg: 0.9, high: 1.8 }, hookRate: { avg: 35 }, cpm: { avg: 8 } },
    TikTok:  { ctr: { low: 1.0, avg: 2.0, high: 4.0 }, hookRate: { avg: 42 }, cpm: { avg: 6 } },
    YouTube: { ctr: { low: 0.4, avg: 0.9, high: 2.0 }, hookRate: { avg: 55 }, cpm: { avg: 7 } },
    general: { ctr: { low: 0.7, avg: 1.4, high: 2.8 }, hookRate: { avg: 40 }, cpm: { avg: 7 } },
  },
  // Sources: WordStream 2025 (Meta CTR 2.70%, +22.8% YoY), focus-digital 2025 (Meta CTR),
  //   Triple Whale 2025 (Meta CPM $20.70 median), Lebesgue 2025 (TikTok)
  "Health & Wellness": {
    Meta:    { ctr: { low: 1.4, avg: 2.2, high: 3.5 }, hookRate: { avg: 30 }, cpm: { avg: 16 } },
    TikTok:  { ctr: { low: 0.9, avg: 1.6, high: 3.0 }, hookRate: { avg: 35 }, cpm: { avg: 8 } },
    YouTube: { ctr: { low: 0.3, avg: 0.5, high: 1.1 }, hookRate: { avg: 42 }, cpm: { avg: 12 } },
    Google:  { ctr: { low: 1.8, avg: 3.2, high: 5.5 }, hookRate: null,        cpm: { avg: 35 } },
    general: { ctr: { low: 1.2, avg: 1.8, high: 3.0 }, hookRate: { avg: 32 }, cpm: { avg: 14 } },
  },
  // Sources: WordStream 2025 (Meta CTR 0.98% for Finance & Insurance), Lebesgue 2025 (TikTok CPM $15-25),
  //   WordStream 2025 (Google Search — Finance CPC among highest)
  "Finance / Fintech": {
    Meta:    { ctr: { low: 0.5, avg: 0.8, high: 1.4 }, hookRate: { avg: 18 }, cpm: { avg: 28 } },
    TikTok:  { ctr: { low: 0.3, avg: 0.6, high: 1.2 }, hookRate: { avg: 16 }, cpm: { avg: 14 } },
    YouTube: { ctr: { low: 0.15, avg: 0.35, high: 0.7 }, hookRate: { avg: 30 }, cpm: { avg: 22 } },
    Google:  { ctr: { low: 2.0, avg: 3.6, high: 6.0 }, hookRate: null,        cpm: { avg: 65 } },
    general: { ctr: { low: 0.5, avg: 0.8, high: 1.3 }, hookRate: { avg: 18 }, cpm: { avg: 30 } },
  },
  // Sources: WordStream 2025 (Meta — Food & Drink category), Lebesgue 2025 (TikTok),
  //   Store Growers 2025 (YouTube)
  "Food & Beverage": {
    Meta:    { ctr: { low: 1.0, avg: 1.6, high: 2.5 }, hookRate: { avg: 33 }, cpm: { avg: 11 } },
    TikTok:  { ctr: { low: 1.2, avg: 2.2, high: 4.0 }, hookRate: { avg: 40 }, cpm: { avg: 7 } },
    YouTube: { ctr: { low: 0.3, avg: 0.7, high: 1.5 }, hookRate: { avg: 48 }, cpm: { avg: 9 } },
    Google:  { ctr: { low: 1.5, avg: 2.8, high: 4.5 }, hookRate: null,        cpm: { avg: 30 } },
    general: { ctr: { low: 1.0, avg: 1.8, high: 3.2 }, hookRate: { avg: 36 }, cpm: { avg: 11 } },
  },
  // Sources: WordStream 2025 (Google Search — Real Estate CTR), Databox 2025 (Meta),
  //   Store Growers 2025 (YouTube)
  "Real Estate": {
    Meta:    { ctr: { low: 0.7, avg: 1.1, high: 1.9 }, hookRate: { avg: 22 }, cpm: { avg: 20 } },
    TikTok:  { ctr: { low: 0.5, avg: 0.9, high: 1.8 }, hookRate: { avg: 25 }, cpm: { avg: 11 } },
    YouTube: { ctr: { low: 0.2, avg: 0.45, high: 0.9 }, hookRate: { avg: 38 }, cpm: { avg: 15 } },
    Google:  { ctr: { low: 2.5, avg: 4.5, high: 8.0 }, hookRate: null,        cpm: { avg: 45 } },
    general: { ctr: { low: 0.7, avg: 1.2, high: 2.0 }, hookRate: { avg: 24 }, cpm: { avg: 20 } },
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
  "health": "Health & Wellness",
  "health & wellness": "Health & Wellness",
  "wellness": "Health & Wellness",
  "fitness": "Health & Wellness",
  "supplements": "Health & Wellness",
  "finance": "Finance / Fintech",
  "finance / fintech": "Finance / Fintech",
  "fintech": "Finance / Fintech",
  "banking": "Finance / Fintech",
  "insurance": "Finance / Fintech",
  "food": "Food & Beverage",
  "food & beverage": "Food & Beverage",
  "beverage": "Food & Beverage",
  "restaurant": "Food & Beverage",
  "cpg": "Food & Beverage",
  "real estate": "Real Estate",
  "realestate": "Real Estate",
  "property": "Real Estate",
  "housing": "Real Estate",
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
    "Health & Wellness": "Health",
    "Finance / Fintech": "Fintech",
    "Food & Beverage": "F&B",
    "Real Estate": "Real Estate",
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
