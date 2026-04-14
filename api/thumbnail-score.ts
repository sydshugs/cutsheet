// api/thumbnail-score.ts — Gemini vision endpoint for thumbnail/still frame scoring
// Scores a video thumbnail across 5 dimensions for YouTube/TikTok/Shorts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { validateBase64Size } from "./_lib/validateInput";

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const GEMINI_MODEL = "gemini-2.5-flash";
const RATE = { freeLimit: 10, proLimit: 60, windowSeconds: 86400 };

const ALLOWED_PLATFORMS = ["youtube", "tiktok", "shorts"];
const DIMENSION_LABELS = [
  "Contrast",
  "Text Readability",
  "Face Visibility",
  "Emotion",
  "Curiosity Gap",
];

function safePlatform(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "YouTube";
  const lower = raw.toLowerCase().trim();
  if (ALLOWED_PLATFORMS.includes(lower)) {
    if (lower === "youtube") return "YouTube";
    if (lower === "tiktok") return "TikTok";
    if (lower === "shorts") return "YouTube Shorts";
  }
  return "YouTube";
}

function safeNiche(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "General";
  return raw.replace(/[<>{}[\]]/g, "").trim().slice(0, 100) || "General";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let creditRefund: (() => Promise<void>) | null = null;

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rl = await checkRateLimit("thumbnail_score", user.id, user.tier, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const { frameBase64, mimeType, platform: rawPlatform, niche: rawNiche } = req.body ?? {};

    if (!frameBase64 || typeof frameBase64 !== "string") {
      return res.status(400).json({ error: "frameBase64 is required" });
    }

    const sizeError = validateBase64Size(frameBase64, "frameBase64");
    if (sizeError) return res.status(400).json({ error: sizeError });

    const safeMime: string = mimeType === "image/jpeg" ? "image/jpeg" : "image/jpeg";
    const platform = safePlatform(rawPlatform);
    const niche = safeNiche(rawNiche);

    // Credit check (Pro/Team only)
    const { checkFeatureCredit, refundCredit } = await import("./_lib/creditCheck");
    const credit = await checkFeatureCredit(user.id, user.tier, "thumbnail_score");
    if (!credit.allowed) {
      return res.status(403).json({
        error: credit.reason === "TIER_BLOCKED" ? "PRO_REQUIRED" : "MONTHLY_LIMIT_REACHED",
        remaining: credit.remaining,
        limit: credit.limit,
      });
    }
    creditRefund = () => refundCredit(user.id, user.tier, "thumbnail_score");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (creditRefund) await creditRefund();
      return res.status(500).json({ error: "Service unavailable" });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    });

    const prompt = `You are a ${platform} thumbnail optimization expert specializing in the ${niche} niche.

This image is a still frame extracted from a video ad thumbnail. Score it across exactly 5 dimensions for ${platform} click-through potential.

SCORING DIMENSIONS (score each 0-10):

1. **Contrast** — Visual pop. Does the thumbnail stand out in a crowded feed? High contrast between subject and background, strong color separation, not muddy or washed out.
   - 8-10: Immediately eye-catching, strong visual separation, pops against any feed background
   - 5-7: Decent contrast but could be stronger, some elements blend together
   - 0-4: Flat, muddy, low contrast, would disappear in a feed

2. **Text Readability** — If text/titles are present, are they legible at small sizes (mobile thumbnail)? Clean fonts, high contrast against background, not cluttered. If NO text is present, score based on whether text SHOULD be added.
   - 8-10: Text is crisp, large enough for mobile, high contrast, easy to read at thumbnail size
   - 5-7: Text exists but is partially obscured, small, or hard to read at thumbnail size
   - 0-4: Text is illegible at thumbnail size, or important text is missing entirely

3. **Face Visibility** — Are human faces clearly visible and well-lit? Faces drive CTR. If no face is present, score based on whether the subject/product is clearly identifiable.
   - 8-10: Clear, well-lit face with visible expression, or strong product/subject visibility
   - 5-7: Face present but partially obscured, poorly lit, or too small
   - 0-4: No identifiable face or subject, or face is hidden/blurry

4. **Emotion** — Does the thumbnail convey a clear emotional signal? Surprise, excitement, curiosity, urgency. Flat/neutral expressions score low.
   - 8-10: Strong, clear emotional expression that creates an immediate reaction
   - 5-7: Some emotional signal but muted or ambiguous
   - 0-4: No emotional signal, neutral, corporate, or lifeless

5. **Curiosity Gap** — Does the thumbnail create a "I need to click this" feeling? Incomplete information, surprising juxtaposition, unexpected elements, pattern interrupts.
   - 8-10: Creates strong curiosity, viewer feels compelled to click to learn more
   - 5-7: Somewhat interesting but doesn't create urgency to click
   - 0-4: No curiosity trigger, viewer can see everything without clicking

PLATFORM CONTEXT:
${platform === "TikTok" ? "TikTok thumbnails appear small in the For You feed. Bold visuals and faces matter most. Text should be minimal but impactful." : platform === "YouTube Shorts" ? "Shorts thumbnails compete in a vertical scroll feed. Strong visual hook needed. Similar to TikTok but YouTube's audience expects slightly more polished production." : "YouTube thumbnails appear alongside 10+ competing videos. Must stand out at small sizes. Text + face + contrast is the winning formula."}

SCORING RULES:
- overallScore = weighted average: Contrast 20%, Text Readability 15%, Face Visibility 25%, Emotion 20%, Curiosity Gap 20%
- For each dimension: if score >= 7.0, set "fix" to null (no fix needed)
- For each dimension: if score < 7.0, provide a specific, actionable fix
- worstDimension = the dimension with the lowest score. Its "fix" MUST be a non-null string.
- lowCTRWarning = true if overallScore < 5.0
- frameTimestamp = 0 (this is a captured frame)

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "overallScore": <number 0-10, one decimal>,
  "dimensions": [
    { "label": "Contrast", "score": <number>, "fix": <string|null> },
    { "label": "Text Readability", "score": <number>, "fix": <string|null> },
    { "label": "Face Visibility", "score": <number>, "fix": <string|null> },
    { "label": "Emotion", "score": <number>, "fix": <string|null> },
    { "label": "Curiosity Gap", "score": <number>, "fix": <string|null> }
  ],
  "worstDimension": { "label": "<label>", "score": <number>, "fix": "<non-null fix string>" },
  "platform": "${platform}",
  "frameTimestamp": 0,
  "lowCTRWarning": <boolean>
}`;

    const result = await model.generateContent([
      { inlineData: { mimeType: safeMime, data: frameBase64 } },
      { text: prompt },
    ]);

    // Handle thinking model output filtering (same as safe-zone.ts)
    const candidate = result.response.candidates?.[0];
    const parts = (candidate?.content?.parts ?? []) as unknown as Array<Record<string, unknown>>;
    const outputText = parts
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text as string)
      .join("");
    const raw = outputText.length > 0 ? outputText : result.response.text();

    console.log(
      "[thumbnail-score] finish:", candidate?.finishReason,
      "| parts:", parts.length,
      "| output len:", outputText.length,
      "| raw len:", raw.length
    );

    // Extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[thumbnail-score] no JSON found. raw preview:", raw.substring(0, 500));
      if (creditRefund) await creditRefund();
      return res.status(500).json({ error: "Thumbnail score parse error" });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      if (creditRefund) await creditRefund();
      return res.status(500).json({ error: "Thumbnail score parse error" });
    }

    // Runtime validation
    const dimensions = parsed.dimensions;
    if (!Array.isArray(dimensions) || dimensions.length !== 5) {
      if (creditRefund) await creditRefund();
      return res.status(500).json({ error: "Thumbnail score parse error" });
    }

    for (let i = 0; i < 5; i++) {
      const d = dimensions[i] as Record<string, unknown>;
      if (d.label !== DIMENSION_LABELS[i]) {
        if (creditRefund) await creditRefund();
        return res.status(500).json({ error: "Thumbnail score parse error" });
      }
      if (typeof d.score !== "number" || d.score < 0 || d.score > 10) {
        if (creditRefund) await creditRefund();
        return res.status(500).json({ error: "Thumbnail score parse error" });
      }
    }

    const worst = parsed.worstDimension as Record<string, unknown> | undefined;
    if (!worst || typeof worst.fix !== "string" || worst.fix.length === 0) {
      if (creditRefund) await creditRefund();
      return res.status(500).json({ error: "Thumbnail score parse error" });
    }

    if (typeof parsed.overallScore !== "number") {
      if (creditRefund) await creditRefund();
      return res.status(500).json({ error: "Thumbnail score parse error" });
    }

    return res.status(200).json({
      overallScore: parsed.overallScore,
      dimensions: parsed.dimensions,
      worstDimension: parsed.worstDimension,
      platform: parsed.platform,
      frameTimestamp: parsed.frameTimestamp,
      lowCTRWarning: parsed.lowCTRWarning === true,
    });
  } catch (err) {
    console.error("[thumbnail-score] error:", err instanceof Error ? err.message : "unknown");
    if (creditRefund) await creditRefund();
    return res.status(500).json({ error: "Thumbnail scoring failed. Please try again." });
  }
}
