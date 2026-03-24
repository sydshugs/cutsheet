// DisplayProgressCard.tsx — Unified loading card for Display/Banner ads
// Matches ProgressCard design: split panel with image left, progress right

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { sanitizeFileName } from "../utils/sanitize";
import type { DisplayFormat } from "../utils/displayAdUtils";

interface DisplayProgressCardProps {
  file: File;
  status: "uploading" | "processing";
  statusMessage: string;
  onCancel: () => void;
  format?: DisplayFormat | null;
  dimensions?: { width: number; height: number } | null;
  icon?: LucideIcon;
}

const STAGES = [
  { label: "Reading creative...", metric: null, pct: 10 },
  { label: "Analyzing contrast & visibility...", metric: "Contrast", pct: 25 },
  { label: "Evaluating visual hierarchy...", metric: "Hierarchy", pct: 45 },
  { label: "Checking CTA clarity...", metric: "CTA", pct: 65 },
  { label: "Assessing brand visibility...", metric: "Brand", pct: 80 },
  { label: "Generating report...", metric: null, pct: 95 },
];

const METRICS = ["Contrast & Visibility", "Visual Hierarchy", "CTA Clarity", "Brand Visibility"];

const CHECK_ITEMS = [
  { id: "hierarchy", label: "Visual hierarchy & contrast" },
  { id: "cta",       label: "CTA visibility" },
  { id: "brand",     label: "Brand recognition" },
  { id: "format",    label: "Format compliance" },
  { id: "safe",      label: "Safe area check" },
] as const;

// Map stageIndex (0-5) → which CHECK_ITEMS index is active
const STAGE_TO_CHECK_INDEX = [0, 1, 2, 3, 4, 4] as const;

function ChecklistItem({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300",
        done   ? "border-emerald-500 bg-emerald-500/10"
        : active ? "border-cyan-500 bg-cyan-500/10"
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
              className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"
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

export function DisplayProgressCard({ 
  file, 
  status, 
  onCancel, 
  format, 
  dimensions,
  icon: Icon = Monitor 
}: DisplayProgressCardProps) {
  const [stageIndex, setStageIndex] = useState(0);

  const previewUrl = useMemo(() => {
    if (file.type.startsWith("image/")) return URL.createObjectURL(file);
    return null;
  }, [file]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (status !== "processing") { setStageIndex(0); return; }
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  const stage = STAGES[stageIndex];
  const activeCheckIndex = STAGE_TO_CHECK_INDEX[stageIndex] ?? 0;
  const truncatedName = (() => { 
    const n = sanitizeFileName(file.name); 
    return n.length > 28 ? n.slice(0, 25) + "..." : n; 
  })();

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

          {/* Left half — creative preview */}
          <div className="flex-1 bg-[#1a1a1c] border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col items-center justify-center relative min-h-[220px] md:min-h-[360px] p-6">
            {/* Creative image */}
            {previewUrl ? (
              <motion.img
                src={previewUrl}
                alt={sanitizeFileName(file.name)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-full max-h-[280px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-[14px] bg-cyan-500/10 flex items-center justify-center">
                <Monitor className="w-7 h-7 text-cyan-500" />
              </div>
            )}

            {/* Scanning overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.04) 50%, transparent 100%)",
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* Filename bar — pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-600 font-mono">
                  {truncatedName}
                </span>
                {dimensions && (
                  <span className="text-[10px] text-zinc-700">
                    {dimensions.width}×{dimensions.height}
                  </span>
                )}
              </div>
              <button
                onClick={onCancel}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Format badge overlay */}
            {format && (
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/40 backdrop-blur-sm">
                <span className="text-[11px] text-cyan-400 font-medium">
                  {format.key} · {format.name}
                </span>
              </div>
            )}
          </div>

          {/* Right half — all progress */}
          <div className="flex-1 flex flex-col p-6 md:p-7 min-h-[360px]">

            {/* Header — Monitor icon + label */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-cyan-950 border border-cyan-800/40 rounded-full flex items-center justify-center flex-shrink-0">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon className="w-5 h-5 text-cyan-400" />
                </motion.div>
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-100 m-0">Analyzing your ad</p>
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
                      "text-[13px] w-[140px] flex-shrink-0 transition-colors duration-300",
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
                          className="h-full bg-cyan-500 rounded-full"
                        />
                      ) : isActive ? (
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, rgba(6,182,212,0.1) 25%, rgba(6,182,212,0.3) 50%, rgba(6,182,212,0.1) 75%)",
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
                        className="text-[11px] text-cyan-500 w-3.5 text-right flex-shrink-0"
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
                    label={item.label}
                    done={i < activeCheckIndex}
                    active={i === activeCheckIndex}
                  />
                ))}
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
