// api/visualize-v2.ts — Visualize It v2: True image editing via Gemini 2.0 Flash
// Sends the original creative + edit prompt to Gemini for surgical pixel-level changes.
// Falls back to v1 visual brief on error. Does NOT touch api/visualize.ts.
//
// CREDIT FLOW:
// 1. verifyAuth() → get user + tier
// 2. checkRateLimit() → per-user throttle
// 3. Verify isPro → 403 if free tier
// 4. Deduct 1 credit (atomic) → 429 if no credits
// 5. Run Gemini image editing
// 6. If Gemini fails (no image generated) → refund credit
// 7. Return result

export const maxDuration = 30; // seconds — spec requires 30s timeout for image editing

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Modality } from "@google/genai";
import { verifyAuth, handlePreflight, isProOrTeam, checkRateLimit } from "./_lib/auth";
import { checkFeatureCredit, refundCredit } from "./_lib/creditCheck";
import { safePlatform, safeAdType, safeNiche, validateBase64Size } from "./_lib/validateInput";

// Use the same model as v1 — gemini-2.5-flash-image supports image editing via generateContent
// The spec suggested "gemini-2.0-flash-preview-image-generation" but that model is unavailable.
const GEMINI_IMAGE_EDIT_MODEL = "gemini-2.5-flash-image";

// ── 2×2 Quadrant Context (same strings as visualize.ts — shared by reference) ───

const PAID_STATIC_CONTEXT = `This is a PAID STATIC ad. The advertiser's CTA button, primary text, headline, and description all live OUTSIDE the creative in the ad platform UI.
Do NOT add a CTA button to the image.
Do NOT add urgency copy that belongs in the headline field.
Focus the visual improvement on: thumb-stop power, message clarity at a glance, visual hierarchy, and brand recognition.
The improved creative should look cleaner and more scroll-stopping — not more cluttered.`;

const PAID_VIDEO_CONTEXT = `This is a PAID VIDEO ad. The platform adds CTA buttons natively — do NOT add a CTA button graphic to the video frame.
Focus improvements on: first-frame scroll-stop, sound-off readability (captions/text overlays), platform-native feel, and CTA timing within the video.
For TikTok: the ad must feel like organic creator content, not a produced commercial.
For Meta: assume significant % of viewers watch muted — visual storytelling must work without audio.
For YouTube skippable: brand and value prop must be clear before the 5-second skip button appears.`;

const ORGANIC_STATIC_CONTEXT = `This is ORGANIC STATIC content, not a paid ad. There is no CTA button anywhere on this platform placement.
Do NOT add a CTA button, urgency copy, offer banners, or any paid ad conventions to the image.
Focus improvements on: scroll-stop power, save-worthiness (would someone bookmark this?), visual value delivery, and clarity of the core message.
The improved version should feel like high-quality organic content — not like an ad.`;

const ORGANIC_VIDEO_CONTEXT = `This is ORGANIC VIDEO content, not a paid ad. There is no CTA button on this platform placement.
Do NOT add a CTA button, offer copy, urgency language, or any paid ad conventions.
Focus improvements on: 3-second scroll-stop hook, completion signal (does it sustain to the end?), DM/share trigger (would someone send this to a friend?), and platform-native feel.
The improved version should feel like content a real creator would post — not like an ad.`;

interface VisualizeContextInput {
  adType: "paid" | "organic";
  format: "static" | "video";
  platform: string;
  excludeCta?: boolean;
}

function getQuadrantContext(ctx: VisualizeContextInput): string {
  if (ctx.adType === "paid" && ctx.format === "static") return PAID_STATIC_CONTEXT;
  if (ctx.adType === "paid" && ctx.format === "video") return PAID_VIDEO_CONTEXT;
  if (ctx.adType === "organic" && ctx.format === "static") return ORGANIC_STATIC_CONTEXT;
  if (ctx.adType === "organic" && ctx.format === "video") return ORGANIC_VIDEO_CONTEXT;
  return PAID_STATIC_CONTEXT; // safest default
}

// ── V2 Edit Prompt Construction ──────────────────────────────────────────────

