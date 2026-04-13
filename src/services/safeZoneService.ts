// safeZoneService.ts — Client for /api/safe-zone

import { supabase } from "../lib/supabase";

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated — please sign in");
  return session.access_token;
}

/**
 * Analyze an image for platform safe-zone compliance.
 * Returns the raw API response — caller is responsible for typing.
 */
export async function analyzeSafeZone<T = unknown>(
  imageData: string,
  mimeType: string,
  platform: string,
  mode: string,
): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch("/api/safe-zone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ imageData, mimeType, platform, mode }),
  });

  const data = await res.json() as T & { error?: string; message?: string };

  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ??
      (data as { error?: string }).error ??
      "Analysis failed"
    );
  }

  return data;
}
