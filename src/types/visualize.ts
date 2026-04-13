// src/types/visualize.ts — Types for the Visualize It feature

/** Context passed alongside the Visualize request to select the correct prompt quadrant. */
export interface VisualizeContext {
  /** 'paid' for paid ad analyzers, 'organic' for organic content analyzers. */
  adType: "paid" | "organic";
  /** 'static' for image creatives, 'video' for video creatives. */
  format: "static" | "video";
  /** Platform name (e.g. 'Meta', 'TikTok', 'Instagram', 'YouTube'). */
  platform: string;
  /** When true, exclude all CTA elements from generated creative. Auto-set for organic; opt-in for Meta paid static. */
  excludeCta?: boolean;
}

/** Determines how Visualize behaves based on production quality score. */
export type VisualizeMode = "image_gen" | "text_overlay" | "brief";

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
  /** Prompt matrix context — determines which quadrant prompt to inject. */
  visualizeContext?: VisualizeContext;
  /** @deprecated Use visualizeContext.excludeCta instead. Kept for backward compat. */
  excludeCta?: boolean;
  /** Score-gated mode: image_gen (default), text_overlay (production 8+), brief. */
  visualizeMode?: VisualizeMode;
}

export interface VisualizeResult {
  originalImageUrl?: string;
  generatedImageUrl?: string;    // base64 data URL or null if only visual brief
  visualBrief?: string;          // fallback: rich text description for designer
  improvementSummary: string;    // 2-3 sentence summary
  changesApplied: string[];      // bullet list of changes
  briefOnly?: boolean;           // true when text_overlay mode — no credit deducted
}

export type VisualizeStatus = "idle" | "loading" | "complete" | "error" | "credit_limit";

export interface VisualizeCreditData {
  used: number;
  limit: number;
  tier: "free" | "pro" | "team";
  resetDate: string; // ISO date string
}
