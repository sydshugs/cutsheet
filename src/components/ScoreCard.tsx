// ScoreCard.tsx — Orchestrator component composing scorecard sub-components
// Refactored from monolith into focused sub-components. Glass card wrapper with ambient glow.
// Pass 1: Consolidated layout — removed Deep Dive, tabs, Compare link. Reordered sections.

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { HookAnalysisExpanded } from "./HookAnalysisExpanded";
import { HashtagsC2 } from "./HashtagsC2";
import { Copy, CheckCircle, Loader2, RotateCcw, FileText, Lightbulb, DollarSign } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import { getBenchmark, type BenchmarkResult } from "../lib/benchmarks";
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
}

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
  youtubeFormat,
  platformScore,
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
  isOrganic = false,
  verdict,
  platformSwitcher,
  briefLoading,
  hasBrief,
  analysisSections,
}: ScoreCardProps) {
  const displayScore = platformScore ?? scores.overall;
  const { label: overallLabel } = getScoreLabel(displayScore);
  const heroVerdict = displayScore >= 8 ? "Strong" : displayScore >= 4 ? "Average" : "Needs Work";
  const benchmark: BenchmarkResult = getBenchmark(niche ?? '', platform ?? '', format === 'video' ? 'video' : 'static');
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

  return (
    <div className="scorecard flex flex-col">
      {/* Header — cleaner, minimal */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
        <span className="text-sm font-medium text-zinc-300">Score Overview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            aria-label="Copy scores to clipboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none px-2.5 py-1.5"
            style={{
              background: 'transparent',
              color: copied ? '#10b981' : '#71717a',
            }}
          >
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Verdict block — cleaner inline style */}
      {/* Main content card — cleaner styling */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.015]">
        {/* Platform switcher */}
        {platformSwitcher && (
          <div className="px-4 pt-4 pb-2 border-b border-white/[0.05]">
            {platformSwitcher}
          </div>
        )}

          {/* 1 + 2. ScoreHero — score number + benchmark bar + dimension grid */}
          <ScoreHero
            score={displayScore}
            verdict={heroVerdict}
            benchmark={benchmark.averageScore}
            platform={platform}
            format={format}
            youtubeFormat={youtubeFormat}
            dimensions={[
              { name: "Hook",   score: scores.hook },
              { name: "Copy",   score: scores.clarity },
              { name: "Visual", score: scores.production },
              { name: "CTA",    score: scores.cta },
            ]}
          />

          {winner && (
            <div className="flex justify-center pb-2">
              <div className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
                &#9733; Winner
              </div>
            </div>
          )}

          {/* ScoreAdaptiveCTA moved below Hashtags */}

          {/* Action row (AI Rewrite / Visualize / Policies) moved to center column tools grid */}

          {/* Fix It result removed — only shows in dedicated slide-out panel in PaidAdAnalyzer */}

          {/* Predicted Performance + Budget moved outside glass card */}

          {/* Analysis sections — only Hook analysis */}
          {analysisSections && analysisSections.length > 0 && (() => {
            // Only show Hook analysis section
            const hookSection = analysisSections.find(s => /hook/i.test(s.title));
            
            if (!hookSection) return null;

            return (
            <div className="px-4 pt-4 space-y-1">
              <CollapsibleSection
                title={hookSection.title}
                icon={<Lightbulb size={14} />}
              >
                <HookAnalysisExpanded content={hookSection.content} format={format ?? 'static'} />
              </CollapsibleSection>
            </div>
          );
          })()}

          {/* Hashtags */}
          {hashtags && (hashtags.tiktok?.length > 0 || hashtags.meta?.length > 0 || hashtags.instagram?.length > 0 || hashtags.pinterest?.length > 0 || hashtags.reels?.length > 0 || hashtags.youtube_shorts?.length > 0) && (
            <HashtagsC2 hashtags={hashtags} format={format} />
          )}

      </div>{/* end main card */}

      {/* Re-analyze / Analyze another button */}
      {onReanalyze && (
        <button
          onClick={onReanalyze}
          className="mx-4 mt-4 w-[calc(100%-2rem)] flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-medium transition-all hover:bg-indigo-500/15 bg-indigo-500/[0.08] text-indigo-400 border border-indigo-500/20"
        >
          <RotateCcw size={14} />
          {isOrganic ? 'Analyze another creative' : 'Re-analyze improved version'}
        </button>
      )}

      {/* Generate Brief button */}
      {onGenerateBrief && (
        <button
          onClick={onGenerateBrief}
          disabled={briefLoading}
          className="mx-4 mt-4 w-[calc(100%-2rem)] flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-medium transition-all hover:bg-amber-500/15 bg-amber-500/[0.08] text-amber-400 border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {briefLoading ? (
            <><Loader2 size={14} className="animate-spin" /> Generating...</>
          ) : (
            <><FileText size={14} /> {hasBrief ? 'Regenerate Brief' : 'Generate Brief'}</>
          )}
        </button>
      )}

      {/* Predicted Performance */}
      {prediction && (
        <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
          <PredictedPerformanceCard prediction={prediction} platform={platform} niche={niche} isOrganic={isOrganic} />
        </div>
      )}

      {/* Budget Recommendation */}
      {(engineBudget || budget) && (
        <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Budget</span>
          </div>
          <BudgetCard
            engineBudget={engineBudget}
            budget={budget}
            onNavigateSettings={onNavigateSettings}
          />
        </div>
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
