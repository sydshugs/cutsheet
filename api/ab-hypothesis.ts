// api/ab-hypothesis.ts — Claude: A/B Hypothesis Generator
// Identifies the weakest scoring dimension and generates one specific,
// testable A/B hypothesis with a calibrated lift range.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory, sanitizeAnalysisText } from "./_lib/sanitizeMemory";
import { apiError } from "./_lib/apiError.js";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 10, proLimit: 60, windowSeconds: 60 };

const ALLOWED_METRICS = ["CTR", "CVR", "completion rate", "ROAS"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("ab-hypothesis", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const {
    scores,
    overallScore,
    platform: rawPlatform,
    format: rawFormat,
    niche: rawNiche,
    geminiAnalysis: rawAnalysis,
  } = req.body ? req.body : {};

  if (!scores || typeof scores !== "object") {
    return res.status(400).json({ error: "scores is required" });
  }

  const platform = sanitizeSessionMemory(String(rawPlatform ? rawPlatform : "unknown"));
  const format = rawFormat === "video" ? "video" : "static";
  const niche = sanitizeSessionMemory(String(rawNiche ? rawNiche : "Other"));
  const geminiAnalysis = sanitizeAnalysisText(String(rawAnalysis ? rawAnalysis : ""));

  const scoresJson = JSON.stringify(scores);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    temperature: 0,
    system: `You are a performance creative strategist with deep expertise in Meta, TikTok, and Google ad testing. You generate precise, evidence-based A/B test hypotheses from creative scorecards. Always identify the single weakest dimension and generate exactly one specific, testable hypothesis.

Use these calibrated lift ranges based on the weakest dimension:
- Hook Strength (score <5): 20–35% CTR lift
- CTA Effectiveness (score <5): 15–25% CTR lift
- Message Clarity (score <5): 10–20% CTR lift
- Visual Impact (score <5): 10–18% CTR lift
- Emotional Resonance (score <5): 8–15% CTR lift
- Trust Signals (score <5): 5–12% CVR lift
- Pacing / Retention (video only, score <5): 8–15% completion rate lift
- Any other dimension (score <5): 5–15% CTR lift
- If the weakest dimension scores 5–6.9, halve the lift range.
- If the weakest dimension scores ≥7, use 3–8% CTR lift.

The hypothesis MUST follow this exact format:
"Test [specific control description] vs [specific variant description]. Predicted lift: [X–Y%] [metric]. Why: [one sentence reason tied to score]."

Be specific. Not "test your hook" — "test a 3-second pattern interrupt with bold text overlay vs current lifestyle opener." A creative director should be able to brief from your hypothesis immediately.`,
    messages: [
      {
        role: "user",
        content: `Dimension scores: ${scoresJson}
Overall score: ${overallScore}/10
Platform: ${platform}
Format: ${format}
Niche: ${niche}

Full analysis context:
<user_data>${geminiAnalysis}</user_data>

Identify the single weakest dimension from the scores object. Generate exactly ONE A/B test hypothesis.

Return ONLY valid JSON — no markdown, no preamble, no explanation:
{
  "weakestDimension": "the dimension name exactly as it appears in the scores",
  "weakestScore": <number>,
  "control": "specific description of the current ad element being tested",
  "variant": "specific description of the proposed test variant",
  "metric": "CTR" | "CVR" | "completion rate" | "ROAS",
  "liftMin": <number>,
  "liftMax": <number>,
  "rationale": "one sentence explaining why this dimension needs testing, tied to the score",
  "hypothesis": "Test [control] vs [variant]. Predicted lift: [X–Y%] [metric]. Why: [rationale]."
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) return apiError(res, "ANALYSIS_FAILED", 500, "Empty response from Claude");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return apiError(res, "ANALYSIS_FAILED", 500, "Could not extract JSON from Claude response");

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return apiError(res, "ANALYSIS_FAILED", 500, "JSON.parse failed on Claude response");
  }

  // Runtime validation
  const hypothesis = parsed.hypothesis;
  const liftMin = Number(parsed.liftMin);
  const liftMax = Number(parsed.liftMax);
  const weakestScore = Number(parsed.weakestScore);
  const metric = String(parsed.metric ? parsed.metric : "");

  if (!hypothesis || typeof hypothesis !== "string" || hypothesis.trim().length === 0) {
    return apiError(res, "VALIDATION_FAILED", 500, "hypothesis is empty");
  }
  if (isNaN(liftMin) || isNaN(liftMax) || liftMin >= liftMax) {
    return apiError(res, "VALIDATION_FAILED", 500, "liftMin must be less than liftMax");
  }
  if (isNaN(weakestScore)) {
    return apiError(res, "VALIDATION_FAILED", 500, "weakestScore must be a number");
  }
  if (!ALLOWED_METRICS.includes(metric)) {
    return apiError(res, "VALIDATION_FAILED", 500, "metric must be CTR, CVR, completion rate, or ROAS");
  }

  const result = {
    weakestDimension: String(parsed.weakestDimension ? parsed.weakestDimension : "Unknown"),
    weakestScore: weakestScore,
    control: String(parsed.control ? parsed.control : ""),
    variant: String(parsed.variant ? parsed.variant : ""),
    metric: metric,
    liftMin: liftMin,
    liftMax: liftMax,
    rationale: String(parsed.rationale ? parsed.rationale : ""),
    hypothesis: hypothesis,
  };

  return res.status(200).json(result);
}
