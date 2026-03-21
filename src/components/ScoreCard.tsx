// ScoreCard.tsx — Orchestrator component composing scorecard sub-components
// Refactored from monolith into focused sub-components. Glass card wrapper with ambient glow.
// Pass 1: Consolidated layout — removed Deep Dive, tabs, Compare link. Reordered sections.

import { useEffect, useState } from "react";
import { Copy, CheckCircle, Wand2, Loader2, AlertCircle, TrendingUp, ArrowUpRight, Share2, RotateCcw, ShieldCheck, FileText, Bookmark, Lightbulb, DollarSign, Sparkles, Lock } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import { getBenchmark, type BenchmarkResult } from "../lib/benchmarks";
import { BenchmarkBadge } from "./BenchmarkBadge";
import SceneBreakdown from "./SceneBreakdown";
import { StaticAdChecks } from "./StaticAdChecks";
import FixItPanel, { type FixItResult } from "./FixItPanel";
import PredictedPerformanceCard, { type PredictionResult } from "./PredictedPerformanceCard";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { OverflowMenu, type OverflowMenuItem } from "./ui/OverflowMenu";
import { AlertDialog } from "./ui/AlertDialog";

// Sub-components
import { MetricBars } from "./scorecard/MetricBars";
import { HookDetailCard } from "./scorecard/HookDetailCard";
import { BudgetCard } from "./scorecard/BudgetCard";
import { ScoreAdaptiveCTA } from "./scorecard/ScoreAdaptiveCTA";

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
  engineBudget?: EngineBudgetRecommendation | null;
  onNavigateSettings?: () => void;
  improvementsLoading?: boolean;
  onReanalyze?: () => void;
  onStartOver?: () => void;
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
  // Compare (moved from standalone link)
  onCompare?: () => void;
  // Visualize It (moved from left panel)
  onVisualize?: () => void;
  visualizeLoading?: boolean;
  canVisualize?: boolean; // false for video format
  // Pro gate
  isPro?: boolean;
  onUpgradeRequired?: (feature: string) => void;
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

/** Token-based score color for inline styles that need CSS custom properties */
function getScoreTokenColor(score: number): string {
  if (score >= 9) return "var(--score-excellent)";
  if (score >= 7) return "var(--score-good)";
  if (score >= 5) return "var(--score-average)";
  return "var(--score-weak)";
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: "Excellent", color: "var(--score-excellent)" };
  if (score >= 7) return { label: "Good", color: "var(--score-good)" };
  if (score >= 5) return { label: "Average", color: "var(--score-average)" };
  return { label: "Weak", color: "var(--score-weak)" };
}

// ─── Improvements list with "Show all" expander ─────────────────────────────
const MAX_VISIBLE_IMPROVEMENTS = 3;

