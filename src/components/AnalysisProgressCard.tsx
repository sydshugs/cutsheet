// AnalysisProgressCard.tsx — Unified loading card for A/B Test, Competitor, and Rank Creative
// Matches the split-panel design of ProgressCard (organic) and DisplayProgressCard (display)

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Swords, Trophy, Check, Monitor,
  type LucideIcon
} from "lucide-react";
import { useThumbnail } from "../hooks/useThumbnail";
import { sanitizeFileName } from "../utils/sanitize";

// Page-specific configurations
export type AnalysisPageType = "ab-test" | "competitor" | "rank-creative" | "display";

interface PageConfig {
  icon: LucideIcon;
  title: string;
  color: string;
  colorLight: string;
  colorBg: string;
  colorBorder: string;
  metrics: string[];
  checkItems: string[];
}

const PAGE_CONFIGS: Record<AnalysisPageType, PageConfig> = {
  "ab-test": {
    icon: GitBranch,
    title: "Analyzing variants",
    color: "#ec4899",
    colorLight: "#f472b6",
    colorBg: "rgba(236,72,153,0.08)",
    colorBorder: "rgba(236,72,153,0.15)",
    metrics: ["Hook Strength", "Message Clarity", "CTA Effectiveness", "Production Quality"],
    checkItems: [
      "Hook & attention capture",
      "Message clarity & recall",
      "CTA effectiveness",
      "Visual hierarchy",
      "Winner prediction",
    ],
  },
  "competitor": {
    icon: Swords,
    title: "Comparing ads",
    color: "#0ea5e9",
    colorLight: "#38bdf8",
    colorBg: "rgba(14,165,233,0.08)",
    colorBorder: "rgba(14,165,233,0.15)",
    metrics: ["Creative Strength", "Message Clarity", "Brand Presence", "CTA Power"],
    checkItems: [
      "Scoring your creative",
      "Scoring competitor creative",
      "Running gap analysis",
      "Calculating win probability",
      "Generating action plan",
    ],
  },
  "rank-creative": {
    icon: Trophy,
    title: "Ranking creatives",
    color: "#6366f1",
    colorLight: "#818cf8",
    colorBg: "rgba(99,102,241,0.08)",
    colorBorder: "rgba(99,102,241,0.15)",
    metrics: ["Hook Strength", "Message Clarity", "CTA Effectiveness", "Production Quality"],
    checkItems: [
      "Analyzing each creative",
      "Scoring hook & attention",
      "Evaluating message clarity",
      "Assessing CTA strength",
      "Generating rankings",
    ],
  },
  "display": {
    icon: Monitor,
    title: "Analyzing display ad",
    color: "#6366f1",
    colorLight: "#818cf8",
    colorBg: "rgba(99,102,241,0.08)",
    colorBorder: "rgba(99,102,241,0.15)",
    metrics: ["Visual Hierarchy", "CTA Visibility", "Brand Clarity", "Message Clarity"],
    checkItems: [
      "Detecting ad format",
      "Analyzing visual hierarchy",
      "Scoring CTA visibility",
      "Evaluating text ratio",
      "Generating placement preview",
    ],
  },
};

interface AnalysisProgressCardProps {
  pageType: AnalysisPageType;
  files: File[];
  statusMessage?: string;
  currentIndex?: number; // For multi-file analysis (which file is being analyzed)
  totalCount?: number;
  onCancel?: () => void;
}

