// api/visualize.ts — Visualize It: generate an improved ad image from scorecard
// Step 1: Claude Sonnet → image generation prompt
// Step 2: Gemini imagen → generated ad image (fallback: Claude visual brief)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

// Free: 2 visualizations per day; Pro: effectively unlimited (200/day)
const RATE = { freeLimit: 2, proLimit: 200, windowSeconds: 86400 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await checkRateLimit("visualize", user.id, user.isPro, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  // ── Input validation ─────────────────────────────────────────────────────
  const { imageBase64, imageMediaType, analysisResult, platform, niche, adType } = req.body ?? {};

  if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });
  if (!analysisResult) return res.status(400).json({ error: "analysisResult is required" });

  const safePlatform = String(platform || "general");
  const safeNiche = String(niche || "general");
  const safeAdType = adType === "display" ? "display" : "static";
  const safeMediaType: string = imageMediaType || "image/jpeg";

  // ── Format scorecard for Claude ───────────────────────────────────────────
  const scoresBlock = analysisResult.scores
    ? Object.entries(analysisResult.scores)
        .map(([k, v]) => `  ${k}: ${v}/10`)
        .join("\n")
    : "  (no scores available)";

  const improvementsBlock = Array.isArray(analysisResult.improvements) && analysisResult.improvements.length
    ? analysisResult.improvements.map((imp: string, i: number) => `  ${i + 1}. ${imp}`).join("\n")
    : "  (no improvements listed)";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // ── STEP 1: Claude — generate image generation prompt ────────────────────
  let imageGenPrompt: string;
  let improvementSummary: string;
  let changesApplied: string[];

  try {
    const step1 = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: safeMediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are a world-class performance creative director. A user's ${safeAdType} ad received this scorecard:

SCORES:
${scoresBlock}

KEY IMPROVEMENTS NEEDED:
${improvementsBlock}

Platform: ${safePlatform} | Niche: ${safeNiche} | Format: ${safeAdType}

Generate a detailed visual description of an IMPROVED version of this ad that directly fixes every weakness in the scorecard. This description will be used to generate an image.

Your description must be:
- Specific and visual — describe exactly what to see, not concepts
- Structured for image generation — layout, colors, typography, imagery, hierarchy
- Grounded in the original ad's brand/product (don't invent a new product)
- Optimized for ${safePlatform} ad specs and best practices

Return JSON only — no prose, no preamble:
{
  "imagePrompt": "<single image generation prompt of 150-250 words starting with visual description — no preamble. Include: 1. Layout and composition, 2. Hero image or visual, 3. Headline text (exact copy, placement, size), 4. Body copy if applicable (exact copy), 5. CTA button (exact copy, color, placement), 6. Color palette, 7. Overall mood and style, 8. Platform-specific format notes. End with: Photorealistic ad mockup, professional advertising quality, clean design.>",
  "improvementSummary": "<2-3 sentence summary of what changed and why, written for the ad creator>",
  "changesApplied": ["<specific change 1>", "<specific change 2>", "<specific change 3>", "<up to 6 changes>"]
}`,
            },
          ],
        },
      ],
    });

    const rawText = step1.content[0].type === "text" ? step1.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse Claude step 1 response");

    const parsed = JSON.parse(jsonMatch[0]);
    imageGenPrompt = String(parsed.imagePrompt ?? "");
    improvementSummary = String(parsed.improvementSummary ?? "");
    changesApplied = Array.isArray(parsed.changesApplied) ? parsed.changesApplied.map(String) : [];
  } catch (err) {
    console.error("[visualize] Step 1 (Claude) failed:", err);
    return res.status(500).json({ error: "Failed to generate improvement description" });
  }

  // ── STEP 2: Gemini — generate improved ad image ───────────────────────────
  let generatedImageUrl: string | undefined;
  let visualBrief: string | undefined;

  try {
    const genAI = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY)! });

    const imageResponse = await genAI.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [{ role: "user", parts: [{ text: imageGenPrompt }] }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        numberOfImages: 1,
      } as Record<string, unknown>,
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
    }
  } catch (err) {
    console.error("[visualize] Step 2 (Gemini image gen) failed — falling back to visual brief:", err);
    // Fallback: use the image gen prompt itself as the visual brief
    visualBrief = imageGenPrompt;
  }

  return res.status(200).json({
    generatedImageUrl,
    visualBrief,
    improvementSummary,
    changesApplied,
  });
}
