// ScoreHero.tsx — D3 Score Hero: score number + benchmark bar + dimension grid
// Replaces arc gauge + MetricBars

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/** Platforms that do NOT support static image ads — benchmark should be hidden for these */
const STATIC_INCOMPATIBLE_PLATFORMS = new Set(['TikTok', 'YouTube', 'YouTube Shorts', 'Instagram Reels']);

export interface ScoreHeroProps {
  score: number;          // 0–10, one decimal
  verdict: string;        // 'Strong' | 'Average' | 'Needs Work' | etc.
  benchmark?: number;     // platform average, e.g. 7.2
  dimensions: {
    name: string;         // 'Hook' | 'Copy' | 'Visual' | 'CTA'
    score: number;        // 0–10
  }[];
  platform?: string;      // 'Meta' | 'TikTok' | etc. — for benchmark label
  format?: 'video' | 'static';  // ad format — used to hide invalid benchmarks
  youtubeFormat?: string; // YouTube sub-format: 'skippable' | 'non_skippable' | 'bumper' | 'shorts' | 'in_feed'
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

/** Score color: 8+ emerald, 4–7.9 amber, 0–3.9 red */
function scoreColor(score: number): string {
  if (score >= 8) return "#10b981";
  if (score >= 4) return "#f59e0b";
  return "#ef4444";
}

/** Colorblind-safe indicator: shape that communicates score band without relying on color */
function scoreIndicator(score: number): string {
  if (score >= 8) return "\u25B2"; // ▲ up triangle = strong
  if (score >= 4) return "\u25CF"; // ● circle = average
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
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Bar track — position:relative, NOT overflow:hidden so tick can overflow */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 9999,
          position: "relative",
          marginTop: 16,
        }}
      >
        {/* Score fill */}
        <motion.div
          style={{
            height: "100%",
            background: color,
            borderRadius: 9999,
            position: "absolute",
            left: 0,
            top: 0,
          }}
          initial={{ width: 0 }}
          animate={{ width: fillPct }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Benchmark tick — overflows the track vertically */}
        <div
          style={{
            position: "absolute",
            width: 2,
            height: 14,
            background: "#6366f1",
            borderRadius: 2,
            top: -5,
            left: tickPct,
            transform: "translateX(-50%)",
          }}
        />
      </div>

      {/* Labels below bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: color,
            fontFamily: "var(--mono)",
          }}
        >
          You · {score.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#6366f1",
            fontFamily: "var(--mono)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "55%",
            textAlign: "right",
          }}
          title={`${label ?? "Avg"} · ${benchmark.toFixed(1)}`}
        >
          {label ?? "Avg"} · {benchmark.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ── ScoreHero ──────────────────────────────────────────────────────────────────

export function ScoreHero({ score, verdict, benchmark, dimensions, platform, format, youtubeFormat }: ScoreHeroProps) {
  const animatedScore = useCountUp(score, 600);
  const color = scoreColor(score);

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
  const benchmarkLabel = ytBenchmarkLabel ?? (platform
    ? (PLATFORM_BENCHMARK_LABELS[platform] ?? `${platform} avg`)
    : "Avg");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "24px 16px 8px",
      }}
    >
      {/* 1. Score number + /10 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1,
            color,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {animatedScore.toFixed(1)}
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 16,
            color: "#71717a",
          }}
        >
          /10
        </span>
      </div>

      {/* 2. Verdict label */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color,
          marginTop: 4,
        }}
      >
        {verdict}
      </span>

      {/* 3. Benchmark bar (conditional) */}
      {showBenchmark && (
        <BenchmarkBar
          score={score}
          benchmark={resolvedBenchmark!}
          color={color}
          platform={platform}
          label={benchmarkLabel}
        />
      )}

      {/* 4. Divider */}
      <div
        style={{
          width: "100%",
          height: 1,
          background: "rgba(255,255,255,0.06)",
          margin: "16px 0",
        }}
      />

      {/* 5. Dimension grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          width: "100%",
        }}
      >
        {resolvedDimensions.map((dim, i) => {
          const dimColor = scoreColor(dim.score);
          return (
            <motion.div
              key={dim.name}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.08, ease: "easeOut" }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: dimColor,
                  fontVariantNumeric: "tabular-nums",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 7, lineHeight: 1 }} aria-hidden="true">{scoreIndicator(dim.score)}</span>
                {dim.score.toFixed(1)}
              </span>
              <span style={{ fontSize: 11, color: "#71717a", whiteSpace: "nowrap" }}>
                {dim.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
