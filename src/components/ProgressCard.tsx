// ProgressCard.tsx — Concept B: Split panel — image left, progress right

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useThumbnail } from "../hooks/useThumbnail";
import { sanitizeFileName } from "../utils/sanitize";

interface ProgressCardProps {
  file?: File | null;
  status: "uploading" | "processing" | "analyzing";
  statusMessage: string;
  onCancel: () => void;
  platform?: string;
  format?: "video" | "static";
  icon?: LucideIcon;
  title?: string;
}

const VIDEO_STAGES = [
  { label: "Reading creative...", metric: null, pct: 10 },
  { label: "Scoring hook strength...", metric: "Hook", pct: 30 },
  { label: "Analyzing scene pacing...", metric: "Clarity", pct: 50 },
  { label: "Evaluating CTA effectiveness...", metric: "CTA", pct: 70 },
  { label: "Assessing production quality...", metric: "Production", pct: 85 },
  { label: "Generating report...", metric: null, pct: 95 },
];

const STATIC_STAGES = [
  { label: "Reading creative...", metric: null, pct: 10 },
  { label: "Scoring scroll-stop power...", metric: "Hook", pct: 30 },
  { label: "Evaluating message clarity...", metric: "Clarity", pct: 50 },
  { label: "Analyzing CTA effectiveness...", metric: "CTA", pct: 70 },
  { label: "Assessing visual quality...", metric: "Production", pct: 85 },
  { label: "Generating report...", metric: null, pct: 95 },
];

const DEFAULT_METRICS = ["Hook Strength", "Message Clarity", "CTA Effectiveness", "Production Quality"];

// ── Checklist card ────────────────────────────────────────────────────────────

const VIDEO_CHECK_ITEMS = [
  { id: "opening-hook", label: "Opening hook (first 3 seconds)" },
  { id: "scene-pacing", label: "Scene structure & pacing" },
  { id: "cta",          label: "CTA clarity + urgency" },
  { id: "platform",     label: "Platform fit for {platform}" },
  { id: "policy",       label: "Policy risk flags" },
] as const;

const STATIC_CHECK_ITEMS = [
  { id: "hook",     label: "Hook & scroll-stop power" },
  { id: "visual",   label: "Visual hierarchy & brand" },
  { id: "cta",      label: "CTA clarity + urgency" },
  { id: "platform", label: "Platform fit for {platform}" },
  { id: "policy",   label: "Policy risk flags" },
];

// Map stageIndex (0-5) → which CHECK_ITEMS index is active
const STAGE_TO_CHECK_INDEX = [0, 1, 2, 3, 4, 4] as const;

function ChecklistItem({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300",
        done   ? "border-emerald-500 bg-emerald-500/10"
        : active ? "border-indigo-500 bg-indigo-500/10"
        :          "border-white/10 bg-transparent"
      )}>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <polyline
                  points="1.5,5 4,7.5 8.5,2"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          ) : active ? (
            <motion.div
              key="dot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
            />
          ) : null}
        </AnimatePresence>
      </div>
      <span className={cn(
        "text-sm transition-colors duration-300",
        done   ? "text-zinc-500"
        : active ? "text-zinc-200"
        :          "text-zinc-600"
      )}>
        {label}
      </span>
    </div>
  );
}

