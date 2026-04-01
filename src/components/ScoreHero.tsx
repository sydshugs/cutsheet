// ScoreHero.tsx — D3 Score Hero: score number + benchmark bar + dimension grid
// Replaces arc gauge + MetricBars

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Platforms that do NOT support static image ads — benchmark should be hidden for these */
const STATIC_INCOMPATIBLE_PLATFORMS = new Set(['TikTok', 'YouTube', 'YouTube Shorts', 'Instagram Reels']);

export interface ScoreHeroProps {
  score: number;          // 0–10, one decimal
  verdict: string;        // 'Strong' | 'Average' | 'Needs Work' | etc.
  benchmark?: number;     // platform average, e.g. 7.2
  dimensions: {
    name: string;         // 'Hook' | 'Copy' | 'Visual' | 'CTA'
    score: number;        // 0–10
    rangeLow?: number;    // confidence interval lower bound
    rangeHigh?: number;   // confidence interval upper bound
  }[];
  platform?: string;      // 'Meta' | 'TikTok' | etc. — for benchmark label
  format?: 'video' | 'static';  // ad format — used to hide invalid benchmarks
  youtubeFormat?: string; // YouTube sub-format: 'skippable' | 'non_skippable' | 'bumper' | 'shorts' | 'in_feed'
  accentColor?: string;   // override benchmark bar fill color (e.g. cyan for Display)
  benchmarkLabelOverride?: string; // niche-aware label e.g. "DTC Meta video ads"
  scoreRange?: { low: number; high: number }; // overall score confidence interval
  overallDelta?: number;  // score change vs previous analysis, e.g. +1.9 or -0.4
  overallDeltaLabel?: string; // human label e.g. "vs 3 days ago"
  dimensionDeltas?: Record<string, number>; // per-dimension delta keyed by dimension name
}

/** Platform benchmark defaults — used when benchmark prop is not supplied */
const PLATFORM_BENCHMARKS: Record<string, number> = {
  'Meta': 7.2,
  'TikTok': 6.8,
  'Instagram': 7.0,
  'YouTube': 7.4,
  'Google': 6.5,
  'Google Display': 6.5,
  'Instagram Reels': 6.9,
  'YouTube Shorts': 6.6,
  'LinkedIn': 6.9,
  'Facebook': 7.0,
};

/** Platform-specific benchmark label shown in the benchmark bar */
const PLATFORM_BENCHMARK_LABELS: Record<string, string> = {
  'Meta': 'Meta avg',
  'TikTok': 'TikTok avg',
  'YouTube': 'YouTube avg',
  'Google': 'Google Display avg',
  'Instagram Reels': 'Reels avg',
  'YouTube Shorts': 'Shorts avg',
  'Instagram': 'Instagram avg',
  'Facebook': 'Facebook avg',
  'all': 'Industry avg',
};

/** Platform-specific dimension labels for the 4-metric grid */
const PLATFORM_DIMENSIONS: Record<string, [string, string, string, string]> = {
  'Meta':            ['Hook', 'Copy', 'Visual', 'CTA'],
  'TikTok':          ['Hook', 'Retention', 'Sound', 'CTA'],
  'YouTube':         ['Hook', 'Watch Time', 'Visual', 'CTA'],
  'Google':          ['Headline', 'Visual', 'Relevance', 'CTA'],
  'Instagram Reels': ['Hook', 'Retention', 'Audio', 'Share Trigger'],
  'YouTube Shorts':  ['Hook', 'Pacing', 'Visual', 'End Screen'],
  'Reels':           ['Hook', 'Retention', 'Audio', 'Share Trigger'],
  'Shorts':          ['Hook', 'Pacing', 'Visual', 'End Screen'],
  'all':             ['Hook', 'Copy', 'Visual', 'CTA'],
};

/** Format-aware dimension overrides — takes precedence over PLATFORM_DIMENSIONS when matched */
const PLATFORM_FORMAT_DIMENSIONS: Record<string, Record<string, [string, string, string, string]>> = {
  'Meta': {
    'video':  ['Hook', 'Sound-Off', 'Visual', 'CTA'],
    'static': ['Thumb-Stop', 'Message', 'Hierarchy', 'Brand'],
  },
  'TikTok': {
    'video':  ['Hook', 'Retention', 'Audio & Captions', 'CTA'],
  },
};

