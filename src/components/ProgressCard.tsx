import { useState, useEffect, useMemo } from "react";
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

export function ProgressCard({ file, status, statusMessage, onCancel }: ProgressCardProps) {
  const [hintIndex, setHintIndex] = useState(0);

  const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(videoUrl), [videoUrl]);

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
      {/* Video thumbnail */}
      <video
        src={videoUrl}
        muted
        preload="metadata"
        className="rounded-2xl border border-white/5 h-[120px] w-full object-cover"
      />

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