interface ScorecardData {
  overallScore: number;
  weaknesses: { name: string; score: number }[];
  improvements: string[];
  hookVerdict?: string;
}

// Patterns to detect CTA/urgency-related content that should be excluded for paid static / organic
const CTA_URGENCY_RE = /\bcta\b|call.to.action|shop\s*now|learn\s*more|buy\s*now|get\s*started|sign\s*up|urgency|limited.time|act\s*now|hurry|\boff\b.*banner|discount.*overlay|promo.*badge|offer.*callout/i;

/** Filter weaknesses and improvements based on quadrant exclusion rules. */
function filterForQuadrant(
  ctx: VisualizeContextInput,
  weaknesses: ScorecardData["weaknesses"],
  improvements: string[],
): { filteredWeaknesses: ScorecardData["weaknesses"]; filteredImprovements: string[] } {
  // Paid static + all organic: exclude CTA-related items
  const excludeCta = ctx.excludeCta || ctx.adType === "organic" || (ctx.adType === "paid" && ctx.format === "static");

  if (!excludeCta) {
    return { filteredWeaknesses: weaknesses, filteredImprovements: improvements };
  }

  return {
    filteredWeaknesses: weaknesses.filter((w) => !CTA_URGENCY_RE.test(w.name)),
    filteredImprovements: improvements.filter((imp) => !CTA_URGENCY_RE.test(imp)),
  };
}

