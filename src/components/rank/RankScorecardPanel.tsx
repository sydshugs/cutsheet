// Right-panel scorecard column extracted from RankScorecardPage.tsx
// Contains: platform switcher, YouTube format selector, CTA-free toggle,
// platform score badge, and the full ScoreCard.

import { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScoreCard } from "../ScoreCard";
import { PlatformSwitcher, PAID_AD_PLATFORMS, PAID_STATIC_PLATFORMS } from "../PlatformSwitcher";
import { YouTubeFormatSelector, type YouTubeFormat } from "../YouTubeFormatSelector";
import { extractRightPanelSections } from "../ReportCards";
import type { AnalysisResult } from "../../services/analyzerService";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { PredictionResult } from "../../services/predictionService";
import type { FixItResult } from "../../services/fixItService";
import type { PlatformScore } from "../../services/claudeService";
import type { VisualizeStatus } from "../../types/visualize";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RankScorecardPanelProps {
  result: AnalysisResult & { scores: NonNullable<AnalysisResult["scores"]> };
  format: string;
  // Platform switcher
  platform: string;
  onPlatformSwitch: (p: string) => void;
  isPlatformSwitching: boolean;
  platformScoreResult: PlatformScore | null;
  // YouTube sub-selector
  youtubeFormat: YouTubeFormat;
  onYoutubeFormatChange: (f: YouTubeFormat) => void;
  // Meta CTA-free toggle
  ctaFree: boolean;
  onCtaFreeChange: (v: boolean) => void;
  // Score-related
  engineBudget: EngineBudgetRecommendation | null;
  platformImprovements: string[] | null;
  improvementsLoading: boolean;
  prediction: PredictionResult | null;
  predictionLoading: boolean;
  // Fix It
  fixItResult: FixItResult | null;
  fixItLoading: boolean;
  onFixIt: () => void;
  // Visualize
  visualizeStatus: VisualizeStatus;
  onVisualize: () => void;
  // Other
  rawUserContextNiche: string | undefined;
  rawUserContextPlatform: string | undefined;
  isPro: boolean;
  onUpgradeRequired: (feature: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RankScorecardPanel({
  result,
  format,
  platform,
  onPlatformSwitch,
  isPlatformSwitching,
  platformScoreResult,
  youtubeFormat,
  onYoutubeFormatChange,
  ctaFree,
  onCtaFreeChange,
  engineBudget,
  platformImprovements,
  improvementsLoading,
  prediction,
  predictionLoading,
  fixItResult,
  fixItLoading,
  onFixIt,
  visualizeStatus,
  onVisualize,
  rawUserContextNiche,
  rawUserContextPlatform,
  isPro,
  onUpgradeRequired,
}: RankScorecardPanelProps) {
  const navigate = useNavigate();
  const scorecardColumnRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex h-auto min-h-0 w-full shrink-0 flex-col overflow-y-auto border-t border-[color:var(--border)] bg-[color:var(--surface)] lg:h-auto lg:w-[350px] lg:border-l lg:border-t-0">
      <div className="flex min-w-0 flex-col gap-4 p-6">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          <div ref={scorecardColumnRef}>
            <ScoreCard
              scores={result.scores}
              hookDetail={result.hookDetail}
              improvements={platformImprovements ?? result.improvements}
              improvementsLoading={improvementsLoading}
              budget={result.budget}
              hashtags={result.hashtags}
              scenes={result.scenes}
              fileName={result.fileName}
              analysisTime={result.timestamp}
              scoreRange={{
                low: Math.max(0, Math.round((result.scores.overall - 0.65) * 10) / 10),
                high: Math.min(10, Math.round((result.scores.overall + 0.65) * 10) / 10),
              }}
              modelName="Gemini + Claude"
              isDark
              format={format as "static" | "video"}
              engineBudget={engineBudget}
              onNavigateSettings={() => navigate("/settings")}
              niche={rawUserContextNiche}
              platform={platform !== "all" ? platform : rawUserContextPlatform}
              youtubeFormat={
                platform === "YouTube" || platform === "Shorts"
                  ? youtubeFormat
                  : undefined
              }
              platformScore={
                platform !== "all" && platformScoreResult
                  ? platformScoreResult.score
                  : undefined
              }
              onFixIt={onFixIt}
              fixItResult={fixItResult}
              fixItLoading={fixItLoading}
              prediction={prediction}
              predictionLoading={predictionLoading}
              onCompare={() => navigate("/app/competitor")}
              onVisualize={onVisualize}
              visualizeLoading={visualizeStatus === "loading"}
              canVisualize
              isPro={isPro}
              verdict={result.verdict}
              platformCta={result.platformCta}
              analysisSections={extractRightPanelSections(result.markdown)}
              platformSwitcher={
                <>
                  <PlatformSwitcher
                    platforms={
                      format === "static" ? PAID_STATIC_PLATFORMS : PAID_AD_PLATFORMS
                    }
                    selected={platform}
                    onChange={(p) => void onPlatformSwitch(p)}
                    isSwitching={isPlatformSwitching}
                    disabled={false}
                  />
                  {(platform === "YouTube" || platform === "Shorts") &&
                    format === "video" && (
                      <div className="mt-1">
                        <YouTubeFormatSelector
                          selected={youtubeFormat}
                          onChange={onYoutubeFormatChange}
                          disabled={false}
                        />
                      </div>
                    )}
                  {platform === "Meta" && format === "video" && (
                    <label className="mt-2 flex cursor-pointer select-none items-center gap-2 group">
                      <input
                        type="checkbox"
                        checked={ctaFree}
                        onChange={(e) => onCtaFreeChange(e.target.checked)}
                        className="cursor-pointer rounded border-[color:var(--border-strong)] accent-[color:var(--accent)]"
                      />
                      <span className="text-xs leading-tight text-[color:var(--ink-muted)] transition-opacity group-hover:text-[color:var(--ink)]">
                        Uses Meta&apos;s native CTA button (no CTA in creative)
                      </span>
                    </label>
                  )}
                  {platformScoreResult && platform !== "all" && (
                    <div
                      className="mt-1.5 flex items-center gap-2 rounded-lg border border-[color:var(--accent-border)] px-3 py-1.5 text-xs"
                      style={{ background: "var(--accent-subtle)" }}
                    >
                      <span className="font-mono font-bold text-[color:var(--accent-light)]">
                        {platformScoreResult.score}/10
                      </span>
                      <span className="text-[color:var(--ink-muted)]">
                        {platformScoreResult.verdict}
                      </span>
                    </div>
                  )}
                </>
              }
              onUpgradeRequired={onUpgradeRequired}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
