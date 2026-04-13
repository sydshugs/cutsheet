// predictionService.ts — Client for /api/predict-performance

import { supabase } from "../lib/supabase";

export interface PredictionResult {
  ctr: { low: number; high: number; benchmark: number; vsAvg: 'above' | 'at' | 'below' };
  cvr: { low: number; high: number };
  hookRetention: { low: number; high: number } | null;
  completionRate?: { low: number; high: number }; // video only
  thumbStop?: { low: number; high: number };       // static only
  fatigueDays: { low: number; high: number };
  confidence: 'Low' | 'Medium' | 'High';
  confidenceReason: string;
  positiveSignals: string[];
  negativeSignals: string[];
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export async function generatePrediction(
  analysisMarkdown: string,
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number },
  platform?: string,
  adType?: 'video' | 'static' | 'display',
  niche?: string,
  intent?: string,
  isOrganic?: boolean,
): Promise<PredictionResult> {
  const token = await getAuthToken();
  const response = await fetch("/api/predict-performance", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ analysisMarkdown, scores, platform, adType, niche, intent, isOrganic }),
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
    throw new Error('Invalid prediction API response: expected object');
  }
  const d = data as Record<string, unknown>;
  if (!d.ctr || typeof d.ctr !== 'object') {
    throw new Error('Invalid prediction API response: missing required field "ctr"');
  }
  if (!d.fatigueDays || typeof d.fatigueDays !== 'object') {
    throw new Error('Invalid prediction API response: missing required field "fatigueDays"');
  }
  if (typeof d.confidence !== 'string') {
    throw new Error('Invalid prediction API response: missing required field "confidence"');
  }
  return data as PredictionResult;
}