/** Build CRITICAL OVERRIDES block that goes at the very end of the prompt to supersede everything. */
function buildOverrides(ctx: VisualizeContextInput): string {
  const overrides: string[] = [];

  if (ctx.adType === "paid" && ctx.format === "static") {
    overrides.push(
      "Do NOT add a CTA button, CTA text, or any call-to-action element to the image — the platform places CTA buttons outside the creative.",
      "Do NOT add urgency copy (limited time, act now, % off banners) — these belong in the ad platform headline/description fields, not the image.",
      "Do NOT add offer callouts, promo badges, or discount overlays unless one already exists in the original image.",
      "Do NOT add primary text, headline, or description copy — these live outside the creative in Ads Manager.",
    );
  } else if (ctx.adType === "organic") {
    overrides.push(
      "Do NOT add a CTA button — organic content has no CTA button on any platform.",
      "Do NOT add urgency copy, offer banners, promo badges, or any paid ad conventions.",
      "The output must look like organic content, not an advertisement.",
    );
  } else if (ctx.adType === "paid" && ctx.format === "video") {
    overrides.push(
      "Do NOT overlay a CTA button graphic on the video frame — the platform adds CTA buttons natively.",
    );
  }

  if (overrides.length === 0) return "";

  return `\n\n---\n\nCRITICAL OVERRIDES — these rules supersede EVERYTHING above, including weaknesses and improvements:\n${overrides.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
}

function buildV2EditPrompt(ctx: VisualizeContextInput, scorecard: ScorecardData): string {
  const quadrantContext = getQuadrantContext(ctx);

  // Filter out CTA/urgency items from weaknesses and improvements for this quadrant
  const { filteredWeaknesses, filteredImprovements } = filterForQuadrant(
    ctx, scorecard.weaknesses, scorecard.improvements,
  );

  const weakLines = filteredWeaknesses
    .map((w) => `- ${w.name}: scored ${w.score}/10`)
    .join("\n");

  const improvementLines = filteredImprovements
    .slice(0, 4)
    .map((imp, i) => `${i + 1}. ${imp}`)
    .join("\n");

  const hookWarning =
    scorecard.hookVerdict && scorecard.hookVerdict !== "Strong"
      ? `\nHOOK IS ${scorecard.hookVerdict.toUpperCase()}: The opening visual/headline is not stopping the scroll. Make the first thing the eye lands on more arresting — but keep the existing headline text.\n`
      : "";

  // Build the CRITICAL OVERRIDES block that goes at the very end
  const overrides = buildOverrides(ctx);

  return `ABSOLUTE RULES — THESE OVERRIDE EVERYTHING ELSE:
1. RULE 1 — HEADLINE TEXT IS LOCKED. DO NOT REWRITE IT.
   The headline text in this ad must appear word-for-word in your output.
   If the headline says "THE COMPLETE CLEAN-UP FOR AFTER" — output those exact words in your image. Not a paraphrase. Not an improvement. The exact same words.
   Gemini's tendency to "improve" headlines is a failure mode. Resist it completely.
2. DO NOT REPLACE THE PRODUCT VISUAL. The hero image stays. You may enhance lighting, contrast, or composition — never swap the subject.
3. DO NOT CHANGE THE BRAND IDENTITY. Logo, colors, typography — identical to the original.
4. ONLY FIX WHAT THE SCORECARD FLAGGED AS WEAK (score < 7). Leave everything that scored 7+ completely alone.
5. THE OUTPUT MUST LOOK LIKE THE INPUT WITH TARGETED IMPROVEMENTS. If someone compared before/after, they should recognize it as the same ad — not a different ad.

PROOFREAD REQUIREMENT: Before outputting, check every word in every text element for spelling errors. "BATHROOM" not "BATHROM". "COMPLETE" not "COMPLET". Read every word character by character. Do not output an image with a misspelling.

DO NOT MAKE THIS LOOK AI-GENERATED:
- No perfect symmetry unless it was in the original
- No overlit product shots with fake studio lighting
- No uncanny-valley faces or impossibly perfect skin
- No generic stock photo aesthetic
- Real textures, real imperfections, authentic feel
- If there are people in the original, keep the same appearance

---

${quadrantContext}

---

You are editing a ${ctx.platform} ad that scored ${scorecard.overallScore}/10. Make ONLY the specific improvements listed below — do not redesign the ad.

WHAT IS WEAK IN THIS AD (fix these specifically):
${weakLines || "- No critical weaknesses identified — refine overall quality."}

SPECIFIC IMPROVEMENTS FROM THE ANALYSIS:
${improvementLines || "- Refine visual impact and clarity."}
${hookWarning}
---

ADDITIONAL EDITING RULES:

1. WHAT YOU CAN CHANGE:
   - Visual hierarchy: adjust what the eye lands on first (size, contrast, position)
   - Background: adjust color, contrast, brightness, gradient
   - Composition: reposition elements for better visual flow
   - Color accents: adjust for better contrast and attention
   - Text styling: change weight, size, color, position for better readability — but keep the SAME WORDS

2. WHAT YOU MUST NOT CHANGE:
   - Any headline or body text (keep exact wording from the original)
   - Brand logo (position, size, or design)
   - Product photography (the core product/hero shot)
   - Brand color palette
   - Elements that scored 8+ in the analysis

3. PROOFREAD ALL TEXT. Every word in your output must match the original. No duplicate words, no repeated phrases, no altered copy. If the original says "A BETTER DOWN-THERE LIFE" your output must say exactly "A BETTER DOWN-THERE LIFE".

4. PRESERVE EXISTING PERSUASION PATTERNS. Loss aversion framing, named villains, and urgency triggers that already exist in the original must be preserved exactly as written.

5. PRESERVE TYPOGRAPHIC HIGHLIGHT TREATMENTS. If any word in the original uses a brand accent color (e.g. pink, colored highlight, neon), bold weight, or special styling, that treatment MUST be maintained. Match the exact color — do not substitute a different accent.
${overrides}

Produce the improved version of the provided image now. Output only the image — no explanation, no description.`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // ── Rate limit ───────────────────────────────────────────────────────
    const rl = await checkRateLimit("visualize-v2", user.id, user.tier, { freeLimit: 0, proLimit: 20, windowSeconds: 86400 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    // ── Pro/Team gate ─────────────────────────────────────────────────────
    if (!isProOrTeam(user.tier)) {
      return res.status(403).json({ error: "PRO_REQUIRED", feature: "visualize" });
    }

    // ── Monthly credit check (atomic deduct — refund on failure) ───────────
    const credit = await checkFeatureCredit(user.id, user.tier, "visualize", true);
    if (!credit.allowed) {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return res.status(429).json({
        error: "CREDIT_LIMIT_REACHED",
        feature: "visualize",
        used: credit.used,
        limit: credit.limit,
        tier: user.tier,
        resetDate: resetDate.toISOString(),
      });
    }

    // ── Input validation ─────────────────────────────────────────────────
    const {
      imageStorageUrl, imageBase64, imageMediaType,
      analysisResult, platform, niche, adType,
      visualizeContext, excludeCta, visualizeMode,
    } = req.body ?? {};

    if (!imageStorageUrl && !imageBase64) {
      return res.status(400).json({ error: "imageStorageUrl or imageBase64 is required" });
    }
    if (!analysisResult) {
      return res.status(400).json({ error: "analysisResult is required" });
    }

    // Validate Supabase storage URL if provided
    if (imageStorageUrl) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
      if (!supabaseUrl || !imageStorageUrl.startsWith(supabaseUrl)) {
        return res.status(400).json({ error: "Invalid storage URL" });
      }
    }

    // Legacy: validate base64 size only when no storage URL provided
    if (!imageStorageUrl && imageBase64) {
      const b64Err = validateBase64Size(imageBase64, "imageBase64");
      if (b64Err) return res.status(413).json({ error: b64Err });
    }

    const cleanPlatform = safePlatform(platform);
    const cleanNiche = safeNiche(niche);
    const cleanAdType = safeAdType(adType);
    const safeMediaType: string = imageMediaType || "image/jpeg";

    // ── Build scorecard data ─────────────────────────────────────────────
    const scores = analysisResult.scores ?? {};
    const dimensionScores = [
      { name: "Hook Strength", score: scores.hook ?? 5 },
      { name: "Message Clarity", score: scores.clarity ?? 5 },
      { name: "CTA Effectiveness", score: scores.cta ?? 5 },
      { name: "Production Quality", score: scores.production ?? 5 },
    ];
    const overallScore = scores.overall ?? 5;
    const improvements: string[] = Array.isArray(analysisResult.improvements)
      ? analysisResult.improvements
      : [];
    const hookVerdict: string | undefined = analysisResult.hookDetail?.verdict;

    // ── Build context ────────────────────────────────────────────────────
    const resolvedExcludeCta = !!excludeCta
      || visualizeContext?.excludeCta
      || visualizeContext?.adType === "organic";

    const ctx: VisualizeContextInput = {
      adType: visualizeContext?.adType ?? "paid",
      format: visualizeContext?.format ?? "static",
      platform: cleanPlatform,
      excludeCta: resolvedExcludeCta,
    };

    const weaknesses = dimensionScores
      .filter((d) => d.score < 7)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const editPrompt = buildV2EditPrompt(ctx, {
      overallScore,
      weaknesses,
      improvements,
      hookVerdict,
    });

    // Diagnostic: log context resolution and prompt length (never log full prompt in prod)
    console.info("[visualize-v2] Context: adType=%s, format=%s, platform=%s, excludeCta=%s",
      ctx.adType, ctx.format, ctx.platform, ctx.excludeCta);
    console.info("[visualize-v2] Prompt length: %d chars, weaknesses: %d, improvements: %d",
      editPrompt.length, weaknesses.length, improvements.length);

    // ── Derive summary + changesApplied for UI (no AI call needed) ────────
    // Filter weaknesses and improvements through the same quadrant rules used in the prompt
    const { filteredWeaknesses, filteredImprovements } = filterForQuadrant(ctx, weaknesses, improvements);

    const improvementSummary = filteredWeaknesses.length
      ? `This ad scored ${overallScore}/10 overall. The weakest areas were ${filteredWeaknesses.map((d) => `${d.name} (${d.score}/10)`).join(" and ")}. The improved version surgically edits these while preserving everything that was already working.`
      : `This ad scored ${overallScore}/10 overall. The improved version refines the creative with targeted edits from the analysis.`;
    const changesApplied = filteredImprovements.slice(0, 6);

    // ── text_overlay mode: skip Gemini, return brief only, no credit ────
    if (visualizeMode === "text_overlay") {
      // Refund the credit that was deducted above
      await refundCredit(user.id, user.tier, "visualize");
      console.info("[visualize-v2] text_overlay mode — returning brief only, credit refunded");

      return res.status(200).json({
        generatedImageUrl: null,
        visualBrief: improvementSummary || changesApplied.join("\n"),
        improvementSummary,
        changesApplied,
        briefOnly: true,
        version: "v2-direction",
      });
    }

    // ── Resolve image to base64 ──────────────────────────────────────────
    let resolvedBase64: string;
    let resolvedMimeType: string = safeMediaType;

    if (imageStorageUrl) {
      const imgResp = await fetch(imageStorageUrl);
      if (!imgResp.ok) throw new Error(`Failed to fetch stored image: ${imgResp.status}`);
      const buf = await imgResp.arrayBuffer();
      resolvedBase64 = Buffer.from(buf).toString("base64");
      resolvedMimeType = imgResp.headers.get("content-type") || safeMediaType;
    } else {
      resolvedBase64 = imageBase64 as string;
    }

    // ── Image size: client-side resize to max 1024px (spec requirement) ──
    // uploadImageToStorage(file, 1024, 0.85) handles this before upload.
    // No server-side resize needed — Gemini accepts the pre-resized image.

    // ── Gemini 2.0 Flash — image editing call ────────────────────────────
    let generatedImageUrl: string | undefined;
    let visualBrief: string | undefined;
    let usedV2 = false;

    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error("GEMINI_API_KEY is not set");
      const genAI = new GoogleGenAI({ apiKey: geminiKey });

      const imageResponse = await genAI.models.generateContent({
        model: GEMINI_IMAGE_EDIT_MODEL,
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: { mimeType: resolvedMimeType, data: resolvedBase64 },
            },
            {
              text: editPrompt,
            },
          ],
        }],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      // Extract edited image from response
      const candidate = imageResponse.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      // Diagnostic: log what Gemini returned (never log image data)
      console.info("[visualize-v2] Gemini response: candidates=%d, parts=%d, finishReason=%s",
        imageResponse.candidates?.length ?? 0,
        parts.length,
        candidate?.finishReason ?? "none",
      );
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.inlineData?.data) {
          console.info("[visualize-v2] Part %d: inlineData, mimeType=%s, size=%dKB", i, p.inlineData.mimeType, Math.round(p.inlineData.data.length / 1024));
        } else if (p.text) {
          console.info("[visualize-v2] Part %d: text, length=%d", i, p.text.length);
        }
      }

      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          usedV2 = true;
          break;
        }
      }

      // If Gemini returned no image, fall through to visual brief
      if (!generatedImageUrl) {
        console.warn("[visualize-v2] Gemini returned no image — falling back to visual brief");
        visualBrief = editPrompt;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errName = err instanceof Error ? err.constructor.name : "Unknown";
      console.error("[visualize-v2] Gemini image editing failed: [%s] %s", errName, errMsg);
      // Log API key presence (never log the key itself)
      console.error("[visualize-v2] GEMINI_API_KEY present: %s", !!process.env.GEMINI_API_KEY);
      // Fall back to visual brief (same behavior as v1 fallback)
      visualBrief = editPrompt;
    }

    // ── Refund credit if no image was generated (user only gets text brief) ──
    if (!generatedImageUrl) {
      await refundCredit(user.id, user.tier, "visualize");
      console.info("[visualize-v2] Credit refunded — visual brief fallback only");
    } else {
      console.info("[visualize-v2] Credit consumed (image generated): used=%d, limit=%d", credit.used, credit.limit);
    }

    return res.status(200).json({
      generatedImageUrl,
      visualBrief,
      improvementSummary,
      changesApplied,
      version: usedV2 ? "v2" : "v1-fallback",
    });
  } catch (err: unknown) {
    console.error(
      "[visualize-v2] Unhandled error:",
      err instanceof Error ? err.message : err,
      err instanceof Error ? err.stack : "",
    );
    return res.status(500).json({
      error: "Internal server error",
      message: "Something went wrong generating the visualization. Please try again.",
    });
  }
}
