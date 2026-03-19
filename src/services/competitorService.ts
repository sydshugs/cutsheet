// competitorService.ts — Competitor gap analysis: two ads head-to-head

import { analyzeVideo, type AnalysisResult } from "./analyzerService";
import { getUserContext, formatUserContextBlock } from "./userContextService";
import { supabase } from "../lib/supabase";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface GapItem {
  metric: string;
  yourScore: number;
  competitorScore: number;
  diff: number;
  insight: string;
}

export interface ActionItem {
  priority: 1 | 2 | 3;
  action: string;
  impact: "high" | "medium" | "low";
  effort: "quick" | "medium" | "heavy";
  metric: string;
}

export interface GapAnalysis {
  verdict: "winning" | "losing" | "tied";
  scoreDiff: number;
  strengths: GapItem[];
  weaknesses: GapItem[];
  actionPlan: ActionItem[];
  winProbability: number;
  summary: string;
}

export interface CompetitorResult {
  your: AnalysisResult;
  competitor: AnalysisResult;
  gap: GapAnalysis;
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

export async function analyzeCompetitor(
  yourFile: File,
  competitorFile: File,
  apiKey: string,
  platform: string,
  format: string,
  onStatusChange: (msg: string) => void
): Promise<CompetitorResult> {
  const contextPrefix =
    platform !== "all"
      ? `Analyzing as ${format} ad for ${platform}.`
      : undefined;

  const userCtx = await getUserContext();
  const userContext = formatUserContextBlock(userCtx);

  onStatusChange("Analyzing both ads...");

  const [yourResult, competitorResult] = await Promise.all([
    analyzeVideo(yourFile, apiKey, undefined, contextPrefix, userContext),
    analyzeVideo(competitorFile, apiKey, undefined, contextPrefix, userContext),
  ]);

  onStatusChange("Running gap analysis...");

  const gap = await generateGapAnalysis(
    yourResult,
    competitorResult,
    platform,
    format,
    userContext,
    yourFile.name,
    competitorFile.name
  );

  return { your: yourResult, competitor: competitorResult, gap };
}

// ─── GAP ANALYSIS ───────────────────────────────────────────────────────────

async function generateGapAnalysis(
  your: AnalysisResult,
  competitor: AnalysisResult,
  platform: string,
  format: string,
  userContext: string,
  yourFileName: string,
  competitorFileName: string
): Promise<GapAnalysis> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const yourScores = your.scores ?? { overall: 0, hook: 0, clarity: 0, cta: 0, production: 0 };
  const compScores = competitor.scores ?? { overall: 0, hook: 0, clarity: 0, cta: 0, production: 0 };

  const response = await fetch("/api/gap-analysis", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      yourScores,
      competitorScores: compScores,
      yourImprovements: your.improvements,
      competitorImprovements: competitor.improvements,
      yourFileName,
      competitorFileName,
      platform,
      format,
      userContext,
    }),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const secs = (data as { resetAt?: string }).resetAt
      ? Math.ceil((new Date((data as { resetAt: string }).resetAt).getTime() - Date.now()) / 1000)
      : 60;
    throw new Error(`RATE_LIMITED:${secs}`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `API error ${response.status}`);
  }

  return response.json() as Promise<GapAnalysis>;
}
