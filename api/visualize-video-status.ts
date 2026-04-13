// api/visualize-video-status.ts — Poll Kling job status via fal.ai
// Client calls this every 5s with { requestId } to check if video is ready.

export const maxDuration = 15;

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";
import { verifyAuth, handlePreflight, checkRateLimit } from "./_lib/auth";

const KLING_ENDPOINT = "fal-ai/kling-video/v2.1/standard/image-to-video";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // ── Rate limit (generous — polling endpoint, ~60/min) ────────────────
    const rl = await checkRateLimit("visualize-video-status", user.id, user.tier, { freeLimit: 60, proLimit: 60, windowSeconds: 60 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const { requestId } = req.body ?? {};
    if (!requestId || typeof requestId !== "string") {
      return res.status(400).json({ error: "requestId is required" });
    }

    // ── DEV MOCK: resolve immediately with placeholder ──────────────────
    if (requestId === "dev-mock-request") {
      return res.status(200).json({
        status: "done",
        videoUrl: "https://v3.fal.media/files/placeholder/dev-mock-video.mp4",
        duration: 5,
      });
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) return res.status(500).json({ error: "Server configuration error" });

    fal.config({ credentials: falKey });

    console.info("[visualize-video-status] Checking status for requestId=%s", requestId);
    const status = await fal.queue.status(KLING_ENDPOINT, {
      requestId,
      logs: false,
    });

    if (status.status === "COMPLETED") {
      const result = await fal.queue.result(KLING_ENDPOINT, { requestId });
      const data = result.data as { video?: { url?: string }; duration?: number };
      const videoUrl = data?.video?.url;

      if (!videoUrl) {
        return res.status(200).json({ status: "failed", error: "No video URL in result" });
      }

      console.info("[visualize-video-status] Complete: %s", videoUrl.slice(0, 80));
      return res.status(200).json({ status: "done", videoUrl, duration: data.duration ?? 5 });
    }

    if (status.status === "IN_QUEUE" || status.status === "IN_PROGRESS") {
      return res.status(200).json({ status: "pending" });
    }

    const unknownStatus = (status as { status?: string }).status;
    return res.status(200).json({ status: "failed", error: `Unexpected status: ${unknownStatus}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[visualize-video-status] Error:", msg);
    return res.status(200).json({ status: "failed", error: msg });
  }
}
