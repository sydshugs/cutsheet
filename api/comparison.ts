// api/comparison.ts — Claude: Before/After ad version comparison

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory, sanitizeUserInput } from "./_lib/sanitizeMemory";
import { apiError } from "./_lib/apiError.js";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 10, proLimit: 60, windowSeconds: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("comparison", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { originalScores, improvedScores, originalImprovements, userContext: rawContext, sessionMemory: rawMemory } = req.body ?? {};
  const sessionMemory = sanitizeSessionMemory(rawMemory);
  const userContext = sanitizeSessionMemory(rawContext);
  // Sanitize improvement items — they're AI-generated but return through req.body (untrusted)
  const safeImprovements = (Array.isArray(originalImprovements) ? originalImprovements : [])
    .slice(0, 10)
    .map((imp: unknown) => sanitizeUserInput(String(imp ?? "")))
    .filter(Boolean);
  if (!originalScores || !improvedScores) {
    return res.status(400).json({ error: "originalScores and improvedScores are required" });
  }

  const prompt = `You are comparing two versions of the same ad creative.
The creator received feedback and made improvements.

${userContext ? `<user_context>\n${userContext}\n</user_context>` : ""}
${sessionMemory ? `<session_memory>\n${sessionMemory}\nConsider whether improvement trends are consistent with this user's prior ad performance.\n</session_memory>` : ""}
ORIGINAL VERSION SCORES:
Overall: ${originalScores.overall}/10
Hook: ${originalScores.hook}/10
CTA: ${originalScores.cta}/10
Clarity: ${originalScores.clarity}/10
Production: ${originalScores.production}/10

IMPROVED VERSION SCORES:
Overall: ${improvedScores.overall}/10
Hook: ${improvedScores.hook}/10
CTA: ${improvedScores.cta}/10
Clarity: ${improvedScores.clarity}/10
Production: ${improvedScores.production}/10

IMPROVEMENTS THAT WERE SUGGESTED:
${safeImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}

Based on the score changes, assess which improvements were addressed.
Be honest. If scores dropped, say so.

Return JSON only:
{
  "scoreChange": ${improvedScores.overall - originalScores.overall},
  "metricChanges": { "hook": ${improvedScores.hook - originalScores.hook}, "cta": ${improvedScores.cta - originalScores.cta}, "clarity": ${improvedScores.clarity - originalScores.clarity}, "production": ${improvedScores.production - originalScores.production} },
  "verdict": "significantly_better" | "better" | "same" | "worse",
  "verdictText": "<one honest sentence>",
  "topWin": "<single biggest improvement>",
  "improvementsAddressed": [
    { "improvement": "<original text>", "addressed": true|false, "confidence": "high"|"medium"|"low", "note": "<what changed>" }
  ],
  "remainingWork": ["<what still needs fixing>"]
}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return apiError(res, 'ANALYSIS_FAILED', 500, "Could not extract JSON from Claude response");

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return apiError(res, 'ANALYSIS_FAILED', 500, "JSON.parse failed on Claude response");
  }
  return res.status(200).json({
    scoreChange: Number(parsed.scoreChange) || 0,
    metricChanges: {
      hook: Number(parsed.metricChanges?.hook) || 0,
      cta: Number(parsed.metricChanges?.cta) || 0,
      clarity: Number(parsed.metricChanges?.clarity) || 0,
      production: Number(parsed.metricChanges?.production) || 0,
    },
    verdict: (["significantly_better", "better", "same", "worse"].includes(parsed.verdict)
      ? parsed.verdict : "same"),
    verdictText: String(parsed.verdictText || ""),
    topWin: String(parsed.topWin || ""),
    improvementsAddressed: Array.isArray(parsed.improvementsAddressed) ? parsed.improvementsAddressed : [],
    remainingWork: Array.isArray(parsed.remainingWork) ? parsed.remainingWork : [],
  });
}
