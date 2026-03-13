import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ProgressCardProps {
  file: File;
  status: "uploading" | "processing";
  statusMessage: string;
  onCancel: () => void;
}

const STAGE_HINTS = [
  "Reading video...",
  "Scoring hook strength...",
  "Evaluating CTA clarity...",
  "Generating report...",
];

/** Capture a poster frame from a video file via canvas, or use objectURL for images. */
function useThumbnail(file: File): string | null {
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setThumbnailDataUrl(null);

    // Image files: use object URL directly — no canvas needed
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setThumbnailDataUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    // Video files: seek to 0.1s, capture frame via canvas
    let revoked = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    video.src = url;

    const cleanup = () => {
      if (!revoked) {
        URL.revokeObjectURL(url);
        revoked = true;
      }
      video.removeAttribute("src");
      video.load();
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailDataUrl(canvas.toDataURL("image/jpeg", 0.8));
        }
      } catch {
        // Silently fall back to gray placeholder
      } finally {
        cleanup();
      }
    };

    const onLoaded = () => {
      video.currentTime = 0.1;
    };

    const onError = () => cleanup();

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      cleanup();
    };
  }, [file]);

  return thumbnailDataUrl;
}

export function ProgressCard({ file, status, statusMessage, onCancel }: ProgressCardProps) {
  const [hintIndex, setHintIndex] = useState(0);
  const thumbnailDataUrl = useThumbnail(file);

  // Cycle stage hints every 3s during processing
  useEffect(() => {
    if (status !== "processing") {
      setHintIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % STAGE_HINTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  const currentHint = status === "uploading" ? STAGE_HINTS[0] : STAGE_HINTS[hintIndex];

  return (
    <motion.div
      layoutId="analyzer-card"
      className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 max-w-[480px] mx-auto p-8 flex flex-col items-center gap-5"
    >
      {/* Video thumbnail — captured poster frame or gray fallback */}
      {thumbnailDataUrl ? (
        <img
          src={thumbnailDataUrl}
          alt=""
          className="rounded-2xl border border-white/5 h-[120px] w-full object-cover"
        />
      ) : (
        <div className="rounded-2xl border border-white/5 h-[120px] w-full bg-zinc-800" />
      )}

      {/* Status text with gentle pulse */}
      <p className="text-lg font-medium text-white" style={{ animation: "gentle-pulse 2s ease-in-out infinite" }}>
        Analyzing your creative...
      </p>

      {/* Shimmer bar */}
      <div
        className="h-0.5 w-full rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite",
        }}
      />

      {/* Stage hint with crossfade */}
      <p className="text-xs text-zinc-500 h-4 transition-opacity duration-300">
        {currentHint}
      </p>

      {/* File metadata */}
      <p className="text-xs text-zinc-600 font-mono">
        {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
      </p>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="text-xs text-zinc-500 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </motion.div>
  );
}
