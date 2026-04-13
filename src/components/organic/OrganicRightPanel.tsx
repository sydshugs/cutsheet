// src/components/organic/OrganicRightPanel.tsx
// Extracted right panel from OrganicAnalyzer — pure extraction, no behaviour changes.

import { forwardRef, useImperativeHandle, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScoreCard } from "../ScoreCard";
import { BriefResultView, type BriefSection } from "../BriefResultView";
import { AlertDialog } from "../ui/AlertDialog";
import { PlatformSwitcher, ORGANIC_PLATFORMS, ORGANIC_STATIC_PLATFORMS } from "../PlatformSwitcher";
import { extractRightPanelSections } from "../ReportCards";
import type { AnalysisResult } from "../../services/analyzerService";
import type { FixItResult } from "../../services/fixItService";
import type { PlatformScore } from "../../services/claudeService";
import type { PredictionResult } from "../../services/predictionService";

// ─── Types ────────────────────────────────────────────────────────────────────

type RightTab = "analysis" | "brief";

type Platform = "all" | "TikTok" | "Instagram Reels" | "YouTube Shorts";

type OrganicFormat = "video" | "static";

const PLATFORM_SERVICE_MAP = {
  'TikTok': 'tiktok',
  'Instagram Reels': 'reels',
  'YouTube Shorts': 'shorts',
} as const;

export interface OrganicRightPanelHandle {
  setTab: (tab: RightTab) => void;
}

export interface OrganicRightPanelProps {
  // ── Visibility ──────────────────────────────────────────────────────────────
  showRightPanel: boolean;

  // ── Active result ───────────────────────────────────────────────────────────
  activeResult: AnalysisResult | null;
  analysisCompletedAt: Date | null;

  // ── Platform / format ────────────────────────────────────────────────────────
  platform: Platform;
  organicFormat: OrganicFormat;
  isPro: boolean;

  // ── Platform scores ──────────────────────────────────────────────────────────
  platformScores: PlatformScore[];
  platformScoresLoading: boolean;
  onPlatformChange: (p: Platform) => void;

  // ── Brief ────────────────────────────────────────────────────────────────────
  brief: string | null;
  briefLoading: boolean;
  briefError: string | null;

  // ── CTA rewrites ─────────────────────────────────────────────────────────────
  ctaRewrites: string[] | null;
  ctaLoading: boolean;

  // ── Fix It ────────────────────────────────────────────────────────────────────
  fixItResult: FixItResult | null;
  fixItLoading: boolean;

  // ── Prediction ────────────────────────────────────────────────────────────────
  prediction: PredictionResult | null;

