// src/types/preflight.ts — Pre-Flight A/B creative testing types

export interface VariantInput {
  id: string;
  label: string;
  file?: File;
  url?: string;
}

export interface RankedVariant {
  rank: number;
  variant: string;
  label: string;
  overallScore: number;
  keyStrength: string;
  keyWeakness: string;
  wouldScale: boolean;
}

export interface ComparisonResult {
  winner: {
    variant: string;
    label: string;
    confidence: "high" | "medium" | "low";
    headline: string;
    reasoning: string;
    predictedLift: string;
  };
  rankings: RankedVariant[];
  headToHead: {
    hookWinner: string;
    hookReason: string;
    ctaWinner: string;
    ctaReason: string;
    retentionWinner: string;
    retentionReason: string;
  };
  recommendation: string;
  hybridNote: string | null;
}

export type TestType = "hook" | "cta" | "full";

export type PreFlightPhase =
  | "idle"
  | "analyzing"
  | "comparing"
  | "done"
  | "error";
