// src/hooks/useVisualize.ts
// Encapsulates all Visualize It + Motion Preview (Kling) state and handlers
// for the PaidAdAnalyzer (and any future analyzer that adopts it).

import { useState } from "react";
import { visualizeAd } from "../lib/visualizeService";
import { animateImage } from "../lib/visualizeVideoService";
import {
  uploadImageToStorage,
  uploadDataUriToStorage,
  removeFromStorage,
} from "../lib/storageService";
import type {
  VisualizeResult,
  VisualizeStatus,
  VisualizeCreditData,
} from "../types/visualize";
import type { AnalysisResult } from "../services/analyzerService";

// ─── Params ───────────────────────────────────────────────────────────────────

export interface UseVisualizeParams {
  file: File | null;
  format: string;
  platform: string;
  thumbnailDataUrl: string | null;
  activeResult: AnalysisResult | null;
  userContext: string;
  onUpgradeRequired: (feature: string) => void;
}

// ─── Return shape ─────────────────────────────────────────────────────────────

export interface UseVisualizeReturn {
  // State
  visualizeOpen: boolean;
  setVisualizeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  visualizeStatus: VisualizeStatus;
  setVisualizeStatus: React.Dispatch<React.SetStateAction<VisualizeStatus>>;
  visualizeResult: VisualizeResult | null;
  setVisualizeResult: React.Dispatch<React.SetStateAction<VisualizeResult | null>>;
  visualizeError: string | null;
  setVisualizeError: React.Dispatch<React.SetStateAction<string | null>>;
  visualizeCreditData: VisualizeCreditData | null;
  setVisualizeCreditData: React.Dispatch<React.SetStateAction<VisualizeCreditData | null>>;
  motionVideoUrl: string | null;
  setMotionVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  motionLoading: boolean;
  setMotionLoading: React.Dispatch<React.SetStateAction<boolean>>;
  motionError: string | null;
  setMotionError: React.Dispatch<React.SetStateAction<string | null>>;
  motionSource: "improved" | "original" | null;
  setMotionSource: React.Dispatch<React.SetStateAction<"improved" | "original" | null>>;
  // Handlers
  handleVisualize: () => Promise<void>;
  handleMotionPreview: () => Promise<void>;
  handleAnimateVisualized: () => Promise<void>;
  handleAnimateOriginalFromPanel: () => Promise<void>;
  resetVisualize: () => void;
}

// ─── Helper: detect aspect ratio from a File object ──────────────────────────

