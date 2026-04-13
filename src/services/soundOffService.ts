// soundOffService.ts — Client for /api/sound-off-check

import { supabase } from "../lib/supabase";

export interface SoundOffItem {
  id: string;
  label: string;
  pass: boolean;
  severity: "critical" | "warning" | "pass";
  fix: string | null;
}

export interface SoundOffResult {
  overallPass: boolean;
  score: number;
  items: SoundOffItem[];
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export async function generateSoundOffCheck(
  geminiAnalysis: string,
  platform: string,
): Promise<SoundOffResult> {
  const token = await getAuthToken();
  const response = await fetch("/api/sound-off-check", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ geminiAnalysis, format: "video", platform }),
  });

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "Sound-off check failed");
  }

  return response.json();
}
