// src/lib/visualizeService.ts — Visualize It API client

import { supabase } from "./supabase";
import type { VisualizeRequest, VisualizeResult } from "../types/visualize";

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Convert a File object to a base64 string (without the data URL prefix). */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Determine the media type from a File object. */
export function getMediaType(file: File): VisualizeRequest["imageMediaType"] {
  const mime = file.type.toLowerCase();
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  return "image/jpeg";
}

/** Call the /api/visualize endpoint and return the result. */
export async function visualizeAd(payload: VisualizeRequest): Promise<VisualizeResult> {
  const token = await getAuthToken();
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
    if (response.status === 429) throw new Error("RATE_LIMITED");
    throw new Error(body?.error ?? `API error ${response.status}`);
  }

  return response.json() as Promise<VisualizeResult>;
}