function ImprovementsList({ improvements, loading }: { improvements: string[]; loading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = improvements.length > MAX_VISIBLE_IMPROVEMENTS;
  const visible = expanded ? improvements : improvements.slice(0, MAX_VISIBLE_IMPROVEMENTS);

  return (
    <div style={{ transition: "opacity 200ms", opacity: loading ? 0.4 : 1 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider m-0">
          Improve This Ad
        </h3>
        {loading && (
          <div style={{ width: 12, height: 12, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        )}
      </div>
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
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-2 cursor-pointer bg-transparent border-none p-0 font-medium transition-colors"
        >
          {expanded ? "Show less" : `Show all ${improvements.length} \u2192`}
        </button>
      )}
    </div>
  );
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
  engineBudget,
  onNavigateSettings,
  improvementsLoading,
  onReanalyze,
  onStartOver,
  onCheckPolicies,
  policyLoading,
  hookDetail,
  niche,
  platform,
  onFixIt,
  fixItResult,
  fixItLoading,
  prediction,
  onCompare,
  onVisualize,
  visualizeLoading,
  canVisualize,
  isPro,
  onUpgradeRequired,
}: ScoreCardProps) {
  const { label: overallLabel, color: overallLabelColor } = getScoreLabel(scores.overall);
  const [mounted, setMounted] = useState(false);
  const benchmark: BenchmarkResult = getBenchmark(niche ?? '', platform ?? '', format === 'video' ? 'video' : 'static');
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [startOverOpen, setStartOverOpen] = useState(false);

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
    lines.push(`--- CUTSHEET ANALYSIS \u2014 ${fileName || "Ad Creative"} ---`);
    lines.push(`Overall Score: ${scores.overall}/10`);
    lines.push("");
    lines.push(`Hook Strength: ${scores.hook}/10`);
    lines.push(`Message Clarity: ${scores.clarity}/10`);
    lines.push(`CTA Effectiveness: ${scores.cta}/10`);
    lines.push(`Production: ${scores.production}/10`);

    if (improvements && improvements.length > 0) {
      lines.push("");
      lines.push("IMPROVEMENTS:");
      improvements.forEach((imp) => lines.push(`\u2022 ${imp}`));
    }

    if (ctaRewrites && ctaRewrites.length > 0) {
      lines.push("");
      lines.push(`CTA REWRITE: "${ctaRewrites[0]}"`);
    }

    if (engineBudget) {
      lines.push("");
      if (engineBudget.action === 'hold') {
        lines.push("BUDGET: Hold \u2014 fix creative before spending");
      } else if (engineBudget.dailyBudget) {
        lines.push(`BUDGET: ${engineBudget.label} \u2014 $${engineBudget.dailyBudget.min}-${engineBudget.dailyBudget.max}/day on ${engineBudget.platform === 'all' ? 'All platforms' : engineBudget.platform}`);
      }
    } else if (budget) {
      lines.push("");
      lines.push(`BUDGET: ${budget.verdict} \u2014 ${budget.daily}/day on ${budget.platform}`);
    }

    lines.push("");
    lines.push("Scored by Cutsheet \u2014 cutsheet.xyz");
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
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
              color: copied ? "var(--success)" : "var(--ink-muted)",
              borderColor: copied ? "rgba(16,185,129,0.3)" : "var(--border)",
              transition: "all var(--duration-fast)",
            }}
          >
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy results"}
          </button>
        </div>
      </div>

      {/* Analysis content \u2014 Glass card */}
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

          {/* 1. Score hero \u2014 arc gauge */}
          <div className="px-5 pt-5 flex flex-col items-center">
            <div className="relative w-40 h-24 flex-shrink-0">
              <svg viewBox="0 0 120 70" className="w-full h-full" role="img" aria-label={`Overall score: ${scores.overall} out of 10`}>
                <title>Overall score: {scores.overall} out of 10</title>
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" strokeLinecap="round" />
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke={overallColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${mounted ? (scores.overall / 10) * 157 : 0} 157`}
                  style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
              </svg>
            </div>

            <div className="flex items-baseline gap-1 -mt-4" title={SCORE_TOOLTIPS.overall} style={{ cursor: "help" }}>
              <span style={{ fontSize: 72, fontFamily: "var(--mono)", fontWeight: 700, color: overallColor, lineHeight: 1 }}>
                {scores.overall}
              </span>
              <span style={{ fontSize: 14, fontFamily: "var(--mono)", color: "var(--ink-faint)" }}>/10</span>
            </div>

            <span style={{ fontSize: 13, fontWeight: 500, color: overallLabelColor, marginTop: 4 }}>
              {overallLabel}
            </span>

            <div className="mt-2">
              <BenchmarkBadge userScore={scores.overall} benchmark={benchmark} />
            </div>

            {winner && (
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
                &#9733; Winner
              </div>
            )}
          </div>

          {/* 2. MetricBars \u2014 always visible */}
          <div style={{ marginTop: 16 }}>
            <MetricBars
              scores={scores}
              mounted={mounted}
              onCTARewrite={onCTARewrite}
              ctaRewrites={ctaRewrites}
              ctaLoading={ctaLoading}
            />
          </div>

          {/* 3. ScoreAdaptiveCTA \u2014 always visible */}
          <div style={{ marginTop: 20, padding: "0 20px" }}>
            <ScoreAdaptiveCTA
              overallScore={scores.overall}
              onShare={onShare}
              onGenerateBrief={onGenerateBrief}
            />
          </div>

          {/* 4. Action row \u2014 Fix It / Visualize / Policy Check */}
          <div
            style={{ marginTop: 12, padding: "0 20px", display: "flex", gap: 8 }}
            className="max-md:flex-col"
          >
            {/* Fix It For Me */}
            {onFixIt && (
              <button
                type="button"
                onClick={onFixIt}
                disabled={fixItLoading}
                aria-label={scores.overall >= 8 ? "Polish It" : "Fix It For Me"}
                style={{
                  flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "transparent", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", cursor: fixItLoading ? "default" : "pointer",
                  fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-muted)",
                  transition: "all var(--duration-fast)",
                }}
                onMouseEnter={(e) => { if (!fixItLoading) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {fixItLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {scores.overall >= 8 ? "Polish It" : "Fix It"}
              </button>
            )}

            {/* Visualize It */}
            {canVisualize !== false && (
              isPro ? (
                <button
                  type="button"
                  onClick={onVisualize}
                  disabled={visualizeLoading}
                  aria-label="Visualize It"
                  style={{
                    flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: "transparent", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", cursor: visualizeLoading ? "default" : "pointer",
                    fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-muted)",
                    transition: "all var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => { if (!visualizeLoading) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {visualizeLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Visualize
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpgradeRequired?.("visualize")}
                  aria-label="Visualize It \u2014 Pro feature"
                  style={{
                    flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: "transparent", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", cursor: "pointer",
                    fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-faint)",
                    transition: "all var(--duration-fast)",
                  }}
                >
                  <Lock size={12} />
                  Visualize
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: "var(--accent-subtle)", color: "var(--accent)" }}>PRO</span>
                </button>
              )
            )}

            {/* Policy Check */}
            {onCheckPolicies && (
              <button
                type="button"
                onClick={onCheckPolicies}
                disabled={policyLoading}
                aria-label="Check Ad Policies"
                style={{
                  flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "transparent", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", cursor: policyLoading ? "default" : "pointer",
                  fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-muted)",
                  transition: "all var(--duration-fast)",
                }}
                onMouseEnter={(e) => { if (!policyLoading) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {policyLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Policies
              </button>
            )}
          </div>

          {/* 5. Fix It result (if already generated) */}
          {fixItResult && (
            <div style={{ marginTop: 12, padding: "0 20px" }}>
              <FixItPanel result={fixItResult} />
            </div>
          )}

          {/* ── Collapsible sections ── */}

          {/* 6. Hook Analysis */}
          {hookDetail && (
            <div style={{ marginTop: 24, padding: "0 20px" }}>
              <CollapsibleSection
                title="Hook Analysis"
                icon={<Lightbulb size={14} />}
                trailing={
                  <span className="text-[10px] font-mono" style={{ color: getScoreTokenColor(scores.hook) }}>
                    {scores.hook}/10
                  </span>
                }
              >
                <HookDetailCard hookDetail={hookDetail} format={format} />
              </CollapsibleSection>
            </div>
          )}

          {/* 7. Improvements */}
          {improvements && improvements.length > 0 && (
            <div style={{ marginTop: 8, padding: "0 20px" }}>
              <CollapsibleSection
                title="Improvements"
                icon={<AlertCircle size={14} />}
                trailing={
                  <span className="text-[10px] text-zinc-500">{improvements.length} items</span>
                }
              >
                <ImprovementsList improvements={improvements} loading={improvementsLoading} />
              </CollapsibleSection>
            </div>
          )}

          {/* 8. Predicted Performance */}
          {prediction && (
            <div style={{ marginTop: 8, padding: "0 20px" }}>
              <CollapsibleSection
                title="Predicted Performance"
                icon={<TrendingUp size={14} />}
              >
                <PredictedPerformanceCard prediction={prediction} platform={platform} niche={niche} />
              </CollapsibleSection>
            </div>
          )}

          {/* 9. Budget Recommendation */}
          {(engineBudget || budget) && (
            <div style={{ marginTop: 8, padding: "0 20px" }}>
              <CollapsibleSection
                title="Budget Recommendation"
                icon={<DollarSign size={14} />}
              >
                <BudgetCard
                  engineBudget={engineBudget}
                  budget={budget}
                  onNavigateSettings={onNavigateSettings}
                />
              </CollapsibleSection>
            </div>
          )}

          {/* 10. Scene Breakdown \u2014 video only */}
          {format === "video" && scenes && scenes.length > 0 && (
            <div style={{ marginTop: 8, padding: "0 20px" }}>
              <CollapsibleSection
                title="Scene Breakdown"
                trailing={<span className="text-[10px] text-zinc-500">{scenes.length} scenes</span>}
              >
                <SceneBreakdown scenes={scenes} />
              </CollapsibleSection>
            </div>
          )}

          {/* 11. Static Ad Checks \u2014 static only */}
          {format === "static" && scores && (
            <div style={{ marginTop: 8, padding: "0 20px" }}>
              <CollapsibleSection title="Ad Quality Checks">
                <StaticAdChecks scores={scores} />
              </CollapsibleSection>
            </div>
          )}

          {/* 12. Hashtags */}
          {hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0) && (
            <div style={{ marginTop: 8, padding: "0 20px", paddingBottom: 16 }}>
              <CollapsibleSection
                title="Recommended Hashtags"
                trailing={
                  <span className="text-[10px] text-zinc-500">
                    {[hashtags.tiktok, hashtags.meta, hashtags.instagram].reduce((n, t) => n + t.length, 0)} tags
                  </span>
                }
              >
                {([["TikTok", hashtags.tiktok], ["Meta", hashtags.meta], ["Instagram", hashtags.instagram]] as const).map(
                  ([plat, tags]) =>
                    tags.length > 0 && (
                      <div key={plat} className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className="text-xs text-zinc-500 w-16 flex-shrink-0">{plat}</span>
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
              </CollapsibleSection>
            </div>
          )}

        </div>{/* end card content */}
      </div>{/* end glass card */}

      {/* 13. Overflow menu */}
      {(onGenerateBrief || onAddToSwipeFile || onStartOver || onCheckPolicies || onCompare) && (
        <div style={{ marginTop: 16 }} className="px-5 pb-3 flex justify-end">
          <OverflowMenu
            items={[
              ...(onGenerateBrief ? [{ label: "Generate Brief", onClick: onGenerateBrief, icon: <FileText size={14} /> }] : []),
              ...(onAddToSwipeFile ? [{
                label: "Add to Swipe File",
                onClick: () => { onAddToSwipeFile(); setToast("Added to Swipe File"); setTimeout(() => setToast(null), 2500); },
                icon: <Bookmark size={14} />,
              }] : []),
              ...(onShare ? [{ label: "Share Score", onClick: onShare, icon: <Share2 size={14} /> }] : []),
              ...(onCompare ? [{ label: "Compare", onClick: onCompare, icon: <ArrowUpRight size={14} /> }] : []),
              ...(onStartOver ? [{ label: "Start Over", onClick: () => setStartOverOpen(true), icon: <RotateCcw size={14} />, destructive: true }] : []),
            ] satisfies OverflowMenuItem[]}
          />
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--success)", color: "white", padding: "8px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          animation: "fadeIn 200ms ease-out",
        }}>
          {toast}
        </div>
      )}

      {/* Start Over confirmation dialog */}
      <AlertDialog
        open={startOverOpen}
        onClose={() => setStartOverOpen(false)}
        onConfirm={() => { if (onStartOver) onStartOver(); }}
        title="Start over?"
        description="This will clear your current analysis. You can find it in History."
        confirmLabel="Start Over"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}
