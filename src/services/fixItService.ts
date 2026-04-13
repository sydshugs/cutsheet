// fixItService.ts — Thin client calling Vercel serverless Fix It endpoint

import { supabase } from "../lib/supabase";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface FixItResult {
  rewrittenHook: { copy: string; reasoning: string };
  revisedBody: string;
  newCTA: { copy: string; placement: string };
  textOverlays: { timestamp: string; copy: string; placement: string }[];
  predictedImprovements: { dimension: string; oldScore: number; newScore: number; reason: string }[];
  editorNotes: string[];
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── API CALL ───────────────────────────────────────────────────────────────

export async function generateFixIt(
  analysisMarkdown: string,
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number },
  platform?: string,
  niche?: string,
  intent?: string,
  adType?: 'video' | 'static' | 'display',
  isOrganic?: boolean,
  ctaFree?: boolean,
): Promise<FixItResult> {
  const token = await getAuthToken();
  const response = await fetch("/api/fix-it", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ analysisMarkdown, scores, platform, niche, intent, adType, isOrganic, ctaFree }),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const secs = (data as { resetAt?: string }).resetAt
      ? Math.ceil((new Date((data as { resetAt: string }).resetAt).getTime() - Date.now()) / 1000)
      : 60;
    throw new Error(`RATE_LIMITED:${secs}`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string; error?: string }).message ?? (data as { error?: string }).error ?? `API error ${response.status}`);
  }

  const data = await response.json() as unknown;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid fix-it API response: expected object');
  }
  const d = data as Record<string, unknown>;
  if (!d.rewrittenHook || typeof d.rewrittenHook !== 'object') {
    throw new Error('Invalid fix-it API response: missing required field "rewrittenHook"');
  }
  if (typeof d.revisedBody !== 'string') {
    throw new Error('Invalid fix-it API response: missing required field "revisedBody"');
  }
  if (!d.newCTA || typeof d.newCTA !== 'object') {
    throw new Error('Invalid fix-it API response: missing required field "newCTA"');
  }
  return data as FixItResult;
}
