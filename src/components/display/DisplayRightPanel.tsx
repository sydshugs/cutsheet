// src/components/display/DisplayRightPanel.tsx
// Extracted right panel from DisplayAnalyzer — pure extraction, no behaviour changes.

import { ScoreCard } from "../ScoreCard";
import { PolicyCheckPanel } from "../PolicyCheckPanel";
import { VisualizePanel } from "../VisualizePanel";
import { AlertDialog } from "../ui/AlertDialog";
import type { DisplayResult } from "../../types/display";
import type { PolicyCheckResult } from "../../lib/policyCheckService";
import type { VisualizeResult, VisualizeStatus, VisualizeCreditData, VisualizeMode } from "../../types/visualize";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { PredictionResult } from "../../services/predictionService";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DisplayRightPanelProps {
  // ── Visibility ──────────────────────────────────────────────────────────────
  show: boolean;

  // ── Result data ─────────────────────────────────────────────────────────────
  result: DisplayResult;
  fileName: string | undefined;
  previewUrl: string | null;
  niche: string | undefined;

  // ── Secondary results ────────────────────────────────────────────────────────
  engineBudget: EngineBudgetRecommendation | null;
  prediction: PredictionResult | null;

  briefLoading: boolean;
  briefMarkdown: string | null;
  briefError: string | null;

  policyResult: PolicyCheckResult | null;
  policyLoading: boolean;
  policyError: string | null;

  // ── Visualize state ──────────────────────────────────────────────────────────
  visualizeOpen: boolean;
  visualizeStatus: VisualizeStatus;
  visualizeResult: VisualizeResult | null;
  visualizeError: string | null;
  visualizeCreditData: VisualizeCreditData | null;
  visualizeMode?: VisualizeMode | null;

  // ── Confirm dialog ───────────────────────────────────────────────────────────
  confirmStartOver: boolean;

  // ── Misc ─────────────────────────────────────────────────────────────────────
  isPro: boolean;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  onGenerateBrief: () => void;
  onCheckPolicies: () => void;
  onVisualize: () => void;
  onReanalyze: () => void;
  onStartOver: () => void;
  onConfirmStartOver: () => void;
  onCancelStartOver: () => void;
  onClosePolicyResult: () => void;
  onCloseVisualize: () => void;
  onUpgradeRequired: (feature: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DisplayRightPanel({
  show,
  result,
  fileName,
  previewUrl,
  niche,
  engineBudget,
  prediction,
  briefLoading,
  briefMarkdown,
  briefError,
  policyResult,
  policyLoading,
  policyError,
  visualizeOpen,
  visualizeStatus,
  visualizeResult,
  visualizeError,
  visualizeCreditData,
  visualizeMode,
  confirmStartOver,
  isPro,
  onGenerateBrief,
  onCheckPolicies,
  onVisualize,
  onReanalyze,
  onStartOver,
  onConfirmStartOver,
  onCancelStartOver,
  onClosePolicyResult,
  onCloseVisualize,
  onUpgradeRequired,
}: DisplayRightPanelProps) {
  return (
    <div
      className={`shrink-0 min-h-0 bg-[#111113] border-l border-white/[0.06] overflow-y-auto overflow-x-hidden pb-12 transition-[width,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/[0.06] ${
        show ? "w-[350px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"
      }`}
    >
      {show && (
        <>
          <ScoreCard
            scores={{ hook: 0, clarity: 0, cta: 0, production: 0, overall: result.overallScore }}
            dimensionOverrides={[
              { name: "Hook",    score: result.scores.hierarchy },
              { name: "Message", score: result.scores.messageClarity },
              { name: "Visual",  score: result.scores.visualContrast },
              { name: "Brand",   score: result.scores.brandClarity },
            ]}
            verdict={{
              state: result.overallScore >= 8 ? "ready" : result.overallScore >= 4 ? "needs_work" : "not_ready",
              headline: result.verdict,
              sub: "Google Display",
            }}
            improvements={result.improvements.map((i) => i.fix)}
            fileName={fileName}
            engineBudget={engineBudget}
            briefLoading={briefLoading}
            hasBrief={!!briefMarkdown}
            onGenerateBrief={onGenerateBrief}
            prediction={prediction}
            onReanalyze={onReanalyze}
            onStartOver={onStartOver}
            format="static"
            niche={niche}
            platform="Google Display"
            onCheckPolicies={onCheckPolicies}
            policyLoading={policyLoading}
            onVisualize={onVisualize}
            visualizeLoading={visualizeStatus === "loading"}
            canVisualize={true}
            isPro={isPro}
            onUpgradeRequired={onUpgradeRequired}
            improvementsLoading={false}
            isDark={true}
          />

          {/* Brief output */}
          {briefError && (
            <div className="mx-4 mt-2 text-xs text-red-400 bg-red-500/[0.08] rounded-xl px-4 py-3 border border-red-500/20">
              {briefError}
            </div>
          )}
          {briefMarkdown && (
            <div className="mx-4 mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {briefMarkdown}
            </div>
          )}

          {/* Policy results */}
          {policyError && (
            <div className="mx-4 mt-2 text-xs text-red-400 bg-red-500/[0.08] rounded-xl px-4 py-3 border border-red-500/20">
              {policyError}
            </div>
          )}
          {policyResult && (
            <div className="px-4 mt-4">
              <PolicyCheckPanel result={policyResult} onClose={onClosePolicyResult} />
            </div>
          )}

          {/* Visualize Panel */}
          {(visualizeOpen || visualizeStatus !== "idle") && (
            <div className="px-4 mt-4 pb-4">
              <VisualizePanel
                status={visualizeStatus}
                result={visualizeResult}
                originalImageUrl={previewUrl}
                error={visualizeError}
                creditData={visualizeCreditData}
                onClose={onCloseVisualize}
                onUpgrade={onUpgradeRequired}
                visualizeMode={visualizeMode}
              />
            </div>
          )}

          {/* Start Over confirmation */}
          <AlertDialog
            open={confirmStartOver}
            onClose={onCancelStartOver}
            onConfirm={onConfirmStartOver}
            title="Start over?"
            description="This will clear your current analysis. You can always re-analyze the same file."
            confirmLabel="Start Over"
            variant="destructive"
          />
        </>
      )}
    </div>
  );
}
