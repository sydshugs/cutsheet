// api/visualize-video.ts — Kling image-to-video: SUBMIT (fire, don't wait)
// Uses fal.queue.submit() to start the job and returns request_id immediately.
// Client polls api/visualize-video-status.ts for completion.
// DO NOT touch api/visualize.ts or api/visualize-v2.ts.
//
// CREDIT FLOW:
// 1. verifyAuth() → get user + tier
// 2. checkRateLimit() → per-user throttle
// 3. Verify isPro → 403 if free tier
// 4. Deduct 1 credit (atomic) → 429 if no credits
// 5. Submit Kling job via fal.queue.submit()
// 6. If submit fails → refund credit
// 7. Return requestId for polling

export const maxDuration = 15; // submit is fast (~2-3s)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";
import { verifyAuth, handlePreflight, isProOrTeam, checkRateLimit } from "./_lib/auth";
import { checkFeatureCredit, refundCredit } from "./_lib/creditCheck";
import { apiError } from "./_lib/apiError.js";

const KLING_ENDPOINT = "fal-ai/kling-video/v2.1/standard/image-to-video";
const DEFAULT_DURATION = "5";
type KlingAspectRatio = "16:9" | "9:16" | "1:1";

function toKlingRatio(input: string): KlingAspectRatio {
  if (input === "16:9") return "16:9";
  if (input === "9:16") return "9:16";
  if (input === "1:1") return "1:1";
  if (input === "4:5" || input === "3:4") return "9:16";
  if (input === "4:3") return "16:9";
  return "9:16";
}

const KLING_PROMPT = `Smooth, continuous, organic motion. Every element moves with gentle, fluid momentum — no hard starts, no sudden stops, no jerky transitions. The clip must loop seamlessly: the final frame must match the opening frame exactly in position, lighting, and state so it plays as a perfect infinite loop with no visible cut point. If text or copy is present in the image, animate it with a subtle fade-up or gentle reveal during the first 1-2 seconds — text should feel like it's appearing, not static. Keep all motion slow and purposeful. Avoid camera shake, flash cuts, or abrupt changes. The overall feel should be cinematic and premium.`;

const KLING_NEGATIVE = "camera shake, flash cuts, hard stops, abrupt motion, flickering, strobing, jitter, rigid movement, visible loop seam, blur, distort, low quality, text glitch, morphing faces";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // ── Rate limit ───────────────────────────────────────────────────────
    const rl = await checkRateLimit("visualize-video", user.id, user.tier, { freeLimit: 0, proLimit: 20, windowSeconds: 86400 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    if (!isProOrTeam(user.tier)) {
      return res.status(403).json({ error: "PRO_REQUIRED", feature: "visualize_video" });
    }

    const credit = await checkFeatureCredit(user.id, user.tier, "visualize_video");
    if (!credit.allowed) {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return res.status(429).json({
        error: "CREDIT_LIMIT_REACHED",
        feature: "visualize_video",
        used: credit.used, limit: credit.limit, tier: user.tier,
        resetDate: resetDate.toISOString(),
      });
    }

    const { imageUrl, aspectRatio = "9:16" } = req.body ?? {};
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const safeAspectRatio = toKlingRatio(aspectRatio);

    // ── DEV MOCK: skip fal.ai entirely in development ─────────────────────
    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === undefined) {
      console.info("[visualize-video] DEV MOCK — returning fake requestId");
      return res.status(200).json({ requestId: "dev-mock-request" });
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error("[visualize-video] FAL_KEY is not set");
      return apiError(res, 'INTERNAL_ERROR', 500, "FAL_KEY is not set");
    }

    fal.config({ credentials: falKey });

    // ── Submit to queue (returns immediately) ─────────────────────────────
    console.info("[visualize-video] Submitting Kling job: aspect=%s", safeAspectRatio);

    let request_id: string;
    try {
      const result = await fal.queue.submit(KLING_ENDPOINT, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input: {
          prompt: KLING_PROMPT,
          image_url: imageUrl,
          duration: DEFAULT_DURATION,
          aspect_ratio: safeAspectRatio,
          negative_prompt: KLING_NEGATIVE,
        } as any,
      });
      request_id = result.request_id;
    } catch (submitErr) {
      // Refund credit — Kling submit failed, user shouldn't lose a credit
      await refundCredit(user.id, user.tier, "visualize_video");
      console.info("[visualize-video] Credit refunded — submit failure");
      return apiError(res, 'GENERATION_FAILED', 500,
        `[visualize-video] submit: ${submitErr instanceof Error ? submitErr.message : String(submitErr)}`);
    }

    // ── Spend logging ─────────────────────────────────────────────────────
    console.info("KLING_JOB_SUBMITTED", {
      userId: user.id,
      requestId: request_id,
      estimatedCost: "$0.28",
      aspectRatio: safeAspectRatio,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ requestId: request_id });
  } catch (err) {
    return apiError(res, 'GENERATION_FAILED', 500,
      `[visualize-video] ${err instanceof Error ? err.message : String(err)}`);
  }
}
