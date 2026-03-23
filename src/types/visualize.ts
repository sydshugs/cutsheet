// src/types/visualize.ts — Types for the Visualize It feature

export interface VisualizeRequest {
  /** Preferred: Supabase signed URL (bypasses Vercel 4.5MB body limit). */
  imageStorageUrl?: string;
  /** Legacy fallback: raw base64 image string (no data URL prefix). */
  imageBase64?: string;
  imageMediaType: "image/jpeg" | "image/png" | "image/webp";
  analysisResult: {
    scores: Record<string, number> | null;
    improvements: string[];
    markdown?: string;
  };
  platform: string;
  niche: string;
  adType: "static" | "display";
  /** When true, the generated creative must NOT add any CTA button or CTA text.
   *  Used for Meta static ads where the CTA is placed by the platform. */
  excludeCta?: boolean;
}

export interface VisualizeResult {
  originalImageUrl?: string;
  generatedImageUrl?: string;    // base64 data URL or null if only visual brief
  visualBrief?: string;          // fallback: rich text description for designer
  improvementSummary: string;    // 2-3 sentence summary
  changesApplied: string[];      // bullet list of changes
}

export type VisualizeStatus = "idle" | "loading" | "complete" | "error" | "credit_limit";

export interface VisualizeCreditData {
  used: number;
  limit: number;
  tier: "free" | "pro" | "team";
  resetDate: string; // ISO date string
}
