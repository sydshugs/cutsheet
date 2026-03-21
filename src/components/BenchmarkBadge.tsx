// BenchmarkBadge.tsx — Inline benchmark context for scorecards
// Shows how the user's score compares to industry average

import { Info } from "lucide-react";
import { useState } from "react";
import type { BenchmarkResult } from "../lib/benchmarks";

interface BenchmarkBadgeProps {
  userScore: number      // 0-10 scale
  benchmark: BenchmarkResult
  className?: string
}

export function BenchmarkBadge({ userScore, benchmark, className }: BenchmarkBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const diff = Math.round((userScore - benchmark.averageScore) * 10) / 10;
  const absDiff = Math.abs(diff);

  // Three states: above (>= +0.5), at (within ±0.4), below (<= -0.5)
  const isAbove = diff >= 0.5;
  const isBelow = diff <= -0.5;

  const style = isAbove
    ? { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.2)" }
    : isBelow
    ? { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" }
    : { bg: "rgba(113,113,122,0.15)", color: "#a1a1aa", border: "rgba(113,113,122,0.2)" };

  const label = isAbove
    ? `↑ ${absDiff} pts above avg ${benchmark.sampleLabel}`
    : isBelow
    ? `↓ ${absDiff} pts below avg ${benchmark.sampleLabel}`
    : `≈ Near avg ${benchmark.sampleLabel} (${benchmark.averageScore}/10)`;

  const tooltipText = benchmark.source === 'aggregate'
    ? `Based on real Cutsheet analyses for ${benchmark.sampleLabel}.`
    : `Based on industry benchmarks for ${benchmark.sampleLabel}. Powered by Cutsheet benchmark data.`;

  return (
    <div className={`relative inline-flex items-center gap-1 ${className ?? ""}`}>
      <span
        className="text-xs font-medium rounded-full px-3 py-1 leading-tight"
        style={{
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
        }}
      >
        {label}
      </span>
      <button
        type="button"
        className="relative cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="Benchmark information"
      >
        <Info size={14} style={{ color: style.color, opacity: 0.6 }} />
        {showTooltip && (
          <div
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-xs leading-relaxed text-zinc-300 rounded-lg px-3 py-2.5"
            style={{
              background: "rgba(24,24,27,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {tooltipText}
          </div>
        )}
      </button>
    </div>
  );
}
