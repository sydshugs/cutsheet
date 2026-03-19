// ScoreCard.tsx — Visual translation from #screen-results (prototype)

import { useEffect, useState } from "react";
import { Copy, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, ArrowUpRight, Share2, RotateCcw, Send } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import SceneBreakdown from "./SceneBreakdown";
import { StaticAdChecks } from "./StaticAdChecks";
import HistoryPanel from "./HistoryPanel";
import type { AnalysisRecord } from "../services/historyService";

interface Scores {
  hook: number;
  clarity: number;
  cta: number;
  production: number;
  overall: number;
}

interface ScoreCardProps {
  scores: Scores;
  improvements?: string[];
  budget?: BudgetRecommendation | null;
  hashtags?: Hashtags;
  fileName?: string;
  onShare?: () => void;
  isDark?: boolean;
  winner?: boolean;
  analysisTime?: Date;
  modelName?: string;
  onGenerateBrief?: () => void;
  onAddToSwipeFile?: () => void;
  onCTARewrite?: () => void;
  ctaRewrites?: string[] | null;
  ctaLoading?: boolean;
  scenes?: Scene[];
  format?: "video" | "static";
onSelectHistory?: (record: AnalysisRecord) => void;
  historyRefreshKey?: number;
  engineBudget?: EngineBudgetRecommendation | null;
  onNavigateSettings?: () => void;
  improvementsLoading?: boolean;
  onReanalyze?: () => void;
}

const SCORE_LABELS: Record<keyof Scores, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
  overall: "Overall Ad Strength",
};

