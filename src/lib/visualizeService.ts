// src/lib/visualizeService.ts — Visualize It API client
// Calls v2 (image editing) first, falls back to v1 (image generation) on error.

import { supabase } from "./supabase";
import type { VisualizeRequest, VisualizeResult } from "../types/visualize";

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Resize image to maxDim and convert to base64 string (no data URL prefix). */
export async function fileToBase64(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Failed to read file"));
    img.src = URL.createObjectURL(file);
  });
}

/** Determine the media type. Always returns image/jpeg because fileToBase64 converts via canvas.toDataURL("image/jpeg"). */
export function getMediaType(_file: File): VisualizeRequest["imageMediaType"] {
  return "image/jpeg";
}

// ── Shared error handling for visualize responses ────────────────────────────

function handleVisualizeError(response: Response, body: Record<string, unknown>): never {
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
  if (response.status === 429) throw new Error("RATE_LIMITED");
  throw new Error((body?.error as string) ?? `API error ${response.status}`);
}

// ── V2 call (image editing) ──────────────────────────────────────────────────

async function callVisualizeV2(payload: VisualizeRequest, token: string): Promise<VisualizeResult & { version?: string }> {
  const response = await fetch("/api/visualize-v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    handleVisualizeError(response, body);
  }

  return response.json() as Promise<VisualizeResult & { version?: string }>;
}

// ── V1 call (image generation — fallback) ────────────────────────────────────

async function callVisualizeV1(payload: VisualizeRequest, token: string): Promise<VisualizeResult> {
  const response = await fetch("/api/visualize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    handleVisualizeError(response, body);
  }

  return response.json() as Promise<VisualizeResult>;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Call Visualize v2 (image editing), falling back to v1 (image generation) on error.
 *  Auth errors (401, 403, 429) are NOT retried — they bubble up immediately. */
export async function visualizeAd(payload: VisualizeRequest): Promise<VisualizeResult> {
  const token = await getAuthToken();

  try {
    const result = await callVisualizeV2(payload, token);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // Don't fall back on auth/billing errors — those apply to v1 too
    if (msg === "PRO_REQUIRED" || msg === "CREDIT_LIMIT_REACHED" || msg === "RATE_LIMITED") {
      throw err;
    }

    // V2 failed (model error, timeout, etc.) — silently fall back to v1
    console.warn("[visualizeService] v2 failed, falling back to v1:", msg);
    return callVisualizeV1(payload, token);
  }
}
