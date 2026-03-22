// ScoreHero.tsx — D3 Score Hero: score number + benchmark bar + dimension grid
// Replaces arc gauge + MetricBars

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export interface ScoreHeroProps {
  score: number;          // 0–10, one decimal
  verdict: string;        // 'Strong' | 'Average' | 'Needs Work' | etc.
  benchmark?: number;     // platform average, e.g. 7.2
  dimensions: {
    name: string;         // 'Hook' | 'Copy' | 'Visual' | 'CTA'
    score: number;        // 0–10
  }[];
  platform?: string;      // 'Meta' | 'TikTok' | etc. — for benchmark label
}

/** Score color: 8+ emerald, 4–7.9 amber, 0–3.9 red */
function getScoreColor(score: number): string {
  if (score >= 8) return "#10b981";
  if (score >= 4) return "#f59e0b";
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

// ── Benchmark bar ──────────────────────────────────────────────────────────────

interface BenchmarkBarProps {
  score: number;
  benchmark: number;
  scoreColor: string;
  platform?: string;
}

function BenchmarkBar({ score, benchmark, scoreColor, platform }: BenchmarkBarProps) {
  return (
    <div className="w-full flex flex-col gap-1">
      {/* Bar track */}
      <div className="relative w-full h-1 bg-white/[0.07] rounded-full overflow-hidden">
        {/* Score fill */}
        <motion.div
          className="h-full rounded-full"
          style={{ background: scoreColor }}
          initial={{ width: "0%" }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {/* Benchmark tick — outside the overflow:hidden track, positioned relative to column */}
      <div className="relative w-full" style={{ height: 0 }}>
        <div
          className="absolute"
          style={{
            left: `${(benchmark / 10) * 100}%`,
            top: -13,
            transform: "translateX(-50%)",
            width: 2,
            height: 14,
            background: "#6366f1",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Labels below bar */}
      <div className="flex justify-between" style={{ marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "var(--ink-faint)", fontFamily: "var(--mono)" }}>
          You · {score.toFixed(1)}
        </span>
        <span style={{ fontSize: 10, color: "var(--ink-faint)", fontFamily: "var(--mono)" }}>
          {platform ? `${platform} avg` : "Avg"} · {benchmark.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ── ScoreHero ──────────────────────────────────────────────────────────────────

export function ScoreHero({ score, verdict, benchmark, dimensions, platform }: ScoreHeroProps) {
  const animatedScore = useCountUp(score, 600);
  const scoreColor = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-4 w-full px-5 pt-6 pb-2">
      {/* Section 1 — Score number + verdict */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-1">
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1,
              color: scoreColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {animatedScore.toFixed(1)}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink-faint)" }}>
            /10
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: scoreColor }}>
          {verdict}
        </span>
      </div>

      {/* Section 2 — Benchmark bar (conditional) */}
      {benchmark != null && (
        <BenchmarkBar
          score={score}
          benchmark={benchmark}
          scoreColor={scoreColor}
          platform={platform}
        />
      )}

      {/* Section 3 — Divider */}
      <div className="w-full h-px bg-white/[0.06]" />

      {/* Section 4 — Dimension scores row */}
      <div className="grid grid-cols-4 w-full">
        {dimensions.map((dim, i) => {
          const dimColor = getScoreColor(dim.score);
          return (
            <motion.div
              key={dim.name}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.08, ease: "easeOut" }}
              className="flex flex-col items-center gap-0.5"
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
              <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                {dim.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
