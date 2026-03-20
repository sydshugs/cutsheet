// api/gap-analysis.ts — Claude: Competitor gap analysis (head-to-head ad scores)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory } from "./_lib/sanitizeMemory";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 5, proLimit: 30, windowSeconds: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("gap-analysis", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const {
    yourScores, competitorScores,
    yourImprovements, competitorImprovements,
    yourFileName, competitorFileName,
    platform, format, userContext: rawContext, sessionMemory: rawMemory,
  } = req.body ?? {};
  const sessionMemory = sanitizeSessionMemory(rawMemory);
  const userContext = sanitizeSessionMemory(rawContext);

  if (!yourScores || !competitorScores) {
    return res.status(400).json({ error: "yourScores and competitorScores are required" });
  }

  const prompt = `You are a senior performance marketing strategist.
You have just scored two ad creatives head-to-head.

${userContext || ""}
${sessionMemory ? `\n${sessionMemory}\nFactor in the user's historical score trends when assessing competitive position.\n` : ""}
YOUR AD: ${yourFileName ?? "Your Ad"}
Overall: ${yourScores.overall}/10
Hook: ${yourScores.hook}/10
Clarity: ${yourScores.clarity}/10
CTA: ${yourScores.cta}/10
Production: ${yourScores.production}/10
Key issues: ${(yourImprovements ?? []).slice(0, 3).join(", ") || "none flagged"}

COMPETITOR AD: ${competitorFileName ?? "Competitor Ad"}
Overall: ${competitorScores.overall}/10
Hook: ${competitorScores.hook}/10
Clarity: ${competitorScores.clarity}/10
CTA: ${competitorScores.cta}/10
Production: ${competitorScores.production}/10
Key issues: ${(competitorImprovements ?? []).slice(0, 3).join(", ") || "none flagged"}

Platform: ${platform ?? "all"}
Format: ${format ?? "all"}

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

  const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? process.env.VITE_ANTHROPIC_API_KEY)! });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Could not parse Claude response" });

  const parsed = JSON.parse(jsonMatch[0]);
  return res.status(200).json({
    verdict: (["winning", "losing", "tied"].includes(parsed.verdict) ? parsed.verdict : "tied"),
    scoreDiff: Number(parsed.scoreDiff) || 0,
    winProbability: Math.min(100, Math.max(0, Number(parsed.winProbability) || 50)),
    summary: String(parsed.summary || ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    actionPlan: Array.isArray(parsed.actionPlan)
      ? parsed.actionPlan.sort((a: { priority?: number }, b: { priority?: number }) => (a.priority ?? 3) - (b.priority ?? 3))
      : [],
  });
}
