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
  /** Blob URL already owned by the parent. If provided, ProgressCard uses it directly and will NOT revoke it. */
  sharedFileObjectUrl?: string | null;
  /** Single-column card (no creative preview) — e.g. Ad Breakdown URL flow */
  compact?: boolean;
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
  "Detecting banner format...",
  "Checking brand presence...",
  "Scoring placement fit...",
  "Analyzing platform best practices...",
  "Finalizing scorecard...",
];

const STEP_DELAYS = [3000, 2500, 3500, 2500, 2000];

export function ProgressCard({
  file,
  status,
  onCancel,
  onComplete,
  format = "video",
  title: titleProp,
  sharedFileObjectUrl,
  compact = false,
}: ProgressCardProps) {
  const title = titleProp ?? "Analyzing your ad";
  const SUBTITLES = format === "static" ? STATIC_SUBTITLES : VIDEO_SUBTITLES;

  const [currentStep, setCurrentStep] = useState(0);
  const thumbnailDataUrl = useThumbnail(file ?? null);
  const isImage = file?.type.startsWith("image/") ?? false;

  // If parent passed a shared blob URL, use it directly (parent owns the lifecycle).
  // Otherwise create and revoke our own.
  const ownPreviewUrl = useMemo(() => {
    if (sharedFileObjectUrl || !file) return null;
    return URL.createObjectURL(file);
  }, [file, sharedFileObjectUrl]);

  useEffect(() => {
    return () => { if (ownPreviewUrl) URL.revokeObjectURL(ownPreviewUrl); };
  }, [ownPreviewUrl]);

  const previewUrl = sharedFileObjectUrl ?? ownPreviewUrl;

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

  const subtitle = SUBTITLES[Math.min(currentStep, SUBTITLES.length - 1)];
  const truncatedName = (() => {
    if (!file) return "";
    const n = sanitizeFileName(file.name);
    return n.length > 32 ? n.slice(0, 29) + "..." : n;
  })();

  return (
    <div className={cn("flex flex-1 items-center justify-center p-6", compact && "pt-2")}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]",
          compact ? "max-w-[440px] flex-col" : "flex max-w-[768px] min-h-[360px] md:min-h-[474px]",
        )}
      >

        {/* ── Left — creative preview ── */}
        {!compact && (
        <div className="relative m-[6px] min-h-[280px] flex-1 overflow-hidden rounded-xl bg-[color:var(--bg)]">
          {thumbnailDataUrl ? (
            <motion.img
              src={thumbnailDataUrl}
              alt={file ? sanitizeFileName(file.name) : "Ad creative"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 w-full h-full object-cover`}
            />
          ) : !isImage && previewUrl ? (
            <video
              src={previewUrl}
              muted
              playsInline
              preload="auto"
              autoPlay={false}
              className="absolute inset-0 w-full h-full object-cover"
              onLoadedData={(e) => {
                const v = e.currentTarget;
                if (v.readyState >= 2) {
                  v.currentTime = Math.min(1.0, (v.duration || 10) * 0.1);
                }
              }}
              onSeeked={(e) => {
                // Force repaint to avoid black frame artifact on some browsers
                const v = e.currentTarget;
                v.style.opacity = '0.99';
                requestAnimationFrame(() => { v.style.opacity = ''; });
              }}
            />
          ) : isImage && previewUrl ? (
            <motion.img
              src={previewUrl}
              alt={file ? sanitizeFileName(file.name) : "Ad creative"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 w-full h-full object-cover`}
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
        )}

        {/* ── Right — progress (full width when compact) ── */}
        <div
          className={cn(
            "flex flex-shrink-0 flex-col",
            compact ? "w-full p-6" : "w-[300px] p-8",
          )}
        >

          {/* Header */}
          <div className={cn("mb-8 flex flex-col items-center gap-1.5", compact && "mb-6")}>
            <p className="m-0 text-center text-[18px] font-semibold tracking-[-0.45px] text-[color:var(--ink)]">{title}</p>
            <div className="min-h-[20px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="m-0 text-center text-[13px] text-[color:var(--ink-muted)]"
                >
                  {subtitle}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-8 h-px bg-[color:var(--border)]" />

          {/* Dimension bars */}
          <div className="flex flex-1 flex-col gap-5">
            {DIMENSIONS.map((label, i) => {
              const dimState = getDimensionState(i);
              return (
                <div key={label} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[14px] font-medium transition-colors duration-300",
                        dimState === "complete"
                          ? "text-[color:var(--success)]"
                          : dimState === "progress"
                            ? "text-[color:var(--ink)]"
                            : "text-zinc-700",
                      )}
                    >
                      {label}
                    </span>
                    <div
                      className={cn(
                        "flex items-center transition-all duration-500",
                        dimState === "complete" ? "scale-100 opacity-100" : "scale-50 opacity-0",
                      )}
                    >
                      <CheckCircle2 size={14} className="text-[color:var(--success)]" />
                    </div>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] ease-out",
                        dimState === "complete" && "w-full bg-[color:var(--success)] duration-[600ms]",
                        dimState === "progress" && "w-[40%] duration-[2000ms]",
                        dimState === "pending" && "w-0 duration-0",
                      )}
                      style={
                        dimState === "progress"
                          ? { background: "var(--grad)" }
                          : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="m-0 text-[13px] text-[color:var(--ink-muted)]">This usually takes 20–30 seconds</p>
            <button
              type="button"
              onClick={onCancel}
              className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--card)]"
            >
              <X size={11} aria-hidden />
              Cancel analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
