// api/safe-zone.ts — AI-powered safe zone compliance detection
// Keeps GEMINI_API_KEY server-side only, never exposed to the browser

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
// 10 checks/day free, unlimited pro
const RATE = { freeLimit: 10, proLimit: 9999, windowSeconds: 86400 };

// ─── SAFE ZONE CONFIG (1080×1920 canvas) ─────────────────────────────────────

interface SafeZoneDims {
  top: number;
  bottom: number;
  right: number;
  left: number;
  label: string;
}

const SAFE_ZONE_CONFIG: Record<string, SafeZoneDims> = {
  tiktok:     { top: 130, bottom: 250, right: 80, left: 0,  label: "TikTok" },
  ig_reels:   { top: 100, bottom: 340, right: 75, left: 0,  label: "Instagram Reels" },
  ig_stories: { top: 220, bottom: 120, right: 0,  left: 30, label: "Instagram Stories" },
  yt_shorts:  { top: 120, bottom: 300, right: 80, left: 0,  label: "YouTube Shorts" },
  fb_reels:   { top: 120, bottom: 300, right: 80, left: 0,  label: "Facebook Reels" },
  universal:  { top: 220, bottom: 340, right: 80, left: 30, label: "Universal (All Platforms)" },
};

const ALLOWED_PLATFORMS = Object.keys(SAFE_ZONE_CONFIG);
const ALLOWED_MODES = ["organic", "paid"];

// Sanitize prompt-injected strings (OWASP AITG-APP-01)
function safeSZPlatform(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "tiktok";
  const lower = raw.toLowerCase().trim();
  return ALLOWED_PLATFORMS.includes(lower) ? lower : "tiktok";
}

function safeSZMode(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "paid";
  const lower = raw.toLowerCase().trim();
  return ALLOWED_MODES.includes(lower) ? lower : "paid";
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rl = await checkRateLimit("safe_zone", user.id, user.tier, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const { imageData, mimeType, platform: rawPlatform, mode: rawMode } = req.body ?? {};

    // Validate image data presence
    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ error: "imageData is required" });
    }

    // Validate base64 size (max ~5MB decoded)
    const sizeError = validateBase64Size(imageData, "imageData");
    if (sizeError) return res.status(400).json({ error: sizeError });

    // Validate MIME type — images only (safe zone is visual layout check)
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const safeMime: string = ALLOWED_MIME_TYPES.includes(mimeType) ? mimeType : "image/jpeg";

    // Sanitize prompt-injected fields
    const platform = safeSZPlatform(rawPlatform);
    const mode = safeSZMode(rawMode);
    const sz = SAFE_ZONE_CONFIG[platform];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Service unavailable" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      // gemini-2.5-flash thinking tokens count against maxOutputTokens.
      // 2048 was too tight — thinking consumed ~1800, leaving <250 for JSON.
      // 8192 gives the model room to think AND return a complete response.
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    });

    // Build safe zone description without any user-controlled interpolation
    const dangerZones: string[] = [
      `- Top ${sz.top}px: platform UI, status bar, navigation controls`,
      `- Bottom ${sz.bottom}px: captions, action buttons, engagement row`,
    ];
    if (sz.right > 0) dangerZones.push(`- Right ${sz.right}px: like/comment/share/save icons`);
    if (sz.left > 0) dangerZones.push(`- Left ${sz.left}px: navigation touch targets`);

    const prompt = `You are a ${sz.label} safe zone compliance expert for ${mode} content creators.

This image is a 9:16 vertical video frame or static creative intended for ${sz.label}.
The canvas dimensions are 1080×1920 pixels.

DANGER ZONES (platform UI will overlap content here):
${dangerZones.join("\n")}

SAFE ZONE: Everything outside the danger zones above.

Your task: Identify any important visual elements (text, logos, faces, CTAs, key product shots, subtitles, price/offer callouts) that appear to overlap or sit within the danger zones.

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "issues": [
    {
      "severity": "critical",
      "element": "what element is at risk (e.g. 'CTA button text', 'brand logo')",
      "location": "where it appears (e.g. 'bottom 15% of frame', 'right edge')",
      "fix": "concrete action to fix it (e.g. 'Move CTA up by 60px', 'Shift logo left')"
    }
  ],
  "safe_elements": ["element that is correctly placed", "..."],
  "overall_risk": "high" | "medium" | "low" | "none"
}

Severity rules:
- "critical" = element is fully inside a danger zone and will be hidden
- "warning" = element is near the edge of a danger zone (within 30px) and may be clipped

If no issues are found, return an empty "issues" array and "overall_risk": "none".
Be specific — name the actual visual elements you see, not generic descriptions.`;

    const result = await model.generateContent([
      { inlineData: { mimeType: safeMime, data: imageData } },
      { text: prompt },
    ]);

    // gemini-2.5-flash is a thinking model. SDK 0.24.x concatenates ALL parts
    // (including thought parts) in response.text(), which can produce a raw string
    // that contains no parseable JSON when the model's output is in a thought part.
    // Access parts directly and filter out thought parts to get only the output text.
    const candidate = result.response.candidates?.[0];
    const parts = (candidate?.content?.parts ?? []) as unknown as Array<Record<string, unknown>>;
    const outputText = parts
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text as string)
      .join("");

    // Fall back to response.text() for non-thinking models (also handles safety throws)
    const raw = outputText.length > 0 ? outputText : result.response.text();

    // DIAGNOSTIC: log response shape — never log imageData (OWASP AITG-APP-03)
    console.log(
      "[safe-zone] finish:", candidate?.finishReason,
      "| parts:", parts.length,
      "| output len:", outputText.length,
      "| raw len:", raw.length
    );

    // Extract JSON from response (handle markdown code fences)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[safe-zone] no JSON found. raw preview:", raw.substring(0, 500));
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    // Validate and sanitize output shape (OWASP AITG-APP-05)
    return res.status(200).json({
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      safe_elements: Array.isArray(parsed.safe_elements) ? parsed.safe_elements : [],
      overall_risk: typeof parsed.overall_risk === "string" ? parsed.overall_risk : "unknown",
    });
  } catch (err) {
    // Never log imageData — only log error message (OWASP AITG-APP-03)
    console.error("[safe-zone] error:", err instanceof Error ? err.message : "unknown");
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
}
