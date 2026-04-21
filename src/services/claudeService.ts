// claudeService.ts — Thin client calling Vercel serverless Claude endpoints

import { supabase } from "../lib/supabase";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

async function callApi<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

  return response.json() as Promise<T>;
}

// ─── PLATFORM SCORING ────────────────────────────────────────────────────────

export interface PlatformScore {
  platform: string;
  score: number;
  platformFit?: number;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  tips?: string[];
  verdict: string;
  /** Organic scoring signals (pass/fail checklist) */
  signals?: { label: string; pass: boolean }[];
}

export async function generatePlatformScore(
  platform: string,
  result: { markdown: string; scores: { overall: number; hook?: number; clarity?: number; cta?: number; production?: number } },
  _fileName: string,
  adType?: 'video' | 'static',
  userContext?: string,
  niche?: string,
): Promise<PlatformScore> {
  return callApi<PlatformScore>("/api/platform-score", {
    analysisMarkdown: result.markdown,
    platform,
    adType: adType ?? 'video',
    userContext,
    niche,
    scores: result.scores,
  });
}

// ─── IMPROVEMENTS ────────────────────────────────────────────────────────────

export async function generateImprovements(
  analysisMarkdown: string,
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  userContext?: string,
  platform?: string,
  sessionMemory?: string,
  adType?: "paid" | "organic"
): Promise<string[]> {
  if (!scores) return [];
  const data = await callApi<{ improvements: string[] }>("/api/improvements", {
    action: "improvements",
    payload: { analysisMarkdown, scores, userContext, platform, sessionMemory, adType },
  });
  return data.improvements ?? [];
}

// ─── CREATIVE BRIEF ──────────────────────────────────────────────────────────

export async function generateBriefWithClaude(
  analysisMarkdown: string,
  filename: string,
  userContext?: string,
  sessionMemory?: string,
  adFormat?: string,
  platform?: string,
): Promise<string> {
  const data = await callApi<{ brief: string }>("/api/improvements", {
    action: "brief",
    payload: { analysisMarkdown, filename, userContext, sessionMemory, adFormat, platform },
  });
  if (!data.brief) throw new Error("Empty brief response");
  return data.brief;
}

// ─── CTA REWRITES ────────────────────────────────────────────────────────────

export async function generateCTARewrites(
  currentCTA: string,
  productContext: string,
  userContext?: string,
  sessionMemory?: string,
  adType?: "paid" | "organic"
): Promise<string[]> {
  const data = await callApi<{ rewrites: string[] }>("/api/improvements", {
    action: "cta-rewrites",
    payload: { currentCTA, productContext, userContext, sessionMemory, adType },
  });
  return data.rewrites ?? [];
}

// ─── SECOND EYE REVIEW ───────────────────────────────────────────────────────

export interface SecondEyeFlag {
  timestamp: string;
  category: "scroll_trigger" | "sound_off" | "pacing" | "clarity" | string;
  severity: "critical" | "warning" | "note";
  issue: string;
  fix: string;
}

export interface SecondEyeResult {
  scrollMoment: string | null;
  flags: SecondEyeFlag[];
  whatItCommunicates: string;
  whatItFails: string;
}

export async function generateSecondEyeReview(
  analysisMarkdown: string,
  fileName: string,
  scores?: { hook: number; overall: number },
  improvements?: string[],
  userContext?: string,
  sessionMemory?: string
): Promise<SecondEyeResult> {
  return callApi<SecondEyeResult>("/api/second-eye", {
    analysisMarkdown,
    fileName,
    scores,
    improvements,
    userContext,
    sessionMemory,
  });
}

// ─── STATIC SECOND EYE (Design Review) ──────────────────────────────────────

export interface StaticSecondEyeFlag {
  area: "typography" | "layout" | "hierarchy" | "contrast";
  severity: "critical" | "warning" | "note";
  issue: string;
  fix: string;
}

export interface StaticSecondEyeResult {
  topIssue: string;
  flags: StaticSecondEyeFlag[];
  overallDesignVerdict: string;
}

