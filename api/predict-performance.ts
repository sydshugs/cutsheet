// api/predict-performance.ts — Claude: predictive performance scoring (serverless)
// Takes analysis + scores + context → returns performance prediction ranges

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { safePlatform, safeAdType, safeNiche } from "./_lib/validateInput";
import { sanitizeAnalysisText } from "./_lib/sanitizeMemory";

import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";
import { getNicheBenchmark, NICHE_BENCHMARKS } from "./_lib/benchmarks";

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

  const { analysisMarkdown, scores, platform, adType, niche, intent, isOrganic: rawIsOrganic } = req.body != null ? req.body : {};
  const isOrganic = rawIsOrganic === true;
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
  const _plat = PLATFORM_DISPLAY_NAMES[platformKey];
  const platformLabel = platformKey === "general" ? "Meta" : (_plat !== undefined && _plat !== null ? _plat : platformKey);
  const nicheLabel = safeNiche(niche);
  const adTypeLabel = safeAdType(adType);
  const intentLabel = (typeof intent === "string" && ["conversion", "awareness", "consideration"].includes(intent)) ? intent : "conversion";

  const nicheBench = getNicheBenchmark(nicheLabel, platformKey);
  let benchmarkBlock: string;
  if (isOrganic) {
    // Organic benchmarks are platform-level rules of thumb — no niche-level CTR data applies.
    benchmarkBlock = `\nORGANIC BENCHMARKS (${platformLabel}):
- Top-quartile save rate on ${platformLabel} for ${nicheLabel} organic content: 1.5-4%. Below 0.3% is weak, above 4% is viral territory.
- Top-quartile share rate on ${platformLabel}: 0.5-2%. Below 0.1% is weak, above 2% is viral territory.
- Completion past 3s: 40-60% is typical, <25% is weak, >75% is strong.
- Creator posting rhythm (days between posts to maintain momentum): 2-4 days on TikTok/Reels/Shorts, 3-7 days on Instagram/Pinterest, 5-10 days on Meta/Facebook.`;
  } else if (nicheBench) {
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

  const systemPrompt = isOrganic
    ? `You are an organic content strategist who has analyzed over 100,000 ${platformLabel} organic posts in the ${nicheLabel} category. You predict organic performance — save rate, share rate, completion, rewatch likelihood, algorithm fit — NOT advertising metrics.

This post scored ${scores?.overall != null ? scores.overall : "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}. Hook: ${scores?.hook != null ? scores.hook : "?"}/10, Shareability & Rewatch: ${scores?.cta != null ? scores.cta : "?"}/10.

CALIBRATION RULES:
- A hook score of 3/10 → predict save rate below 0.3% and completion below 25%. A hook of 8/10 → predict save rate above 2% and completion above 60%.
- A shareability score of 3/10 → predict share rate in the bottom quartile for organic ${nicheLabel} on ${platformLabel}. A shareability of 8/10 → top quartile.
- An overall score of 4/10 → creator should post again in 5-7 days to rebuild momentum. An 8/10 → 2-4 days keeps the wave.
- Every prediction must cite the specific score that drives it: "Save rate predicted at X% because [dimension] scored [N]/10."
- Never guess high to flatter. Weak organic content gets weak predictions.
- You never predict CTR, CPM, CPC, CVR, ROAS, or any advertising-only metric. You never suggest adding CTAs, offers, or conversion tactics.`
    : `You are a performance marketing analyst specializing in ${nicheLabel} ${adTypeLabel} advertising on ${platformLabel}. You have studied over 100,000 ${platformLabel} ad campaigns in the ${nicheLabel} category.

This ad scored ${scores?.overall != null ? scores.overall : "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}. Hook: ${scores?.hook != null ? scores.hook : "?"}/10, CTA: ${scores?.cta != null ? scores.cta : "?"}/10.

CALIBRATION RULES:
- A hook score of 3/10 → predict retention below 20%. A hook of 8/10 → predict retention above 55%.
- A CTA score of 3/10 → predict CTR in the bottom quartile for ${nicheLabel}. A CTA of 8/10 → top quartile.
- An overall score of 4/10 → fatigue in under 7 days at moderate spend. An 8/10 → 14-21 days.
- Every prediction must cite the specific score that drives it: "CTR predicted at X% vs Y% ${platformLabel} average for ${nicheLabel} because [dimension] scored [N]/10."
- Never guess high to flatter. A weak ad gets weak predictions.`;

  const promptOrganic = `Based on the following organic content scorecard, generate an organic performance prediction for this ${adTypeLabel} post on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
<analysis>
${safeAnalysis}
</analysis>

Scores: Hook ${scores.hook != null ? scores.hook : 0}/10, Clarity ${scores.clarity != null ? scores.clarity : 0}/10, Shareability ${scores.cta != null ? scores.cta : 0}/10, Production ${scores.production != null ? scores.production : 0}/10, Overall ${scores.overall != null ? scores.overall : 0}/10
Platform: ${platformLabel} | Format: ${adTypeLabel} | Niche: ${nicheLabel}
${benchmarkBlock}

Predict organic performance only. Never predict CTR, CPM, CPC, CVR, or ROAS.

1. Save Rate Range — % of viewers who save this post. Anchor against the organic benchmarks above. (Will be returned in the "ctr" field.)
2. Share Rate Range — % of viewers who share this post via DM or repost. (Will be returned in the "cvr" field.)
3. Hook Retention (video only) — estimated % who watch past 3 seconds on ${platformLabel}. ${platformLabel === "TikTok" ? "TikTok users decide in 0.5-1s." : platformLabel === "YouTube" ? "YouTube users can skip at 5s." : "Meta/Instagram feed users decide in 1-2s."}
4. Creator Posting Rhythm — days until this creator should post next to maintain algorithm momentum. (Will be returned in the "fatigueDays" field.)
5. Confidence Level — how reliable is this prediction?
Rules:
- 'High' = scores are clear-cut (very high 8+ or very low 3-), strong organic signal in the content.
- 'Medium' = scores are mid-range (4-7), mixed signals.
- 'Low' = unusual format, atypical niche, or contradictory signals.
Confidence reflects prediction RELIABILITY, not content quality.
6. Top 2 signals boosting organic performance — be specific to what you saw in the analysis.
7. Top 2 signals limiting organic performance — reference the weakest scores.

IMPORTANT FIELD MAPPING — the response uses paid-named fields for schema compatibility, but the VALUES are organic:
- "ctr" field → save rate values (% who save the post)
- "ctr.benchmark" field → typical save rate for this platform/niche (from the organic benchmarks above)
- "ctr.vsAvg" → "above" / "at" / "below" the organic save-rate benchmark
- "cvr" field → share rate values (% who share or DM the post)
- "fatigueDays" field → days until next post for creator momentum
- "hookRetention" field → % who watch past 3s (same meaning as paid)

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

Return ONLY valid JSON, no markdown fencing. Be calibrated — a hook score of 3/10 should predict low save rate and low completion, not moderate.`;

  const promptPaid = `Based on the following creative scorecard, generate a performance prediction for this ${adTypeLabel} ad on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
<analysis>
${safeAnalysis}
</analysis>

Scores: Hook ${scores.hook != null ? scores.hook : 0}/10, Clarity ${scores.clarity != null ? scores.clarity : 0}/10, CTA ${scores.cta != null ? scores.cta : 0}/10, Production ${scores.production != null ? scores.production : 0}/10, Overall ${scores.overall != null ? scores.overall : 0}/10
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

  const prompt = isOrganic ? promptOrganic : promptPaid;

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
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      // Inline guardrails — avoids ESM import issue in Vercel CJS bundle
      const validatedPrediction = {
        ...parsed,
        ctr: {
          ...parsed.ctr,
          low: Math.max(0, Math.min(100, parsed.ctr?.low != null ? parsed.ctr.low : 0)),
          high: Math.max(0, Math.min(100, parsed.ctr?.high != null ? parsed.ctr.high : 0)),
        },
        cvr: {
          low: Math.max(0, Math.min(100, parsed.cvr?.low != null ? parsed.cvr.low : 0)),
          high: Math.max(0, Math.min(100, parsed.cvr?.high != null ? parsed.cvr.high : 0)),
        },
        fatigueDays: {
          low: Math.max(0, parsed.fatigueDays?.low != null ? parsed.fatigueDays.low : 0),
          high: Math.max(0, parsed.fatigueDays?.high != null ? parsed.fatigueDays.high : 0),
        },
      };
      const overallScore = (scores?.overall != null ? scores.overall : 5);
      validatedPrediction.confidence = parsed.confidence === "High" && overallScore < 5
        ? "Medium"
        : parsed.confidence === "Medium" && overallScore < 3
        ? "Low"
        : (parsed.confidence != null ? parsed.confidence : "Low");
      logApiUsage({ userId: user.id, endpoint: "predict-performance", statusCode: 200, responseTimeMs: Date.now() - start, platform: platformLabel, niche: nicheLabel, format: adTypeLabel });
      return res.status(200).json(validatedPrediction);
    } catch (parseErr) {
      console.error("[predict-performance] JSON parse failed. Raw text:", text);
      console.error("[predict-performance] Cleaned:", cleaned);
      console.error("[predict-performance] Parse error:", parseErr instanceof Error ? parseErr.message : String(parseErr));
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
