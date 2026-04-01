// ScoreCard.tsx — Orchestrator component composing scorecard sub-components
// Refactored from monolith into focused sub-components. Glass card wrapper with ambient glow.
// Pass 1: Consolidated layout — removed Deep Dive, tabs, Compare link. Reordered sections.

import { useEffect, useState } from "react";
import { HookAnalysisExpanded } from "./HookAnalysisExpanded";
import { HashtagsC2 } from "./HashtagsC2";
import { Copy, CheckCircle, Loader2, RotateCcw, Activity } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import { getNicheAwareBenchmark, type BenchmarkResult } from "../lib/benchmarks";
import { type FixItResult } from "./FixItPanel";
import PredictedPerformanceCard, { type PredictionResult } from "./PredictedPerformanceCard";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { AlertDialog } from "./ui/AlertDialog";

// Sub-components
import { ScoreHero } from "./ScoreHero";
import { BudgetCard } from "./scorecard/BudgetCard";

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
  youtubeFormat?: string;
  platformScore?: number; // override overall score when platform-specific score exists
  // Fix It For Me
  onFixIt?: () => void;
  fixItResult?: FixItResult | null;
  fixItLoading?: boolean;
  // Predicted Performance
  prediction?: PredictionResult | null;
  predictionLoading?: boolean;
  // Compare (moved from standalone link)
  onCompare?: () => void;
  // Visualize It (moved from left panel)
  onVisualize?: () => void;
  visualizeLoading?: boolean;
  canVisualize?: boolean; // false for video format
  // Pro gate
  isPro?: boolean;
  onUpgradeRequired?: (feature: string) => void;
  // Mode — affects hashtag default state (expanded for organic)
  isOrganic?: boolean;
  // Verdict
  verdict?: { state: 'not_ready' | 'needs_work' | 'ready'; headline: string; sub: string };
  // Platform switcher (rendered inside scorecard)
  platformSwitcher?: React.ReactNode;
  // Brief loading state
  briefLoading?: boolean;
  hasBrief?: boolean;
  // Analysis sections for right panel (Hook, Hierarchy, Copy, Messaging, Emotional)
  analysisSections?: { title: string; content: string }[];
  // Dimension overrides — when provided, ScoreHero uses these instead of scores.hook/clarity/etc.
  dimensionOverrides?: { name: string; score: number; rangeLow?: number; rangeHigh?: number }[];
  // Confidence interval for overall score — "X.X – Y.Y range" shown below score number
  scoreRange?: { low: number; high: number };
  // Score delta vs previous analysis
  overallDelta?: number;
  overallDeltaLabel?: string;
  dimensionDeltas?: Record<string, number>;
}

