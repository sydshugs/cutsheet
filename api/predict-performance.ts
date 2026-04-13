// api/predict-performance.ts — Claude: predictive performance scoring (serverless)
// Takes analysis + scores + context → returns performance prediction ranges

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { safePlatform, safeAdType, safeNiche } from "./_lib/validateInput";
import { sanitizeAnalysisText } from "./_lib/sanitizeMemory";

import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";

// ── Inline benchmark data (avoids ESM import issue in Vercel CJS bundle) ──────
// SYNC WARNING: This must match src/lib/benchmarks.ts exactly.
// Last synced: 2026-04-11. Verified against published sources April 2026.
interface NicheBenchmark {
  ctr: { low: number; avg: number; high: number };
  hookRate: { avg: number } | null;
  cpm: { avg: number };
}

const NICHE_BENCHMARKS: Record<string, Record<string, NicheBenchmark>> = {
  "Ecommerce / DTC": {
    Meta:    { ctr: { low: 1.5, avg: 2.1, high: 3.2 }, hookRate: { avg: 32 }, cpm: { avg: 14 } },
    TikTok:  { ctr: { low: 0.8, avg: 1.4, high: 2.5 }, hookRate: { avg: 28 }, cpm: { avg: 9 } },
    Google:  { ctr: { low: 2.0, avg: 3.5, high: 6.0 }, hookRate: null,        cpm: { avg: 38 } },
    YouTube: { ctr: { low: 0.3, avg: 0.6, high: 1.2 }, hookRate: { avg: 45 }, cpm: { avg: 11 } },
    general: { ctr: { low: 1.2, avg: 1.9, high: 3.0 }, hookRate: { avg: 30 }, cpm: { avg: 13 } },
  },
  SaaS: {
    Meta:    { ctr: { low: 0.7, avg: 1.0, high: 1.8 }, hookRate: { avg: 22 }, cpm: { avg: 22 } },
    TikTok:  { ctr: { low: 0.4, avg: 0.8, high: 1.5 }, hookRate: { avg: 20 }, cpm: { avg: 12 } },
    Google:  { ctr: { low: 2.5, avg: 4.2, high: 7.5 }, hookRate: null,        cpm: { avg: 55 } },
    YouTube: { ctr: { low: 0.2, avg: 0.4, high: 0.9 }, hookRate: { avg: 35 }, cpm: { avg: 18 } },
    general: { ctr: { low: 0.6, avg: 0.9, high: 1.6 }, hookRate: { avg: 21 }, cpm: { avg: 26 } },
  },
  Agency: {
    Meta:    { ctr: { low: 0.9, avg: 1.4, high: 2.5 }, hookRate: { avg: 27 }, cpm: { avg: 16 } },
    TikTok:  { ctr: { low: 0.6, avg: 1.1, high: 2.0 }, hookRate: { avg: 25 }, cpm: { avg: 10 } },
    Google:  { ctr: { low: 2.2, avg: 3.8, high: 6.5 }, hookRate: null,        cpm: { avg: 42 } },
    YouTube: { ctr: { low: 0.25, avg: 0.5, high: 1.0 }, hookRate: { avg: 40 }, cpm: { avg: 13 } },
    general: { ctr: { low: 0.8, avg: 1.3, high: 2.2 }, hookRate: { avg: 26 }, cpm: { avg: 17 } },
  },
  "Creator / Content": {
    Meta:    { ctr: { low: 0.5, avg: 0.9, high: 1.8 }, hookRate: { avg: 35 }, cpm: { avg: 8 } },
    TikTok:  { ctr: { low: 1.0, avg: 2.0, high: 4.0 }, hookRate: { avg: 42 }, cpm: { avg: 6 } },
    YouTube: { ctr: { low: 0.4, avg: 0.9, high: 2.0 }, hookRate: { avg: 55 }, cpm: { avg: 7 } },
    general: { ctr: { low: 0.7, avg: 1.4, high: 2.8 }, hookRate: { avg: 40 }, cpm: { avg: 7 } },
  },
  "Health & Wellness": {
    Meta:    { ctr: { low: 1.4, avg: 2.2, high: 3.5 }, hookRate: { avg: 30 }, cpm: { avg: 16 } },
    TikTok:  { ctr: { low: 0.9, avg: 1.6, high: 3.0 }, hookRate: { avg: 35 }, cpm: { avg: 8 } },
    YouTube: { ctr: { low: 0.3, avg: 0.5, high: 1.1 }, hookRate: { avg: 42 }, cpm: { avg: 12 } },
    Google:  { ctr: { low: 1.8, avg: 3.2, high: 5.5 }, hookRate: null,        cpm: { avg: 35 } },
    general: { ctr: { low: 1.2, avg: 1.8, high: 3.0 }, hookRate: { avg: 32 }, cpm: { avg: 14 } },
  },
  "Finance / Fintech": {
    Meta:    { ctr: { low: 0.5, avg: 0.8, high: 1.4 }, hookRate: { avg: 18 }, cpm: { avg: 28 } },
    TikTok:  { ctr: { low: 0.3, avg: 0.6, high: 1.2 }, hookRate: { avg: 16 }, cpm: { avg: 14 } },
    YouTube: { ctr: { low: 0.15, avg: 0.35, high: 0.7 }, hookRate: { avg: 30 }, cpm: { avg: 22 } },
    Google:  { ctr: { low: 2.0, avg: 3.6, high: 6.0 }, hookRate: null,        cpm: { avg: 65 } },
    general: { ctr: { low: 0.5, avg: 0.8, high: 1.3 }, hookRate: { avg: 18 }, cpm: { avg: 30 } },
  },
  "Food & Beverage": {
    Meta:    { ctr: { low: 1.0, avg: 1.6, high: 2.5 }, hookRate: { avg: 33 }, cpm: { avg: 11 } },
    TikTok:  { ctr: { low: 1.2, avg: 2.2, high: 4.0 }, hookRate: { avg: 40 }, cpm: { avg: 7 } },
    YouTube: { ctr: { low: 0.3, avg: 0.7, high: 1.5 }, hookRate: { avg: 48 }, cpm: { avg: 9 } },
    Google:  { ctr: { low: 1.5, avg: 2.8, high: 4.5 }, hookRate: null,        cpm: { avg: 30 } },
    general: { ctr: { low: 1.0, avg: 1.8, high: 3.2 }, hookRate: { avg: 36 }, cpm: { avg: 11 } },
  },
  "Real Estate": {
    Meta:    { ctr: { low: 0.7, avg: 1.1, high: 1.9 }, hookRate: { avg: 22 }, cpm: { avg: 20 } },
    TikTok:  { ctr: { low: 0.5, avg: 0.9, high: 1.8 }, hookRate: { avg: 25 }, cpm: { avg: 11 } },
    YouTube: { ctr: { low: 0.2, avg: 0.45, high: 0.9 }, hookRate: { avg: 38 }, cpm: { avg: 15 } },
    Google:  { ctr: { low: 2.5, avg: 4.5, high: 8.0 }, hookRate: null,        cpm: { avg: 45 } },
    general: { ctr: { low: 0.7, avg: 1.2, high: 2.0 }, hookRate: { avg: 24 }, cpm: { avg: 20 } },
  },
};

