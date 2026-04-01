// ProgressCard.tsx — Concept B: Split panel — image left, progress right

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useThumbnail } from "../hooks/useThumbnail";
import { sanitizeFileName } from "../utils/sanitize";

interface ProgressCardProps {
  file?: File | null;
  status: "uploading" | "processing" | "analyzing";
  statusMessage: string;
  onCancel: () => void;
  onComplete?: () => void;
  platform?: string;
  format?: "video" | "static";
  icon?: LucideIcon;
  title?: string;
}

const DIMENSIONS = ["Hook Strength", "Message Clarity", "CTA Effectiveness", "Production Quality"];

const VIDEO_SUBTITLES = [
  "Evaluating first 3 seconds...",
  "Checking brand presence...",
  "Scoring CTA clarity...",
  "Analyzing platform best practices...",
  "Finalizing scorecard...",
];

const STATIC_SUBTITLES = [
  "Scanning visual hierarchy...",
  "Checking brand presence...",
  "Scoring CTA clarity...",
  "Analyzing platform best practices...",
  "Finalizing scorecard...",
];

const STEP_DELAYS = [3000, 2500, 3500, 2500, 2000];

export function ProgressCard({ file, status, onCancel, onComplete, format = "video", title: titleProp }: ProgressCardProps) {
  const title = titleProp ?? "Analyzing your ad";
  const SUBTITLES = format === "static" ? STATIC_SUBTITLES : VIDEO_SUBTITLES;

  const [currentStep, setCurrentStep] = useState(0);
  const thumbnailDataUrl = useThumbnail(file ?? null);
  const isImage = file?.type.startsWith("image/") ?? false;

  const previewUrl = useMemo(() => {
    if (isImage && file) return URL.createObjectURL(file);
    return null;
  }, [file, isImage]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Step sequencer — setTimeout chain matching Figma animation timing
  useEffect(() => {
    if (status !== "processing" && status !== "analyzing") { setCurrentStep(0); return; }
    let timeout: ReturnType<typeof setTimeout>;
    const advance = (step: number) => {
      if (step > 4) return;
      setCurrentStep(step);
      if (step < 4) {
        timeout = setTimeout(() => advance(step + 1), STEP_DELAYS[step]);
      } else {
        timeout = setTimeout(() => onComplete?.(), STEP_DELAYS[step]);
      }
    };
    timeout = setTimeout(() => advance(0), 600);
    return () => clearTimeout(timeout);
  }, [status, onComplete]);

  const getDimensionState = (i: number): "pending" | "progress" | "complete" => {
    if (i < 3) {
      if (currentStep === i) return "progress";
      if (currentStep > i) return "complete";
      return "pending";
    }
    // dim 3 (Production Quality): active on steps 3 and 4
    if (currentStep === 3 || currentStep === 4) return "progress";
    if (currentStep >= 5) return "complete";
    return "pending";
  };

  const displayUrl = thumbnailDataUrl || previewUrl;
  const subtitle = SUBTITLES[Math.min(currentStep, SUBTITLES.length - 1)];
  const truncatedName = (() => {
    if (!file) return "";
    const n = sanitizeFileName(file.name);
    return n.length > 32 ? n.slice(0, 29) + "..." : n;
  })();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className={cn(
        "w-full max-w-[768px]",
        "bg-[#18181b] border border-white/[0.06]",
        "rounded-2xl overflow-hidden",
        "flex",
        "min-h-[360px] md:min-h-[474px]",
      )}>

        {/* ── Left — creative preview ── */}
        <div className="relative bg-[#09090b] rounded-xl m-[6px] overflow-hidden flex-1 min-h-[280px]">
          {displayUrl ? (
            <motion.img
              src={displayUrl}
              alt={file ? sanitizeFileName(file.name) : "Ad creative"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-white/[0.02]" />
          )}

          {/* Scanning overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.04) 50%, transparent 100%)" }}
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(to top, #09090b 0%, rgba(9,9,11,0.6) 50%, transparent 100%)" }}
          />

          {/* Filename */}
          {file && (
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
              <span className="text-[12px] font-mono text-zinc-500 tracking-[-0.02em]">
                {truncatedName} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          )}
        </div>

        {/* ── Right — progress ── */}
        <div className="flex flex-col p-8 w-[300px] flex-shrink-0">

          {/* Header */}
          <div className="flex flex-col items-center gap-1.5 mb-8">
            <p className="text-[18px] font-semibold text-white text-center tracking-[-0.45px] m-0">{title}</p>
            <div className="min-h-[20px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="text-[13px] text-zinc-500 text-center m-0"
                >
                  {subtitle}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-8" />

          {/* Dimension bars */}
          <div className="flex flex-col gap-5 flex-1">
            {DIMENSIONS.map((label, i) => {
              const dimState = getDimensionState(i);
              return (
                <div key={label} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[14px] font-medium transition-colors duration-300",
                      dimState === "complete" ? "text-zinc-500"
                      : dimState === "progress"  ? "text-white"
                      :                           "text-zinc-700"
                    )}>
                      {label}
                    </span>
                    <div className={cn(
                      "transition-all duration-500 flex items-center",
                      dimState === "complete" ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )}>
                      <CheckCircle2 size={14} className="text-[#10b981]" />
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all ease-out",
                      dimState === "complete" ? "bg-[#10b981] duration-[600ms] w-full"
                      : dimState === "progress"  ? "bg-[#6366f1] duration-[2000ms] w-[65%]"
                      :                           "bg-[#6366f1] duration-0 w-0"
                    )} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-3 mt-8">
            <p className="text-[13px] text-zinc-500 m-0">This usually takes 20–30 seconds</p>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-400 transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              <X size={11} />
              Cancel analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
