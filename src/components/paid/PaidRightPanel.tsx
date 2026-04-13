// src/components/paid/PaidRightPanel.tsx
// Extracted right panel from PaidAdAnalyzer — pure extraction, no behaviour changes.

import { useState, useImperativeHandle, forwardRef } from "react";
import { Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreCard } from "../ScoreCard";
import { BriefResultView, type BriefSection } from "../BriefResultView";
import FixItPanel from "../FixItPanel";
import { PolicyCheckPanel } from "../PolicyCheckPanel";
import { BeforeAfterComparison } from "../BeforeAfterComparison";
import { PlatformSwitcher, PAID_AD_PLATFORMS, PAID_STATIC_PLATFORMS } from "../PlatformSwitcher";
import { YouTubeFormatSelector, type YouTubeFormat } from "../YouTubeFormatSelector";
import { extractRightPanelSections } from "../ReportCards";
import type { AnalysisResult } from "../../services/analyzerService";
import type { FixItResult } from "../FixItPanel";
import type { PolicyCheckResult } from "../../lib/policyCheckService";
import type { PlatformScore } from "../../services/claudeService";
import type { ComparisonResult } from "../../services/claudeService";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { PredictionResult } from "../../services/predictionService";

// ─── Types ────────────────────────────────────────────────────────────────────

type RightTab = "analysis" | "brief" | "policy" | "ai_rewrite";

type Platform =
  | "all"
  | "Meta"
  | "TikTok"
  | "Google"
  | "YouTube"
  | "Instagram"
  | "Facebook"
  | "Shorts"
  | "Reels";

type Format = "video" | "static";

export interface PaidRightPanelHandle {
  /** Switch to a specific tab from outside (e.g. when Fix It / Policy Check fires) */
  setTab: (tab: RightTab) => void;
}

export interface PaidRightPanelProps {
  // ── Visibility ──────────────────────────────────────────────────────────────
  showRightPanel: boolean;

  // ── Active result ───────────────────────────────────────────────────────────
  activeResult: AnalysisResult | null;
  analysisCompletedAt: Date | null;

  // ── Platform / format ────────────────────────────────────────────────────────
  platform: Platform;
  format: Format;
  youtubeFormat: YouTubeFormat;
  ctaFree: boolean;
  isPro: boolean;

  // ── Score delta ──────────────────────────────────────────────────────────────
  scoreDelta: {
    overall: number;
    label: string;
    dims: Record<string, number>;
  } | null;

  // ── Platform score / improvements ────────────────────────────────────────────
  platformScoreResult: PlatformScore | null;
  platformImprovements: string[] | null;
  improvementsLoading: boolean;
  isPlatformSwitching: boolean;

  // ── Secondary results ────────────────────────────────────────────────────────
  brief: string | null;
  briefLoading: boolean;
  briefError: string | null;

  ctaRewrites: string[] | null;
  ctaLoading: boolean;

  policyResult: PolicyCheckResult | null;
  policyLoading: boolean;
  policyError: string | null;

  fixItResult: FixItResult | null;
  fixItLoading: boolean;

  prediction: PredictionResult | null;
  predictionLoading: boolean;

  engineBudget: EngineBudgetRecommendation | null;

  // ── Before/After comparison ──────────────────────────────────────────────────
  reanalyzeMode: boolean;
  comparisonResult: ComparisonResult | null;
  comparisonLoading: boolean;
  originalScoresSnapshot: {
    overall: number;
    hook: number;
    cta: number;
    clarity: number;
    production: number;
  } | null;

