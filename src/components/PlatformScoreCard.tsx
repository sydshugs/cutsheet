// src/components/PlatformScoreCard.tsx — Figma-parity rewrite (Organic-Static 493:1439).
// Atomic rewrite per Pass 5 audit: single-card flat-row shell, CSS-only transitions.
// Data contract (`PlatformScore[]` from claudeService) preserved — no caller changes.
//
// TODO(tech-debt #8): Cutsheet has 4+ conflicting score-tier label systems —
//   • ScoreCard:       Strong Performance / Good Potential / Average / Needs Work (8/7/5)
//   • PlatformScoreCard: Excellent / Good / Fair / Needs Work (8/6/4) — this file
//   • Remotion + Demo: Excellent / Good / Average / Weak (9/7/5)
//   • verdictState:    not_ready / needs_work / ready (ReportCards 5/8, Display 4/8)
// Unifying tier vocabulary + thresholds belongs on its own track — needs a
// scoring-philosophy brainstorm → single source of truth → coordinated update
// across all 4 systems. Do not unilaterally consolidate here.
//
// Pass 5 scope: preserve this file's shipped 4-tier labels and 8/6/4 thresholds;
// fix the color/label threshold misalignment bug so the pill color tracks the
// label tier (score 4 → "Fair" in amber, previously showed "Fair" in red).

import { useState } from 'react';
import { BarChart2, Music2, Camera, Youtube, CheckCircle, XCircle, Facebook, Instagram, Pin, Sparkles, ChevronDown } from 'lucide-react';
import type { PlatformScore } from '../services/claudeService';

interface PlatformScoreCardProps {
  scores: PlatformScore[];
  loading: boolean;
  platform: string;  // OrganicAnalyzer Platform value: "all" | "TikTok" | "Instagram Reels" | "YouTube Shorts"
}

// Platform display label + icon. Pinterest stays `Pin` (audit row 13 —
// Track B's `Camera` mapping is a copy-paste quirk, not intentional Figma spec).
const PLATFORM_META: Record<string, {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  bg: string;
  color: string;
}> = {
  tiktok:    { label: 'TikTok',          Icon: Music2,    bg: 'rgba(244,63,94,0.10)',   color: '#f43f5e' },
  reels:     { label: 'Instagram Reels', Icon: Camera,    bg: 'rgba(236,72,153,0.10)',  color: '#ec4899' },
  shorts:    { label: 'YouTube Shorts',  Icon: Youtube,   bg: 'rgba(239,68,68,0.10)',   color: '#ef4444' },
  meta:      { label: 'Meta Feed',       Icon: Facebook,  bg: 'rgba(59,130,246,0.10)',  color: '#3b82f6' },
  instagram: { label: 'Instagram Feed',  Icon: Instagram, bg: 'rgba(236,72,153,0.10)',  color: '#ec4899' },
  pinterest: { label: 'Pinterest',       Icon: Pin,       bg: 'rgba(220,38,38,0.10)',   color: '#dc2626' },
};

// Score → color aligned to label thresholds (bug fix for Pass 5).
// Matches tokens.css semantic bands: --score-excellent / --score-good are the
// same emerald per tokens.css:83-84; --score-average amber; --score-weak red.
// No new hex colors introduced.
function scoreColor(score: number): string {
  if (score >= 8) return '#10b981'; // --score-excellent
  if (score >= 6) return '#10b981'; // --score-good (same emerald per tokens.css)
  if (score >= 4) return '#f59e0b'; // --score-average
  return '#ef4444';                  // --score-weak
}

// 4-tier labels — shipped labels + thresholds preserved (8/6/4).
function scoreLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Needs Work';
}

// Tailwind utility classes per tier — bg-*/10, border-*/20, text-*-400.
function scoreLabelClasses(score: number): string {
  if (score >= 6) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (score >= 4) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border border-red-500/20';
}

// ─── Shimmer row (loading state) ─────────────────────────────────────────────
// Out-of-scope in Figma 493:1439 (audit row 12). Shell simplified to match the
// new flat-row layout; no per-card gradient.

