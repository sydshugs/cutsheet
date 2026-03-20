// api/predict-performance.ts — Claude: predictive performance scoring (serverless)
// Takes analysis + scores + context → returns performance prediction ranges

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 10, proLimit: 50, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("predict-performance", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { analysisMarkdown, scores, platform, adType, niche, intent } = req.body ?? {};

  if (!analysisMarkdown || !scores) {
    return res.status(400).json({ error: "Missing analysisMarkdown or scores" });
  }

  const platformLabel = platform ?? "Meta";
  const nicheLabel = niche ?? "general";
  const adTypeLabel = adType ?? "video";
  const intentLabel = intent ?? "conversion";

  const prompt = `You are a performance marketing analyst who has studied the results of over 100,000 ad campaigns. Based on the following creative scorecard data, generate a performance prediction.

Scorecard & Analysis:
${analysisMarkdown}

Scores: Hook ${scores.hook ?? 0}/10, Clarity ${scores.clarity ?? 0}/10, CTA ${scores.cta ?? 0}/10, Production ${scores.production ?? 0}/10, Overall ${scores.overall ?? 0}/10
Platform: ${platformLabel} | Format: ${adTypeLabel} | Niche: ${nicheLabel} | Intent: ${intentLabel}

Predict:
1. CTR Range — estimated click-through rate for this creative on ${platformLabel}. Include benchmark for ${nicheLabel}/${platformLabel}.
2. CVR Potential — if this ad drives to a typical ${nicheLabel} landing page.
3. Hook Retention (video only) — estimated % who watch past 3 seconds.
4. Fatigue Timeline — at moderate spend ($300-500/day), estimated days before fatigue.
5. Confidence Level and reason.
6. Top 2 signals boosting performance.
7. Top 2 signals limiting performance.

Return as JSON:
{
  "ctr": { "low": number, "high": number, "benchmark": number, "vsAvg": "above" | "at" | "below" },
  "cvr": { "low": number, "high": number },
  "hookRetention": { "low": number, "high": number } | null,
  "fatigueDays": { "low": number, "high": number },
  "confidence": "Low" | "Medium" | "High",
  "confidenceReason": string,
  "positiveSignals": [string, string],
  "negativeSignals": [string, string]
}

Return ONLY valid JSON, no markdown fencing. Frame all predictions as ranges. Be calibrated — avoid extremes unless scores justify them.`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({
        ctr: { low: 0, high: 0, benchmark: 0, vsAvg: "at" },
        cvr: { low: 0, high: 0 },
        hookRetention: null,
        fatigueDays: { low: 0, high: 0 },
        confidence: "Low",
        confidenceReason: "Could not parse prediction response.",
        positiveSignals: [],
        negativeSignals: [],
      });
    }
  } catch (err) {
    console.error("predict-performance error:", err);
    return res.status(500).json({ error: "Performance prediction failed" });
  }
}
