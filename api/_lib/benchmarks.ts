// api/_lib/benchmarks.ts — Inline benchmark data for API routes
// Avoids ESM import from src/lib/benchmarks.ts in Vercel CJS bundle.
// SYNC WARNING: Must match src/lib/benchmarks.ts exactly.
// Last synced: 2026-04-11. Verified against published sources April 2026.

export interface NicheBenchmark {
  ctr: { low: number; avg: number; high: number };
  hookRate: { avg: number } | null;
  cpm: { avg: number };
}

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
  "Health & Wellness": {
    Meta:    { ctr: { low: 1.4, avg: 2.2, high: 3.5 }, hookRate: { avg: 30 }, cpm: { avg: 16 } },
    TikTok:  { ctr: { low: 0.9, avg: 1.6, high: 3.0 }, hookRate: { avg: 35 }, cpm: { avg: 8 } },
    YouTube: { ctr: { low: 0.3, avg: 0.5, high: 1.1 }, hookRate: { avg: 42 }, cpm: { avg: 12 } },
    Google:  { ctr: { low: 1.8, avg: 3.2, high: 5.5 }, hookRate: null,        cpm: { avg: 35 } },
    general: { ctr: { low: 1.2, avg: 1.8, high: 3.0 }, hookRate: { avg: 32 }, cpm: { avg: 14 } },
  },
  "Finance / Fintech": {
    Meta:    { ctr: { low: 0.5, avg: 0.8, high: 1.4 }, hookRate: { avg: 18 }, cpm: { avg: 28 } },
    TikTok:  { ctr: { low: 0.3, avg: 0.6, high: 1.2 }, hookRate: { avg: 16 }, cpm: { avg: 14 } },
    YouTube: { ctr: { low: 0.15, avg: 0.35, high: 0.7 }, hookRate: { avg: 30 }, cpm: { avg: 22 } },
    Google:  { ctr: { low: 2.0, avg: 3.6, high: 6.0 }, hookRate: null,        cpm: { avg: 65 } },
    general: { ctr: { low: 0.5, avg: 0.8, high: 1.3 }, hookRate: { avg: 18 }, cpm: { avg: 30 } },
  },
  "Food & Beverage": {
    Meta:    { ctr: { low: 1.0, avg: 1.6, high: 2.5 }, hookRate: { avg: 33 }, cpm: { avg: 11 } },
    TikTok:  { ctr: { low: 1.2, avg: 2.2, high: 4.0 }, hookRate: { avg: 40 }, cpm: { avg: 7 } },
    YouTube: { ctr: { low: 0.3, avg: 0.7, high: 1.5 }, hookRate: { avg: 48 }, cpm: { avg: 9 } },
    Google:  { ctr: { low: 1.5, avg: 2.8, high: 4.5 }, hookRate: null,        cpm: { avg: 30 } },
    general: { ctr: { low: 1.0, avg: 1.8, high: 3.2 }, hookRate: { avg: 36 }, cpm: { avg: 11 } },
  },
  "Real Estate": {
    Meta:    { ctr: { low: 0.7, avg: 1.1, high: 1.9 }, hookRate: { avg: 22 }, cpm: { avg: 20 } },
    TikTok:  { ctr: { low: 0.5, avg: 0.9, high: 1.8 }, hookRate: { avg: 25 }, cpm: { avg: 11 } },
    YouTube: { ctr: { low: 0.2, avg: 0.45, high: 0.9 }, hookRate: { avg: 38 }, cpm: { avg: 15 } },
    Google:  { ctr: { low: 2.5, avg: 4.5, high: 8.0 }, hookRate: null,        cpm: { avg: 45 } },
    general: { ctr: { low: 0.7, avg: 1.2, high: 2.0 }, hookRate: { avg: 24 }, cpm: { avg: 20 } },
  },
};

const NICHE_ALIASES: Record<string, string> = {
  "ecommerce": "Ecommerce / DTC", "ecommerce / dtc": "Ecommerce / DTC",
  "e-commerce": "Ecommerce / DTC", "dtc": "Ecommerce / DTC",
  "d2c": "Ecommerce / DTC", "direct to consumer": "Ecommerce / DTC",
  "saas": "SaaS", "software": "SaaS", "b2b": "SaaS", "b2b saas": "SaaS", "tech": "SaaS",
  "agency": "Agency",
  "creator / content": "Creator / Content", "creator": "Creator / Content",
  "content": "Creator / Content", "content creator": "Creator / Content",
  "health": "Health & Wellness", "health & wellness": "Health & Wellness",
  "wellness": "Health & Wellness", "fitness": "Health & Wellness", "supplements": "Health & Wellness",
  "finance": "Finance / Fintech", "finance / fintech": "Finance / Fintech",
  "fintech": "Finance / Fintech", "banking": "Finance / Fintech", "insurance": "Finance / Fintech",
  "food": "Food & Beverage", "food & beverage": "Food & Beverage",
  "beverage": "Food & Beverage", "restaurant": "Food & Beverage", "cpg": "Food & Beverage",
  "real estate": "Real Estate", "realestate": "Real Estate",
  "property": "Real Estate", "housing": "Real Estate",
};

const PLATFORM_ALIASES: Record<string, string> = {
  meta: "Meta", facebook: "Meta", instagram: "Meta",
  tiktok: "TikTok", google: "Google", "google display": "Google", youtube: "YouTube",
};

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

function resolveNicheKey(niche: string): string | null {
  if (NICHE_BENCHMARKS[niche]) return niche;
  const alias = NICHE_ALIASES[niche.toLowerCase().trim()];
  return alias !== undefined && alias !== null ? alias : null;
}

function resolvePlatformKey(platform: string): string {
  const lower = platform.toLowerCase().trim();
  const mapped = PLATFORM_ALIASES[lower];
  return (mapped !== undefined && mapped !== null) ? mapped : (platform || "general");
}

export function getNicheBenchmark(
  niche: string | null | undefined,
  platform: string | null | undefined
): NicheBenchmark | null {
  if (!niche) return null;
  const nicheKey = resolveNicheKey(niche);
  if (!nicheKey) return null;
  const nicheData = NICHE_BENCHMARKS[nicheKey];
  const platKey = resolvePlatformKey(platform != null ? platform : "");
  const platData = nicheData[platKey];
  if (platData !== undefined && platData !== null) return platData;
  const generalData = nicheData["general"];
  return generalData !== undefined && generalData !== null ? generalData : null;
}

export function getNicheShortLabel(niche: string | null | undefined): string | null {
  if (!niche) return null;
  const nicheKey = resolveNicheKey(niche);
  if (!nicheKey) return null;
  const label = SHORT_LABELS[nicheKey];
  return label !== undefined && label !== null ? label : null;
}
