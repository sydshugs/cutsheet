// api/predict-performance.ts — Claude: predictive performance scoring (serverless)
// Takes analysis + scores + context → returns performance prediction ranges

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { safePlatform, safeAdType, safeNiche } from "./_lib/validateInput";
import { sanitizeAnalysisText } from "./_lib/sanitizeMemory";
// Dynamic import — benchmarks.ts is ESM, Vercel bundles API routes as CJS

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
  // Sanitize analysis text — AI-generated but returned through client req.body (untrusted)
  const safeAnalysis = sanitizeAnalysisText(analysisMarkdown);

  if (!safeAnalysis || !scores) {
    return res.status(400).json({ error: "Missing analysisMarkdown or scores" });
  }

  const platformKey = safePlatform(platform);
  const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
    google_display: "Google Display",
    "google display": "Google Display",
    meta: "Meta", facebook: "Meta", instagram: "Instagram",
    tiktok: "TikTok", youtube: "YouTube", google: "Google",
    linkedin: "LinkedIn", twitter: "X/Twitter", x: "X/Twitter",
  };
  const platformLabel = platformKey === "general" ? "Meta" : (PLATFORM_DISPLAY_NAMES[platformKey] ?? platformKey);
  const nicheLabel = safeNiche(niche);
  const adTypeLabel = safeAdType(adType);
  const intentLabel = (typeof intent === "string" && ["conversion", "awareness", "consideration"].includes(intent)) ? intent : "conversion";

  // Niche × platform benchmarks from shared lib — dynamic import for CJS compat
  const { getNicheBenchmark } = await import("../src/lib/benchmarks");
  const nicheBench = getNicheBenchmark(nicheLabel, platformKey);
  let benchmarkBlock: string;
  if (nicheBench) {
    const ctrLine = `${platformLabel} ${nicheLabel} avg CTR: ${nicheBench.ctr.low}–${nicheBench.ctr.high}% (avg ${nicheBench.ctr.avg}%).`;
    const hookLine = nicheBench.hookRate ? ` Avg hook retention: ${nicheBench.hookRate.avg}%.` : "";
    const cpmLine = ` Avg CPM: $${nicheBench.cpm.avg}.`;
    benchmarkBlock = `\nINDUSTRY BENCHMARKS:\n${ctrLine}${hookLine}${cpmLine}`;
  } else if (platformKey === "google_display" || platformKey === "google display") {
    benchmarkBlock = `\nINDUSTRY BENCHMARKS: Google Display Network avg CTR: 0.35–0.60% (avg 0.46%). Set "benchmark" to 0.46 in the JSON response.`;
  } else {
    benchmarkBlock = `\nNote: Use general paid social benchmarks for ${nicheLabel}. Meta avg CTR: 0.9-1.5%. Google Display: 0.35-0.60%.`;
  }

  // Identify weakest dimensions for calibration
  const weakDims = scores
    ? Object.entries(scores as Record<string, number>)
        .filter(([k]) => ["hook", "clarity", "cta", "production"].includes(k))
        .sort(([, a], [, b]) => a - b)
        .slice(0, 2)
        .map(([k, v]) => `${k} (${v}/10)`)
    : [];

  const systemPrompt = `You are a performance marketing analyst specializing in ${nicheLabel} ${adTypeLabel} advertising on ${platformLabel}. You have studied over 100,000 ${platformLabel} ad campaigns in the ${nicheLabel} category.

This ad scored ${scores?.overall ?? "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}. Hook: ${scores?.hook ?? "?"}/10, CTA: ${scores?.cta ?? "?"}/10.

CALIBRATION RULES:
- A hook score of 3/10 → predict retention below 20%. A hook of 8/10 → predict retention above 55%.
- A CTA score of 3/10 → predict CTR in the bottom quartile for ${nicheLabel}. A CTA of 8/10 → top quartile.
- An overall score of 4/10 → fatigue in under 7 days at moderate spend. An 8/10 → 14-21 days.
- Every prediction must cite the specific score that drives it: "CTR predicted at X% vs Y% ${platformLabel} average for ${nicheLabel} because [dimension] scored [N]/10."
- Never guess high to flatter. A weak ad gets weak predictions.`;

  const prompt = `Based on the following creative scorecard, generate a performance prediction for this ${adTypeLabel} ad on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
<analysis>
${safeAnalysis}
</analysis>

Scores: Hook ${scores.hook ?? 0}/10, Clarity ${scores.clarity ?? 0}/10, CTA ${scores.cta ?? 0}/10, Production ${scores.production ?? 0}/10, Overall ${scores.overall ?? 0}/10
Platform: ${platformLabel} | Format: ${adTypeLabel} | Niche: ${nicheLabel} | Intent: ${intentLabel}
${benchmarkBlock}

The user's goal is ${intentLabel === "awareness" ? "brand awareness and reach" : intentLabel === "consideration" ? "engagement and click-through rate" : "direct response conversion and ROAS"}.

Predict:
1. CTR Range — for this specific ${nicheLabel} ${adTypeLabel} ad on ${platformLabel}. Anchor against the benchmarks above.
2. CVR Potential — if this ad drives to a typical ${nicheLabel} landing page on ${platformLabel}.
3. Hook Retention (video only) — estimated % who watch past 3 seconds on ${platformLabel}. ${platformLabel === "TikTok" ? "TikTok users decide in 0.5-1s." : platformLabel === "YouTube" ? "YouTube users can skip at 5s." : "Meta feed users decide in 1-2s."}
4. Fatigue Timeline — at moderate spend ($300-500/day on ${platformLabel}), estimated days before fatigue for ${nicheLabel}.
5. Confidence Level and reason — cite specific scores and creative signals.
6. Top 2 signals boosting performance — be specific to what you saw in the analysis.
7. Top 2 signals limiting performance — reference the weakest scores.

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

Return ONLY valid JSON, no markdown fencing. Be calibrated — a hook score of 3/10 should predict low retention, not moderate.`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
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
