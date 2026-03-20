// api/fix-it.ts — Claude: "Fix It For Me" full ad rewrite (serverless)
// Takes cached analysis + context → returns structured rewrite with predicted improvements

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 5, proLimit: 30, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("fix-it", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { analysisMarkdown, platform, niche, intent, adType, scores } = req.body ?? {};

  if (!analysisMarkdown) {
    return res.status(400).json({ error: "Missing analysisMarkdown" });
  }

  const prompt = `You are a world-class performance creative director. A user's ad received the following scorecard:

${analysisMarkdown}

Platform: ${platform ?? "unknown"} | Niche: ${niche ?? "unknown"} | Intent: ${intent ?? "unknown"} | Format: ${adType ?? "video"}

${scores ? `Scores: Hook ${scores.hook}/10 | Clarity ${scores.clarity}/10 | CTA ${scores.cta}/10 | Production ${scores.production}/10 | Overall ${scores.overall}/10` : ""}

Your job is to FIX this ad, not just critique it. Produce a complete rewrite that directly addresses every weakness.

Return a JSON object with these exact keys:
{
  "rewrittenHook": { "copy": "<new hook text/script>", "reasoning": "<1 sentence why this is stronger>" },
  "revisedBody": "<full rewrite with **bold** on every changed part>",
  "newCTA": { "copy": "<rewritten CTA>", "placement": "<where to put it>" },
  "textOverlays": [{ "timestamp": "<when>", "copy": "<text>", "placement": "<where>" }],
  "predictedImprovements": [{ "dimension": "<metric name>", "oldScore": <number>, "newScore": <number>, "reason": "<why>" }],
  "editorNotes": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}

Return ONLY valid JSON, no markdown fencing.`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({
        rewrittenHook: { copy: "", reasoning: "" },
        revisedBody: "",
        newCTA: { copy: "", placement: "" },
        textOverlays: [],
        predictedImprovements: [],
        editorNotes: ["Could not parse rewrite response."],
      });
    }
  } catch (err) {
    console.error("fix-it error:", err);
    return res.status(500).json({ error: "Fix-it rewrite failed" });
  }
}
