// src/lib/visualizeVideoService.ts — Kling video generation client
// Calls api/visualize-video.ts to animate a seed image into a 5s video clip.

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

/** Call api/visualize-video.ts to generate a Kling video from a seed image. */
export async function animateImage(payload: AnimateImageRequest): Promise<AnimateImageResult> {
  const token = await getAuthToken();
  const response = await fetch("/api/visualize-video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 403 && body?.error === "PRO_REQUIRED") throw new Error("PRO_REQUIRED");
    if (response.status === 429 && body?.error === "CREDIT_LIMIT_REACHED") {
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
    throw new Error((body?.error as string) ?? `API error ${response.status}`);
  }

  return response.json() as Promise<AnimateImageResult>;
}
