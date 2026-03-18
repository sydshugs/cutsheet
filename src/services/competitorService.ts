// competitorService.ts — Competitor gap analysis: two ads head-to-head

import Anthropic from "@anthropic-ai/sdk";
import { analyzeVideo, type AnalysisResult } from "./analyzerService";
import { getUserContext, formatUserContextBlock } from "./userContextService";

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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_ANTHROPIC_API_KEY");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const yourScores = your.scores ?? { overall: 0, hook: 0, clarity: 0, cta: 0, production: 0 };
  const compScores = competitor.scores ?? { overall: 0, hook: 0, clarity: 0, cta: 0, production: 0 };

  const prompt = `You are a senior performance marketing strategist.
You have just scored two ad creatives head-to-head.

${userContext}

YOUR AD: ${yourFileName}
Overall: ${yourScores.overall}/10
Hook: ${yourScores.hook}/10
Clarity: ${yourScores.clarity}/10
CTA: ${yourScores.cta}/10
Production: ${yourScores.production}/10
Key issues: ${your.improvements?.slice(0, 3).join(", ") || "none flagged"}

COMPETITOR AD: ${competitorFileName}
Overall: ${compScores.overall}/10
Hook: ${compScores.hook}/10
Clarity: ${compScores.clarity}/10
CTA: ${compScores.cta}/10
Production: ${compScores.production}/10
Key issues: ${competitor.improvements?.slice(0, 3).join(", ") || "none flagged"}

Platform: ${platform}
Format: ${format}

IMPORTANT: Do not mention the user's role, niche, or platform explicitly.
Use the context to inform your analysis but never reference it directly.

Return JSON only — no prose, no preamble:
{
  "verdict": "winning" | "losing" | "tied",
  "scoreDiff": <your overall minus competitor overall>,
  "winProbability": <0-100, honest probability your ad outperforms>,
  "summary": "<one paragraph honest assessment, mention specific scores>",
  "strengths": [
    {
      "metric": "<Hook | CTA | Clarity | Production>",
      "yourScore": <number>,
      "competitorScore": <number>,
      "diff": <positive number>,
      "insight": "<one sentence, specific, why this matters>"
    }
  ],
  "weaknesses": [
    {
      "metric": "<Hook | CTA | Clarity | Production>",
      "yourScore": <number>,
      "competitorScore": <number>,
      "diff": <negative number>,
      "insight": "<one sentence, specific, what competitor does better>"
    }
  ],
  "actionPlan": [
    {
      "priority": 1 | 2 | 3,
      "action": "<specific, actionable, one sentence — not generic>",
      "impact": "high" | "medium" | "low",
      "effort": "quick" | "medium" | "heavy",
      "metric": "<which score this improves>"
    }
  ]
}

Rules:
- strengths: only metrics where your score > competitor score
- weaknesses: only metrics where competitor score > your score
- tied metrics: omit from both arrays
- actionPlan: 3-5 items, ordered by priority (1 = most important)
- winProbability: honest, not flattering
- summary: mention specific scores, be direct about the gap`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid gap analysis response");

  const parsed = JSON.parse(jsonMatch[0]) as GapAnalysis;

  // Normalize
  return {
    verdict: (["winning", "losing", "tied"].includes(parsed.verdict) ? parsed.verdict : "tied") as GapAnalysis["verdict"],
    scoreDiff: Number(parsed.scoreDiff) || 0,
    winProbability: Math.min(100, Math.max(0, Number(parsed.winProbability) || 50)),
    summary: String(parsed.summary || ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    actionPlan: Array.isArray(parsed.actionPlan)
      ? parsed.actionPlan.sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3))
      : [],
  };
}