/** Score band color — design spec: 7.0+ emerald, 5.0–6.9 amber, below 5.0 red */
export function getScoreColorByValue(score: number): string {
  if (score >= 7) return "#10b981";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
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
  youtubeFormat,
  platformScore,
  onFixIt,
  fixItResult,
  fixItLoading,
  prediction,
  predictionLoading,
  onCompare,
  onVisualize,
  visualizeLoading,
  canVisualize,
  isPro,
  onUpgradeRequired,
  isOrganic = false,
  verdict,
  platformSwitcher,
  briefLoading,
  hasBrief,
  analysisSections,
  dimensionOverrides,
  scoreRange,
  overallDelta,
  overallDeltaLabel,
  dimensionDeltas,
}: ScoreCardProps) {
  const displayScore = platformScore ?? scores.overall;
  const heroVerdict = displayScore >= 8 ? "Strong Performance" : displayScore >= 7 ? "Good Potential" : displayScore >= 5 ? "Average" : "Needs Work";
  const benchmark: BenchmarkResult = getNicheAwareBenchmark(niche, platform, format === 'video' ? 'video' : 'static');
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [startOverOpen, setStartOverOpen] = useState(false);

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
    if (dimensionOverrides) {
      dimensionOverrides.forEach(d => lines.push(`${d.name}: ${d.score}/10`));
    } else {
      lines.push(`Hook Strength: ${scores.hook}/10`);
      lines.push(`Message Clarity: ${scores.clarity}/10`);
      lines.push(`CTA Effectiveness: ${scores.cta}/10`);
      lines.push(`Production: ${scores.production}/10`);
    }

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

  return (
    <div className="scorecard flex flex-col gap-4">
      {/* ── Main score card ── */}
      <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-5 flex flex-col gap-5 font-['Geist',sans-serif] text-[#f4f4f5]">

        {/* Header — label + platform pills */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            SCORE OVERVIEW
          </span>
          <div className="flex items-center gap-2">
            {platformSwitcher}
            <button
              onClick={handleCopy}
              aria-label="Copy scores to clipboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg cursor-pointer transition-[color,background-color] hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none px-2.5 py-1.5"
              style={{
                background: 'transparent',
                color: copied ? '#10b981' : '#71717a',
              }}
            >
              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* ScoreHero — score number + benchmark bar + dimension scores */}
        <ScoreHero
          score={displayScore}
          verdict={heroVerdict}
          benchmark={benchmark.averageScore}
          benchmarkLabelOverride={benchmark.sampleLabel}
          platform={platform}
          format={format}
          youtubeFormat={youtubeFormat}
          scoreRange={scoreRange}
          overallDelta={overallDelta}
          overallDeltaLabel={overallDeltaLabel}
          dimensionDeltas={dimensionDeltas}
          dimensions={dimensionOverrides ?? [
            { name: "Hook",   score: scores.hook },
            { name: "Copy",   score: scores.clarity },
            { name: "Visual", score: scores.production },
            { name: "CTA",    score: scores.cta },
          ]}
        />

        {winner && (
          <div className="flex justify-center">
            <div className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
              &#9733; Winner
            </div>
          </div>
        )}

        {/* Deep dive rows */}
        <div className="flex flex-col border-t border-white/[0.04]">
          {/* Hook Analysis */}
          {analysisSections && analysisSections.length > 0 && (() => {
            const hookSection = analysisSections.find(s => /hook/i.test(s.title));
            if (!hookSection) return null;
            return (
              <div className="border-b border-white/[0.04]">
                <CollapsibleSection
                  title={hookSection.title}
                  icon={<Activity size={14} />}
                >
                  <HookAnalysisExpanded content={hookSection.content} format={format ?? 'static'} platform={platform} />
                </CollapsibleSection>
              </div>
            );
          })()}

          {/* Hashtags */}
          {hashtags && (hashtags.tiktok?.length > 0 || hashtags.meta?.length > 0 || hashtags.instagram?.length > 0 || hashtags.pinterest?.length > 0 || hashtags.reels?.length > 0 || hashtags.youtube_shorts?.length > 0) && (
            <div className="border-b border-white/[0.04]">
              <HashtagsC2 hashtags={hashtags} format={format} />
            </div>
          )}
        </div>

        {/* Actions row */}
        <div className="flex gap-[13px] pt-2">
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className="flex-1 flex items-center justify-center gap-[9px] rounded-full h-[46px] border border-white/[0.08] bg-transparent text-[#d4d4d8] text-[15px] font-medium hover:bg-white/[0.04] transition-colors"
            >
              <RotateCcw size={14} className="text-zinc-400" />
              {isOrganic ? 'Analyze another' : 'Re-analyze'}
            </button>
          )}
          {onGenerateBrief && (
            <button
              onClick={onGenerateBrief}
              disabled={briefLoading}
              className="flex-1 flex items-center justify-center rounded-full h-[46px] text-white text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: briefLoading ? '#4f4dcc' : '#615fff' }}
              onMouseEnter={e => { if (!briefLoading) e.currentTarget.style.background = '#5250e5'; }}
              onMouseLeave={e => { if (!briefLoading) e.currentTarget.style.background = '#615fff'; }}
            >
              {briefLoading ? (
                <><Loader2 size={14} className="animate-spin mr-1.5" /> Generating...</>
              ) : (
                <>{hasBrief ? 'Regenerate Brief' : 'Generate Brief'}</>
              )}
            </button>
          )}
        </div>
      </div>{/* end main score card */}

      {/* Predicted Performance — own card wrapper included in component */}
      {(prediction || predictionLoading) && (
        <PredictedPerformanceCard prediction={prediction ?? null} platform={platform} niche={niche} isOrganic={isOrganic} loading={predictionLoading && !prediction} />
      )}

      {/* Budget Recommendation — separate card */}
      {(engineBudget || budget) && (
        <BudgetCard
          engineBudget={engineBudget}
          budget={budget}
          onNavigateSettings={onNavigateSettings}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium z-[9999] shadow-lg shadow-emerald-500/25 animate-[fadeIn_200ms_ease-out]">
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
