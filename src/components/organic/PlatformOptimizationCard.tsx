// src/components/organic/PlatformOptimizationCard.tsx
// Organic-only card that surfaces per-platform scores, pass/fail signals, and
// numbered recommendations. Mounts in the center column of OrganicAnalyzer.
// Paid routes do NOT render this component.

import {
  BarChart2,
  ChevronDown,
  Music2,
  Camera,
  Youtube,
  Facebook,
  Instagram,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlatformOptimizationSignalType = "pass" | "fail";

export interface PlatformOptimizationSignal {
  type: PlatformOptimizationSignalType;
  label: string;
}

export interface PlatformOptimizationEntry {
  name: string;
  score: number;
  verdict: string;
  signals: PlatformOptimizationSignal[];
  recommendations: string[];
}

export interface PlatformOptimizationCardProps {
  entries: PlatformOptimizationEntry[];
  className?: string;
}

// ─── Icon + color registry ───────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, ElementType> = {
  tiktok: Music2,
  reels: Camera,
  "instagram reels": Camera,
  shorts: Youtube,
  "youtube shorts": Youtube,
  youtube: Youtube,
  meta: Facebook,
  "meta feed": Facebook,
  facebook: Facebook,
  instagram: Instagram,
  "instagram feed": Instagram,
  pinterest: Camera,
};

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  tiktok: { bg: "bg-rose-500/10", text: "text-rose-500" },
  reels: { bg: "bg-pink-500/10", text: "text-pink-500" },
  "instagram reels": { bg: "bg-pink-500/10", text: "text-pink-500" },
  shorts: { bg: "bg-red-500/10", text: "text-red-500" },
  "youtube shorts": { bg: "bg-red-500/10", text: "text-red-500" },
  youtube: { bg: "bg-red-500/10", text: "text-red-500" },
  meta: { bg: "bg-blue-500/10", text: "text-blue-500" },
  "meta feed": { bg: "bg-blue-500/10", text: "text-blue-500" },
  facebook: { bg: "bg-blue-500/10", text: "text-blue-500" },
  instagram: { bg: "bg-pink-500/10", text: "text-pink-500" },
  "instagram feed": { bg: "bg-pink-500/10", text: "text-pink-500" },
  pinterest: { bg: "bg-red-500/10", text: "text-red-400" },
};

const DEFAULT_ICON = Camera;
const DEFAULT_COLORS = { bg: "bg-white/[0.05]", text: "text-zinc-400" };

function iconFor(name: string): ElementType {
  return PLATFORM_ICONS[name.toLowerCase()] ?? DEFAULT_ICON;
}

function colorsFor(name: string): { bg: string; text: string } {
  return PLATFORM_COLORS[name.toLowerCase()] ?? DEFAULT_COLORS;
}

// ─── Score → status mapping ──────────────────────────────────────────────────
// Matches the organic verdict bands used elsewhere in the app:
//   ≥ 7.0 → EXCELLENT
//   ≥ 5.0 → GOOD
//   < 5.0 → NEEDS WORK

function getScoreColor(score: number): string {
  if (score >= 7) return "text-[#10b981]";
  if (score >= 5) return "text-[#f59e0b]";
  return "text-[#ef4444]";
}

function getScoreBarColor(score: number): string {
  if (score >= 7) return "bg-[#10b981]";
  if (score >= 5) return "bg-[#f59e0b]";
  return "bg-[#ef4444]";
}

function getScoreLabel(score: number): { label: string; classes: string } {
  if (score >= 7) {
    return {
      label: "EXCELLENT",
      classes:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    };
  }
  if (score >= 5) {
    return {
      label: "GOOD",
      classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
  }
  return {
    label: "NEEDS WORK",
    classes: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PlatformOptimizationCard({
  entries,
  className,
}: PlatformOptimizationCardProps) {
  if (!entries || entries.length === 0) return null;

  const count = entries.length;
  const headerSummary = `${count} platform${count === 1 ? "" : "s"} analyzed`;

  return (
    <div
      data-testid="platform-optimization-card"
      className={`rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden flex flex-col ${className ?? ""}`}
    >
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
          <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">
          Platform Optimization
        </h3>
        <span className="text-xs text-zinc-600 ml-auto inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-zinc-500" aria-hidden="true" />
          {headerSummary}
        </span>
      </div>

      {/* PLATFORM ROWS */}
      <div className="flex flex-col">
        {entries.map((entry, index) => {
          const Icon = iconFor(entry.name);
          const colors = colorsFor(entry.name);
          const scoreColor = getScoreColor(entry.score);
          const scoreBarColor = getScoreBarColor(entry.score);
          const { label: scoreLabel, classes: scoreLabelClasses } =
            getScoreLabel(entry.score);
          const isLast = index === entries.length - 1;

          return (
            <div
              key={`${entry.name}-${index}`}
              data-testid="platform-entry"
              className={`flex flex-col ${!isLast ? "border-b border-white/[0.04]" : ""}`}
            >
              {/* HEADER ROW */}
              <div className="px-4 py-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">
                    {entry.name}
                  </span>

                  <span
                    data-testid="status-badge"
                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${scoreLabelClasses}`}
                  >
                    {scoreLabel}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    <span className={`text-sm font-bold ${scoreColor}`}>
                      {entry.score.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-600">/10</span>
                    <ChevronDown
                      className="w-3 h-3 text-zinc-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    data-testid="score-bar-fill"
                    className={`h-full rounded-full ${scoreBarColor}`}
                    style={{ width: `${Math.max(0, Math.min(100, (entry.score / 10) * 100))}%` }}
                  />
                </div>
              </div>

              {/* BODY — always rendered (chevron is decorative) */}
              <div className="px-4 py-3 border-t border-white/[0.04] flex flex-col">
                {/* Verdict */}
                {entry.verdict && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 mb-3 flex items-start gap-2">
                    <Sparkles
                      className="w-3 h-3 text-indigo-400 mt-[2px] shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-zinc-400 italic leading-relaxed">
                      {entry.verdict}
                    </p>
                  </div>
                )}

                {/* Quick Checks */}
                {entry.signals.length > 0 && (
                  <div className="flex flex-col mb-3">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                      QUICK CHECKS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {entry.signals.map((signal, idx) => {
                        const pass = signal.type === "pass";
                        return (
                          <div
                            key={`${signal.label}-${idx}`}
                            data-testid={`signal-${signal.type}`}
                            className={`text-[10px] font-medium rounded-lg px-2 py-1 flex items-center gap-1 ${
                              pass
                                ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400"
                                : "bg-red-500/10 border border-red-500/15 text-red-400"
                            }`}
                          >
                            {pass ? (
                              <CheckCircle
                                className="w-2.5 h-2.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <XCircle
                                className="w-2.5 h-2.5"
                                aria-hidden="true"
                              />
                            )}
                            {signal.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {entry.recommendations.length > 0 && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                      RECOMMENDATIONS
                    </span>
                    <div className="flex flex-col">
                      {entry.recommendations.map((rec, idx) => {
                        const isLastRec =
                          idx === entry.recommendations.length - 1;
                        return (
                          <div
                            key={`${rec}-${idx}`}
                            className={`flex items-start gap-2 py-2 ${!isLastRec ? "border-b border-white/[0.03]" : ""}`}
                          >
                            <div
                              data-testid="recommendation-chip"
                              className="w-4 h-4 rounded bg-[#6366f1]/10 text-[#6366f1] text-[10px] font-bold flex items-center justify-center shrink-0"
                            >
                              {idx + 1}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {rec}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