function ShimmerRow() {
  return (
    <div className="px-4 py-3 flex flex-col gap-2.5 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-3 w-full">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] shrink-0" />
        <div className="w-24 h-3 rounded bg-white/[0.04]" />
        <div className="w-14 h-3.5 rounded bg-white/[0.04]" />
        <div className="ml-auto w-10 h-3 rounded bg-white/[0.04]" />
      </div>
      <div className="w-full h-[3px] rounded-full bg-white/[0.04]" />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function PlatformScoreCard({ scores, loading, platform }: PlatformScoreCardProps) {
  // First row expanded by default (audit row 10); toggle per-row on click.
  const [expandedRows, setExpandedRows] = useState<number[]>([0]);

  const toggleRow = (i: number) => {
    setExpandedRows(prev =>
      prev.includes(i) ? prev.filter(n => n !== i) : [...prev, i]
    );
  };

  if (!loading && scores.length === 0) return null;

  const shimmerCount = platform === 'all' ? 3 : 1;
  const countLabel = loading
    ? 'Analyzing platform fit...'
    : `${scores.length} platform${scores.length !== 1 ? 's' : ''} analyzed`;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden flex flex-col">
      {/* ── Card header ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
          <BarChart2 size={14} className="text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">Platform Optimization</h3>
        <span className="text-xs text-zinc-600 ml-auto">{countLabel}</span>
      </div>

      {/* ── Rows ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col">
        {loading && scores.length === 0
          ? Array.from({ length: shimmerCount }).map((_, i) => <ShimmerRow key={`shimmer-${i}`} />)
          : scores.map((score, index) => {
              const meta = PLATFORM_META[score.platform] ?? {
                label: score.platform,
                Icon: BarChart2,
                bg: 'rgba(99,102,241,0.10)',
                color: '#6366f1',
              };
              const Icon = meta.Icon;
              const color = scoreColor(score.score);
              const label = scoreLabel(score.score);
              const labelClasses = scoreLabelClasses(score.score);
              const isExpanded = expandedRows.includes(index);
              const isLast = index === scores.length - 1;

              return (
                <div
                  key={`${score.platform}-${index}`}
                  className={`flex flex-col ${!isLast ? 'border-b border-white/[0.04]' : ''}`}
                >
                  {/* Collapsed header row */}
                  <button
                    type="button"
                    onClick={() => toggleRow(index)}
                    className="px-4 py-3 flex flex-col gap-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors duration-150 text-left w-full focus-visible:outline-none focus-visible:bg-white/[0.03]"
                    aria-expanded={isExpanded}
                    aria-label={`${meta.label} · ${score.score.toFixed(1)} out of 10 · ${label}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: meta.bg }}
                      >
                        <Icon size={14} color={meta.color} />
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{meta.label}</span>
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 uppercase tracking-wider ${labelClasses}`}>
                        {label}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color }}>
                          {score.score.toFixed(1)}
                        </span>
                        <span className="text-xs text-zinc-600">/10</span>
                        <ChevronDown
                          size={12}
                          className={`text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Thin 3px score bar */}
                    <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(score.score / 10) * 100}%`, background: color }}
                      />
                    </div>
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="px-4 py-3 border-t border-white/[0.04] flex flex-col">
                      {/* Verdict block */}
                      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 mb-3 flex items-start gap-2">
                        <Sparkles size={12} className="text-indigo-400 mt-[2px] shrink-0" />
                        <p className="text-xs text-zinc-400 italic leading-relaxed">{score.verdict}</p>
                      </div>

                      {/* Quick Checks */}
                      {(score.signals ?? []).length > 0 && (
                        <div className="flex flex-col mb-3">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                            Quick Checks
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(score.signals ?? []).map((sig, i) => (
                              <span
                                key={`${sig.label}-${i}`}
                                className={`text-[10px] font-medium rounded-lg px-2 py-1 flex items-center gap-1 ${
                                  sig.pass
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                }`}
                              >
                                {sig.pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                {sig.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {(score.improvements ?? []).length > 0 && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                            Recommendations
                          </span>
                          <div className="flex flex-col">
                            {(score.improvements ?? []).map((imp, i) => {
                              const last = i === (score.improvements?.length ?? 0) - 1;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 py-2 ${!last ? 'border-b border-white/[0.03]' : ''}`}
                                >
                                  <div className="w-4 h-4 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-[1px]">
                                    {i + 1}
                                  </div>
                                  <p className="text-xs text-zinc-400 leading-relaxed">{imp}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
