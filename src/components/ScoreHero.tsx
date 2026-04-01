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

/** Colorblind-safe indicator: shape that communicates score band without relying on color */
function scoreIndicator(score: number): string {
  if (score >= 7) return "\u25B2"; // ▲ up triangle = strong
  if (score >= 5) return "\u25CF"; // ● circle = average
  return "\u25BC"; // ▼ down triangle = weak
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

// ── Benchmark bar ──────────────────────────────────────────────────────────────

interface BenchmarkBarProps {
  score: number;
  benchmark: number;
  color: string;
  platform?: string;
  label?: string;
}

function BenchmarkBar({ score, benchmark, color, label }: BenchmarkBarProps) {
  const fillPct = `${(score / 10) * 100}%`;
  const tickPct = `${(benchmark / 10) * 100}%`;

  return (
    <div className="w-full flex flex-col">
      {/* Labels above bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-zinc-400">
          You · {score.toFixed(1)}
        </span>
        <span 
          className="font-mono text-[10px] text-zinc-500 truncate max-w-[55%] text-right"
          title={`${label ?? "Avg"} · ${benchmark.toFixed(1)}`}
        >
          {label ?? "Avg"} · {benchmark.toFixed(1)}
        </span>
      </div>
      
      {/* Bar track */}
      <div className="relative w-full h-1 bg-white/[0.04] rounded-full">
        {/* Score fill */}
        <motion.div
          className="absolute h-full rounded-full left-0 top-0"
          style={{ background: `${color}80` }}
          initial={{ width: 0 }}
          animate={{ width: fillPct }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Benchmark tick */}
        <div
          className="absolute w-0.5 h-2.5 bg-zinc-500 rounded-sm"
          style={{
            top: -3,
            left: tickPct,
            transform: "translateX(-50%)",
          }}
        />
      </div>
    </div>
  );
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

  return (
    <div className="flex flex-col items-center w-full px-4 pt-5 pb-4">
      {/* Score display — brand guide: Geist Mono, 40px, Bold */}
      <div className="flex items-baseline gap-1">
        <span
          className="font-mono tabular-nums tracking-tight"
          style={{
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1,
            color: effectiveColor,
            letterSpacing: '-0.03em',
          }}
        >
          {animatedScore.toFixed(1)}
        </span>
        <span className="font-mono text-sm text-zinc-500">/10</span>
      </div>

      {/* Verdict label — neutral, not accent-colored */}
      <span
        className="text-xs font-semibold mt-1.5"
        style={{ color: '#a1a1aa' }}
      >
        {verdict}
      </span>

      {/* Confidence range — shown when scoreRange is provided */}
      {scoreRange && (
        <span className="text-[11px] text-zinc-600 font-mono mt-1">
          {scoreRange.low.toFixed(1)} – {scoreRange.high.toFixed(1)} range
        </span>
      )}

      {/* Score delta pill — shown when a previous analysis exists */}
      {hasDelta && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold"
          style={{
            background: overallDelta! > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: overallDelta! > 0 ? '#10b981' : '#ef4444',
          }}
        >
          <span>{overallDelta! > 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(overallDelta!).toFixed(1)}</span>
          {overallDeltaLabel && (
            <span className="font-normal opacity-70 ml-0.5">{overallDeltaLabel}</span>
          )}
        </motion.div>
      )}

      {/* Benchmark bar */}
      {showBenchmark && (
        <div className="w-full mt-4">
          <BenchmarkBar
            score={score}
            benchmark={resolvedBenchmark!}
            color={accentColor ?? color}
            platform={platform}
            label={benchmarkLabel}
          />
        </div>
      )}

      {/* Dimension grid — score + mini bar with optional confidence band */}
      <div className="w-full mt-4 pt-4 border-t border-white/[0.04]">
        {/* "Show changes" toggle — only visible when delta data exists */}
        {hasDelta && dimensionDeltas && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowDeltas(v => !v)}
              className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-opacity"
            >
              {showDeltas ? 'Hide changes' : 'Show changes'}
            </button>
          </div>
        )}
        <div className="grid grid-cols-4 gap-1.5">
          {resolvedDimensions.map((dim, i) => {
            const dimColor = scoreColor(dim.score);
            // When accentColor is provided (e.g. Display), use neutral white for tiles
            // so page accent color never bleeds into individual score tiles.
            const dimDisplayColor = accentColor != null ? '#f4f4f5' : dimColor;
            const hasRange = dim.rangeLow != null && dim.rangeHigh != null;
            return (
              <motion.div
                key={dim.name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.015)' }}
              >
                <span
                  className="font-mono text-xs font-medium tabular-nums"
                  style={{ color: dimDisplayColor }}
                  aria-label={`${dim.name}: ${dim.score.toFixed(1)} — ${dim.score >= 7 ? "Strong" : dim.score >= 5 ? "Average" : "Weak"}`}
                >
                  {scoreIndicator(dim.score)} {dim.score.toFixed(1)}
                </span>

                {/* Mini bar track with optional confidence band */}
                <div className="relative w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  {/* Confidence band — lighter overlay spanning rangeLow → rangeHigh */}
                  {hasRange && (
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${(dim.rangeLow! / 10) * 100}%`,
                        width: `${((dim.rangeHigh! - dim.rangeLow!) / 10) * 100}%`,
                        background: `${dimDisplayColor}30`,
                      }}
                    />
                  )}
                  {/* Score fill */}
                  <motion.div
                    className="absolute h-full rounded-full left-0 top-0"
                    style={{ background: dimDisplayColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(dim.score / 10) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
                  />
                </div>

                <span className="text-[9px] text-zinc-500 text-center leading-tight whitespace-nowrap">
                  {dim.name}
                </span>

                {/* Per-dimension delta chip */}
                <AnimatePresence>
                  {showDeltas && dimensionDeltas && dimensionDeltas[dim.name] != null && Math.abs(dimensionDeltas[dim.name]) >= 0.05 && (
                    <motion.span
                      key="delta"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className="font-mono text-[9px] font-semibold"
                      style={{
                        color: dimensionDeltas[dim.name] > 0 ? '#10b981' : '#ef4444',
                      }}
                    >
                      {dimensionDeltas[dim.name] > 0 ? '+' : ''}{dimensionDeltas[dim.name].toFixed(1)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
