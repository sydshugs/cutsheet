// src/components/organic/platformOptimizationAdapter.ts
// Maps the PlatformScore API shape to PlatformOptimizationEntry for the card.
// Stop-gap: if PlatformScore drifts from PlatformOptimizationEntry, fix here.

import type { PlatformScore } from "../../services/claudeService";
import type {
  PlatformOptimizationEntry,
  PlatformOptimizationSignal,
} from "./PlatformOptimizationCard";

// Canonical display labels keyed by the lowercase platform token the API returns.
const PLATFORM_DISPLAY_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  "instagram reels": "Instagram Reels",
  shorts: "YouTube Shorts",
  "youtube shorts": "YouTube Shorts",
  youtube: "YouTube",
  meta: "Meta Feed",
  "meta feed": "Meta Feed",
  facebook: "Facebook",
  instagram: "Instagram",
  "instagram feed": "Instagram",
  pinterest: "Pinterest",
};

function displayLabel(raw: string | undefined): string {
  if (!raw) return "Unknown";
  const normalized = raw.toLowerCase().trim();
  return PLATFORM_DISPLAY_LABEL[normalized] ?? raw;
}

function toSignals(
  input: PlatformScore["signals"],
): PlatformOptimizationSignal[] {
  if (!input || input.length === 0) return [];
  return input.map((s) => ({
    type: s.pass ? "pass" : "fail",
    label: s.label,
  }));
}

function toRecommendations(score: PlatformScore): string[] {
  // Prefer `improvements` (concrete action items), fall back to `tips`.
  if (score.improvements && score.improvements.length > 0) {
    return score.improvements.slice(0, 3);
  }
  if (score.tips && score.tips.length > 0) {
    return score.tips.slice(0, 3);
  }
  return [];
}

export function toPlatformOptimizationEntry(
  score: PlatformScore,
): PlatformOptimizationEntry {
  return {
    name: displayLabel(score.platform),
    score: typeof score.score === "number" ? score.score : 0,
    verdict: score.verdict ?? "",
    signals: toSignals(score.signals),
    recommendations: toRecommendations(score),
  };
}

export function toPlatformOptimizationEntries(
  scores: PlatformScore[] | null | undefined,
): PlatformOptimizationEntry[] {
  if (!scores || scores.length === 0) return [];
  return scores.map(toPlatformOptimizationEntry);
}