export async function generateStaticSecondEye(
  analysisMarkdown: string,
  fileName: string,
  scores?: { overall: number; cta: number },
  improvements?: string[],
  userContext?: string,
  sessionMemory?: string
): Promise<StaticSecondEyeResult> {
  return callApi<StaticSecondEyeResult>("/api/design-review", {
    analysisMarkdown,
    fileName,
    scores,
    improvements,
    userContext,
    sessionMemory,
  });
}

// ─── A/B HYPOTHESIS ─────────────────────────────────────────────────────────

export interface ABHypothesisResult {
  weakestDimension: string;
  weakestScore: number;
  control: string;
  variant: string;
  metric: string;
  liftMin: number;
  liftMax: number;
  rationale: string;
  hypothesis: string;
}

export async function generateABHypothesis(
  scores: Record<string, number>,
  overallScore: number,
  platform: string,
  format: "video" | "static",
  niche: string,
  geminiAnalysis: string,
): Promise<ABHypothesisResult> {
  return callApi<ABHypothesisResult>("/api/ab-hypothesis", {
    scores,
    overallScore,
    platform,
    format,
    niche,
    geminiAnalysis,
  });
}

// ─── THUMBNAIL SCORING ──────────────────────────────────────────────────────

export interface ThumbnailDimensionScore {
  label: string;
  score: number;
  fix: string | null;
}

export interface ThumbnailScoreResult {
  overallScore: number;
  dimensions: ThumbnailDimensionScore[];
  worstDimension: ThumbnailDimensionScore;
  platform: string;
  frameTimestamp: number;
  lowCTRWarning: boolean;
}

export async function scoreThumbnail(
  frameBase64: string,
  mimeType: "image/jpeg",
  platform: string,
  niche: string,
): Promise<ThumbnailScoreResult> {
  return callApi<ThumbnailScoreResult>("/api/thumbnail-score", {
    frameBase64,
    mimeType,
    platform,
    niche,
  });
}

// ─── DISPLAY AD SUITE COHESION ──────────────────────────────────────────────

export interface SuiteIssue {
  severity: "critical" | "warning" | "note";
  issue: string;
  affectedFormats: string[];
  fix: string;
}

export interface SuiteCohesionResult {
  suiteScore: number;
  brandConsistency: number;
  messageConsistency: number;
  visualConsistency: number;
  ctaConsistency: number;
  verdict: string;
  strongestBanner: string;
  weakestBanner: string;
  strengths: string[];
  issues: SuiteIssue[];
  recommendations: string[];
  missingFormats: string[];
}

export async function analyzeSuiteCohesion(
  banners: Array<{ format: string; fileName: string; overallScore: number; improvements?: string[] }>,
  userContext?: string,
  sessionMemory?: string
): Promise<SuiteCohesionResult> {
  return callApi<SuiteCohesionResult>("/api/suite-cohesion", { banners, userContext, sessionMemory });
}

// ─── BEFORE/AFTER COMPARISON ────────────────────────────────────────────────

export interface AddressedImprovement {
  improvement: string;
  addressed: boolean;
  confidence: "high" | "medium" | "low";
  note: string;
}

export interface ComparisonResult {
  scoreChange: number;
  metricChanges: { hook: number; cta: number; clarity: number; production: number };
  improvementsAddressed: AddressedImprovement[];
  verdict: "significantly_better" | "better" | "same" | "worse";
  verdictText: string;
  topWin: string;
  remainingWork: string[];
}

// ─── PLATFORM SCORING (Organic Analyzer) ─────────────────────────────────────
// Note: PlatformScore is already declared above (lines 42-51).
// The organic analyzer uses a compatible subset — the first declaration covers both.


export async function generateComparison(
  originalScores: { overall: number; hook: number; cta: number; clarity: number; production: number },
  improvedScores: { overall: number; hook: number; cta: number; clarity: number; production: number },
  originalImprovements: string[],
  userContext?: string,
  sessionMemory?: string
): Promise<ComparisonResult> {
  return callApi<ComparisonResult>("/api/comparison", {
    originalScores,
    improvedScores,
    originalImprovements,
    userContext,
    sessionMemory,
  });
}
