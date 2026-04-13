// api/sound-off-check.ts — Gemini: Sound-Off Readability Checklist for video ads
// 0 credits — bundled into existing analysis. Video only.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeAnalysisText } from "./_lib/sanitizeMemory";
import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";

export const maxDuration = 30;

const GEMINI_MODEL = "gemini-2.0-flash";
const RATE = { freeLimit: 10, proLimit: 60, windowSeconds: 60 };

const REQUIRED_IDS = [
  "captions_present",
  "value_prop_visible",
  "offer_visible",
  "hook_visual",
  "brand_visible",
  "text_readable",
  "motion_tells_story",
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("sound-off-check", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const body = req.body != null ? req.body : {};
  const rawAnalysis = body.geminiAnalysis;
  const format = body.format;
  const platform = typeof body.platform === "string" ? body.platform : "all";

  if (!rawAnalysis) {
    return apiError(res, "INVALID_INPUT", 400, "geminiAnalysis is required");
  }
  if (format !== "video") {
    return apiError(res, "INVALID_INPUT", 400, "Sound-off check is video-only");
  }

  const geminiAnalysis = sanitizeAnalysisText(rawAnalysis);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return apiError(res, "INTERNAL_ERROR", 500, "GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: "You are a performance creative strategist specializing in mobile feed ads. Evaluate video ads for sound-off watchability. Be strict \u2014 most ads fail captions_present. Apply the same rubric on every call.",
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048,
    },
  });

  try {
    const result = await model.generateContent([
      {
        text: `Based on this ad analysis:\n${geminiAnalysis}\n\nEvaluate sound-off readability. Return ONLY valid JSON, no markdown fences:\n{\n  "overallPass": boolean,\n  "score": number (0\u2013100),\n  "items": [\n    {\n      "id": string,\n      "label": string,\n      "pass": boolean,\n      "severity": "critical" | "warning" | "pass",\n      "fix": string | null\n    }\n  ]\n}\n\nEvaluate ALL 7 items in this exact order:\n1. captions_present    \u2014 Captions or on-screen text convey dialogue/narration?\n2. value_prop_visible  \u2014 Core value proposition readable without audio?\n3. offer_visible       \u2014 Offer, deal, or CTA legible on screen?\n4. hook_visual         \u2014 First 3 seconds hooks visually without sound?\n5. brand_visible       \u2014 Brand name or logo clearly visible?\n6. text_readable       \u2014 On-screen text large + high-contrast enough to read?\n7. motion_tells_story  \u2014 Visual motion/sequence conveys narrative without words?\n\nseverity rules:\n- critical: fails AND is conversion-essential (captions_present, value_prop_visible, offer_visible)\n- warning: fails but not conversion-blocking\n- pass: passes \u2014 set fix to null\n\nscore: weighted average. critical failures penalize more than warnings.\noverallPass: true only if no critical failures.`,
      },
    ]);

    const text = result.response.text();
    if (!text.trim()) {
      return apiError(res, "ANALYSIS_FAILED", 500, "Empty response from Gemini");
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return apiError(res, "ANALYSIS_FAILED", 500, "Could not extract JSON from Gemini response");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return apiError(res, "ANALYSIS_FAILED", 500, "JSON.parse failed on Gemini response");
    }

    // Runtime validation
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    if (items.length !== 7) {
      return apiError(res, "ANALYSIS_FAILED", 500, "Sound-off check parse error: expected 7 items, got " + items.length);
    }

    const validatedItems = items.map((item: Record<string, unknown>, i: number) => ({
      id: String(item.id != null ? item.id : REQUIRED_IDS[i]),
      label: String(item.label != null ? item.label : ""),
      pass: item.pass === true,
      severity: (["critical", "warning", "pass"].includes(String(item.severity))
        ? String(item.severity)
        : (item.pass === true ? "pass" : "warning")) as "critical" | "warning" | "pass",
      fix: item.pass === true ? null : (item.fix != null ? String(item.fix) : null),
    }));

    // Verify all 7 IDs are present in order
    for (let i = 0; i < REQUIRED_IDS.length; i++) {
      if (validatedItems[i].id !== REQUIRED_IDS[i]) {
        return apiError(res, "ANALYSIS_FAILED", 500, "Sound-off check parse error: expected id " + REQUIRED_IDS[i] + " at index " + i);
      }
    }

    const score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 0;
    const overallPass = typeof parsed.overallPass === "boolean" ? parsed.overallPass : !validatedItems.some((it: { severity: string }) => it.severity === "critical");

    logApiUsage({
      userId: user.id,
      endpoint: "sound-off-check",
      statusCode: 200,
      responseTimeMs: Date.now() - start,
      platform,
      format: "video",
    });

    return res.status(200).json({
      overallPass,
      score,
      items: validatedItems,
    });
  } catch (err) {
    console.error("[sound-off-check] Gemini error:", err);
    return apiError(res, "ANALYSIS_FAILED", 500, "Gemini call failed");
  }
}
