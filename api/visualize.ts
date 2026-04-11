// api/visualize.ts — Visualize It: generate an improved ad image from scorecard
// Scorecard-driven prompt → Gemini image gen (with original image for reference)
// Fallback: visual brief text if image generation fails
//
// CREDIT FLOW:
// 1. verifyAuth() → get user + tier
// 2. checkRateLimit() → per-user throttle
// 3. Verify isPro → 403 if free tier
// 4. Deduct 1 credit (atomic) → 429 if no credits
// 5. Run Gemini image generation
// 6. If Gemini fails → refund credit
// 7. Return result

export const maxDuration = 60; // seconds — image gen takes 15-20s

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Modality } from "@google/genai";
import { verifyAuth, handlePreflight, isProOrTeam, checkRateLimit } from "./_lib/auth";
import { checkFeatureCredit, refundCredit } from "./_lib/creditCheck";
import { safePlatform, safeAdType, safeNiche, validateBase64Size } from "./_lib/validateInput";
import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

// ── 2×2 Prompt Matrix Context (Paid/Organic × Static/Video) ─────────────────
// Injected as a prefix to the existing scorecard-driven prompt.
// See Notion spec: "Visualize It Prompt Matrix"

interface VisualizeContextInput {
  adType: "paid" | "organic";
  format: "static" | "video";
  platform: string;
  excludeCta?: boolean;
}

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

function buildVisualizeContextPrefix(ctx: VisualizeContextInput): string {
  if (ctx.adType === "paid" && ctx.format === "static") return PAID_STATIC_CONTEXT;
  if (ctx.adType === "paid" && ctx.format === "video") return PAID_VIDEO_CONTEXT;
  if (ctx.adType === "organic" && ctx.format === "static") return ORGANIC_STATIC_CONTEXT;
  if (ctx.adType === "organic" && ctx.format === "video") return ORGANIC_VIDEO_CONTEXT;
  // Fallback: paid static (safest default)
  return PAID_STATIC_CONTEXT;
}

// ── Scorecard-driven prompt construction ─────────────────────────────────────

const PLATFORM_SPECS: Record<string, string> = {
  Meta: "square (1:1) or vertical (4:5) format, mobile-first layout",
  TikTok: "full vertical (9:16) format, bold text overlays native to TikTok style",
  Instagram: "square or vertical, clean aesthetic, strong visual hook in top third",
  "Google Display": "horizontal banner format, high contrast, clear brand presence",
  YouTube: "horizontal (16:9), skip-proof first frame, clear value prop visible immediately",
};

