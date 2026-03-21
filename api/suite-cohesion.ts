// api/suite-cohesion.ts — Claude: Display ad suite consistency analysis

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory } from "./_lib/sanitizeMemory";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 5, proLimit: 20, windowSeconds: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("suite-cohesion", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { banners, userContext: rawContext, sessionMemory: rawMemory } = req.body ?? {};
  const sessionMemory = sanitizeSessionMemory(rawMemory);
  const userContext = sanitizeSessionMemory(rawContext);
  if (!Array.isArray(banners) || banners.length < 2) {
    return res.status(400).json({ error: "At least 2 banners are required" });
  }

  const bannerList = banners
    .map(
      (b: { format: string; fileName: string; overallScore: number; improvements?: string[] }, i: number) =>
        `${i + 1}. ${b.format} — ${b.fileName} — Score: ${b.overallScore}/10\n   Issues: ${b.improvements?.slice(0, 3).join(", ") || "none"}`
    )
    .join("\n");

  const systemPrompt = `You are a display advertising creative director who has reviewed thousands of IAB banner suites. You know that consistency across sizes is what separates professional campaigns from amateur ones. You evaluate against real campaign standards — not just whether files exist, but whether they function as a cohesive campaign that builds brand recognition across placements.`;

  const prompt = `You are reviewing a full banner ad suite for campaign consistency.

${userContext || ""}
${sessionMemory ? `\n${sessionMemory}\nIf this user's prior ads share consistency issues with this suite, flag the pattern.\n` : ""}
A display ad suite must be consistent across all sizes: same brand identity, same headline/offer, same CTA, same visual style.

BANNERS IN THIS SUITE:
${bannerList}

Analyze for:
1. Brand consistency — same logo/colors/fonts across sizes?
2. Message consistency — same headline/offer across sizes?
3. Visual consistency — do all sizes feel like the same campaign?
4. CTA consistency — same call to action everywhere?
5. Format coverage — key standard formats missing?

Standard IAB suite: 728x90, 300x250, 160x600, 320x50. Missing formats should be flagged.

IMPORTANT: Do not mention the user's role, niche, or platform explicitly.

Return JSON only — no prose:
{
  "suiteScore": <1-10>,
  "brandConsistency": <1-10>,
  "messageConsistency": <1-10>,
  "visualConsistency": <1-10>,
  "ctaConsistency": <1-10>,
  "verdict": "<one honest sentence about the suite overall>",
  "strongestBanner": "<format name of best performer, e.g. '300x250 Medium Rectangle'>",
  "weakestBanner": "<format name of worst performer>",
  "strengths": ["<2-3 things the suite does well>"],
  "issues": [
    { "severity": "critical" | "warning" | "note", "issue": "<specific, name formats>", "affectedFormats": ["<format>"], "fix": "<specific, actionable>" }
  ],
  "recommendations": ["<3 prioritized actions>"],
  "missingFormats": ["<standard formats not present>"]
}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
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
    suiteScore: Number(parsed.suiteScore) || 5,
    brandConsistency: Number(parsed.brandConsistency) || 5,
    messageConsistency: Number(parsed.messageConsistency) || 5,
    visualConsistency: Number(parsed.visualConsistency) || 5,
    ctaConsistency: Number(parsed.ctaConsistency) || 5,
    verdict: String(parsed.verdict ?? ""),
    strongestBanner: String(parsed.strongestBanner ?? ""),
    weakestBanner: String(parsed.weakestBanner ?? ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    missingFormats: Array.isArray(parsed.missingFormats) ? parsed.missingFormats : [],
  });
}
