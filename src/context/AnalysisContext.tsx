// AnalysisContext — shared state for analysis results across ScoreCard + analyzer pages
// Eliminates ScoreCard's 35-prop signature by grouping into a typed context.

import { createContext, useContext, type ReactNode } from "react";
import type { BudgetRecommendation, Hashtags, Scene, HookDetail } from "../services/analyzerService";
import type { EngineBudgetRecommendation } from "../services/budgetService";
import type { AnalysisRecord } from "../services/historyService";
import type { FixItResult } from "../components/FixItPanel";
import type { PredictionResult } from "../components/PredictedPerformanceCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Scores {
  hook: number;
  clarity: number;
  cta: number;
  production: number;
  overall: number;
}

/** Core analysis data — the immutable result of a completed analysis. */
export interface AnalysisData {
  scores: Scores;
  improvements?: string[];
  budget?: BudgetRecommendation | null;
  hashtags?: Hashtags;
  scenes?: Scene[];
  format: "video" | "static";
  hookDetail?: HookDetail;
  fileName?: string;
  analysisTime?: Date;
  modelName?: string;
  niche?: string;
  platform?: string;
}

/** Feature results — async features that load after the initial analysis. */
export interface AnalysisFeatures {
  ctaRewrites?: string[] | null;
  ctaLoading?: boolean;
  engineBudget?: EngineBudgetRecommendation | null;
  fixItResult?: FixItResult | null;
  fixItLoading?: boolean;
  prediction?: PredictionResult | null;
  improvementsLoading?: boolean;
  policyLoading?: boolean;
}

/** Actions — callbacks for user interactions. */
export interface AnalysisActions {
  onShare?: () => void;
  onGenerateBrief?: () => void;
  onAddToSwipeFile?: () => void;
  onCTARewrite?: () => void;
  onNavigateSettings?: () => void;
  onReanalyze?: () => void;
  onCheckPolicies?: () => void;
  onFixIt?: () => void;
  onSelectHistory?: (record: AnalysisRecord) => void;
}

/** Full context shape — data + features + actions. */
export interface AnalysisContextValue {
  data: AnalysisData;
  features: AnalysisFeatures;
  actions: AnalysisActions;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AnalysisCtx = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({
  value,
  children,
}: {
  value: AnalysisContextValue;
  children: ReactNode;
}) {
  return <AnalysisCtx.Provider value={value}>{children}</AnalysisCtx.Provider>;
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisCtx);
  if (!ctx) throw new Error("useAnalysis must be used within <AnalysisProvider>");
  return ctx;
}

/** Convenience hooks for sub-components that only need one slice. */
export function useAnalysisData(): AnalysisData {
  return useAnalysis().data;
}

export function useAnalysisFeatures(): AnalysisFeatures {
  return useAnalysis().features;
}

export function useAnalysisActions(): AnalysisActions {
  return useAnalysis().actions;
}