const NICHE_ALIASES: Record<string, string> = {
  "ecommerce": "Ecommerce / DTC", "ecommerce / dtc": "Ecommerce / DTC",
  "e-commerce": "Ecommerce / DTC", "dtc": "Ecommerce / DTC",
  "d2c": "Ecommerce / DTC", "direct to consumer": "Ecommerce / DTC",
  "saas": "SaaS", "software": "SaaS", "b2b": "SaaS", "b2b saas": "SaaS", "tech": "SaaS",
  "agency": "Agency",
  "creator / content": "Creator / Content", "creator": "Creator / Content",
  "content": "Creator / Content", "content creator": "Creator / Content",
  "health": "Health & Wellness", "health & wellness": "Health & Wellness",
  "wellness": "Health & Wellness", "fitness": "Health & Wellness", "supplements": "Health & Wellness",
  "finance": "Finance / Fintech", "finance / fintech": "Finance / Fintech",
  "fintech": "Finance / Fintech", "banking": "Finance / Fintech", "insurance": "Finance / Fintech",
  "food": "Food & Beverage", "food & beverage": "Food & Beverage",
  "beverage": "Food & Beverage", "restaurant": "Food & Beverage", "cpg": "Food & Beverage",
  "real estate": "Real Estate", "realestate": "Real Estate",
  "property": "Real Estate", "housing": "Real Estate",
};

const PLATFORM_ALIASES: Record<string, string> = {
  meta: "Meta", facebook: "Meta", instagram: "Meta",
  tiktok: "TikTok", google: "Google", "google display": "Google", youtube: "YouTube",
};

function getNicheBenchmark(niche: string | null | undefined, platform: string | null | undefined): NicheBenchmark | null {
  if (!niche) return null;
  const lower = niche.toLowerCase().trim();
  const nicheKey = NICHE_BENCHMARKS[niche] ? niche : (NICHE_ALIASES[lower] ?? null);
  if (!nicheKey) return null;
  const nicheData = NICHE_BENCHMARKS[nicheKey];
  const platLower = (platform ?? "").toLowerCase().trim();
  const platKey = PLATFORM_ALIASES[platLower] ?? platform ?? "general";
  return nicheData[platKey] ?? nicheData["general"] ?? null;
}

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 10, proLimit: 50, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

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
5. Confidence Level — how reliable is this prediction?
Rules:
- 'High' = scores are clear-cut (very high 8+ or very low 3-), large sample of benchmark data for this platform+niche, strong signal in the creative.
- 'Medium' = scores are mid-range (4-7), mixed signals, some dimensions strong and others weak, or limited benchmark data for this niche.
- 'Low' = unusual creative format, niche with sparse benchmark data, or contradictory signals (e.g. great hook but no CTA).
Confidence reflects prediction RELIABILITY, not ad quality.
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
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      const { validatePrediction, validateConfidence } = await import("../src/utils/scoreGuardrails.js");
      const validatedPrediction = validatePrediction(parsed, scores);
      validatedPrediction.confidence = validateConfidence(parsed.confidence, scores);
      logApiUsage({ userId: user.id, endpoint: "predict-performance", statusCode: 200, responseTimeMs: Date.now() - start, platform: platformLabel, niche: nicheLabel, format: adTypeLabel });
      return res.status(200).json(validatedPrediction);
    } catch {
      logApiUsage({ userId: user.id, endpoint: "predict-performance", statusCode: 200, responseTimeMs: Date.now() - start, platform: platformLabel, niche: nicheLabel, format: adTypeLabel, errorCode: "PARSE_FALLBACK" });
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
    logApiUsage({ userId: user.id, endpoint: "predict-performance", statusCode: 500, responseTimeMs: Date.now() - start, errorCode: "ANALYSIS_FAILED" });
    return apiError(res, 'ANALYSIS_FAILED', 500,
      `[predict-performance] ${err instanceof Error ? err.message : String(err)}`);
  }
}
