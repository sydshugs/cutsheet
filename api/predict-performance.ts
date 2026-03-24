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

  const { analysisMarkdown, scores, platform, adType, niche, intent, isOrganic } = req.body ?? {};

  if (!analysisMarkdown || !scores) {
    return res.status(400).json({ error: "Missing analysisMarkdown or scores" });
  }

  const platformLabel = platform ?? "Meta";
  const nicheLabel = niche ?? "general";
  const adTypeLabel = adType ?? "video";
  const intentLabel = intent ?? "conversion";

  // ── Platform-specific benchmarks ──────────────────────────────────────────
  const PLATFORM_BENCHMARKS: Record<string, { label: string; ctrRange: string; ctrAvg: number; cvrRange: string; hookRetentionRange: string | null; creativeFatigue: string }> = {
    meta:           { label: 'Meta',           ctrRange: '0.8–1.5%', ctrAvg: 1.25, cvrRange: '1.5–3.5%', hookRetentionRange: '55–70%',  creativeFatigue: '~3–5d' },
    instagram:      { label: 'Instagram',      ctrRange: '0.5–1.2%', ctrAvg: 0.90, cvrRange: '1.0–2.5%', hookRetentionRange: '50–65%',  creativeFatigue: '~3–5d' },
    tiktok:         { label: 'TikTok',         ctrRange: '1.5–3.0%', ctrAvg: 2.10, cvrRange: '0.5–1.5%', hookRetentionRange: '60–75%',  creativeFatigue: '~1–3d' },
    pinterest:      { label: 'Pinterest',      ctrRange: '0.2–0.5%', ctrAvg: 0.35, cvrRange: '0.8–2.0%', hookRetentionRange: '40–55%',  creativeFatigue: '~7–14d' },
    youtube:        { label: 'YouTube',        ctrRange: '0.3–0.7%', ctrAvg: 0.50, cvrRange: '0.5–1.5%', hookRetentionRange: '30–50%',  creativeFatigue: '~5–7d' },
    google_display: { label: 'Google Display', ctrRange: '0.1–0.3%', ctrAvg: 0.18, cvrRange: '0.5–1.5%', hookRetentionRange: null,       creativeFatigue: '~5–7d' },
  };
  const platformKey = platformLabel.toLowerCase().replace(/\s+/g, '_');
  const platBenchmark = PLATFORM_BENCHMARKS[platformKey] ?? PLATFORM_BENCHMARKS.meta;

  const nicheBenchmarks: Record<string, { ctr: string; cvr: string }> = {
    ecommerce: { ctr: `${platBenchmark.label} ecommerce avg CTR: ${platBenchmark.ctrRange}. Benchmark avg: ${platBenchmark.ctrAvg}%.`, cvr: `Ecommerce avg CVR from ad click: ${platBenchmark.cvrRange}.` },
    supplements: { ctr: `Supplement ads avg CTR: ${platBenchmark.ctrRange} on ${platBenchmark.label}. Benchmark avg: ${platBenchmark.ctrAvg}%.`, cvr: "Supplement CVR: 3-6% (impulse category)." },
    saas: { ctr: `SaaS avg CTR: ${platBenchmark.ctrRange} on ${platBenchmark.label}. Benchmark avg: ${platBenchmark.ctrAvg}%.`, cvr: "SaaS CVR from ad: 1-3% (longer sales cycle)." },
    fitness: { ctr: `Fitness avg CTR: ${platBenchmark.ctrRange} on ${platBenchmark.label}. Benchmark avg: ${platBenchmark.ctrAvg}%.`, cvr: "Fitness CVR: 2-5% depending on price point." },
    skincare: { ctr: `Skincare avg CTR: ${platBenchmark.ctrRange} on ${platBenchmark.label}. Benchmark avg: ${platBenchmark.ctrAvg}%.`, cvr: "Skincare CVR: 2-4%." },
    finance: { ctr: `Finance avg CTR: ${platBenchmark.ctrRange} on ${platBenchmark.label}. Benchmark avg: ${platBenchmark.ctrAvg}%.`, cvr: "Finance CVR: 1-2% (high consideration)." },
  };

  const nicheKey = nicheLabel.toLowerCase().replace(/[^a-z]/g, "");
  const benchmarks = Object.entries(nicheBenchmarks).find(([k]) => nicheKey.includes(k))?.[1];
  const benchmarkBlock = benchmarks
    ? `\nPLATFORM BENCHMARKS (${platBenchmark.label} · Ecommerce / DTC avg):\nCTR: ${platBenchmark.ctrRange} (avg ${platBenchmark.ctrAvg}%)\nCVR: ${platBenchmark.cvrRange}\n${platBenchmark.hookRetentionRange ? `Hook Retention: ${platBenchmark.hookRetentionRange}` : ""}\nCreative Fatigue: ${platBenchmark.creativeFatigue}\n\n${benchmarks.ctr}\n${benchmarks.cvr}`
    : `\nPLATFORM BENCHMARKS (${platBenchmark.label} · Ecommerce / DTC avg):\nCTR: ${platBenchmark.ctrRange} (avg ${platBenchmark.ctrAvg}%)\nCVR: ${platBenchmark.cvrRange}\n${platBenchmark.hookRetentionRange ? `Hook Retention: ${platBenchmark.hookRetentionRange}` : ""}\nCreative Fatigue: ${platBenchmark.creativeFatigue}`;

  // Identify weakest dimensions for calibration
  const weakDims = scores
    ? Object.entries(scores as Record<string, number>)
        .filter(([k]) => ["hook", "clarity", "cta", "production"].includes(k))
        .sort(([, a], [, b]) => a - b)
        .slice(0, 2)
        .map(([k, v]) => `${k} (${v}/10)`)
    : [];

  // ── Organic vs Paid prompt selection ──────────────────────────────────────
  const systemPrompt = isOrganic
    ? `You are an organic content strategist specializing in ${nicheLabel} content on ${platformLabel}. You have studied over 100,000 organic posts in the ${nicheLabel} category.

This post scored ${scores?.overall ?? "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}.

This is ORGANIC content. Do NOT predict CTR, CVR, or any paid ad metrics.

CALIBRATION RULES:
- An overall score of 3/10 → predict low save rate (<1%), minimal shares.
- An overall score of 8/10 → predict high save rate (5%+), strong DM sharing.
- A hook/scroll-stop score of 3/10 → most viewers scroll past in under 1s.
- Every prediction must cite a specific score that drives it.
- Never guess high to flatter. A weak post gets weak predictions.`
    : `You are a performance marketing analyst specializing in ${nicheLabel} ${adTypeLabel} advertising on ${platformLabel}. You have studied over 100,000 ${platformLabel} ad campaigns in the ${nicheLabel} category.

This ad scored ${scores?.overall ?? "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}. Hook: ${scores?.hook ?? "?"}/10, CTA: ${scores?.cta ?? "?"}/10.

CALIBRATION RULES:
- A hook score of 3/10 → predict retention below 20%. A hook of 8/10 → predict retention above 55%.
- A CTA score of 3/10 → predict CTR in the bottom quartile for ${nicheLabel}. A CTA of 8/10 → top quartile.
- An overall score of 4/10 → fatigue in under 7 days at moderate spend. An 8/10 → 14-21 days.
- Every prediction must cite the specific score that drives it: "CTR predicted at X% vs ${platBenchmark.ctrAvg}% ${platBenchmark.label} average for ${nicheLabel} because [dimension] scored [N]/10."
- The benchmark field in the JSON must be ${platBenchmark.ctrAvg} (the ${platBenchmark.label} platform average).
- Never guess high to flatter. A weak ad gets weak predictions.`;

  const prompt = isOrganic
    ? `Based on the following content scorecard, predict organic performance for this ${adTypeLabel} post on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
${analysisMarkdown}

Scores: Overall ${scores.overall ?? 0}/10, Hook ${scores.hook ?? 0}/10, Clarity ${scores.clarity ?? 0}/10, Shareability ${scores.cta ?? 0}/10, Production ${scores.production ?? 0}/10
Platform: ${platformLabel} | Format: ${adTypeLabel} | Niche: ${nicheLabel}

Predict:
1. Save Rate — likelihood viewers will bookmark/save this post (as % of impressions)
2. Share/DM Potential — likelihood viewers DM this to a friend (as % of impressions)
3. Scroll-Stop Score — 1-10, does this stop the feed scroll in under 2 seconds?
4. Post Longevity — evergreen content (lasts months) vs trending (fades in days)
5. Confidence Level and reason — cite specific scores
6. Top 2 positive signals — what makes this post shareable
7. Top 2 negative signals — what limits organic reach

Return as JSON:
{
  "ctr": { "low": number, "high": number, "benchmark": number, "vsAvg": "above" | "at" | "below" },
  "cvr": { "low": number, "high": number },
  "hookRetention": { "low": number, "high": number } | null,
  "fatigueDays": { "low": number, "high": number },
  "confidence": "Low" | "Medium" | "High",
  "confidenceReason": string,
  "positiveSignals": [string, string],
  "negativeSignals": [string, string],
  "isOrganic": true,
  "organicMetrics": {
    "saveRate": { "low": number, "high": number, "label": "Save Rate" },
    "sharePotential": { "low": number, "high": number, "label": "Share / DM Potential" },
    "scrollStop": number,
    "longevity": { "label": "evergreen" | "trending" | "moderate", "days": number }
  }
}

Map the organic metrics to the standard fields too (for backwards compatibility):
- ctr = save rate (same number range)
- cvr = share potential
- hookRetention = scroll-stop as percentage (score * 10)
- fatigueDays = post longevity in days

Return ONLY valid JSON, no markdown fencing.`
    : `Based on the following creative scorecard, generate a performance prediction for this ${adTypeLabel} ad on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
${analysisMarkdown}

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
      temperature: 0,
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
