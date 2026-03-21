// api/deconstruct.ts — Winning Ad Deconstructor: Gemini visual + Claude teardown

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { validateFetchUrl } from "./_lib/validateUrl";

export const maxDuration = 60; // seconds — Claude + Gemini can take 15-30s

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
// 3 deconstructions/day free, 20/day pro (86400s = 24h window)
const RATE = { freeLimit: 3, proLimit: 20, windowSeconds: 86400 };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    return {
      data: Buffer.from(buffer).toString("base64"),
      mimeType: contentType.split(";")[0].trim(),
    };
  } catch {
    return null;
  }
}

async function fetchYouTubeMeta(
  url: string
): Promise<{ title: string; thumbnailUrl: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return {
      title: data.title ?? "YouTube Ad",
      thumbnailUrl: data.thumbnail_url ?? "",
    };
  } catch {
    return null;
  }
}

async function fetchMetaAdMeta(url: string): Promise<{
  body: string;
  snapshotUrl: string;
  caption: string;
} | null> {
  try {
    const parsed = new URL(url);
    const adId =
      parsed.searchParams.get("id") ?? parsed.searchParams.get("ad_id");
    if (!adId) return null;

    const token = process.env.META_ACCESS_TOKEN;
    if (!token) return null;

    const apiUrl = `https://graph.facebook.com/v21.0/${adId}?fields=ad_creative_body,ad_snapshot_url,ad_creative_link_caption&access_token=${token}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      ad_creative_body?: string;
      ad_snapshot_url?: string;
      ad_creative_link_caption?: string;
    };
    return {
      body: data.ad_creative_body ?? "",
      snapshotUrl: data.ad_snapshot_url ?? "",
      caption: data.ad_creative_link_caption ?? "",
    };
  } catch {
    return null;
  }
}

// ─── GEMINI VISUAL ANALYSIS ──────────────────────────────────────────────────

function buildGeminiVisualPrompt(sourceType: string): string {
  const platformContext: Record<string, string> = {
    meta: "This is a Meta (Facebook/Instagram) ad. Look for: thumb-stop visual, sound-off readability, text overlay compliance (Meta's 20% text rule), CTA button placement, and feed-native aesthetics.",
    tiktok: "This is a TikTok ad. Look for: native UGC feel vs overproduced look, vertical framing, text overlay placement for TikTok's UI safe zones, trending format usage, and creator-style authenticity.",
    youtube: "This is a YouTube ad. Look for: skip-worthy first 5 seconds, horizontal framing quality, end screen CTA setup, audio-dependent elements, and mid-roll retention hooks.",
  };

  return `You are analyzing a paid advertisement from ${sourceType.toUpperCase()}. This is a ${sourceType} ad — evaluate it against ${sourceType}-specific creative standards.

${platformContext[sourceType] || "Evaluate against general paid advertising standards."}

Analyze this ad creative and identify:
1. Hook type (pattern interrupt, curiosity gap, bold claim, social proof, problem-agitate) — and whether this hook style works specifically on ${sourceType}
2. Visual hierarchy — what the eye goes to first, second, third. Is this optimized for ${sourceType}'s feed layout?
3. Emotional triggers present (fear, desire, envy, aspiration, humor, urgency) — which of these performs best on ${sourceType}?
4. Text overlay usage — placement, size, readability. Does it comply with ${sourceType}'s text guidelines?
5. Brand/product presentation style — is it ${sourceType}-native or does it feel like a repurposed asset?
6. CTA placement and style — does the CTA follow ${sourceType} best practices?
7. Estimated target audience based on visual cues and ${sourceType} demographics

Return structured JSON only. No prose, no preamble.
{
  "hookType": "string",
  "visualHierarchy": ["first element", "second element", "third element"],
  "emotionalTriggers": ["trigger1", "trigger2"],
  "textOverlay": "description of text overlay usage and platform compliance",
  "brandPresentation": "description of brand/product style and platform nativeness",
  "ctaStyle": "description of CTA and platform-specific effectiveness",
  "targetAudience": "estimated audience description based on visual cues and platform",
  "platformFit": "how well this creative fits ${sourceType} specifically"
}`;
}

async function runGeminiAnalysis(
  imageUrl: string,
  sourceType: string
): Promise<Record<string, unknown>> {
  try {
    const imageData = await fetchImageAsBase64(imageUrl);
    if (!imageData) return {};

    const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY)!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
      buildGeminiVisualPrompt(sourceType),
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ─── CLAUDE TEARDOWN PROMPT ──────────────────────────────────────────────────

function buildClaudePrompt(
  adContext: string,
  geminiContext: string
): string {
  return `You are a world-class creative strategist and media buyer. Based on this ad analysis data, write a complete Ad Deconstruction Report.

${adContext}

${geminiContext}

Write the following sections in clean markdown. Be specific, not generic. Reference concrete elements from the ad data.

## Why This Ad Works
2-3 sentence executive summary of the core insight that makes this ad effective.

## Hook Analysis
What happens in the first 3 seconds/above the fold. Why it stops the scroll. Hook type and effectiveness score (1-10).

## Psychological Triggers
Bullet list of every trigger used with location/timestamp and explanation of why each one works.

## Structure Breakdown
The narrative arc: Hook → Tension → Resolution → CTA. What each beat achieves.

## CTA Mechanics
Exact CTA language, placement, urgency signals used, what makes it convert.

## What You Can Steal
3 specific, actionable techniques from this ad you can apply immediately to your own creatives.

## Your Brief
A ready-to-use creative brief for making your own version of this ad:
- **Hook concept:**
- **Core message:**
- **Tone & style:**
- **Key visual moments:**
- **CTA recommendation:**
- **Platform optimization notes:**`;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("deconstruct", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res
      .status(429)
      .json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { url, sourceType, mediaUrl } = (req.body ?? {}) as {
    url?: string;
    sourceType?: string;
    mediaUrl?: string;
  };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }
  if (!["meta", "tiktok", "youtube"].includes(sourceType ?? "")) {
    return res
      .status(400)
      .json({ error: "sourceType must be meta, tiktok, or youtube" });
  }

  // ── SSRF protection: validate user-provided URLs ───────────────────────────
  const urlError = validateFetchUrl(url);
  if (urlError) return res.status(400).json({ error: urlError });
  if (mediaUrl) {
    const mediaUrlError = validateFetchUrl(mediaUrl);
    if (mediaUrlError) return res.status(400).json({ error: mediaUrlError });
  }

  // ── Fetch ad metadata and resolve media URL ────────────────────────────────
  let adTitle = "";
  let adBody = "";
  let resolvedMediaUrl = mediaUrl ?? "";

  if (sourceType === "youtube") {
    const meta = await fetchYouTubeMeta(url);
    if (meta) {
      adTitle = meta.title;
      resolvedMediaUrl = resolvedMediaUrl || meta.thumbnailUrl;
    }
  } else if (sourceType === "meta") {
    const meta = await fetchMetaAdMeta(url);
    if (meta) {
      adBody = meta.body;
      resolvedMediaUrl = resolvedMediaUrl || meta.snapshotUrl;
    } else {
      return res.status(422).json({
        error:
          "Couldn't fetch this ad — it may have been removed. Try uploading the creative directly.",
      });
    }
  }
  // TikTok: relies on user-provided mediaUrl

  // ── Gemini visual analysis (non-fatal if it fails) ────────────────────────
  let geminiParsed: Record<string, unknown> = {};
  if (resolvedMediaUrl) {
    geminiParsed = await runGeminiAnalysis(resolvedMediaUrl, sourceType ?? "meta");
  }

  const geminiContext =
    Object.keys(geminiParsed).length > 0
      ? `Visual Analysis (Gemini):\n${JSON.stringify(geminiParsed, null, 2)}`
      : sourceType === "tiktok" && !resolvedMediaUrl
      ? "Note: No visual media provided for TikTok ad — analyze based on available context."
      : "Note: Visual analysis unavailable — analyzing from metadata only.";

  const adContext = [
    adTitle && `Ad title: ${adTitle}`,
    adBody && `Ad copy: ${adBody}`,
    `Source: ${sourceType} (${url})`,
  ]
    .filter(Boolean)
    .join("\n");

  // ── Claude teardown ────────────────────────────────────────────────────────
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[deconstruct] ANTHROPIC_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error — please contact support." });
    }

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: buildClaudePrompt(adContext, geminiContext),
        },
      ],
    });

    const teardown =
      message.content[0].type === "text" ? message.content[0].text : "";
    if (!teardown.trim()) {
      return res
        .status(500)
        .json({ error: "Analysis failed — please try again." });
    }

    return res.status(200).json({
      teardown,
      adTitle: adTitle || url,
      thumbnailUrl: resolvedMediaUrl || "",
      sourceType,
      gemini: geminiParsed,
    });
  } catch (err) {
    console.error("[deconstruct] Claude error:", err);
    const message = err instanceof Error ? err.message : "Deconstruction failed";
    const status = message.includes("RATE_LIMITED") || message.includes("429") || message.includes("resource exhausted") || message.includes("quota") ? 429 : 500;
    return res.status(status).json({ error: message });
  }

  } catch (err: unknown) {
    console.error('[deconstruct] Unhandled error:', err instanceof Error ? err.message : err, err instanceof Error ? err.stack : '');
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
