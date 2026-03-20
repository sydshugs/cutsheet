// ScoreCard.tsx — 3-tier glass card restructure per DESIGN-SPEC.md

import { useEffect, useState, useMemo } from "react";
import { Copy, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, ArrowUpRight, Share2, RotateCcw, Send, ShieldCheck, FileText, Bookmark, Lightbulb, DollarSign, Film, Hash, Zap } from "lucide-react";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { OverflowMenu, type OverflowMenuItem } from "./ui/OverflowMenu";
import { BenchmarkBadge } from "./ui/BenchmarkBadge";
import { SlideSheet } from "./ui/SlideSheet";
import { DeepDiveTabGroup, type Tab } from "./DeepDiveTabGroup";
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
  onStartOver?: () => void;
}

const SCORE_LABELS: Record<keyof Scores, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
  overall: "Overall Ad Strength",
};

const SCORE_TOOLTIPS: Record<keyof Scores, string> = {
  hook: "How effectively the first 3 seconds grab attention and stop the scroll",
  clarity: "How clearly the core message and value proposition come through",
  cta: "How compelling and clear the call-to-action is",
  production: "Visual quality, pacing, audio mix, and overall polish",
  overall: "Weighted composite of all scoring dimensions",
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

const MAX_VISIBLE_IMPROVEMENTS = 3;

function ImprovementsList({ improvements, loading }: { improvements: string[]; loading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = improvements.length > MAX_VISIBLE_IMPROVEMENTS;
  const visible = expanded ? improvements : improvements.slice(0, MAX_VISIBLE_IMPROVEMENTS);

  return (
    <div style={{ transition: "opacity 200ms", opacity: loading ? 0.4 : 1 }}>
      {loading && (
        <div className="flex justify-end mb-2">
          <div style={{ width: 12, height: 12, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {visible.map((item, i) => (
          <li key={i} className="flex gap-2 items-start py-1.5">
            <span className="w-1 h-1 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
            <span className="text-xs text-zinc-400 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono mt-2 transition-colors"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {expanded ? "Show less" : `Show all ${improvements.length} →`}
        </button>
      )}
    </div>
  );
}

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
  onStartOver,
}: ScoreCardProps) {
  const { label: overallLabel, color: overallLabelColor } = getScoreLabel(scores.overall);
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');
  const [slideSheetOpen, setSlideSheetOpen] = useState(false);
  const [deepDiveTab, setDeepDiveTab] = useState<string>("scenes");

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
  const [toast, setToast] = useState<string | null>(null);

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

  // Build deep dive tabs based on format and available data
  const deepDiveTabs = useMemo<Tab[]>(() => {
    const tabs: Tab[] = [];
    if (format === "video" && scenes && scenes.length > 0) {
      tabs.push({ id: "scenes", label: "Scenes" });
    }
    if (hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0)) {
      tabs.push({ id: "hashtags", label: "Hashtags" });
    }
    if (format === "static") {
      tabs.push({ id: "adchecks", label: "Ad Checks" });
    }
    return tabs;
  }, [format, scenes, hashtags]);

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
          <span className="text-xs text-zinc-600 font-mono truncate max-w-[120px]" title={fileName ? formatFileName(fileName) : undefined}>
            {fileName ? formatFileName(fileName) : modelName}
          </span>
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

      {/* Analysis content — Glass card */}
      {activeTab === 'analysis' && <>

      <div style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "var(--glass-card-blur)",
        WebkitBackdropFilter: "var(--glass-card-blur)",
        border: "1px solid var(--glass-card-border)",
        boxShadow: "var(--glass-card-shadow)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        position: "relative",
        margin: "12px 12px 0",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "var(--ambient-glow)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Card content */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ═══════════════════════════════════════════════════
              TIER 1 — Always Visible
              Score Hero + Dimension Grid + CTA
              ═══════════════════════════════════════════════════ */}

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
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Filled arc */}
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke={overallColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${mounted ? (scores.overall / 10) * 157 : 0} 157`}
                  style={{
                    transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </svg>
            </div>

            {/* Score number — 72px mono in score-band color */}
            <div className="flex items-baseline gap-1 -mt-4" title={SCORE_TOOLTIPS.overall} style={{ cursor: "help" }}>
              <span style={{ fontSize: 72, fontFamily: "var(--mono)", fontWeight: 700, color: overallColor, lineHeight: 1 }}>
                {scores.overall}
              </span>
              <span style={{ fontSize: 14, fontFamily: "var(--mono)", color: "var(--ink-faint)" }}>/10</span>
            </div>

            {/* Score label — 13px, font-weight 500, score-band color */}
            <span style={{ fontSize: 13, fontWeight: 500, color: overallLabelColor, marginTop: 4 }}>
              {overallLabel}
            </span>

            {/* BenchmarkBadge */}
            <div style={{ marginTop: 8 }}>
              <BenchmarkBadge delta={0.8} format={format} />
            </div>

            {/* Winner badge */}
            {winner && (
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
                ★ Winner
              </div>
            )}
          </div>

          {/* Dimension grid — 2×2 CSS Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            background: "var(--grid-gap-bg)",
            margin: "16px 16px 0",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
          }}>
            {scoreKeys.map((key) => {
              const value = scores[key];
              const cellColor = getScoreColorByValue(value);
              return (
                <div
                  key={key}
                  style={{
                    background: "var(--grid-cell-bg)",
                    border: "1px solid var(--grid-cell-border)",
                    padding: "12px",
                  }}
                  title={SCORE_TOOLTIPS[key]}
                >
                  {/* Score number — 32px mono, score-band color */}
                  <span style={{
                    fontSize: 32,
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    color: cellColor,
                    lineHeight: 1,
                    display: "block",
                  }}>
                    {value}
                  </span>
                  {/* Label — 13px */}
                  <span style={{
                    fontSize: 13,
                    color: "var(--ink-muted)",
                    display: "block",
                    marginTop: 4,
                  }}>
                    {SCORE_LABELS[key]}
                  </span>
                  {/* Quality text — 11px, 50% opacity score color */}
                  <span style={{
                    fontSize: 11,
                    color: cellColor,
                    opacity: 0.5,
                    display: "block",
                    marginTop: 2,
                  }}>
                    {getScoreQualityText(value)}
                  </span>
                  {/* CTA rewrite button — only when CTA score ≤ 5 */}
                  {key === "cta" && value <= 5 && onCTARewrite && (
                    <div style={{ marginTop: 6 }}>
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

          {/* Score-adaptive primary CTA — full width, 48px, pill, solid indigo */}
          <div className="px-4 pt-4 pb-4">
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
                  width: "100%", height: 48, borderRadius: 9999, border: "none",
                  background: "#6366F1", color: "white", fontSize: 13, fontWeight: 600,
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
                    width: "100%", height: 48, borderRadius: 9999, border: "none",
                    background: "#6366F1", color: "white", fontSize: 13, fontWeight: 600,
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
                  width: "100%", height: 48, borderRadius: 9999, border: "none",
                  background: "#6366F1", color: "white", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Send size={14} /> Send improvements to your editor
              </button>
            )}
            <p id="adaptive-cta-toast" style={{ fontSize: 11, color: "#10b981", textAlign: "center", marginTop: 6, opacity: 0, transition: "opacity 300ms", minHeight: 16 }} />
          </div>

          {/* ═══════════════════════════════════════════════════
              TIER 2 — Collapsed by Default
              Key Insights / Performance Forecast / Budget
              ═══════════════════════════════════════════════════ */}

          <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Key Insights (formerly "Improve This Ad") */}
            {improvements && improvements.length > 0 && (
              <CollapsibleSection
                title="Key Insights"
                icon={<Lightbulb size={14} />}
                defaultOpen={false}
                trailing={
                  <span style={{
                    fontSize: 10,
                    fontFamily: "var(--mono)",
                    color: "#52525b",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 9999,
                    padding: "2px 8px",
                  }}>
                    {improvements.length}
                  </span>
                }
              >
                <ImprovementsList
                  improvements={improvements}
                  loading={improvementsLoading}
                />
              </CollapsibleSection>
            )}

            {/* Performance Forecast — PredictedPerformanceCard handles its own collapsed state */}
            {/* When prediction data is passed via parent, render PredictedPerformanceCard here */}

            {/* Budget (formerly "Budget Recommendation") */}
            {(engineBudget || budget) && (
              <CollapsibleSection
                title="Budget"
                icon={<DollarSign size={14} />}
                defaultOpen={false}
                trailing={engineBudget ? (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "var(--mono)",
                    color: engineBudget.action === 'hold' ? '#ef4444' : engineBudget.action === 'limited' ? '#f59e0b' : '#10b981',
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 9999,
                    padding: "2px 8px",
                  }}>
                    {engineBudget.label}
                  </span>
                ) : budget ? (
                  <span style={{
                    fontSize: 10,
                    fontFamily: "var(--mono)",
                    color: "#52525b",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 9999,
                    padding: "2px 8px",
                  }}>
                    {budget.verdict}
                  </span>
                ) : null}
              >
                {engineBudget ? (
                  <>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${engineBudget.action === 'hold' ? 'rgba(239,68,68,0.2)' : engineBudget.action === 'limited' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        background: engineBudget.action === 'hold' ? 'rgba(239,68,68,0.06)' : engineBudget.action === 'limited' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {engineBudget.action === 'hold' && <AlertTriangle size={16} color="#ef4444" />}
                        {engineBudget.action === 'limited' && <AlertCircle size={16} color="#f59e0b" />}
                        {engineBudget.action === 'test' && <TrendingUp size={16} color="#10b981" />}
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: engineBudget.action === 'hold' ? '#ef4444' : engineBudget.action === 'limited' ? '#f59e0b' : '#10b981',
                        }}>
                          {engineBudget.label}
                          {engineBudget.dailyBudget && ` · $${engineBudget.dailyBudget.min}–$${engineBudget.dailyBudget.max}/day`}
                        </span>
                      </div>

                      {engineBudget.action !== 'hold' && (
                        <p style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>
                          Platform CPM: {engineBudget.platformCPM}
                        </p>
                      )}

                      <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>
                        {engineBudget.advice}
                      </p>

                      {engineBudget.scaleSignal && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 8 }}>
                          <ArrowUpRight size={12} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#818cf8', fontStyle: 'italic', lineHeight: 1.4 }}>
                            {engineBudget.scaleSignal}
                          </span>
                        </div>
                      )}

                      {engineBudget.action !== 'hold' && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                          <span style={{ fontSize: 11, color: '#52525b' }}>Test: {engineBudget.testDuration}</span>
                          <span style={{ fontSize: 11, color: '#52525b' }}>ROAS: {engineBudget.roasTarget}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#71717a', background: 'rgba(255,255,255,0.04)', borderRadius: 9999, padding: '2px 8px' }}>
                        {engineBudget.niche} · {engineBudget.platform === 'all' ? 'All platforms' : engineBudget.platform}
                      </span>
                    </div>

                    {engineBudget.niche === 'Other' && onNavigateSettings && (
                      <button
                        type="button"
                        onClick={onNavigateSettings}
                        style={{ marginTop: 8, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationColor: 'rgba(99,102,241,0.3)' }}
                      >
                        Set your niche in Settings for personalized budgets &rarr;
                      </button>
                    )}

                    {engineBudget.footnote && (
                      <p style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>{engineBudget.footnote}</p>
                    )}
                  </>
                ) : budget ? (
                  <p className="text-xs text-zinc-400 leading-relaxed">{budget.reason || `${budget.verdict} — ${budget.daily}/day`}</p>
                ) : null}
              </CollapsibleSection>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════
              TIER 3 — On Demand (Deep Dive → SlideSheet)
              ═══════════════════════════════════════════════════ */}

          {deepDiveTabs.length > 0 && (
            <div style={{ padding: "0 16px 16px" }}>
              {/* Section label */}
              <span style={{
                fontSize: 10,
                textTransform: "uppercase",
                color: "#3f3f46",
                letterSpacing: "0.08em",
                fontWeight: 500,
                display: "block",
                marginBottom: 8,
              }}>
                Deep Dive
              </span>

              {/* Ghost pill buttons */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {format === "video" && scenes && scenes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setDeepDiveTab("scenes"); setSlideSheetOpen(true); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", fontSize: 11, borderRadius: 9999,
                      border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
                      color: "#52525b", cursor: "pointer", fontWeight: 500,
                      transition: "all 150ms ease",
                    }}
                  >
                    <Film size={12} /> Scenes
                  </button>
                )}

                {hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0) && (
                  <button
                    type="button"
                    onClick={() => { setDeepDiveTab("hashtags"); setSlideSheetOpen(true); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", fontSize: 11, borderRadius: 9999,
                      border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
                      color: "#52525b", cursor: "pointer", fontWeight: 500,
                      transition: "all 150ms ease",
                    }}
                  >
                    <Hash size={12} /> Hashtags
                  </button>
                )}

                {format === "static" && (
                  <button
                    type="button"
                    onClick={() => { setDeepDiveTab("adchecks"); setSlideSheetOpen(true); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", fontSize: 11, borderRadius: 9999,
                      border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
                      color: "#52525b", cursor: "pointer", fontWeight: 500,
                      transition: "all 150ms ease",
                    }}
                  >
                    <ShieldCheck size={12} /> Ad Checks
                  </button>
                )}
              </div>
            </div>
          )}

        </div>{/* end card content */}
      </div>{/* end glass card */}


      {/* Quick actions — overflow menu */}
      {(onGenerateBrief || onAddToSwipeFile || onStartOver) && (
        <div className="mt-auto px-5 pb-3 flex justify-end">
          <OverflowMenu
            items={[
              ...(onGenerateBrief ? [{ label: "Generate Brief", onClick: onGenerateBrief, icon: <FileText size={14} /> }] : []),
              ...(onAddToSwipeFile ? [{
                label: "Add to Swipe File",
                onClick: () => { onAddToSwipeFile(); setToast("Added to Swipe File"); setTimeout(() => setToast(null), 2500); },
                icon: <Bookmark size={14} />,
              }] : []),
              ...(onStartOver ? [{ label: "Start Over", onClick: onStartOver, icon: <RotateCcw size={14} />, destructive: true }] : []),
            ] satisfies OverflowMenuItem[]}
          />
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

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#10B981", color: "white", padding: "8px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          animation: "fadeIn 200ms ease-out",
        }}>
          {toast}
        </div>
      )}

      {/* SlideSheet — Deep Dive content */}
      <SlideSheet
        open={slideSheetOpen}
        onClose={() => setSlideSheetOpen(false)}
        title="Deep Dive"
      >
        <DeepDiveTabGroup
          tabs={deepDiveTabs}
          activeTab={deepDiveTab}
          onTabChange={setDeepDiveTab}
        />

        {/* Scenes panel */}
        {deepDiveTab === "scenes" && scenes && scenes.length > 0 && (
          <SceneBreakdown scenes={scenes} />
        )}

        {/* Hashtags panel */}
        {deepDiveTab === "hashtags" && hashtags && (
          <div>
            {([["TikTok", hashtags.tiktok], ["Meta", hashtags.meta], ["Instagram", hashtags.instagram]] as const).map(
              ([platform, tags]) =>
                tags.length > 0 && (
                  <div key={platform} className="flex items-center gap-1.5 flex-wrap mb-3">
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

        {/* Ad Checks panel */}
        {deepDiveTab === "adchecks" && format === "static" && scores && (
          <StaticAdChecks scores={scores} />
        )}
      </SlideSheet>
    </div>
  );
}
