// ScoreHero.tsx — pixel-matched to Figma node 228:69
// Score number + benchmark bar + dimension list with deltas

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

/** Platforms that do NOT support static image ads — benchmark should be hidden for these */
const STATIC_INCOMPATIBLE_PLATFORMS = new Set(['TikTok', 'YouTube', 'YouTube Shorts', 'Instagram Reels']);

export interface ScoreHeroProps {
  score: number;
  verdict: string;
  benchmark?: number;
  dimensions: {
    name: string;
    score: number;
    rangeLow?: number;
    rangeHigh?: number;
  }[];
  platform?: string;
  format?: 'video' | 'static';
  youtubeFormat?: string;
  accentColor?: string;
  benchmarkLabelOverride?: string;
  scoreRange?: { low: number; high: number };
  overallDelta?: number;
  overallDeltaLabel?: string;
  dimensionDeltas?: Record<string, number>;
  platformCta?: string | null;
  isOrganic?: boolean;
}

const PLATFORM_BENCHMARKS: Record<string, number> = {
  'Meta': 7.2, 'TikTok': 6.8, 'Instagram': 7.0, 'YouTube': 7.4,
  'Google': 6.5, 'Google Display': 6.5, 'Instagram Reels': 6.9,
  'YouTube Shorts': 6.6, 'LinkedIn': 6.9, 'Facebook': 7.0,
};

const PLATFORM_BENCHMARK_LABELS: Record<string, string> = {
  'Meta': 'Meta avg', 'TikTok': 'TikTok avg', 'YouTube': 'YouTube avg',
  'Google': 'Google Display avg', 'Instagram Reels': 'Reels avg',
  'YouTube Shorts': 'Shorts avg', 'Instagram': 'Instagram avg',
  'Facebook': 'Facebook avg', 'all': 'Industry avg',
};

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

const PLATFORM_FORMAT_DIMENSIONS: Record<string, Record<string, [string, string, string, string]>> = {
  'Meta': {
    'video':  ['Hook', 'Sound-Off', 'Visual', 'CTA'],
    'static': ['Thumb-Stop', 'Message', 'Visual', 'Brand'],
  },
  'TikTok': {
    'video':  ['Hook', 'Retention', 'Audio & Captions', 'CTA'],
  },
};

// Organic mode: platform-independent vocabulary that overrides PLATFORM_FORMAT_DIMENSIONS when isOrganic=true.
// Positional map — order must match ScoreCard's 4-element dimensions prop: [hook, clarity, production, cta].
// TODO(tech-debt): Dimension label shim — positional map.
// The Scores type in code uses { hook, clarity, production, cta } but the product
// vocabulary has shifted to { hook, message, visual, brand } per Figma node 456:2343.
// This constant is a label-only fix: slot 0→Hook, slot 1→Message (clarity), slot 2→Visual (production),
// slot 3→Brand (cta). The full rename (Scores type, analyzerService parsing, api/analyze.ts prompt schema,
// Supabase analyses table, ReportCover, Remotion ScorecardScene, ProgressCard loading labels) is scheduled
// as a standalone backend pass — see docs/superpowers/plans/2026-04-23-figma-parity-organic.md §13.
const ORGANIC_DIMENSIONS: [string, string, string, string] = ['Hook', 'Message', 'Visual', 'Brand'];

const YOUTUBE_FORMAT_DIMENSIONS: Record<string, [string, string, string, string]> = {
  'skippable':     ['Pre-Skip Hook', 'Watch-Through', 'Message Arc', 'CTA Timing'],
  'non_skippable': ['Message Clarity', 'Brand Visibility', 'CTA Efficiency', 'Visual Impact'],
  'bumper':        ['Brand Recall', 'Simplicity', 'Message', 'Audio Brand'],
  'shorts':        ['Hook', 'Hold Rate', 'Format Fit', 'End Action'],
  'in_feed':       ['Thumbnail', 'Title Strength', 'First 5s', 'Watch-Worthy'],
};

const YOUTUBE_FORMAT_BENCHMARK_LABELS: Record<string, string> = {
  'skippable':     'YouTube VTR avg \u00B7 31.9%',
  'non_skippable': 'YouTube avg \u00B7 completion 100%',
  'bumper':        'YouTube Bumper \u00B7 brand recall',
  'shorts':        'YouTube Shorts avg \u00B7 hold rate',
  'in_feed':       'YouTube In-Feed \u00B7 CTR avg 0.65%',
};

