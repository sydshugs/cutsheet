// ScoreCard.tsx — Orchestrator component composing scorecard sub-components
// Refactored from 883-line monolith into focused sub-components.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, CheckCircle, Wand2, Loader2 } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import { getBenchmark, type BenchmarkResult } from "../lib/benchmarks";
import { BenchmarkBadge } from "./BenchmarkBadge";
import SceneBreakdown from "./SceneBreakdown";
import { StaticAdChecks } from "./StaticAdChecks";
import HistoryPanel from "./HistoryPanel";
import type { AnalysisRecord } from "../services/historyService";
import FixItPanel, { type FixItResult } from "./FixItPanel";
import PredictedPerformanceCard, { type PredictionResult } from "./PredictedPerformanceCard";

// Sub-components
import { MetricBars } from "./scorecard/MetricBars";
import { HookDetailCard } from "./scorecard/HookDetailCard";
import { BudgetCard } from "./scorecard/BudgetCard";
import { ScoreAdaptiveCTA } from "./scorecard/ScoreAdaptiveCTA";
import { QuickActions } from "./scorecard/QuickActions";

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
  onCheckPolicies?: () => void;
  policyLoading?: boolean;
  hookDetail?: HookDetail;
  niche?: string;
  platform?: string;
  // Fix It For Me
  onFixIt?: () => void;
  fixItResult?: FixItResult | null;
  fixItLoading?: boolean;
  // Predicted Performance
  prediction?: PredictionResult | null;
}

const SCORE_TOOLTIPS: Record<string, string> = {
  overall: "Weighted composite of all scoring dimensions",
};

/** Score band color for chips/overlays: 9-10 green, 7-8 indigo, 5-6 amber, 1-4 red (scores 0-10). */
export function getScoreColorByValue(score: number): string {
  if (score >= 9) return "#10B981";
  if (score >= 7) return "#6366F1";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: "Excellent", color: "#10B981" };
  if (score >= 7) return { label: "Good", color: "#6366F1" };
  if (score >= 5) return { label: "Average", color: "#F59E0B" };
  return { label: "Weak", color: "#EF4444" };
}

function getScoreBadgeClasses(score: number): string {
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
  onCheckPolicies,
  policyLoading,
  hookDetail,
  niche,
  platform,
  onFixIt,
  fixItResult,
  fixItLoading,
  prediction,
}: ScoreCardProps) {
  const { label: overallLabel } = getScoreLabel(scores.overall);
  const [mounted, setMounted] = useState(false);
  const benchmark: BenchmarkResult = getBenchmark(niche ?? '', platform ?? '', format === 'video' ? 'video' : 'static');
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
        <div className="flex items-baseline gap-1 -mt-4" title={SCORE_TOOLTIPS.overall} style={{ cursor: "help" }}>
          <span className="text-4xl font-bold font-mono text-white leading-none">
            {scores.overall}
          </span>
          <span className="text-zinc-500 font-mono">/10</span>
        </div>

        {/* Status badge */}
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold font-mono ${badgeClasses}`}>
          {overallLabel}
        </div>

        {/* Benchmark context */}
        <div className="mt-2">
          <BenchmarkBadge userScore={scores.overall} benchmark={benchmark} />
        </div>

        {/* Winner badge */}
        {winner && (
          <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
            ★ Winner
          </div>
        )}
      </div>

      {/* ── Metric bars (extracted) ── */}
      <MetricBars
        scores={scores}
        mounted={mounted}
        onCTARewrite={onCTARewrite}
        ctaRewrites={ctaRewrites}
        ctaLoading={ctaLoading}
      />

      {/* ── Hook detail (extracted) ── */}
      {hookDetail && (
        <HookDetailCard hookDetail={hookDetail} format={format} />
      )}

      {/* Improve This Ad */}
      {improvements && improvements.length > 0 && (
        <div id="improvements-section" className="px-5 border-t border-white/5 mt-4 pt-4" style={{ transition: "opacity 200ms", opacity: improvementsLoading ? 0.4 : 1 }}>
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

      {/* Fix It For Me */}
      {onFixIt && (
        <div className="px-5 mt-3">
          {fixItResult ? (
            <FixItPanel result={fixItResult} />
          ) : (
            <button
              type="button"
              onClick={onFixIt}
              disabled={fixItLoading}
              className="w-full h-11 rounded-xl text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-150"
              style={{
                background: fixItLoading ? "rgba(99,102,241,0.08)" : "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#818cf8",
                cursor: fixItLoading ? "default" : "pointer",
                opacity: fixItLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!fixItLoading) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; }}
            >
              {fixItLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Rewriting your ad...
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  {scores.overall >= 8 ? "Polish It" : "Fix It For Me"}
                </>
              )}
            </button>
          )}
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

      {/* ── Budget recommendation (extracted) ── */}
      <BudgetCard
        engineBudget={engineBudget}
        budget={budget}
        onNavigateSettings={onNavigateSettings}
      />

      {/* Predicted Performance */}
      {prediction && (
        <div className="px-5 border-t border-white/5 mt-4 pt-4">
          <PredictedPerformanceCard prediction={prediction} platform={platform} niche={niche} />
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
        <div className="px-5 pb-2 text-xs font-mono text-zinc-500 truncate">
          {formatFileName(fileName)}
        </div>
      )}

      {/* ── Score-adaptive CTA (extracted) ── */}
      <ScoreAdaptiveCTA
        overallScore={scores.overall}
        onShare={onShare}
        onGenerateBrief={onGenerateBrief}
      />

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

      {/* ── Quick actions (extracted) ── */}
      <QuickActions
        onCheckPolicies={onCheckPolicies}
        policyLoading={policyLoading}
        onGenerateBrief={onGenerateBrief}
        onAddToSwipeFile={onAddToSwipeFile}
      />
      </>}

      {/* Compare against competitor link */}
      <div className="px-5 pb-4">
        <Link
          to="/app/competitor"
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
        </Link>
      </div>
    </div>
  );
}