  // ── Misc ─────────────────────────────────────────────────────────────────────
  savedAnalysisId: string | null;
  rawUserContext: { niche: string; platform: string } | null;
  visualizeLoading: boolean;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  onGenerateBrief: () => void;
  onAddToSwipeFile: () => void;
  onCTARewrite: () => void;
  onShare: () => Promise<void>;
  onCheckPolicies: () => void;
  onFixIt: () => void;
  onVisualize: () => void;
  onNavigateSettings: () => void;
  onReanalyzeAgain: () => void;
  onStartFresh: () => void;
  onStartOver: () => void;
  onCompare: () => void;
  onPlatformSwitch: (p: string) => void;
  onSetYoutubeFormat: (f: YouTubeFormat) => void;
  onSetCtaFree: (v: boolean) => void;
  onSetReanalyzeMode: (v: boolean) => void;
  onSetComparisonResult: (r: ComparisonResult | null) => void;
  onReanalyze: (file: File) => void;
  onUpgradeRequired: (feature: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PaidRightPanel = forwardRef<PaidRightPanelHandle, PaidRightPanelProps>(
  function PaidRightPanel(props, ref) {
    const {
      showRightPanel,
      activeResult,
      analysisCompletedAt,
      platform,
      format,
      youtubeFormat,
      ctaFree,
      isPro,
      scoreDelta,
      platformScoreResult,
      platformImprovements,
      improvementsLoading,
      isPlatformSwitching,
      brief,
      briefLoading,
      briefError,
      ctaRewrites,
      ctaLoading,
      policyResult,
      policyLoading,
      policyError,
      fixItResult,
      fixItLoading,
      prediction,
      predictionLoading,
      engineBudget,
      reanalyzeMode,
      comparisonResult,
      comparisonLoading,
      originalScoresSnapshot,
      savedAnalysisId,
      rawUserContext,
      visualizeLoading,
      onGenerateBrief,
      onAddToSwipeFile,
      onCTARewrite,
      onShare,
      onCheckPolicies,
      onFixIt,
      onVisualize,
      onNavigateSettings,
      onReanalyzeAgain,
      onStartFresh,
      onStartOver,
      onCompare,
      onPlatformSwitch,
      onSetYoutubeFormat,
      onSetCtaFree,
      onSetReanalyzeMode,
      onSetComparisonResult,
      onReanalyze,
      onUpgradeRequired,
    } = props;

    // ── Internal tab state — only used inside this panel ──────────────────────
    const [rightTab, setRightTab] = useState<RightTab>("analysis");

    // Expose setTab via ref so parent can switch tabs (e.g. when Fix It fires)
    useImperativeHandle(ref, () => ({
      setTab: (tab: RightTab) => setRightTab(tab),
    }));

    return (
      <div
        className={`shrink-0 min-w-0 min-h-0 h-full bg-[#111113] border-l border-white/[0.06] overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/[0.06] relative pb-6 ${showRightPanel ? "w-[350px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}
      >
        <div className="flex min-w-0 flex-col gap-[16px] p-[24px]">
          <AnimatePresence mode="wait">
            {showRightPanel && activeResult?.scores && rightTab === "analysis" && !(reanalyzeMode && !comparisonResult) && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-[16px]"
              >
                {/* Platform Switcher + YouTube format moved inside ScoreCard */}
                <div>
                  <ScoreCard
                    scores={activeResult.scores}
                    hookDetail={activeResult.hookDetail}
                    improvements={platformScoreResult?.improvements ?? platformImprovements ?? activeResult.improvements}
                    improvementsLoading={improvementsLoading}
                    budget={activeResult.budget}
                    hashtags={activeResult.hashtags}
                    scenes={activeResult.scenes}
                    fileName={activeResult.fileName}
                    analysisTime={analysisCompletedAt ?? undefined}
                    scoreRange={activeResult.scores ? {
                      low:  Math.max(0,  Math.round((activeResult.scores.overall - 0.65) * 10) / 10),
                      high: Math.min(10, Math.round((activeResult.scores.overall + 0.65) * 10) / 10),
                    } : undefined}
                    overallDelta={scoreDelta?.overall}
                    overallDeltaLabel={scoreDelta?.label}
                    dimensionDeltas={scoreDelta?.dims}
                    modelName="Gemini + Claude"
                    onGenerateBrief={onGenerateBrief}
                    onAddToSwipeFile={onAddToSwipeFile}
                    onCTARewrite={onCTARewrite}
                    ctaRewrites={ctaRewrites}
                    ctaLoading={ctaLoading}
                    onShare={onShare}
                    isDark={true}
                    format={format}
                    engineBudget={engineBudget}
                    onNavigateSettings={onNavigateSettings}
                    onReanalyze={() => { onSetComparisonResult(null); setRightTab("analysis"); onSetReanalyzeMode(true); }}
                    onStartOver={onStartOver}
                    onCheckPolicies={onCheckPolicies}
                    policyLoading={policyLoading}
                    niche={rawUserContext?.niche}
                    platform={platform !== "all" ? platform : rawUserContext?.platform}
                    youtubeFormat={(platform === "YouTube" || platform === "Shorts") ? youtubeFormat : undefined}
                    platformScore={platform !== "all" && platformScoreResult ? platformScoreResult.score : undefined}
                    onFixIt={onFixIt}
                    fixItResult={fixItResult}
                    fixItLoading={fixItLoading}
                    prediction={prediction}
                    predictionLoading={predictionLoading}
                    onCompare={onCompare}
                    onVisualize={onVisualize}
                    visualizeLoading={visualizeLoading}
                    canVisualize={true}
                    isPro={isPro}
                    briefLoading={briefLoading}
                    hasBrief={!!brief}
                    verdict={activeResult.verdict}
                    platformCta={activeResult.platformCta}
                    analysisSections={extractRightPanelSections(activeResult.markdown)}
                    platformSwitcher={
                      <>
                        <PlatformSwitcher
                          platforms={format === "static" ? PAID_STATIC_PLATFORMS : PAID_AD_PLATFORMS}
                          selected={platform}
                          onChange={onPlatformSwitch}
                          isSwitching={isPlatformSwitching}
                          disabled={false /* status is always complete when panel is visible */}
                        />
                        {(platform === "YouTube" || platform === "Shorts") && format === "video" && (
                          <div className="mt-1">
                            <YouTubeFormatSelector
                              selected={youtubeFormat}
                              onChange={onSetYoutubeFormat}
                              disabled={false}
                            />
                          </div>
                        )}
                        {platform === "Meta" && format === "video" && (
                          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none group">
                            <input
                              type="checkbox"
                              id="cta-free"
                              checked={ctaFree}
                              onChange={(e) => onSetCtaFree(e.target.checked)}
                              className="rounded border-zinc-600 accent-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-opacity leading-tight">
                              Uses Meta's native CTA button (no CTA in creative)
                            </span>
                          </label>
                        )}
                        {platformScoreResult && platform !== "all" && (
                          <div className="mt-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                          >
                            <span className="font-mono font-bold text-indigo-400">{platformScoreResult.score}/10</span>
                            <span className="text-zinc-400">{platformScoreResult.verdict}</span>
                          </div>
                        )}
                      </>
                    }
                    onUpgradeRequired={onUpgradeRequired}
                  />
                </div>
              </motion.div>
            )}

            {showRightPanel && rightTab === "brief" && (
              <motion.div
                key="brief"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col h-full"
              >
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRightTab("analysis")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    ← Back to Scores
                  </button>
                  <span className="text-xs text-zinc-500 font-mono">Claude Sonnet</span>
                </div>
                {briefLoading && !brief && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500">Generating creative brief...</span>
                  </div>
                )}
                {briefError && (
                  <div className="px-5 py-4">
                    <p className="text-xs text-red-400">{briefError}</p>
                  </div>
                )}
                {brief && (
                  <>
                    {(() => {
                      // Parse brief into BriefSection format for new component
                      const sections: BriefSection[] = [];
                      let current: BriefSection | null = null;
                      for (const line of brief.split("\n")) {
                        const t = line.trim();
                        if (!t || t === "---" || t.startsWith("## ")) continue;
                        const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                        if (boldMatch) {
                          if (current) sections.push(current);
                          const content = boldMatch[2];
                          current = {
                            label: boldMatch[1].replace(/:$/, ""),
                            content: content || undefined,
                            items: content ? undefined : [],
                          };
                        } else if (current) {
                          const cleanLine = t.replace(/^[-*]\s*/, "");
                          if (!current.items) {
                            current.items = [];
                          }
                          current.items.push(cleanLine);
                        }
                      }
                      if (current) sections.push(current);

                      return (
                        <BriefResultView
                          sections={sections}
                          platform={platform !== "all" ? platform : "Meta"}
                          adFormat={format === "static" ? "Static" : "Video"}
                          onBack={() => setRightTab("analysis")}
                        />
                      );
                    })()}
                  </>
                )}
              </motion.div>
            )}

            {/* Policy Check panel */}
            {showRightPanel && rightTab === "policy" && (
              <motion.div
                key="policy"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex min-w-0 flex-col h-full"
              >
                <div className="flex min-w-0 items-center justify-end gap-2 border-b border-white/5 px-3 py-2 sm:px-4">
                  <span className="shrink-0 text-xs font-mono text-zinc-600">Claude Sonnet</span>
                </div>
                <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4">
                  {policyLoading && !policyResult && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                      <div style={{ width: 20, height: 20, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "#71717a" }}>Checking policies...</span>
                      <span style={{ fontSize: 11, color: "#52525b" }}>Evaluating Meta & TikTok compliance</span>
                    </div>
                  )}
                  {policyError && (
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#ef4444" }}>
                      {policyError}
                    </div>
                  )}
                  {policyResult && !policyLoading && (
                    <PolicyCheckPanel
                      embedded
                      result={policyResult}
                      onClose={() => setRightTab("analysis")}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* AI Rewrite panel — uses FixItPanel component */}
            {showRightPanel && rightTab === "ai_rewrite" && (
              <motion.div
                key="ai_rewrite"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto p-4">
                  {fixItLoading && !fixItResult && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-[13px] text-zinc-400">Rewriting your ad...</span>
                    </div>
                  )}
                  {fixItResult && !fixItLoading && (
                    <FixItPanel
                      result={fixItResult}
                      onClose={() => setRightTab("analysis")}
                      mediaType={format as "static" | "video"}
                      analysisId={savedAnalysisId ?? undefined}
                      platform={platform !== "all" ? platform : (rawUserContext?.platform ?? undefined)}
                      niche={rawUserContext?.niche}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Re-analyze upload — replaces entire right panel */}
            {showRightPanel && reanalyzeMode && !comparisonResult && (
              <motion.div
                key="reanalyze-upload"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col h-full"
              >
                <div className="p-5 border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => onSetReanalyzeMode(false)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    ← Back to Scores
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                  {comparisonLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-sm text-zinc-500">Analyzing improved version...</span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-zinc-100">Upload your improved version</p>
                      <p className="text-xs text-zinc-500 -mt-2">We'll score it and compare against your original.</p>
                      <div
                        className="w-full max-w-[320px] h-[140px] border-2 border-dashed border-indigo-500/25 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file"; input.accept = "video/*,image/*";
                          input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onReanalyze(f); };
                          input.click();
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500/50", "bg-indigo-500/5"); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-500/5"); }}
                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-500/5"); const f = e.dataTransfer.files[0]; if (f) onReanalyze(f); }}
                      >
                        <Upload size={20} className="text-indigo-400" />
                        <span className="text-xs text-indigo-400 font-medium">Drop improved version here</span>
                        <span className="text-[11px] text-zinc-600">or click to browse</span>
                      </div>
                      <span className="text-[11px] text-zinc-600">PNG, JPG, MP4 supported</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Before/After comparison result */}
            {showRightPanel && comparisonResult && originalScoresSnapshot && activeResult?.scores && (
              <div style={{ padding: "0 16px 12px" }}>
                <BeforeAfterComparison
                  originalScores={originalScoresSnapshot}
                  improvedScores={activeResult.scores}
                  comparison={comparisonResult}
                  fileName={activeResult.fileName}
                  onReanalyzeAgain={onReanalyzeAgain}
                  onStartFresh={onStartFresh}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

export default PaidRightPanel;