/** YouTube format-specific dimension labels */
const YOUTUBE_FORMAT_DIMENSIONS: Record<string, [string, string, string, string]> = {
  'skippable':     ['Pre-Skip Hook', 'Watch-Through', 'Message Arc', 'CTA Timing'],
  'non_skippable': ['Message Clarity', 'Brand Visibility', 'CTA Efficiency', 'Visual Impact'],
  'bumper':        ['Brand Recall', 'Simplicity', 'Message', 'Audio Brand'],
  'shorts':        ['Hook', 'Hold Rate', 'Format Fit', 'End Action'],
  'in_feed':       ['Thumbnail', 'Title Strength', 'First 5s', 'Watch-Worthy'],
};

/** YouTube format-specific benchmark labels */
const YOUTUBE_FORMAT_BENCHMARK_LABELS: Record<string, string> = {
  'skippable':     'YouTube VTR avg \u00B7 31.9%',
  'non_skippable': 'YouTube avg \u00B7 completion 100%',
  'bumper':        'YouTube Bumper \u00B7 brand recall',
  'shorts':        'YouTube Shorts avg \u00B7 hold rate',
  'in_feed':       'YouTube In-Feed \u00B7 CTR avg 0.65%',
};

/** Score color — design spec: 7.0+ emerald, 5.0–6.9 amber, below 5.0 red */
function scoreColor(score: number): string {
  if (score >= 7) return "#10b981";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
}

/** Count-up animation from 0 → target over `duration` ms */
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * 10) / 10);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

// ── ScoreHero ──────────────────────────────────────────────────────────────────

