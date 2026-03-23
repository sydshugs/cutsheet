// api/visualize-video.ts — Kling image-to-video via fal.ai
// Accepts a seed image URL and returns a 5s animated video clip.
// Used by all three animation scenarios (static motion preview, video hook animate, v2 animate).
// DO NOT touch api/visualize.ts or api/visualize-v2.ts.

export const maxDuration = 60; // Kling generation can take 30-50s

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";
import { verifyAuth, handlePreflight, isProOrTeam } from "./_lib/auth";
import { checkFeatureCredit } from "./_lib/creditCheck";

const KLING_ENDPOINT = "fal-ai/kling-video/v2.1/standard/image-to-video";
const DEFAULT_DURATION = "5"; // string — Kling API requires "5" or "10"
// Kling only supports 16:9, 9:16, 1:1
type KlingAspectRatio = "16:9" | "9:16" | "1:1";

function toKlingRatio(input: string): KlingAspectRatio {
  if (input === "16:9") return "16:9";
  if (input === "9:16") return "9:16";
  if (input === "1:1") return "1:1";
  if (input === "4:5" || input === "3:4") return "9:16";
  if (input === "4:3") return "16:9";
  return "9:16";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // ── Pro/Team gate ─────────────────────────────────────────────────────
    if (!isProOrTeam(user.tier)) {
      return res.status(403).json({ error: "PRO_REQUIRED", feature: "visualize_video" });
    }

    // ── Credit check (separate pool from visualize) ──────────────────────
    const credit = await checkFeatureCredit(user.id, user.tier, "visualize_video");
    if (!credit.allowed) {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return res.status(429).json({
        error: "CREDIT_LIMIT_REACHED",
        feature: "visualize_video",
        used: credit.used,
        limit: credit.limit,
        tier: user.tier,
        resetDate: resetDate.toISOString(),
      });
    }

    // ── Input validation ─────────────────────────────────────────────────
    const { imageUrl, aspectRatio = "9:16" } = req.body ?? {};

    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const safeAspectRatio = toKlingRatio(aspectRatio);

    // ── Configure fal.ai client ──────────────────────────────────────────
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error("[visualize-video] FAL_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    fal.config({ credentials: falKey });

    // ── Call Kling via fal.ai ────────────────────────────────────────────
    console.info("[visualize-video] Starting Kling generation: aspect=%s, duration=%ds",
      safeAspectRatio, DEFAULT_DURATION);

    const result = await fal.subscribe(KLING_ENDPOINT, {
      input: {
        prompt: "Bring this image to life with subtle, natural motion. Gentle movement, smooth transitions.",
        image_url: imageUrl,
        duration: DEFAULT_DURATION,
        aspect_ratio: safeAspectRatio,
        negative_prompt: "blur, distort, low quality, text glitch, morphing faces",
      },
      pollInterval: 2000,
    });

    // ── Extract video URL from result ────────────────────────────────────
    const data = result.data as { video?: { url?: string }; duration?: number };
    const videoUrl = data?.video?.url;

    if (!videoUrl) {
      console.error("[visualize-video] Kling returned no video URL:", JSON.stringify(data).slice(0, 200));
      return res.status(502).json({ error: "Video generation failed — no video returned" });
    }

    console.info("[visualize-video] Kling generation complete: videoUrl=%s", videoUrl.slice(0, 80));

    return res.status(200).json({
      videoUrl,
      duration: data.duration ?? DEFAULT_DURATION,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[visualize-video] Error:", msg);
    return res.status(500).json({ error: "Video generation failed", detail: msg });
  }
}