/** Score band color for chips/overlays: 9-10 green, 7-8 indigo, 5-6 amber, 1-4 red (scores 0-10). */
export function getScoreColorByValue(score: number): string {
  if (score >= 9) return "#10B981";
  if (score >= 7) return "#6366F1";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

function getScoreQualityText(score: number): string {
  if (score >= 9) return "Exceptional";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Average";
  if (score >= 4) return "Below avg";
  return "Needs work";
}

function getScoreLabel(score: number, isCTA?: boolean): { label: string; color: string } {
  if (isCTA && score === 0) return { label: "No CTA Detected", color: "#EF4444" };
  if (score >= 9) return { label: "Excellent", color: "#10B981" };
  if (score >= 7) return { label: "Good", color: "#6366F1" };
  if (score >= 5) return { label: "Average", color: "#F59E0B" };
  return { label: "Weak", color: "#EF4444" };
}

function getScoreBadgeClasses(score: number, isCTA?: boolean): string {
  if (isCTA && score === 0) return "bg-red-500/15 text-red-400";
  if (score >= 9) return "bg-emerald-500/15 text-emerald-400";
  if (score >= 7) return "bg-indigo-500/15 text-indigo-400";
  if (score >= 5) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

function formatFileName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ");
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

const scoreKeys = ["hook", "clarity", "cta", "production"] as const;

export function ScoreCard({
  scores,
  improvements,
  budget,
  hashtags,
  fileName,
  onShare,
  isDark = true,
  winner,
  analysisTime,
  modelName = "Gemini + Claude",
  onGenerateBrief,
  onAddToSwipeFile,
  onCTARewrite,
  ctaRewrites,
  ctaLoading,
  scenes,
  format = "video",
onSelectHistory,
  historyRefreshKey,
  engineBudget,
  onNavigateSettings,
  improvementsLoading,
  onReanalyze,
}: ScoreCardProps) {
  const { label: overallLabel } = getScoreLabel(scores.overall);
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!analysisTime) return;
    setRelativeTime(formatRelativeTime(analysisTime));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(analysisTime));
    }, 30000);
    return () => clearInterval(interval);
  }, [analysisTime]);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push(`--- CUTSHEET ANALYSIS — ${fileName || "Ad Creative"} ---`);
    lines.push(`Overall Score: ${scores.overall}/10 ⭐`);
    lines.push("");
    lines.push(`Hook Strength: ${scores.hook}/10`);
    lines.push(`Message Clarity: ${scores.clarity}/10`);
    lines.push(`CTA Effectiveness: ${scores.cta}/10`);
    lines.push(`Production: ${scores.production}/10`);

    if (improvements && improvements.length > 0) {
      lines.push("");
      lines.push("IMPROVEMENTS:");
      improvements.forEach((imp) => lines.push(`• ${imp}`));
    }

    if (ctaRewrites && ctaRewrites.length > 0) {
      lines.push("");
      lines.push(`CTA REWRITE: "${ctaRewrites[0]}"`);
    }

    if (engineBudget) {
      lines.push("");
      if (engineBudget.action === 'hold') {
        lines.push("BUDGET: Hold — fix creative before spending");
      } else if (engineBudget.dailyBudget) {
        lines.push(`BUDGET: ${engineBudget.label} — $${engineBudget.dailyBudget.min}-${engineBudget.dailyBudget.max}/day on ${engineBudget.platform === 'all' ? 'All platforms' : engineBudget.platform}`);
      }
    } else if (budget) {
      lines.push("");
      lines.push(`BUDGET: ${budget.verdict} — ${budget.daily}/day on ${budget.platform}`);
    }

    lines.push("");
    lines.push("Scored by Cutsheet — cutsheet.xyz");
    lines.push("---");

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const overallColor = getScoreColorByValue(scores.overall);
  const badgeClasses = getScoreBadgeClasses(scores.overall);

  return (
    <div className="scorecard flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">Score Overview</span>
          {analysisTime && (
            <span className="text-xs text-zinc-600">{relativeTime}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 font-mono">{modelName}</span>
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
              color: copied ? "#10b981" : "#a1a1aa",
              borderColor: copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                (e.currentTarget as HTMLButtonElement).style.color = "#f4f4f5";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.16)";
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              }
            }}
          >
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy results"}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
        {(['analysis', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '5px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
              background: activeTab === tab ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${activeTab === tab ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: activeTab === tab ? '#818cf8' : '#71717a',
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === 'analysis' ? 'Analysis' : 'History'}
          </button>
        ))}
      </div>

      {/* History panel */}
      {activeTab === 'history' && (
        <div style={{ padding: '16px' }}>
          <HistoryPanel
            onSelect={(record) => {
              if (onSelectHistory) onSelectHistory(record)
              setActiveTab('analysis')
            }}
            refreshKey={historyRefreshKey}
          />
        </div>
      )}

      {/* Analysis content */}
      {activeTab === 'analysis' && <>

      {/* Arc gauge */}
      <div className="px-5 pt-5 flex flex-col items-center">
        <div className="relative w-40 h-24 flex-shrink-0">
          <svg viewBox="0 0 120 70" className="w-full h-full" role="img" aria-label={`Overall score: ${scores.overall} out of 10`}>
            <title>Overall score: {scores.overall} out of 10</title>
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={overallColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${mounted ? (scores.overall / 10) * 157 : 0} 157`}
              style={{
                transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                filter: `drop-shadow(0 0 4px ${overallColor}60)`,
              }}
            />
          </svg>
        </div>

        {/* Score number */}
        <div className="flex items-baseline gap-1 -mt-4">
          <span className="text-4xl font-bold font-mono text-white leading-none">
            {scores.overall}
          </span>
          <span className="text-zinc-500 font-mono">/10</span>
        </div>

        {/* Status badge */}
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold font-mono ${badgeClasses}`}>
          {overallLabel}
        </div>

        {/* Winner badge */}
        {winner && (
          <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
            ★ Winner
          </div>
        )}
      </div>

      {/* Metric bars */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {scoreKeys.map((key) => {
          const value = scores[key];
          const pct = value <= 0 ? 2 : Math.min(100, (value / 10) * 100);
          const barColor = getScoreColorByValue(value);
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{SCORE_LABELS[key]}</span>
                <span className="font-mono" style={{ color: barColor }}>{value} <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, opacity: 0.8 }}>— {getScoreQualityText(value)}</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={10} aria-label={`${SCORE_LABELS[key]}: ${value} out of 10, ${getScoreQualityText(value)}`}>
                <div
                  className="h-full rounded-full"
                  style={{
                    "--bar-width": `${pct}%`,
                    width: mounted ? `${pct}%` : "0%",
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                    animation: mounted ? "barFill 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                    boxShadow: `0 0 6px ${barColor}40`,
                  } as React.CSSProperties}
                />
              </div>
              {/* CTA rewrite button — only when CTA score ≤ 5 */}
              {key === "cta" && value <= 5 && onCTARewrite && (
                <div className="mt-1.5">
                  {!ctaRewrites ? (
                    <button
                      onClick={onCTARewrite}
                      disabled={ctaLoading}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors disabled:opacity-50"
                    >
                      {ctaLoading ? "Rewriting..." : "✦ Rewrite CTA"}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1">
                      {ctaRewrites.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 bg-indigo-500/5 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-indigo-400 font-mono">{i + 1}.</span>
                          <span className="text-xs text-zinc-300">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Improve This Ad */}
      {improvements && improvements.length > 0 && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4" style={{ transition: "opacity 200ms", opacity: improvementsLoading ? 0.4 : 1 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider m-0">
              Improve This Ad
            </h3>
            {improvementsLoading && (
              <div style={{ width: 12, height: 12, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            )}
          </div>
          <ul className="flex flex-col gap-1">
            {improvements.map((item, i) => (
              <li key={i} className="flex gap-2 items-start py-1.5">
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                <span className="text-xs text-zinc-400 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scene Breakdown — video only */}
      {format === "video" && scenes && scenes.length > 0 && (
        <div className="px-5">
          <SceneBreakdown scenes={scenes} />
        </div>
      )}

      {/* Static Ad Checks — static only */}
      {format === "static" && scores && (
        <div className="px-5">
          <StaticAdChecks scores={scores} />
        </div>
      )}

      {/* Budget Recommendation — engine-based */}
      {engineBudget && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Budget Recommendation
          </p>

          {/* Main card */}
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${engineBudget.action === 'hold' ? 'rgba(239,68,68,0.2)' : engineBudget.action === 'limited' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
              background: engineBudget.action === 'hold' ? 'rgba(239,68,68,0.06)' : engineBudget.action === 'limited' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
            }}
          >
            {/* Header row: icon + label + budget range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {engineBudget.action === 'hold' && <AlertTriangle size={16} color="#ef4444" />}
              {engineBudget.action === 'limited' && <AlertCircle size={16} color="#f59e0b" />}
              {engineBudget.action === 'test' && <TrendingUp size={16} color="#10b981" />}
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: engineBudget.action === 'hold' ? '#ef4444' : engineBudget.action === 'limited' ? '#f59e0b' : '#10b981',
              }}>
                {engineBudget.label}
                {engineBudget.dailyBudget && ` · $${engineBudget.dailyBudget.min}–$${engineBudget.dailyBudget.max}/day`}
              </span>
            </div>

            {/* Platform CPM */}
            {engineBudget.action !== 'hold' && (
              <p style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>
                Platform CPM: {engineBudget.platformCPM}
              </p>
            )}

            {/* Advice */}
            <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>
              {engineBudget.advice}
            </p>

            {/* Scale signal */}
            {engineBudget.scaleSignal && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 8 }}>
                <ArrowUpRight size={12} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#818cf8', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {engineBudget.scaleSignal}
                </span>
              </div>
            )}

            {/* Test duration + ROAS target */}
            {engineBudget.action !== 'hold' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: '#52525b' }}>
                  Test: {engineBudget.testDuration}
                </span>
                <span style={{ fontSize: 11, color: '#52525b' }}>
                  ROAS: {engineBudget.roasTarget}
                </span>
              </div>
            )}
          </div>

          {/* Niche + platform pill */}
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <span style={{
              fontSize: 10,
              color: '#71717a',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 9999,
              padding: '2px 8px',
            }}>
              {engineBudget.niche} · {engineBudget.platform === 'all' ? 'All platforms' : engineBudget.platform}
            </span>
          </div>

          {/* Missing profile hint */}
          {engineBudget.niche === 'Other' && onNavigateSettings && (
            <button
              type="button"
              onClick={onNavigateSettings}
              style={{
                marginTop: 8,
                fontSize: 11,
                color: '#6366f1',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(99,102,241,0.3)',
              }}
            >
              Set your niche in Settings for personalized budgets &rarr;
            </button>
          )}

          {/* Static all-platforms footnote */}
          {engineBudget.footnote && (
            <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>
              {engineBudget.footnote}
            </p>
          )}
        </div>
      )}

      {/* Legacy budget fallback (from Gemini) */}
      {!engineBudget && budget && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Budget Recommendation
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">{budget.reason || `${budget.verdict} — ${budget.daily}/day`}</p>
        </div>
      )}

      {/* Recommended Hashtags */}
      {hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0) && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Recommended Hashtags
          </p>
          {([["TikTok", hashtags.tiktok], ["Meta", hashtags.meta], ["Instagram", hashtags.instagram]] as const).map(
            ([platform, tags]) =>
              tags.length > 0 && (
                <div key={platform} className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-xs text-zinc-500 w-16 flex-shrink-0">{platform}</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-md font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )
          )}
        </div>
      )}

      {/* File name */}
      {fileName && (
        <div className="px-5 pb-2 text-xs font-mono text-zinc-600 truncate">
          {formatFileName(fileName)}
        </div>
      )}

      {/* Score-adaptive primary CTA */}
      <div className="px-5 pb-3">
        {scores.overall >= 8 ? (
          <button
            type="button"
            onClick={() => {
              const text = `CUTSHEET SCORECARD\n${fileName ?? "Ad"}\nOverall: ${scores.overall}/10\nHook: ${scores.hook} | CTA: ${scores.cta} | Clarity: ${scores.clarity} | Production: ${scores.production}\n\nScored by Cutsheet — cutsheet.xyz`;
              navigator.clipboard.writeText(text);
              const el = document.getElementById("adaptive-cta-toast");
              if (el) { el.textContent = "Copied — ready to share"; el.style.opacity = "1"; setTimeout(() => { el.style.opacity = "0"; }, 2500); }
            }}
            style={{
              width: "100%", height: 44, borderRadius: 9999, border: "none",
              background: "#4f46e5", color: "white", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Share2 size={14} /> Share this scorecard
          </button>
        ) : scores.overall >= 5 ? (
          <>
            <button
              type="button"
              onClick={() => {
                const impSection = document.querySelector("h3");
                if (impSection) impSection.scrollIntoView({ behavior: "smooth" });
                onReanalyze?.();
              }}
              style={{
                width: "100%", height: 44, borderRadius: 9999, border: "none",
                background: "#4f46e5", color: "white", fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <RotateCcw size={14} /> Fix and re-score →
            </button>
            <p style={{ fontSize: 11, color: "#52525b", textAlign: "center", marginTop: 6 }}>
              Make the changes above, then upload your improved version
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              const impList = improvements?.map((imp, i) => `${i + 1}. ${imp}`).join("\n") ?? "";
              const text = `CREATIVE BRIEF — ${fileName ?? "Ad"}\nScore: ${scores.overall}/10 — needs significant revision\n\nIMPROVEMENTS NEEDED:\n${impList}\n\nScored by Cutsheet — cutsheet.xyz`;
              navigator.clipboard.writeText(text);
              const el = document.getElementById("adaptive-cta-toast");
              if (el) { el.textContent = "Brief copied — paste it to your editor"; el.style.opacity = "1"; setTimeout(() => { el.style.opacity = "0"; }, 2500); }
            }}
            style={{
              width: "100%", height: 44, borderRadius: 9999, border: "none",
              background: "#4f46e5", color: "white", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Send size={14} /> Send improvements to your editor
          </button>
        )}
        <p id="adaptive-cta-toast" style={{ fontSize: 11, color: "#10b981", textAlign: "center", marginTop: 6, opacity: 0, transition: "opacity 300ms", minHeight: 16 }} />
      </div>

      {/* Share button (backward compat) */}
      {onShare && (
        <div className="px-5 pb-2" data-html2canvas-ignore="true">
          <button
            type="button"
            onClick={onShare}
            className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer"
          >
            Copy Scorecard
          </button>
        </div>
      )}

      {/* Quick actions */}
      {(onGenerateBrief || onAddToSwipeFile) && (
        <div className="mt-auto p-5 border-t border-white/5 flex flex-col gap-2">
          {onGenerateBrief && (
            <button
              type="button"
              onClick={onGenerateBrief}
              className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center transition-colors duration-150 cursor-pointer"
            >
              Generate Brief
            </button>
          )}
          {onAddToSwipeFile && (
            <button
              type="button"
              onClick={onAddToSwipeFile}
              className="bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center transition-colors duration-150 cursor-pointer"
            >
              Add to Swipe File
            </button>
          )}
        </div>
      )}
      </>}

      {/* Compare against competitor link */}
      <div className="px-5 pb-4">
        <a
          href="/app/competitor"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 12, color: "#71717a", textDecoration: "none",
            padding: "8px 0", borderRadius: 8,
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#818cf8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
        >
          Compare against a competitor →
        </a>
      </div>
    </div>
  );
}
