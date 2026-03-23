// ScoreCard.tsx — Orchestrator component composing scorecard sub-components
// Refactored from monolith into focused sub-components. Glass card wrapper with ambient glow.
// Pass 1: Consolidated layout — removed Deep Dive, tabs, Compare link. Reordered sections.

import { useEffect, useState } from "react";
import { Copy, CheckCircle, Wand2, Loader2, AlertCircle, TrendingUp, ArrowUpRight, Share2, RotateCcw, ShieldCheck, FileText, Bookmark, Lightbulb, DollarSign, Sparkles, Lock, Film, Hash } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import { getBenchmark, type BenchmarkResult } from "../lib/benchmarks";
import SceneBreakdown from "./SceneBreakdown";
import { StaticAdChecks } from "./StaticAdChecks";
import FixItPanel, { type FixItResult } from "./FixItPanel";
import PredictedPerformanceCard, { type PredictionResult } from "./PredictedPerformanceCard";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { OverflowMenu, type OverflowMenuItem } from "./ui/OverflowMenu";
import { AlertDialog } from "./ui/AlertDialog";
import { getScoreColor, getScoreBg, getScoreBorder, getVerdict, getVerdictCopy } from '../lib/scoreColors';

// Sub-components
import { ScoreHero } from "./ScoreHero";
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
  // Mode — affects hashtag default state (expanded for organic)
  isOrganic?: boolean;
}

/** Score band color for chips/overlays — exported for external consumers */
export function getScoreColorByValue(score: number): string {
  return getScoreColor(score);
}

function getScoreLabel(score: number): { label: string; color: string } {
  const verdict = getVerdict(score);
  return { label: verdict, color: getScoreColor(score) };
}

// ── HashtagChip — click-to-copy with feedback ────────────────────────────────

function HashtagChip({ tag }: { tag: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="cs-chip"
      onClick={() => {
        navigator.clipboard.writeText(`#${tag}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
    >
      {copied ? '✓ ' : '#'}{tag}
    </button>
  );
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
          <div style={{ width: 12, height: 12, border: "2px solid var(--accent-bg)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {visible.map((item, i) => (
          <li key={i} className="flex gap-2 items-start py-1.5">
            <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--accent)" }} />
            <span className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>{item}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] mt-2 cursor-pointer bg-transparent border-none p-0 font-medium transition-colors"
          style={{ color: "var(--accent)" }}
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
  isOrganic = false,
}: ScoreCardProps) {
  const { label: overallLabel } = getScoreLabel(scores.overall);
  const heroVerdict = scores.overall >= 8 ? "Strong" : scores.overall >= 4 ? "Average" : "Needs Work";
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
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">Score Overview</span>
          {analysisTime && (
            <span className="text-xs text-zinc-600">{relativeTime}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="cs-btn-ghost">
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy scorecard"}
          </button>
          {(onGenerateBrief || onAddToSwipeFile || onStartOver || onCheckPolicies || onCompare) && (
            <OverflowMenu
              direction="down"
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
          )}
        </div>
      </div>

      {/* Analysis content — solid card, no glass */}
      <div className="cs-card" style={{ margin: '12px 16px 0', overflow: 'hidden' }}>

        {/* 1 + 2. ScoreHero — score number + benchmark bar + dimension grid */}
        <ScoreHero
          score={scores.overall}
          verdict={heroVerdict}
          benchmark={benchmark.averageScore}
          platform={platform}
          format={format}
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

        {/* 3. ScoreAdaptiveCTA — always visible */}
        <div style={{ marginTop: 16, padding: "0 20px" }}>
          <ScoreAdaptiveCTA
            overallScore={scores.overall}
            onShare={onShare}
            onGenerateBrief={onGenerateBrief}
          />
        </div>

        {/* 4. Action row — Fix It / Visualize / Policy Check */}
        <div
          style={{ marginTop: 16, padding: "0 20px", display: "flex", gap: 8 }}
          className="max-md:flex-col"
        >
          {/* Fix It For Me */}
          {onFixIt && (
            <button
              type="button"
              onClick={onFixIt}
              disabled={fixItLoading}
              aria-label={scores.overall >= 8 ? "Polish It" : "Fix It For Me"}
              className="cs-btn-ghost flex-1 h-10 justify-center"
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
                className="cs-btn-ghost flex-1 h-10 justify-center"
              >
                {visualizeLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Visualize
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onUpgradeRequired?.("visualize")}
                aria-label="Visualize It — Pro feature"
                className="cs-btn-ghost flex-1 h-10 justify-center opacity-40"
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
              className="cs-btn-ghost flex-1 h-10 justify-center"
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
                <span className="text-[10px] font-mono" style={{ color: getScoreColor(scores.hook) }}>
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
          <div style={{ marginTop: 16, padding: "0 20px" }}>
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
          <div style={{ marginTop: 16, padding: "0 20px" }}>
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
          <div style={{ marginTop: 16, padding: "0 20px" }}>
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

        {/* 10. Scene Breakdown — video only */}
        {format === "video" && scenes && scenes.length > 0 && (
          <div style={{ marginTop: 16, padding: "0 20px" }}>
            <CollapsibleSection
              title="Scene Breakdown"
              icon={<Film size={14} />}
              trailing={<span className="text-[10px] text-zinc-500">{scenes.length} scenes</span>}
            >
              <SceneBreakdown scenes={scenes} />
            </CollapsibleSection>
          </div>
        )}

        {/* 11. Static Ad Checks — static only */}
        {format === "static" && scores && (
          <div style={{ marginTop: 16, padding: "0 20px", paddingBottom: 20 }}>
            <CollapsibleSection title="Ad Quality Checks" icon={<ShieldCheck size={14} />}>
              <StaticAdChecks scores={scores} />
            </CollapsibleSection>
          </div>
        )}

        {/* 12. Hashtags — collapsed for paid, expanded for organic */}
        {hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0) && (
          <div style={{ marginTop: 16, padding: "0 20px", paddingBottom: 16 }}>
            <CollapsibleSection
              title="Recommended Hashtags"
              icon={<Hash size={14} />}
              defaultOpen={isOrganic}
              trailing={
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">
                    {[hashtags.tiktok, hashtags.meta, hashtags.instagram].reduce((n, t) => n + t.length, 0)} tags
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const allTags = [
                        ...hashtags.tiktok.map(t => `#${t}`),
                        ...hashtags.meta.map(t => `#${t}`),
                        ...hashtags.instagram.map(t => `#${t}`),
                      ];
                      navigator.clipboard.writeText(allTags.join(' '));
                    }}
                    className="text-[10px] transition-colors"
                    style={{ color: "var(--accent)" }}
                  >
                    Copy all
                  </button>
                </div>
              }
            >
              {([["TikTok", hashtags.tiktok], ["Meta", hashtags.meta], ["Instagram", hashtags.instagram]] as const).map(
                ([plat, tags]) =>
                  tags.length > 0 && (
                    <div key={plat} className="mb-3">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{plat}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tags.map((tag) => (
                          <HashtagChip key={tag} tag={tag} />
                        ))}
                      </div>
                    </div>
                  )
              )}
            </CollapsibleSection>
          </div>
        )}

      </div>{/* end cs-card */}

      {/* Overflow menu moved to header row — see Score Overview header above */}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--success)", color: "white", padding: "8px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "var(--shadow-lg)",
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