function scoreColor(score: number): string {
  if (score >= 7) return "#10b981";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
}

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * 10) / 10);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

export function ScoreHero({
  score, verdict, benchmark, dimensions, platform, format, youtubeFormat,
  accentColor, benchmarkLabelOverride, scoreRange, overallDelta, dimensionDeltas,
  platformCta, isOrganic,
}: ScoreHeroProps) {
  const animatedScore = useCountUp(score, 600);
  const color = scoreColor(score);
  const [showDeltas, setShowDeltas] = useState(false);
  const hasDelta = overallDelta != null && Math.abs(overallDelta) >= 0.05;
  const effectiveColor = (accentColor != null && color === '#10b981') ? accentColor : color;

  const platformIncompatible = format === 'static' && platform != null && STATIC_INCOMPATIBLE_PLATFORMS.has(platform);
  const resolvedBenchmark = platformIncompatible
    ? undefined
    : benchmark != null ? benchmark : platform != null ? PLATFORM_BENCHMARKS[platform] : undefined;
  const showBenchmark = resolvedBenchmark != null;

  const ytFormatOverride = (platform === 'YouTube' || platform === 'Shorts') && youtubeFormat
    ? YOUTUBE_FORMAT_DIMENSIONS[youtubeFormat] : undefined;
  const formatOverride = platform && format ? PLATFORM_FORMAT_DIMENSIONS[platform]?.[format] : undefined;
  const platformDimLabels = isOrganic
    ? ORGANIC_DIMENSIONS
    : (ytFormatOverride ?? formatOverride ?? (platform ? PLATFORM_DIMENSIONS[platform] : undefined));
  const resolvedDimensions = platformDimLabels
    ? dimensions.map((dim, i) => ({ ...dim, name: platformDimLabels[i] ?? dim.name }))
    : dimensions;

  const ytBenchmarkLabel = (platform === 'YouTube' || platform === 'Shorts') && youtubeFormat
    ? YOUTUBE_FORMAT_BENCHMARK_LABELS[youtubeFormat] : undefined;
  const benchmarkLabel = benchmarkLabelOverride ?? ytBenchmarkLabel ?? (platform
    ? (PLATFORM_BENCHMARK_LABELS[platform] ?? `${platform} avg`) : "Avg");

  // Verdict badge — always indigo for ≥7, else score-banded
  const badgeBg = score >= 7
    ? 'rgba(99,102,241,0.15)' : score >= 5
    ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)';
  const badgeBorder = score >= 7
    ? 'rgba(99,102,241,0.3)' : score >= 5
    ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)';
  const badgeText = score >= 5 ? '#818cf8' : '#f87171';

  const benchmarkDiffText = showBenchmark
    ? (() => {
        const diff = score - resolvedBenchmark!;
        const absDiff = Math.abs(diff).toFixed(1);
        const platformShort = benchmarkLabel.replace(' avg', '');
        return diff >= 0
          ? `↑ ${absDiff} pts above avg · ${platformShort}`
          : `↓ ${absDiff} pts below avg · ${platformShort}`;
      })()
    : null;
  const aboveBenchmark = showBenchmark ? score >= resolvedBenchmark! : true;

  return (
    <div className="flex flex-col w-full">
      {/* ── Score hero ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          {/* Left: OVERALL SCORE label + big number */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[1.27px] text-[#71717b]">
              OVERALL SCORE
            </span>
            <div className="flex items-baseline gap-0 leading-none">
              <span
                className="text-[50px] font-bold leading-none tracking-tight"
                style={{ color: effectiveColor }}
              >
                {animatedScore.toFixed(1)}
              </span>
              <span className="text-[23px] font-bold leading-none text-[#52525c] ml-0.5 self-end pb-0.5">/10</span>
            </div>
          </div>
          {/* Right: verdict badge */}
          <div
            className="px-[10px] h-[28px] flex items-center rounded-[6px] border text-[12px] font-semibold tracking-[0.3px] uppercase whitespace-nowrap self-end mb-1"
            style={{ background: badgeBg, borderColor: badgeBorder, color: badgeText }}
          >
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
          <div className="flex flex-col gap-[9px] pt-4">
            {/* Labels row */}
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[13px] text-[#71717b] whitespace-nowrap shrink-0">
                You · {score.toFixed(1)}
              </span>
              <div
                className="rounded-full border flex items-center gap-[6px] px-[12px] min-w-0 overflow-hidden"
                style={{
                  height: 29,
                  borderColor: aboveBenchmark ? 'rgba(0,188,125,0.2)' : 'rgba(239,68,68,0.2)',
                }}
              >
                <span
                  className="font-mono text-[11px] truncate"
                  style={{ color: aboveBenchmark ? '#00d492' : '#f87171' }}
                >
                  {benchmarkDiffText}
                </span>
                <Info size={13} className="shrink-0 cursor-help" style={{ color: '#71717a' }} aria-label="Benchmark comparison info" />
              </div>
            </div>
            {/* Bar track */}
            <div className="relative h-[6.5px] w-full bg-[#3f3f46] rounded-full overflow-hidden">
              {/* Avg marker */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#71717b] z-10"
                style={{ left: `${(resolvedBenchmark! / 10) * 100}%` }}
              />
              {/* Fill */}
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

      {/* ── Dimension scores ── */}
      <div className="flex flex-col gap-[15px] pt-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[1.27px] text-[#71717b]">
            Dimension Scores
          </span>
          {hasDelta && dimensionDeltas && (
            <button
              onClick={() => setShowDeltas(v => !v)}
              className="rounded-full px-3 py-[5px] text-[11px] font-medium transition-colors"
              style={{
                background: 'rgba(97,95,255,0.06)',
                border: '1px solid rgba(97,95,255,0.2)',
                color: '#7c86ff',
              }}
            >
              {showDeltas ? 'Hide changes' : 'Show changes'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-[13px]">
          {resolvedDimensions.map((dim) => {
            const dimColor = scoreColor(dim.score);
            const dimDisplayColor = accentColor != null ? '#f4f4f5' : dimColor;
            const hasRange = dim.rangeLow != null && dim.rangeHigh != null;
            const dimDelta = dimensionDeltas?.[dim.name];
            const hasDimDelta = showDeltas && dimDelta != null && Math.abs(dimDelta) >= 0.05;
            return (
              <div key={dim.name} className="flex flex-col gap-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[13px] font-medium text-[#9f9fa9]">{dim.name}</span>
                    {dim.name === 'CTA' && platformCta && (
                      <span
                        className="text-[10px] font-medium rounded px-[5px] py-[1px]"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#71717a',
                        }}
                        title={`Platform CTA: ${platformCta}`}
                      >
                        Platform
                      </span>
                    )}
                    <AnimatePresence>
                      {hasDimDelta && (
                        <motion.span
                          key="delta"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="text-[11px] font-semibold rounded-[4px] px-[6px] py-[2px]"
                          style={dimDelta! > 0
                            ? { background: 'rgba(0,188,125,0.06)', color: '#00bc7d' }
                            : { background: 'rgba(251,44,54,0.06)', color: '#ff6467' }
                          }
                        >
                          {dimDelta! > 0 ? '↑' : '↓'}{Math.abs(dimDelta!).toFixed(1)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    className="text-[13px] font-bold leading-none"
                    style={{ color: dimDisplayColor }}
                    aria-label={`${dim.name}: ${dim.score.toFixed(1)}`}
                  >
                    {dim.score.toFixed(1)}
                  </span>
                </div>
                {dim.name === 'CTA' && platformCta && (
                  <div className="flex items-center gap-1.5 mt-1 pl-0">
                    <Info size={11} style={{ color: '#71717a' }} />
                    <span className="text-[10px] text-zinc-500">
                      Scored for end-frame effectiveness — Meta's native button handles the CTA
                    </span>
                  </div>
                )}
                <div className="relative h-[4px] w-full bg-[#27272a] rounded-full overflow-hidden">
                  {hasRange && (
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-white/[0.12]"
                      style={{
                        left: `${(dim.rangeLow! / 10) * 100}%`,
                        width: `${((dim.rangeHigh! - dim.rangeLow!) / 10) * 100}%`,
                      }}
                    />
                  )}
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
