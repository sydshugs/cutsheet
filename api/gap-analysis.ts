// api/gap-analysis.ts — Claude: Competitor gap analysis (head-to-head ad scores)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory, sanitizeUserInput } from "./_lib/sanitizeMemory";

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
  // Sanitize short user-supplied strings that get interpolated into the prompt
  const safeYourFileName = sanitizeUserInput(yourFileName ?? "Your Ad") || "Your Ad";
  const safeCompetitorFileName = sanitizeUserInput(competitorFileName ?? "Competitor Ad") || "Competitor Ad";
  // Sanitize improvement items — AI-generated but returned through client req.body (untrusted)
  const safeYourImprovements = (Array.isArray(yourImprovements) ? yourImprovements : [])
    .slice(0, 5)
    .map((imp: unknown) => sanitizeUserInput(String(imp ?? "")))
    .filter(Boolean);
  const safeCompetitorImprovements = (Array.isArray(competitorImprovements) ? competitorImprovements : [])
    .slice(0, 5)
    .map((imp: unknown) => sanitizeUserInput(String(imp ?? "")))
    .filter(Boolean);

  if (!yourScores || !competitorScores) {
    return res.status(400).json({ error: "yourScores and competitorScores are required" });
  }

  const nicheLabel = userContext?.match(/niche[:\s]+(\w[\w\s/&-]*)/i)?.[1]?.trim() || "performance marketing";
  const intentLabel = userContext?.match(/intent[:\s]+(\w[\w\s-]*)/i)?.[1]?.trim() || "conversion";
  const platformLabel = platform || "paid social";

  // Identify user's weakest dimensions for targeted action plans
  const userWeakDims = ["hook", "clarity", "cta", "production"]
    .map(d => ({ dim: d, score: (yourScores as Record<string, number>)?.[d] ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const systemPrompt = `You are a competitive intelligence analyst specializing in ${nicheLabel} advertising on ${platformLabel}. You don't sugarcoat — if the user's ad is losing, say so clearly and explain exactly what the competitor does better for ${nicheLabel} audiences.

The user's weakest dimensions are: ${userWeakDims.map(d => `${d.dim} (${d.score}/10)`).join(", ")}. Every action plan item must be specific and steal-worthy — not "improve your hook" but "steal the competitor's [specific technique] and adapt it for ${nicheLabel} on ${platformLabel}". Rank actions by impact on the user's weakest dimensions first.`;

  const prompt = `You have scored two ${nicheLabel} ad creatives head-to-head on ${platformLabel}.

${userContext ? `<user_context>\n${userContext}\n</user_context>` : ""}
${sessionMemory ? `<session_memory>\n${sessionMemory}\nFactor in the user's historical score trends when assessing competitive position.\n</session_memory>` : ""}
YOUR AD: ${safeYourFileName}
Overall: ${yourScores.overall}/10
Hook: ${yourScores.hook}/10
Clarity: ${yourScores.clarity}/10
CTA: ${yourScores.cta}/10
Production: ${yourScores.production}/10
Key issues: ${safeYourImprovements.slice(0, 3).join(", ") || "none flagged"}

COMPETITOR AD: ${safeCompetitorFileName}
Overall: ${competitorScores.overall}/10
Hook: ${competitorScores.hook}/10
Clarity: ${competitorScores.clarity}/10
CTA: ${competitorScores.cta}/10
Production: ${competitorScores.production}/10
Key issues: ${safeCompetitorImprovements.slice(0, 3).join(", ") || "none flagged"}

USER'S WEAKEST DIMENSIONS: ${userWeakDims.map(d => `${d.dim} (${d.score}/10)`).join(", ")}
Platform: ${platformLabel}
Format: ${format ?? "all"}
User's goal: ${intentLabel}

IMPORTANT: Do not mention the user's role, niche, or platform explicitly.
Use the context to inform your analysis but never reference it directly.

SCORING RULES — DETERMINISTIC:
Apply criteria mechanically. For the same input, always produce the same score.
Scores must be integers 1-10. No decimals. No ranges.
1-3: Significant problems. 4-6: Functional but weak. 7-8: Solid. 9-10: Excellent.

Return JSON only — no prose, no preamble:
{
  "verdict": "winning" | "losing" | "tied",
  "scoreDiff": <your overall minus competitor overall>,
  "winProbability": <0-100, honest probability your ad outperforms on ${platformLabel} for ${intentLabel}>,
  "summary": "<one paragraph honest assessment — mention specific scores, explain what the gap means for ${intentLabel} on ${platformLabel}>",
  "strengths": [
    {
      "metric": "<Hook | CTA | Clarity | Production>",
      "yourScore": <number>,
      "competitorScore": <number>,
      "diff": <positive number>,
      "insight": "<why this advantage matters for ${intentLabel} on ${platformLabel}>"
    }
  ],
  "weaknesses": [
    {
      "metric": "<Hook | CTA | Clarity | Production>",
      "yourScore": <number>,
      "competitorScore": <number>,
      "diff": <negative number>,
      "insight": "<what the competitor does better and why it matters for ${intentLabel}>"
    }
  ],
  "actionPlan": [
    {
      "priority": 1 | 2 | 3,
      "action": "<steal-this pattern from competitor — specific technique, not generic advice. Format: 'Steal [competitor's specific technique] for your [weakest dimension] because [why it works on ${platformLabel}]'>",
      "impact": "high" | "medium" | "low",
      "effort": "quick" | "medium" | "heavy",
      "metric": "<which score this improves — prioritize ${userWeakDims[0]?.dim ?? "hook"} and ${userWeakDims[1]?.dim ?? "cta"} first>"
    }
  ]
}

Rules:
- strengths: only metrics where your score > competitor score
- weaknesses: only metrics where competitor score > your score
- tied metrics: omit from both arrays
- actionPlan: 3-5 items, ordered by impact on user's weakest dimensions (${userWeakDims.map(d => d.dim).join(", ")}) first
- winProbability: honest, calibrated for ${platformLabel} ${intentLabel} campaigns
- summary: mention specific scores, be direct about the gap
- Every action must be a steal-this pattern from the competitor, not generic advice`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Could not parse Claude response" });

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return res.status(500).json({ error: "Failed to parse AI response — please try again" });
  }
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
