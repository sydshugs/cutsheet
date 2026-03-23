// ProgressCard.tsx — Concept B: Split panel — image left, progress right

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useThumbnail } from "../hooks/useThumbnail";
import { sanitizeFileName } from "../utils/sanitize";

interface ProgressCardProps {
  file: File;
  status: "uploading" | "processing";
  statusMessage: string;
  onCancel: () => void;
  platform?: string;
  icon?: LucideIcon;
}

const STAGES = [
  { label: "Reading creative...", metric: null, pct: 10 },
  { label: "Scoring hook strength...", metric: "Hook", pct: 30 },
  { label: "Evaluating message clarity...", metric: "Clarity", pct: 50 },
  { label: "Analyzing CTA effectiveness...", metric: "CTA", pct: 70 },
  { label: "Assessing production quality...", metric: "Production", pct: 85 },
  { label: "Generating report...", metric: null, pct: 95 },
];

const METRICS = ["Hook Strength", "Message Clarity", "CTA Effectiveness", "Production Quality"];

const CHECK_ITEMS = [
  { id: "hook",     label: "Hook & scroll-stop power" },
  { id: "cta",      label: "CTA clarity + urgency" },
  { id: "visual",   label: "Visual hierarchy & brand" },
  { id: "platform", label: "Platform fit for {platform}" },
  { id: "policy",   label: "Policy risk flags" },
] as const;

// Map stageIndex (0-5) → which CHECK_ITEMS index is active
const STAGE_TO_CHECK_INDEX = [0, 1, 2, 3, 4, 4] as const;

function ChecklistItem({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300",
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
              <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                <polyline
                  points="1.5,5 4,7.5 8.5,2"
                  stroke="var(--success)"
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
        "text-[11px] transition-colors duration-300",
        done   ? "text-zinc-500"
        : active ? "text-zinc-200"
        :          "text-zinc-600"
      )}>
        {label}
      </span>
    </div>
  );
}

export function ProgressCard({ file, status, onCancel, platform, icon: Icon = Zap }: ProgressCardProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const thumbnailDataUrl = useThumbnail(file);
  const isImage = file.type.startsWith("image/");

  const previewUrl = useMemo(() => {
    if (isImage) return URL.createObjectURL(file);
    return null;
  }, [file, isImage]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (status !== "processing") { setStageIndex(0); return; }
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [status]);

  const stage = STAGES[stageIndex];
  const displayUrl = thumbnailDataUrl || previewUrl;
  const activeCheckIndex = STAGE_TO_CHECK_INDEX[stageIndex] ?? 0;
  const platformLabel = platform && platform !== "all" ? platform : "your platform";
  const truncatedName = (() => { const n = sanitizeFileName(file.name); return n.length > 28 ? n.slice(0, 25) + "..." : n; })();

  return (
    <>
      {/* Outer — full height, centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Unified container — split panel */}
        <div className={cn(
          "w-full max-w-[720px]",
          "border border-white/[0.06]",
          "rounded-2xl overflow-hidden",
          "flex flex-col md:flex-row",
          "min-h-[360px]",
        )}
          style={{ background: "var(--surface-2)" }}
        >

          {/* ── Left half — creative preview ── */}
          <div
            className="flex-1 border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col items-center justify-center relative min-h-[220px] md:min-h-[360px] p-6"
            style={{ background: "var(--surface-3)" }}
          >
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
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5}>
                  <path d="M5 3l14 9-14 9V3z"/>
                </svg>
              </div>
            )}

            {/* Scanning overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, transparent 0%, var(--accent-bg) 50%, transparent 100%)",
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* Filename bar — pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-3 border-t border-white/[0.04]">
              <span className="text-[11px] text-zinc-600 font-mono">
                {truncatedName} · {(file.size / 1024 / 1024).toFixed(1)} MB
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
          <div className="flex-1 flex flex-col p-5 md:p-6 min-h-[360px]">

            {/* Header — Zap icon + label */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
              >
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                </motion.div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100 m-0">Analyzing your ad</p>
                <div className="min-h-[16px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={stageIndex}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] text-zinc-500 m-0"
                    >
                      {stage.label}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Metric bars */}
            <div className="flex flex-col gap-2.5 mb-5">
              {METRICS.map((metric, i) => {
                const isActive = stageIndex >= i + 1;
                const isDone = stageIndex > i + 1;
                return (
                  <div key={metric} className="flex items-center gap-3">
                    <span className={cn(
                      "text-[11px] w-[120px] flex-shrink-0 transition-colors duration-300",
                      isActive ? "text-zinc-400" : "text-zinc-700"
                    )}>
                      {metric}
                    </span>
                    <div className="flex-1 h-[2px] bg-white/[0.07] rounded-full overflow-hidden">
                      {isDone ? (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                      ) : isActive ? (
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, var(--accent-bg) 25%, var(--accent-bg-hover) 50%, var(--accent-bg) 75%)",
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
                        className="text-[11px] w-3.5 text-right flex-shrink-0"
                        style={{ color: "var(--accent)" }}
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
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest m-0 mb-3">
                What we're checking
              </p>
              <div className="flex flex-col gap-2">
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

            {/* Overall progress bar — pinned to bottom */}
            <div className="mt-auto pt-4">
              <div className="w-full h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${stage.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-text))" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </>
  );
}
