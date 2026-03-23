// src/lib/visualizeVideoService.ts — Kling video generation client (async fire + poll)

import { supabase } from "./supabase";

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export interface AnimateImageRequest {
  imageUrl: string;
  aspectRatio?: "9:16" | "4:5" | "16:9";
}

export interface AnimateImageResult {
  videoUrl: string;
  duration: number;
}

function handleError(body: Record<string, unknown>, status: number): never {
  if (status === 403 && body?.error === "PRO_REQUIRED") throw new Error("PRO_REQUIRED");
  if (status === 429 && body?.error === "CREDIT_LIMIT_REACHED") {
    const err = new Error("CREDIT_LIMIT_REACHED") as Error & {
      creditData: { used: number; limit: number; tier: string; resetDate: string };
    };
    err.creditData = {
      used: (body.used as number) ?? 0,
      limit: (body.limit as number) ?? 0,
      tier: (body.tier as string) ?? "pro",
      resetDate: (body.resetDate as string) ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    };
    throw err;
  }
  throw new Error((body?.error as string) ?? `API error ${status}`);
}

const POLL_INTERVAL = 5000;
const MAX_POLLS = 60; // 5 minutes

/** Submit a Kling video job and poll until completion. */
export async function animateImage(payload: AnimateImageRequest): Promise<AnimateImageResult> {
  const token = await getAuthToken();

  // Step 1: Submit (fast)
  const submitRes = await fetch("/api/visualize-video", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const body = await submitRes.json().catch(() => ({}));
    handleError(body, submitRes.status);
  }

  const { requestId } = await submitRes.json() as { requestId: string };
  if (!requestId) throw new Error("No requestId returned");

  // Step 2: Poll for result
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const statusRes = await fetch("/api/visualize-video-status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.status}`);

    const data = await statusRes.json() as { status: string; videoUrl?: string; duration?: number; error?: string };

    if (data.status === "done" && data.videoUrl) {
      return { videoUrl: data.videoUrl, duration: data.duration ?? 5 };
    }

    if (data.status === "failed") {
      throw new Error(data.error ?? "Video generation failed");
    }
  }

  throw new Error("Video generation timed out after 5 minutes");
}