function buildVisualizePrompt(params: {
  platform: string;
  overallScore: number;
  dimensionScores: { name: string; score: number }[];
  improvements: string[];
  adFormat: "static" | "video_frame";
  hookVerdict?: string;
  excludeCta?: boolean;
}): string {
  const weakDimensions = params.dimensionScores
    .filter((d) => d.score < 7)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const topImprovements = params.improvements.slice(0, 3);
  const platformSpec = PLATFORM_SPECS[params.platform] || "maintain original aspect ratio";

  const hookLine =
    params.hookVerdict && params.hookVerdict !== "Strong"
      ? `\nHOOK IS ${params.hookVerdict.toUpperCase()}: The opening visual/headline is not stopping the scroll. Fix the hook — make the first thing the eye lands on impossible to ignore.\n`
      : "";

  return `You are a senior performance creative director at a top DTC performance marketing agency.

You are looking at a ${params.platform} ${params.adFormat === "static" ? "static image ad" : "video ad frame"} that scored ${params.overallScore}/10 in an AI creative analysis.

Your job: produce an improved version of this exact ad. Not a new ad. Not a reimagined concept. The SAME ad, with the specific weaknesses fixed.

---

WHAT IS WEAK IN THIS AD (fix these specifically):
${weakDimensions.map((d) => `- ${d.name}: scored ${d.score}/10`).join("\n")}

SPECIFIC IMPROVEMENTS IDENTIFIED BY THE ANALYSIS:
${topImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}
${hookLine}
---

PLATFORM REQUIREMENTS FOR ${params.platform.toUpperCase()}:
${platformSpec}

---

CRITICAL STYLE RULES — READ CAREFULLY:

1. PRESERVE THE ORIGINAL AESTHETIC. If the original uses real photography, keep real photography. If it uses a specific color palette, keep it. If it has a specific brand voice in the copy, preserve that voice. Do NOT replace the style with something generic.

2. DO NOT MAKE THIS LOOK AI-GENERATED. Specifically:
   - No perfect symmetry unless it was in the original
   - No overlit product shots with fake studio lighting unless that was the original style
   - No uncanny-valley faces or impossibly perfect skin
   - No generic stock photo aesthetic
   - Real textures, real imperfections, authentic feel
   - If there are people in the original, keep the same ethnic diversity and age range

3. SURGICAL FIXES ONLY. Change only what the analysis flagged as weak:
   - If the headline is generic → replace it with something specific and benefit-driven
   - If the visual hierarchy is confused → clarify what the eye should land on first
   - If the hook is weak → make the opening visual more arresting
   - Do NOT redesign elements that scored 8+ — leave them alone
   - Do NOT add a CTA button or CTA text to the image. CTA buttons are placed by the ad platform (Meta, Google, etc.), not embedded in the creative itself. Focus improvements on hook strength, visual hierarchy, and message clarity only.${params.excludeCta ? `

CTA-FREE MODE IS ON: This platform handles the CTA outside the creative. Do NOT add any call-to-action text, button, or overlay to the image. Zero CTA elements in the output.` : ""}

4. TEXT IN THE AD must be readable, specific, and benefit-driven. No placeholder text. No generic copy like "Shop Now" or "Learn More" unless that was the original.

5. MAINTAIN BRAND INTEGRITY. Keep the brand's visual identity — logo placement, brand colors, typography style — exactly as they appeared in the original.

6. PRESERVE PSYCHOLOGICALLY STRONG ELEMENTS. Before changing any copy or layout, ask: is this element doing something clever? Binary choice CTAs ("Scan Now / Ignore Risk"), loss aversion framing, named villains, urgency triggers — these are high-value persuasion patterns. Do NOT remove them. Only intensify them.

7. INTENSIFY EMOTIONAL SPECIFICITY. Match or intensify the original's emotional register. "Scammers love unprotected phone numbers" is stronger than "Your personal info is still exposed online" because it has a named villain and a specific fear. Never sand copy down to something blander or more generic. If the original is aggressive, be more aggressive. If it's urgent, be more urgent.

8. PROOFREAD ALL TEXT. Before finalizing, check every text element for duplicate words, repeated phrases, and incomplete sentences. No word should appear twice in a row. No phrase should be repeated. "FREE: Find My Data Now Now" style duplications are unacceptable — every text string must be clean.

Produce the improved ad now. Output only the image — no explanation, no description.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

  try {

  // ── Auth ──────────────────────────────────────────────────────────────────
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // ── Rate limit ───────────────────────────────────────────────────────────
  const rl = await checkRateLimit("visualize", user.id, user.tier, { freeLimit: 0, proLimit: 20, windowSeconds: 86400 });
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  // ── Pro/Team gate ─────────────────────────────────────────────────────────
  if (!isProOrTeam(user.tier)) {
    return res.status(403).json({ error: "PRO_REQUIRED", feature: "visualize" });
  }

  // ── Monthly credit check (Pro: 10/mo, Team: 25/mo) ─────────────────────
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

  // ── Input validation ─────────────────────────────────────────────────────
  const { imageStorageUrl, imageBase64, imageMediaType, analysisResult, platform, niche, adType, excludeCta, visualizeContext } = req.body ?? {};

  if (!imageStorageUrl && !imageBase64) return res.status(400).json({ error: "imageStorageUrl or imageBase64 is required" });
  if (!analysisResult) return res.status(400).json({ error: "analysisResult is required" });

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

  // ── Build scorecard-driven prompt ─────────────────────────────────────────
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
  const adFormat = cleanAdType === "static" ? "static" as const : "video_frame" as const;

  // Resolve excludeCta: explicit flag OR derived from visualizeContext (organic always excludes CTA)
  const resolvedExcludeCta = !!excludeCta
    || visualizeContext?.excludeCta
    || visualizeContext?.adType === "organic";

  const corePrompt = buildVisualizePrompt({
    platform: cleanPlatform,
    overallScore,
    dimensionScores,
    improvements,
    adFormat,
    hookVerdict,
    excludeCta: resolvedExcludeCta,
  });

  // Prepend 2×2 quadrant context if provided — does NOT modify the core prompt
  const contextPrefix = visualizeContext
    ? buildVisualizeContextPrefix({
        adType: visualizeContext.adType ?? "paid",
        format: visualizeContext.format ?? "static",
        platform: cleanPlatform,
        excludeCta: resolvedExcludeCta,
      })
    : "";

  const imageGenPrompt = contextPrefix
    ? `${contextPrefix}\n\n---\n\n${corePrompt}`
    : corePrompt;

  // Derive improvement summary and changes from scorecard data (no Claude call needed)
  const weakDims = dimensionScores.filter((d) => d.score < 7).sort((a, b) => a.score - b.score);
  const improvementSummary = weakDims.length
    ? `This ad scored ${overallScore}/10 overall. The weakest areas were ${weakDims.map((d) => `${d.name} (${d.score}/10)`).join(" and ")}. The improved version surgically fixes these while preserving everything that was already working.`
    : `This ad scored ${overallScore}/10 overall. The improved version refines the creative with the specific changes identified in the analysis.`;
  const changesApplied = improvements.slice(0, 6);

  // ── Resolve image to base64 for Gemini ───────────────────────────────────
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

  // ── Gemini — generate improved ad image with original for reference ──────
  let generatedImageUrl: string | undefined;
  let visualBrief: string | undefined;

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not set");
    const genAI = new GoogleGenAI({ apiKey: geminiKey });

    const imageResponse = await genAI.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [{
        role: "user",
        parts: [
          {
            text: "SYSTEM: You are a performance creative director. Your output will be shown directly to a paid media professional. Generic, stock-photo-style, or obviously AI-generated output is not acceptable and will be rejected. The improved ad must look like it was produced by a human creative team — authentic, on-brand, platform-native.",
          },
          {
            inlineData: { mimeType: resolvedMimeType, data: resolvedBase64 },
          },
          {
            text: imageGenPrompt,
          },
        ],
      }],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Extract image from response parts
    const parts = imageResponse.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    // If no image was returned, fall through to visual brief fallback
    if (!generatedImageUrl) {
      visualBrief = imageGenPrompt;
      // Refund credit — user gets text brief, not the image they paid for
      await refundCredit(user.id, user.tier, "visualize");
      console.info("[visualize] Credit refunded — visual brief fallback only");
    }
  } catch (err) {
    console.error("[visualize] Gemini image gen failed — falling back to visual brief:", err);
    visualBrief = imageGenPrompt;
    // Refund credit — AI call failed, user shouldn't lose a credit
    await refundCredit(user.id, user.tier, "visualize");
    console.info("[visualize] Credit refunded — Gemini failure");
  }

  logApiUsage({ userId: user.id, endpoint: "visualize", statusCode: 200, responseTimeMs: Date.now() - start, platform: cleanPlatform, niche: cleanNiche, format: cleanAdType });
  return res.status(200).json({
    generatedImageUrl,
    visualBrief,
    improvementSummary,
    changesApplied,
  });

  } catch (err: unknown) {
    logApiUsage({ userId: "unknown", endpoint: "visualize", statusCode: 500, responseTimeMs: Date.now() - start, errorCode: "GENERATION_FAILED" });
    return apiError(res, 'GENERATION_FAILED', 500,
      err instanceof Error ? err.message : String(err));
  }
}