function ChecklistItem({ 
  label, 
  done, 
  active, 
  color 
}: { 
  label: string; 
  done: boolean; 
  active: boolean; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div 
        className="w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          borderColor: done ? "#10b981" : active ? color : "rgba(255,255,255,0.1)",
          background: done ? "rgba(16,185,129,0.1)" : active ? `${color}15` : "transparent",
        }}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Check size={10} color="#10b981" />
            </motion.div>
          ) : active ? (
            <motion.div
              key="dot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: color }}
            />
          ) : null}
        </AnimatePresence>
      </div>
      <span 
        className="text-sm transition-colors duration-300"
        style={{
          color: done ? "#71717a" : active ? "#e4e4e7" : "#52525b",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function AnalysisProgressCard({ 
  pageType, 
  files, 
  statusMessage,
  currentIndex = 0,
  totalCount,
  onCancel,
}: AnalysisProgressCardProps) {
  const config = PAGE_CONFIGS[pageType];
  const Icon = config.icon;
  const [stageIndex, setStageIndex] = useState(0);
  
  // Get thumbnail for first file
  const primaryFile = files[0];
  const primaryFileObjectUrl = useMemo(
    () => (primaryFile ? URL.createObjectURL(primaryFile) : null),
    [primaryFile],
  );
  useEffect(() => {
    return () => {
      if (primaryFileObjectUrl) URL.revokeObjectURL(primaryFileObjectUrl);
    };
  }, [primaryFileObjectUrl]);

  const thumbnailDataUrl = useThumbnail(primaryFile, primaryFileObjectUrl);
  const isImage = primaryFile?.type.startsWith("image/");
  const previewUrl = primaryFileObjectUrl;

  // Progress through stages
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, config.checkItems.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [config.checkItems.length]);

  const total = totalCount ?? files.length;
  const hasSinglePreview = files.length === 1 && (!!thumbnailDataUrl || !!previewUrl);

  const progressText = total > 1 
    ? `Analyzing ${currentIndex + 1} of ${total}...` 
    : statusMessage || "Processing...";

  return (
    <>
      {/* Outer — full height, centered (matches ProgressCard layout) */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Unified container — split panel */}
        <div
          className="w-full max-w-[720px] min-w-[480px] bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[360px]"
        >
          {/* ── Left half — creative preview ── */}
          <div className="flex-1 bg-[#1a1a1c] border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col items-center justify-center relative min-h-[220px] md:min-h-[360px] p-6">
            {hasSinglePreview ? (
              <>
                {thumbnailDataUrl ? (
                  <motion.img
                    src={thumbnailDataUrl}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-full max-h-[280px] object-contain rounded-lg"
                  />
                ) : !isImage && previewUrl ? (
                  <motion.video
                    src={previewUrl}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-full max-h-[280px] object-contain rounded-lg"
                    muted
                    playsInline
                    preload="auto"
                    onLoadedData={(e) => {
                      const v = e.currentTarget;
                      if (v.readyState >= 2) {
                        v.currentTime = Math.min(1.0, (v.duration || 10) * 0.1);
                      }
                    }}
                  />
                ) : isImage && previewUrl ? (
                  <motion.img
                    src={previewUrl}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-full max-h-[280px] object-contain rounded-lg"
                  />
                ) : null}
              </>
            ) : files.length > 1 ? (
              <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
                {files.slice(0, 4).map((file, i) => (
                  <FileThumb key={i} file={file} index={i} currentIndex={currentIndex} color={config.color} />
                ))}
                {files.length > 4 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs"
                    style={{ background: config.colorBg, color: config.colorLight }}>
                    +{files.length - 4} more
                  </div>
                )}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center"
                style={{ background: config.colorBg }}>
                <Icon size={28} color={config.color} style={{ opacity: 0.6 }} />
              </div>
            )}

            {/* Scanning overlay — framer-motion (matches ProgressCard) */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, transparent 0%, ${config.color}0a 50%, transparent 100%)`,
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* Filename bar — pinned to bottom (matches ProgressCard) */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-3 border-t border-white/[0.04]">
              <span className="text-[11px] text-zinc-600 font-mono truncate flex-1">
                {files.length === 1
                  ? sanitizeFileName(primaryFile?.name ?? "").slice(0, 32)
                  : `${files.length} files`
                }
              </span>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors bg-transparent border-none cursor-pointer ml-3 flex-shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* ── Right half — all progress ── */}
          <div className="flex-1 flex flex-col p-6 md:p-7 min-h-[360px]">

            {/* Header — icon + title + animated progress text */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: config.colorBg, border: `1px solid ${config.colorBorder}` }}
              >
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon size={20} color={config.color} />
                </motion.div>
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-100 m-0">{config.title}</p>
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
                      {progressText}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Metric bars — shimmer style matching ProgressCard */}
            <div className="flex flex-col gap-[10px] mb-5">
              {config.metrics.map((metric, i) => {
                const isActive = stageIndex >= i + 1;
                const isDone = stageIndex > i + 1;
                return (
                  <div key={metric} className="flex items-center gap-3">
                    <span
                      className="text-[13px] w-[130px] flex-shrink-0 transition-colors duration-300"
                      style={{ color: isActive ? "#a1a1aa" : "#3f3f46" }}
                    >
                      {metric}
                    </span>
                    <div className="flex-1 h-[5px] bg-white/[0.07] rounded-full overflow-hidden">
                      {isDone ? (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: config.color }}
                        />
                      ) : isActive ? (
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${config.colorBg} 25%, ${config.color}4d 50%, ${config.colorBg} 75%)`,
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
                        style={{ color: config.color }}
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
                {config.checkItems.map((item, i) => (
                  <ChecklistItem
                    key={item}
                    label={item}
                    done={i < stageIndex}
                    active={i === stageIndex}
                    color={config.color}
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

// Small file thumbnail component for multi-file view
function FileThumb({ 
  file, 
  index, 
  currentIndex, 
  color 
}: { 
  file: File; 
  index: number; 
  currentIndex: number;
  color: string;
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const isImage = file.type.startsWith("image/");
  const isActive = index === currentIndex;
  
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden aspect-square"
      style={{ 
        border: isActive ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.06)",
        opacity: index < currentIndex ? 0.5 : 1,
      }}
    >
      {isImage ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <video src={url} className="w-full h-full object-cover" muted />
      )}
      {index < currentIndex && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Check size={16} color="#10b981" />
        </div>
      )}
      {isActive && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${color}20 100%)`,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