export function ProgressCard({ file, status, onCancel, platform, format = "video", icon: IconProp, title: titleProp }: ProgressCardProps) {
  const Icon = IconProp ?? Zap;
  const title = titleProp ?? "Analyzing your ad";
  const METRICS = DEFAULT_METRICS;
  const [stageIndex, setStageIndex] = useState(0);
  const thumbnailDataUrl = useThumbnail(file ?? null);
  const isImage = file?.type.startsWith("image/") ?? false;
  const STAGES = format === "static" ? STATIC_STAGES : VIDEO_STAGES;
  const CHECK_ITEMS = format === "static" ? STATIC_CHECK_ITEMS : VIDEO_CHECK_ITEMS;

  const previewUrl = useMemo(() => {
    if (isImage && file) return URL.createObjectURL(file);
    return null;
  }, [file, isImage]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (status !== "processing" && status !== "analyzing") { setStageIndex(0); return; }
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [status, STAGES.length]);

  const stage = STAGES[stageIndex];
  const displayUrl = thumbnailDataUrl || previewUrl;
  const activeCheckIndex = STAGE_TO_CHECK_INDEX[stageIndex] ?? 0;
  const platformLabel = platform && platform !== "all" ? platform : "your platform";
  const truncatedName = (() => { if (!file) return ""; const n = sanitizeFileName(file.name); return n.length > 28 ? n.slice(0, 25) + "..." : n; })();

  return (
    <>
      {/* Outer — full height, centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Unified container — split panel */}
        <div className={cn(
          "w-full max-w-[720px] min-w-[480px]",
          "bg-[#111113] border border-white/[0.06]",
          "rounded-2xl overflow-hidden",
          "flex flex-col md:flex-row",
          "min-h-[360px]",
        )}>

          {/* ── Left half — creative preview ── */}
          <div className="flex-1 bg-[#1a1a1c] border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col items-center justify-center relative min-h-[220px] md:min-h-[360px] p-6">
            {/* Creative image/video */}
            {displayUrl ? (
              <motion.img
                src={displayUrl}
                alt={sanitizeFileName(file.name)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-full max-h-[280px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-[14px] bg-indigo-500/10 flex items-center justify-center">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}>
                  <path d="M5 3l14 9-14 9V3z"/>
                </svg>
              </div>
            )}

            {/* Scanning overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.04) 50%, transparent 100%)",
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* Filename bar — pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-3 border-t border-white/[0.04]">
              <span className="text-[11px] text-zinc-600 font-mono">
                {file ? `${truncatedName} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "Analyzing..."}
              </span>
              <button
                onClick={onCancel}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* ── Right half — all progress ── */}
          <div className="flex-1 flex flex-col p-6 md:p-7 min-h-[360px]">

            {/* Header — Zap icon + label */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-indigo-950 border border-indigo-800/40 rounded-full flex items-center justify-center flex-shrink-0">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon className="w-5 h-5 text-indigo-400" />
                </motion.div>
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-100 m-0">{title}</p>
                <div className="min-h-[16px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={stageIndex}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="text-[13px] text-zinc-500 m-0"
                    >
                      {stage.label}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Metric bars */}
            <div className="flex flex-col gap-[10px] mb-5">
              {METRICS.map((metric, i) => {
                const isActive = stageIndex >= i + 1;
                const isDone = stageIndex > i + 1;
                return (
                  <div key={metric} className="flex items-center gap-3">
                    <span className={cn(
                      "text-[13px] w-[130px] flex-shrink-0 transition-colors duration-300",
                      isActive ? "text-zinc-400" : "text-zinc-700"
                    )}>
                      {metric}
                    </span>
                    <div className="flex-1 h-[5px] bg-white/[0.07] rounded-full overflow-hidden">
                      {isDone ? (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      ) : isActive ? (
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, rgba(99,102,241,0.1) 25%, rgba(99,102,241,0.3) 50%, rgba(99,102,241,0.1) 75%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.5s infinite",
                          }}
                        />
                      ) : null}
                    </div>
                    {isDone ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[11px] text-indigo-500 w-3.5 text-right flex-shrink-0"
                      >
                        ✓
                      </motion.span>
                    ) : (
                      <span className="w-3.5 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/[0.05] mb-4" />

            {/* Checklist */}
            <div className="flex-1">
              <p className="text-[11px] text-zinc-600 uppercase tracking-[0.06em] m-0 mb-3">
                What we're checking
              </p>
              <div className="flex flex-col gap-2.5">
                {CHECK_ITEMS.map((item, i) => (
                  <ChecklistItem
                    key={item.id}
                    label={item.id === "platform"
                      ? `Platform fit for ${platformLabel}`
                      : item.label}
                    done={i < activeCheckIndex}
                    active={i === activeCheckIndex}
                  />
                ))}
              </div>
            </div>

            {/* Overall progress bar removed — checklist + metric bars are sufficient */}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </>
  );
}