  // ── User context ─────────────────────────────────────────────────────────────
  rawUserContext: { niche: string; platform: string } | null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  onGenerateBrief: () => void;
  onAddToSwipeFile: () => void;
  onCTARewrite: () => void;
  onShare: () => void;
  onFixIt: () => void;
  onReset: () => void;
  onUpgradeRequired: (feature: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OrganicRightPanel = forwardRef<OrganicRightPanelHandle, OrganicRightPanelProps>(
  function OrganicRightPanel(props, ref) {
    const {
      showRightPanel, activeResult, analysisCompletedAt,
      platform, organicFormat, isPro,
      platformScores, platformScoresLoading, onPlatformChange,
      brief, briefLoading, briefError,
      ctaRewrites, ctaLoading,
      fixItResult, fixItLoading,
      prediction,
      rawUserContext,
      onGenerateBrief, onAddToSwipeFile, onCTARewrite, onShare,
      onFixIt, onReset, onUpgradeRequired,
    } = props;

    const navigate = useNavigate();
    const [rightTab, setRightTab] = useState<RightTab>("analysis");
    const [confirmStartOver, setConfirmStartOver] = useState(false);

    useImperativeHandle(ref, () => ({ setTab: setRightTab }));

    // Sync rightTab to "brief" when brief arrives (called from parent via onGenerateBrief flow)
    // Parent sets brief → panel auto-advances via useEffect pattern is not needed;
    // parent calls ref.setTab("brief") after brief is set.

    return (
      <div
        className={`shrink-0 bg-[#111113] border-l border-white/[0.06] overflow-y-auto overflow-x-hidden pb-12 transition-[width,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/[0.06] ${
          showRightPanel ? "w-[350px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"
        }`}
      >
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
          <>
            <ScoreCard
              scores={activeResult.scores}
              hookDetail={activeResult.hookDetail}
              improvements={activeResult.improvements}
              hashtags={activeResult.hashtags}
              scenes={activeResult.scenes}
              fileName={activeResult.fileName}
              analysisTime={analysisCompletedAt ?? undefined}
              modelName="Gemini + Claude"
              onGenerateBrief={onGenerateBrief}
              onAddToSwipeFile={onAddToSwipeFile}
              onCTARewrite={onCTARewrite}
              ctaRewrites={ctaRewrites}
              ctaLoading={ctaLoading}
              onShare={onShare}
              isDark={true}
              format={organicFormat}
              isOrganic={true}
              niche={rawUserContext?.niche}
              platform={platform !== "all" ? platform : rawUserContext?.platform}
              onFixIt={onFixIt}
              fixItResult={fixItResult}
              fixItLoading={fixItLoading}
              prediction={prediction}
              onReanalyze={onReset}
              canVisualize={false}
              verdict={(() => {
                const s = activeResult.scores.overall;
                return {
                  state: (s >= 8 ? 'ready' : s >= 5 ? 'needs_work' : 'not_ready') as 'ready' | 'needs_work' | 'not_ready',
                  headline: s >= 8 ? 'Ready to post' : s >= 5 ? 'Needs refinement' : 'Not ready',
                  sub: 'Organic content',
                };
              })()}
              analysisSections={activeResult.markdown ? extractRightPanelSections(activeResult.markdown) : undefined}
              briefLoading={briefLoading}
              hasBrief={!!brief}
              improvementsLoading={false}
              onStartOver={() => setConfirmStartOver(true)}
              onNavigateSettings={() => navigate('/settings')}
              isPro={isPro}
              onUpgradeRequired={onUpgradeRequired}
              platformScore={
                platform !== "all" && platformScores.length > 0
                  ? platformScores.find(
                      ps => ps.platform === PLATFORM_SERVICE_MAP[platform as keyof typeof PLATFORM_SERVICE_MAP]
                    )?.score
                  : undefined
              }
              platformSwitcher={
                <PlatformSwitcher
                  platforms={organicFormat === "static" ? ORGANIC_STATIC_PLATFORMS : ORGANIC_PLATFORMS}
                  selected={platform}
                  onChange={(p) => onPlatformChange(p as Platform)}
                  disabled={false}
                  isSwitching={platformScoresLoading}
                />
              }
            />

            <AlertDialog
              open={confirmStartOver}
              onClose={() => setConfirmStartOver(false)}
              onConfirm={() => {
                setConfirmStartOver(false);
                onReset();
              }}
              title="Start over?"
              description="This will clear your current analysis. You can always re-analyze the same file."
              confirmLabel="Start Over"
              variant="destructive"
            />
          </>
        )}

        {showRightPanel && rightTab === "brief" && (
          <>
            {briefLoading && !brief && (
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRightTab("analysis")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    ← Back to Scores
                  </button>
                  <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                  <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">Generating creative brief...</span>
                </div>
              </div>
            )}

            {briefError && (
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRightTab("analysis")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    ← Back to Scores
                  </button>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-red-400">{briefError}</p>
                </div>
              </div>
            )}

            {brief && (() => {
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
                    label: boldMatch[1].replace(/:$/, ''),
                    content: content || undefined,
                    items: content ? undefined : [],
                  };
                } else if (current) {
                  const cleanLine = t.replace(/^[-*]\s*/, '');
                  if (!current.items) current.items = [];
                  current.items.push(cleanLine);
                }
              }
              if (current) sections.push(current);

              return (
                <BriefResultView
                  sections={sections}
                  platform={platform !== "all" ? platform : "TikTok"}
                  adFormat={organicFormat === "static" ? "Static" : "Video"}
                  onBack={() => setRightTab("analysis")}
                />
              );
            })()}
          </>
        )}
      </div>
    );
  }
);