export function ScoreHero({ score, verdict, benchmark, dimensions, platform, format, youtubeFormat, accentColor, benchmarkLabelOverride, scoreRange, overallDelta, overallDeltaLabel, dimensionDeltas }: ScoreHeroProps) {
  const animatedScore = useCountUp(score, 600);
  const color = scoreColor(score);
  const [showDeltas, setShowDeltas] = useState(false);
  const hasDelta = overallDelta != null && Math.abs(overallDelta) >= 0.05;
  // When accentColor is supplied, replace the "strong" green (#10b981) with it so
  // platform-specific accent colors (e.g. cyan for Display) propagate everywhere.
  const effectiveColor = (accentColor != null && color === '#10b981') ? accentColor : color;

  // Hide benchmark for platforms that don't serve the current format
  const platformIncompatible = format === 'static' && platform != null && STATIC_INCOMPATIBLE_PLATFORMS.has(platform);

  // Resolve benchmark: explicit prop → platform default lookup → undefined
  const resolvedBenchmark = platformIncompatible
    ? undefined
    : benchmark != null
      ? benchmark
      : platform != null
      ? PLATFORM_BENCHMARKS[platform]
      : undefined;

  const showBenchmark = resolvedBenchmark != null;

  // Apply platform-specific dimension labels (override names from props)
  // YouTube format-specific > format-aware > platform-only
  const ytFormatOverride = (platform === 'YouTube' || platform === 'Shorts') && youtubeFormat
    ? YOUTUBE_FORMAT_DIMENSIONS[youtubeFormat]
    : undefined;
  const formatOverride = platform && format ? PLATFORM_FORMAT_DIMENSIONS[platform]?.[format] : undefined;
  const platformDimLabels = ytFormatOverride ?? formatOverride ?? (platform ? PLATFORM_DIMENSIONS[platform] : undefined);
  const resolvedDimensions = platformDimLabels
    ? dimensions.map((dim, i) => ({
        ...dim,
        name: platformDimLabels[i] ?? dim.name,
      }))
    : dimensions;

  // Resolve benchmark label for display
  // YouTube format-specific labels take precedence
  const ytBenchmarkLabel = (platform === 'YouTube' || platform === 'Shorts') && youtubeFormat
    ? YOUTUBE_FORMAT_BENCHMARK_LABELS[youtubeFormat]
    : undefined;
  const benchmarkLabel = benchmarkLabelOverride ?? ytBenchmarkLabel ?? (platform
    ? (PLATFORM_BENCHMARK_LABELS[platform] ?? `${platform} avg`)
    : "Avg");

  // Badge style based on score band
  const badgeStyles = score >= 7
    ? "bg-emerald-500/[0.15] border-emerald-500/[0.3] text-emerald-400"
    : score >= 5
    ? "bg-[#6366f1]/[0.15] border-[#6366f1]/[0.3] text-[#818cf8]"
    : "bg-red-500/[0.15] border-red-500/[0.3] text-red-400";

  // Benchmark diff text
  const benchmarkDiffText = showBenchmark
    ? (() => {
        const diff = score - resolvedBenchmark!;
        const absDiff = Math.abs(diff).toFixed(1);
        return diff >= 0
          ? `↑ ${absDiff} pts above avg · ${benchmarkLabel.replace(' avg', '')}`
          : `↓ ${absDiff} pts below avg · ${benchmarkLabel.replace(' avg', '')}`;
      })()
    : null;
  const aboveBenchmark = showBenchmark ? score >= resolvedBenchmark! : true;

  return (
    <div className="flex flex-col w-full">
      {/* Hero score section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              OVERALL SCORE
            </span>
            <div className="flex items-center gap-3">
              <span
                className="text-[52px] font-bold leading-none tracking-tight"
                style={{ color: effectiveColor }}
              >
                {animatedScore.toFixed(1)}
              </span>
              <span className="text-[24px] font-bold leading-none text-zinc-600 self-end pb-1">/10</span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-md border text-[12px] font-semibold tracking-wide uppercase mb-1 ${badgeStyles}`}>
            {verdict}
          </div>
        </div>

        {/* Confidence range */}
        {scoreRange && (
          <span className="text-[11px] text-zinc-600 font-mono -mt-2">
            {scoreRange.low.toFixed(1)} – {scoreRange.high.toFixed(1)} range
          </span>
        )}

        {/* Benchmark bar */}
        {showBenchmark && (
          <div className="flex flex-col gap-2 pt-4">
            <div className="flex items-center justify-between w-full flex-nowrap gap-2">
              <span className="text-sm text-zinc-500 whitespace-nowrap shrink-0">
                You · {score.toFixed(1)}
              </span>
              <div className={`rounded-full border font-mono px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[11px] ${
                aboveBenchmark
                  ? 'border-emerald-500/20 text-emerald-400'
                  : 'border-red-500/20 text-red-400'
              }`}>
                <span>{benchmarkDiffText}</span>
              </div>
            </div>
            <div className="relative h-1.5 w-full bg-[#3f3f46] rounded-full overflow-hidden">
              {/* Average marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-zinc-500 z-10"
                style={{ left: `${(resolvedBenchmark! / 10) * 100}%` }}
              />
              {/* Score fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(score / 10) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 bottom-0 left-0 rounded-full"
                style={{ backgroundColor: effectiveColor }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dimension scores — vertical list */}
      <div className="flex flex-col gap-4 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Dimension Scores
          </span>
          {hasDelta && dimensionDeltas && (
            <button
              onClick={() => setShowDeltas(v => !v)}
              className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
                showDeltas
                  ? "border border-indigo-500/20 bg-indigo-500/[0.06] text-indigo-400"
                  : "border border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {showDeltas ? 'Hide changes' : 'Show changes'}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3.5">
          {resolvedDimensions.map((dim, i) => {
            const dimColor = scoreColor(dim.score);
            const dimDisplayColor = accentColor != null ? '#f4f4f5' : dimColor;
            const hasRange = dim.rangeLow != null && dim.rangeHigh != null;
            const dimDelta = dimensionDeltas?.[dim.name];
            const hasDimDelta = showDeltas && dimDelta != null && Math.abs(dimDelta) >= 0.05;
            return (
              <div key={dim.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-400">{dim.name}</span>
                    <AnimatePresence>
                      {hasDimDelta && (
                        <motion.span
                          key="delta"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                            dimDelta! > 0
                              ? "text-emerald-500 bg-emerald-500/[0.06]"
                              : "text-red-400 bg-red-500/[0.06]"
                          }`}
                        >
                          {dimDelta! > 0 ? "↑" : "↓"}{Math.abs(dimDelta!).toFixed(1)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    className="text-sm font-bold leading-none"
                    style={{ color: dimDisplayColor }}
                    aria-label={`${dim.name}: ${dim.score.toFixed(1)} — ${dim.score >= 7 ? "Strong" : dim.score >= 5 ? "Average" : "Weak"}`}
                  >
                    {dim.score.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-1 w-full bg-[#27272a] rounded-full overflow-hidden">
                  {/* Confidence band — always visible when range data exists */}
                  {hasRange && (
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-white/[0.12] transition-opacity duration-300"
                      style={{
                        left: `${(dim.rangeLow! / 10) * 100}%`,
                        width: `${((dim.rangeHigh! - dim.rangeLow!) / 10) * 100}%`,
                      }}
                    />
                  )}
                  {/* Score fill */}
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 rounded-full z-10"
                    style={{ backgroundColor: dimDisplayColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(dim.score / 10) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
