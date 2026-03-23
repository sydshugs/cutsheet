// api/visualize-v2.ts — Visualize It v2: True image editing via Gemini 2.0 Flash
// Sends the original creative + edit prompt to Gemini for surgical pixel-level changes.
// Falls back to v1 visual brief on error. Does NOT touch api/visualize.ts.

export const maxDuration = 30; // seconds — spec requires 30s timeout for image editing

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Modality } from "@google/genai";
import { verifyAuth, handlePreflight, isProOrTeam } from "./_lib/auth";
import { checkFeatureCredit } from "./_lib/creditCheck";
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

function buildV2EditPrompt(ctx: VisualizeContextInput, scorecard: ScorecardData): string {
  const quadrantContext = getQuadrantContext(ctx);

  const weakLines = scorecard.weaknesses
    .map((w) => `- ${w.name}: scored ${w.score}/10`)
    .join("\n");

  const improvementLines = scorecard.improvements
    .slice(0, 4)
    .map((imp, i) => `${i + 1}. ${imp}`)
    .join("\n");

  const hookWarning =
    scorecard.hookVerdict && scorecard.hookVerdict !== "Strong"
      ? `\nHOOK IS ${scorecard.hookVerdict.toUpperCase()}: The opening visual/headline is not stopping the scroll. Fix the hook — make the first thing the eye lands on impossible to ignore.\n`
      : "";

  return `You are editing an existing ad creative. Make ONLY the specific improvements listed below.
Do NOT redesign the entire image. Preserve all elements that are already working.
Do NOT change the product, brand logo, or overall composition unless explicitly instructed.

${quadrantContext}

---

The ad scored ${scorecard.overallScore}/10. The specific weaknesses to fix:
${weakLines}

Specific improvements from the analysis:
${improvementLines}
${hookWarning}
---

EDITING RULES — CRITICAL:

1. PRESERVE THE ORIGINAL. This is image editing, not image generation. The output must be recognizably the same ad — same background, same product, same brand identity. You are making surgical fixes, not creating a new creative.

2. DO NOT MAKE THIS LOOK AI-GENERATED. Specifically:
   - No perfect symmetry unless it was in the original
   - No overlit product shots with fake studio lighting
   - No uncanny-valley faces or impossibly perfect skin
   - Real textures, real imperfections, authentic feel

3. WHAT YOU CAN CHANGE:
   - Text overlays: rewrite, reposition, resize, change weight/color for better contrast
   - Visual hierarchy: adjust what the eye lands on first
   - Background: adjust color, contrast, brightness, gradient
   - Composition: reposition elements for better visual flow
   - Color accents: adjust for better contrast and attention

4. WHAT YOU MUST NOT CHANGE:
   - Brand logo (position, size, or design)
   - Product photography (the core product shot)
   - Brand color palette
   - Elements that scored 8+ in the analysis — leave them alone

5. PROOFREAD ALL TEXT. No duplicate words, no repeated phrases, no incomplete sentences. Every text string must be clean.

6. PRESERVE PSYCHOLOGICALLY STRONG ELEMENTS. Binary choice CTAs, loss aversion framing, named villains, urgency triggers — these are high-value persuasion patterns. Do NOT remove them. Only intensify them.

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

    // ── Pro/Team gate ─────────────────────────────────────────────────────
    if (!isProOrTeam(user.tier)) {
      return res.status(403).json({ error: "PRO_REQUIRED", feature: "visualize" });
    }

    // ── Monthly credit check (same credit pool as v1) ────────────────────
    const credit = await checkFeatureCredit(user.id, user.tier, "visualize");
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
      visualizeContext, excludeCta,
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

    // ── Derive summary for UI (no AI call needed) ────────────────────────
    const improvementSummary = weaknesses.length
      ? `This ad scored ${overallScore}/10 overall. The weakest areas were ${weaknesses.map((d) => `${d.name} (${d.score}/10)`).join(" and ")}. The improved version surgically edits these while preserving everything that was already working.`
      : `This ad scored ${overallScore}/10 overall. The improved version refines the creative with targeted edits from the analysis.`;
    const changesApplied = improvements.slice(0, 6);

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
      const genAI = new GoogleGenAI({
        apiKey: (process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY)!,
      });

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
      console.error("[visualize-v2] GEMINI_API_KEY present: %s, VITE_GEMINI_API_KEY present: %s",
        !!process.env.GEMINI_API_KEY, !!process.env.VITE_GEMINI_API_KEY);
      // Fall back to visual brief (same behavior as v1 fallback)
      visualBrief = editPrompt;
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
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