async function detectAspectRatio(
  file: File,
): Promise<"9:16" | "4:5" | "16:9"> {
  const img = new Image();
  const ratio = await new Promise<number>((resolve) => {
    img.onload = () => resolve(img.width / img.height);
    img.onerror = () => resolve(1);
    img.src = URL.createObjectURL(file);
  });
  if (ratio > 1.2) return "16:9";
  if (ratio > 0.9) return "4:5";
  return "9:16";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVisualize({
  file,
  format,
  platform,
  thumbnailDataUrl,
  activeResult,
  userContext,
  onUpgradeRequired,
}: UseVisualizeParams): UseVisualizeReturn {
  // ── Visualize It state ────────────────────────────────────────────────────
  const [visualizeOpen, setVisualizeOpen] = useState(false);
  const [visualizeStatus, setVisualizeStatus] = useState<VisualizeStatus>("idle");
  const [visualizeResult, setVisualizeResult] = useState<VisualizeResult | null>(null);
  const [visualizeError, setVisualizeError] = useState<string | null>(null);
  const [visualizeCreditData, setVisualizeCreditData] = useState<VisualizeCreditData | null>(null);

  // ── Motion Preview (Kling) state ──────────────────────────────────────────
  const [motionVideoUrl, setMotionVideoUrl] = useState<string | null>(null);
  const [motionLoading, setMotionLoading] = useState(false);
  const [motionError, setMotionError] = useState<string | null>(null);
  const [motionSource, setMotionSource] = useState<"improved" | "original" | null>(null);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetVisualize = () => {
    setVisualizeOpen(false);
    setVisualizeStatus("idle");
    setVisualizeResult(null);
    setVisualizeError(null);
    setVisualizeCreditData(null);
    setMotionVideoUrl(null);
    setMotionLoading(false);
    setMotionError(null);
    setMotionSource(null);
  };

  // ── handleVisualize ───────────────────────────────────────────────────────
  const handleVisualize = async () => {
    if (!activeResult?.scores || !file) return;
    setVisualizeOpen(true);
    setVisualizeStatus("loading");
    setVisualizeResult(null);
    setVisualizeError(null);

    try {
      // For video: use thumbnail (hook frame) as the creative input
      let imageFile: File = file;
      if (format === "video") {
        if (!thumbnailDataUrl) {
          setVisualizeError("Could not extract a frame from this video.");
          setVisualizeStatus("error");
          return;
        }
        const blob = await fetch(thumbnailDataUrl).then((r) => r.blob());
        imageFile = new File([blob], "hook-frame.jpg", { type: "image/jpeg" });
      }

      const { signedUrl: imageStorageUrl, storagePath } = await uploadImageToStorage(
        imageFile,
        1200,
        0.85,
      );
      const niche =
        userContext.match(/Niche:\s*(.+)/)?.[1]?.trim() || "general";
      // Meta static ads use platform-native CTA — exclude CTA from generated creative
      const isMetaStatic = platform === "Meta" && format === "static";
      const cleanPlatform = platform === "all" ? "general" : platform;

      const result = await visualizeAd({
        imageStorageUrl,
        imageMediaType: "image/jpeg",
        analysisResult: {
          scores: activeResult.scores as Record<string, number>,
          improvements: activeResult.improvements ?? [],
          markdown: activeResult.markdown,
        },
        platform: cleanPlatform,
        niche,
        adType: "static",
        excludeCta: isMetaStatic,
        visualizeContext: {
          adType: "paid",
          format: format as "static" | "video",
          platform: cleanPlatform,
          excludeCta: isMetaStatic,
        },
      });

      setVisualizeResult(result);
      setVisualizeStatus("complete");
      removeFromStorage(storagePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") {
        setVisualizeOpen(false);
        setVisualizeStatus("idle");
        onUpgradeRequired("visualize");
        return;
      }
      if (
        msg === "CREDIT_LIMIT_REACHED" &&
        err &&
        typeof err === "object" &&
        "creditData" in err
      ) {
        const creditErr = err as Error & { creditData: VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setVisualizeError(msg.includes("RATE_LIMITED") ? "RATE_LIMITED" : msg);
      setVisualizeStatus("error");
    }
  };

  // ── handleMotionPreview ───────────────────────────────────────────────────
  // Animates the ORIGINAL uploaded image (no Gemini edit)
  const handleMotionPreview = async () => {
    if (!file || motionLoading) return;
    setMotionLoading(true);
    setMotionError(null);
    setMotionVideoUrl(null);

    try {
      const { signedUrl } = await uploadImageToStorage(file, 1024, 0.85);
      const aspectRatio = await detectAspectRatio(file);
      const result = await animateImage({ imageUrl: signedUrl, aspectRatio });
      setMotionVideoUrl(result.videoUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") {
        onUpgradeRequired("visualize_video");
        return;
      }
      if (
        msg === "CREDIT_LIMIT_REACHED" &&
        err &&
        typeof err === "object" &&
        "creditData" in err
      ) {
        const creditErr = err as Error & { creditData: VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        setVisualizeOpen(true);
        return;
      }
      setMotionError(msg);
    } finally {
      setMotionLoading(false);
    }
  };

  // ── handleAnimateVisualized ───────────────────────────────────────────────
  // Animates the Gemini-improved image from Visualize v2
  const handleAnimateVisualized = async () => {
    if (motionLoading) return;
    const seedDataUri = visualizeResult?.generatedImageUrl;
    if (!seedDataUri) return;

    setMotionLoading(true);
    setMotionError(null);
    setMotionVideoUrl(null);
    setMotionSource("improved");

    let tempStoragePath: string | undefined;
    try {
      // Gemini returns a data: URI — Kling needs a public URL.
      const { signedUrl, storagePath } = await uploadDataUriToStorage(seedDataUri);
      tempStoragePath = storagePath;

      const aspectRatio = file
        ? await detectAspectRatio(file)
        : ("9:16" as const);

      const result = await animateImage({ imageUrl: signedUrl, aspectRatio });
      setMotionVideoUrl(result.videoUrl);

      // Cleanup temp image from Supabase
      if (tempStoragePath) removeFromStorage(tempStoragePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") {
        onUpgradeRequired("visualize_video");
        return;
      }
      if (
        msg === "CREDIT_LIMIT_REACHED" &&
        err &&
        typeof err === "object" &&
        "creditData" in err
      ) {
        const creditErr = err as Error & { creditData: VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setMotionError(msg);
    } finally {
      setMotionLoading(false);
      // Cleanup on error too
      if (tempStoragePath) removeFromStorage(tempStoragePath);
    }
  };

  // ── handleAnimateOriginalFromPanel ────────────────────────────────────────
  // Animates the original uploaded image (called from within VisualizePanel)
  const handleAnimateOriginalFromPanel = async () => {
    if (!file || motionLoading) return;
    setMotionLoading(true);
    setMotionError(null);
    setMotionVideoUrl(null);
    setMotionSource("original");

    try {
      const { signedUrl } = await uploadImageToStorage(file, 1024, 0.85);
      const aspectRatio = await detectAspectRatio(file);
      const result = await animateImage({ imageUrl: signedUrl, aspectRatio });
      setMotionVideoUrl(result.videoUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "PRO_REQUIRED") {
        onUpgradeRequired("visualize_video");
        return;
      }
      if (
        msg === "CREDIT_LIMIT_REACHED" &&
        err &&
        typeof err === "object" &&
        "creditData" in err
      ) {
        const creditErr = err as Error & { creditData: VisualizeCreditData };
        setVisualizeCreditData(creditErr.creditData);
        setVisualizeStatus("credit_limit");
        return;
      }
      setMotionError(msg);
    } finally {
      setMotionLoading(false);
    }
  };

  return {
    // State
    visualizeOpen,
    setVisualizeOpen,
    visualizeStatus,
    setVisualizeStatus,
    visualizeResult,
    setVisualizeResult,
    visualizeError,
    setVisualizeError,
    visualizeCreditData,
    setVisualizeCreditData,
    motionVideoUrl,
    setMotionVideoUrl,
    motionLoading,
    setMotionLoading,
    motionError,
    setMotionError,
    motionSource,
    setMotionSource,
    // Handlers
    handleVisualize,
    handleMotionPreview,
    handleAnimateVisualized,
    handleAnimateOriginalFromPanel,
    resetVisualize,
  };
}
