// src/lib/benchmarks.ts — Static benchmark dataset (MVP)
// Designed so getBenchmark() can be swapped for a Supabase query with zero UI changes.

export interface BenchmarkResult {
  averageScore: number       // 0-10 overall score average
  sampleLabel: string        // e.g. "ecomm video ads on Meta"
  percentile?: number        // where this score ranks (added by caller)
  source: 'static' | 'aggregate'  // 'static' = curated, 'aggregate' = real Cutsheet data
}

// Lookup key: `${niche}:${platform}:${adType}`
// Fallback chain: exact match → platform:adType match → adType-only match → global default
const BENCHMARKS: Record<string, { avg: number; label: string }> = {
  // Ecomm
  'ecomm:meta:video':            { avg: 6.8, label: 'ecomm video ads on Meta' },
  'ecomm:meta:static':           { avg: 6.4, label: 'ecomm static ads on Meta' },
  'ecomm:tiktok:video':          { avg: 7.1, label: 'ecomm video ads on TikTok' },
  'ecomm:instagram_reels:video': { avg: 6.9, label: 'ecomm Reels ads' },
  'ecomm:youtube:video':         { avg: 6.2, label: 'ecomm YouTube ads' },
  'ecomm:display:static':        { avg: 5.8, label: 'ecomm display banners' },
  // SaaS / Tech
  'saas:meta:video':             { avg: 6.5, label: 'SaaS video ads on Meta' },
  'saas:meta:static':            { avg: 6.1, label: 'SaaS static ads on Meta' },
  'saas:linkedin:static':        { avg: 5.9, label: 'SaaS LinkedIn ads' },
  'saas:youtube:video':          { avg: 6.3, label: 'SaaS YouTube ads' },
  // Health & Wellness
  'health:meta:video':           { avg: 7.0, label: 'health & wellness video on Meta' },
  'health:tiktok:video':         { avg: 7.3, label: 'health & wellness TikTok ads' },
  'health:meta:static':          { avg: 6.5, label: 'health & wellness static on Meta' },
  // Beauty / CPG
  'beauty:meta:video':           { avg: 7.2, label: 'beauty video ads on Meta' },
  'beauty:tiktok:video':         { avg: 7.5, label: 'beauty TikTok ads' },
  'beauty:instagram_reels:video':{ avg: 7.3, label: 'beauty Reels ads' },
  // Finance
  'finance:meta:static':         { avg: 6.0, label: 'finance static ads on Meta' },
  'finance:meta:video':          { avg: 6.3, label: 'finance video ads on Meta' },
  // Education / Courses
  'education:meta:video':        { avg: 6.7, label: 'education/course video ads on Meta' },
  'education:youtube:video':     { avg: 6.5, label: 'education YouTube ads' },
  // Platform-only fallbacks (no niche)
  ':meta:video':                 { avg: 6.7, label: 'video ads on Meta' },
  ':meta:static':                { avg: 6.3, label: 'static ads on Meta' },
  ':tiktok:video':               { avg: 7.0, label: 'TikTok video ads' },
  ':instagram_reels:video':      { avg: 6.9, label: 'Instagram Reels ads' },
  ':youtube:video':              { avg: 6.3, label: 'YouTube video ads' },
  ':display:static':             { avg: 5.7, label: 'display banner ads' },
  ':linkedin:static':            { avg: 5.8, label: 'LinkedIn ads' },
  // Format-only fallbacks
  '::video':                     { avg: 6.7, label: 'video ads' },
  '::static':                    { avg: 6.2, label: 'static ads' },
  // Global fallback
  '::':                          { avg: 6.5, label: 'ads in your category' },
}

// Niche alias map — normalize user-facing niche names to lookup keys
const NICHE_ALIASES: Record<string, string> = {
  'e-commerce': 'ecomm',
  'ecommerce': 'ecomm',
  'ecom': 'ecomm',
  'dtc': 'ecomm',
  'd2c': 'ecomm',
  'direct to consumer': 'ecomm',
  'software': 'saas',
  'tech': 'saas',
  'b2b': 'saas',
  'b2b saas': 'saas',
  'health & wellness': 'health',
  'health and wellness': 'health',
  'wellness': 'health',
  'fitness': 'health',
  'beauty & skincare': 'beauty',
  'skincare': 'beauty',
  'cosmetics': 'beauty',
  'cpg': 'beauty',
  'personal finance': 'finance',
  'fintech': 'finance',
  'insurance': 'finance',
  'online courses': 'education',
  'courses': 'education',
  'edtech': 'education',
}

// Platform alias map
const PLATFORM_ALIASES: Record<string, string> = {
  'facebook': 'meta',
  'instagram': 'meta',
  'ig': 'meta',
  'reels': 'instagram_reels',
  'instagram reels': 'instagram_reels',
  'linkedin': 'linkedin',
  'youtube': 'youtube',
  'yt': 'youtube',
  'tiktok': 'tiktok',
  'tt': 'tiktok',
  'display': 'display',
  'gdn': 'display',
  'google display': 'display',
}

function normalizeNiche(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return NICHE_ALIASES[lower] ?? lower
}

function normalizePlatform(raw: string): string {
  const lower = raw.toLowerCase().replace(/\s+/g, ' ').trim()
  return PLATFORM_ALIASES[lower] ?? lower.replace(/\s+/g, '_')
}

export function getBenchmark(
  niche: string,
  platform: string,
  adType: 'video' | 'static' | 'display'
): BenchmarkResult {
  const n = normalizeNiche(niche || '')
  const p = normalizePlatform(platform || '')
  const t = adType || 'video'

  // Fallback chain: exact → platform:type → type-only → global
  const key = `${n}:${p}:${t}`
  const platformKey = `:${p}:${t}`
  const typeKey = `::${t}`
  const globalKey = '::'

  const match =
    BENCHMARKS[key] ??
    BENCHMARKS[platformKey] ??
    BENCHMARKS[typeKey] ??
    BENCHMARKS[globalKey]!

  return {
    averageScore: match.avg,
    sampleLabel: match.label,
    source: 'static',
  }
}

// Future: replace getBenchmark() body with a Supabase query:
// const { data } = await supabase
//   .from('score_aggregates')
//   .select('avg_score, sample_count, label')
//   .eq('niche', niche).eq('platform', platform).eq('ad_type', adType)
//   .single();
// return { averageScore: data.avg_score, sampleLabel: data.label, source: 'aggregate' };

// Future Supabase migration (scaffold only — do not run yet):
// create table if not exists score_aggregates (
//   id uuid primary key default gen_random_uuid(),
//   niche text not null,
//   platform text not null,
//   ad_type text check (ad_type in ('video', 'static', 'display')),
//   avg_score numeric(5,2) not null,
//   sample_count integer not null default 0,
//   label text not null,
//   updated_at timestamptz default now(),
//   unique(niche, platform, ad_type)
// );
