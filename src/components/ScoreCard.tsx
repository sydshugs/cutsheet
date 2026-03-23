// ScoreCard.tsx — Orchestrator component composing scorecard sub-components
// Refactored from monolith into focused sub-components. Glass card wrapper with ambient glow.
// Pass 1: Consolidated layout — removed Deep Dive, tabs, Compare link. Reordered sections.

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { HookAnalysisExpanded } from "./HookAnalysisExpanded";
import { VisualHierarchyExpanded } from "./VisualHierarchyExpanded";
import { CopyAndMessagingExpanded } from "./CopyAndMessagingExpanded";
import { HashtagsC2 } from "./HashtagsC2";
import { Copy, CheckCircle, Wand2, Loader2, TrendingUp, ArrowUpRight, Share2, RotateCcw, ShieldCheck, FileText, Bookmark, Lightbulb, DollarSign, Sparkles, Film, Hash, Layout, Heart, MessageSquare } from "lucide-react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import { getBenchmark, type BenchmarkResult } from "../lib/benchmarks";
import FixItPanel, { type FixItResult } from "./FixItPanel";
import PredictedPerformanceCard, { type PredictionResult } from "./PredictedPerformanceCard";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { OverflowMenu, type OverflowMenuItem } from "./ui/OverflowMenu";
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
      {/* Header — Option A */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium text-zinc-200">Score Overview</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            aria-label="Copy scores to clipboard"
            className="inline-flex items-center gap-1.5 text-[11px] rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
            style={{
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              color: copied ? '#10b981' : '#71717a',
            }}
          >
            {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy scores"}
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

      {/* Verdict block — Option A */}
      {verdict && (() => {
        const vColors = {
          not_ready: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', chipBg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Not ready' },
          needs_work: { bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.15)', chipBg: 'rgba(217,119,6,0.12)', color: '#d97706', label: 'Needs work' },
          ready: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', chipBg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Ready' },
        };
        const v = vColors[verdict.state];
        return (
          <div className="mx-4 mb-3">
            <div
              className="flex items-center gap-2.5 rounded-[9px]"
              style={{ padding: '10px 12px', background: v.bg, border: `0.5px solid ${v.border}` }}
            >
              <span
                className="text-[10px] font-medium uppercase rounded-full shrink-0"
                style={{ padding: '2px 8px', background: v.chipBg, color: v.color }}
              >
                {v.label}
              </span>
              <span className="text-xs text-zinc-400 leading-[1.45]">{verdict.headline}</span>
            </div>
          </div>
        );
      })()}

      {/* Analysis content — Glass card */}
      <div style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "var(--glass-card-blur)",
        WebkitBackdropFilter: "var(--glass-card-blur)",
        border: "1px solid var(--glass-card-border)",
        boxShadow: "var(--glass-card-shadow)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        position: "relative",
        margin: "12px 16px 0",
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

          {/* Platform switcher — inside glass card at top */}
          {platformSwitcher && (
            <div className="px-4 pt-3 pb-1">
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

          {/* 5. Fix It result (if already generated) */}
          {fixItResult && (
            <div style={{ marginTop: 12, padding: "0 20px" }}>
              <FixItPanel result={fixItResult} />
            </div>
          )}

          {/* Predicted Performance + Budget moved outside glass card */}

          {/* ── Analysis sections (Hook, Hierarchy, Copy, Messaging) ── */}
          {analysisSections && analysisSections.length > 0 && (() => {
            // Merge copy inventory + messaging into one combined section
            const copySection = analysisSections.find(s => /copy/i.test(s.title));
            const messagingSection = analysisSections.find(s => /messag/i.test(s.title));
            const combinedContent = [copySection?.content, messagingSection?.content].filter(Boolean).join('\n\n');
            const hasCombined = copySection || messagingSection;
            const ctaMissing = hasCombined && /no\s*(explicit\s*)?(cta|call)|cta.*none|none.*cta|flag.*missing/i.test(combinedContent);

            // Filter out copy + messaging from individual rendering
            const filteredSections = analysisSections.filter(s =>
              !(/copy/i.test(s.title)) && !(/messag/i.test(s.title))
            );

            return (
            <div style={{ marginTop: 16 }}>
              {filteredSections.map((section, i) => {
                const iconMap: Record<string, typeof Lightbulb> = {
                  hook: Lightbulb, hierarchy: Layout,
                };
                const matchedIcon = Object.entries(iconMap).find(([key]) =>
                  section.title.toLowerCase().includes(key)
                );
                const SIcon = matchedIcon?.[1] ?? FileText;
                const isHook = section.title.toLowerCase().includes('hook');
                const isHierarchy = section.title.toLowerCase().includes('hierarchy');
                return (
                  <div key={i} style={{ padding: "0 20px", marginTop: i > 0 ? 12 : 0 }}>
                    <CollapsibleSection
                      title={section.title}
                      icon={<SIcon size={14} />}
                    >
                      {isHook ? (
                        <HookAnalysisExpanded content={section.content} format={format ?? 'static'} />
                      ) : isHierarchy ? (
                        <VisualHierarchyExpanded content={section.content} />
                      ) : (
                        <div className="text-sm text-zinc-400 leading-relaxed [&_strong]:text-zinc-300 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-zinc-300 [&_h3]:mt-4 [&_h3]:mb-2 [&_em]:text-indigo-300/70">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      )}
                    </CollapsibleSection>
                  </div>
                );
              })}

              {/* Combined Copy & Messaging section */}
              {hasCombined && (
                <div style={{ padding: "0 20px", marginTop: 12 }}>
                  <CollapsibleSection
                    title="Copy & messaging"
                    icon={<MessageSquare size={14} />}
                    trailing={ctaMissing ? (
                      <span className="text-[10px] font-medium rounded-full px-2 py-px" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>No CTA</span>
                    ) : undefined}
                  >
                    <CopyAndMessagingExpanded content={combinedContent} />
                  </CollapsibleSection>
                </div>
              )}
            </div>
          );
          })()}

          {/* Recommended Hashtags — C2 layout */}
          {hashtags && (hashtags.tiktok.length > 0 || hashtags.meta.length > 0 || hashtags.instagram.length > 0) && (
            <HashtagsC2 hashtags={hashtags} format={format} />
          )}

        </div>{/* end card content */}
      </div>{/* end glass card */}

      {/* Re-analyze button — below ScoreHero, above Predicted Performance */}
      {onReanalyze && (
        <div className="mx-4 mt-3">
          <button
            onClick={onReanalyze}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-medium transition-colors hover:opacity-80"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <RotateCcw size={13} />
            Re-analyze improved version →
          </button>
        </div>
      )}

      {/* Predicted Performance — own card, always expanded */}
      {prediction && (
        <div className="mx-4 mt-3 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-200">Predicted Performance</span>
          </div>
          <PredictedPerformanceCard prediction={prediction} platform={platform} niche={niche} />
        </div>
      )}

      {/* Budget Recommendation — own card, always expanded */}
      {(engineBudget || budget) && (
        <div className="mx-4 mt-3 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-200">Budget Recommendation</span>
          </div>
          <BudgetCard
            engineBudget={engineBudget}
            budget={budget}
            onNavigateSettings={onNavigateSettings}
          />
        </div>
      )}

      {/* Overflow menu moved to header row — see Score Overview header above */}

      {/* Re-analyze button is above Predicted Performance */}

      {/* Generate Brief button — below all sections */}
      {onGenerateBrief && (
        <div className="mx-4 mt-3 mb-2">
          <button
            onClick={onGenerateBrief}
            disabled={briefLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-medium transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
          >
            {briefLoading ? (
              <><Loader2 size={13} className="animate-spin" /> Generating brief...</>
            ) : (
              <><FileText size={13} /> {hasBrief ? 'Regenerate Brief' : 'Generate a Brief'}</>
            )}
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--success)", color: "white", padding: "8px 20px", borderRadius: 12,
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
