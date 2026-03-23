// ScoreHero.tsx — D3 Score Hero: score number + benchmark bar + dimension grid
// Replaces arc gauge + MetricBars

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getScoreColor, getVerdict, getVerdictColor, getVerdictBg, getVerdictCopy } from '../lib/scoreColors';

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
            background: "var(--accent)",
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
            color: "var(--accent)",
            fontFamily: "var(--mono)",
          }}
        >
          {label ?? "Avg"} · {benchmark.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ── ScoreHero ──────────────────────────────────────────────────────────────────

export function ScoreHero({ score, verdict: _verdict, benchmark, dimensions, platform, format }: ScoreHeroProps) {
  const animatedScore = useCountUp(score, 600);
  const color = getScoreColor(score);

  // Verdict computed internally using shared utility
  const verdict = getVerdict(score);
  const verdictColor = getVerdictColor(verdict);
  const verdictBg = getVerdictBg(verdict);
  const verdictCopy = getVerdictCopy(verdict);

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
  const platformDimLabels = platform ? PLATFORM_DIMENSIONS[platform] : undefined;
  const resolvedDimensions = platformDimLabels
    ? dimensions.map((dim, i) => ({
        ...dim,
        name: platformDimLabels[i] ?? dim.name,
      }))
    : dimensions;

  // Resolve benchmark label for display
  const benchmarkLabel = platform
    ? (PLATFORM_BENCHMARK_LABELS[platform] ?? `${platform} avg`)
    : "Avg";

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
            color: "var(--ink-faint)",
          }}
        >
          /10
        </span>
      </div>

      {/* 2. Verdict chip + copy — gap-2 between score and chip */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span
          className="cs-verdict-chip"
          style={{
            color: verdictColor,
            background: verdictBg,
          }}
        >
          {verdict}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--ink-muted)",
            textAlign: "center",
          }}
        >
          {verdictCopy}
        </span>
      </div>

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
          background: "var(--border-subtle)",
          margin: "16px 0",
        }}
      />

      {/* 5. Dimension grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          width: "100%",
        }}
      >
        {resolvedDimensions.map((dim, i) => {
          const dimColor = getScoreColor(dim.score);
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
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: dimColor,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {dim.score.toFixed(1)}
              </span>
              <span style={{ fontSize: 10, color: "var(--ink-faint)" }}>
                {dim.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
