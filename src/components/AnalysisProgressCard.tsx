// AnalysisProgressCard.tsx — Unified loading card for A/B Test, Competitor, and Rank Creative
// Matches the split-panel design of ProgressCard (organic) and DisplayProgressCard (display)

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FlaskConical, Swords, Trophy, Check, Monitor,
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
    icon: FlaskConical,
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
  const thumbnailDataUrl = useThumbnail(primaryFile);
  const isImage = primaryFile?.type.startsWith("image/");
  
  const previewUrl = useMemo(() => {
    if (primaryFile && isImage) return URL.createObjectURL(primaryFile);
    return null;
  }, [primaryFile, isImage]);
  
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Progress through stages
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, config.checkItems.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [config.checkItems.length]);

  const displayUrl = previewUrl || thumbnailDataUrl;
  const total = totalCount ?? files.length;
  const progressText = total > 1 
    ? `Analyzing ${currentIndex + 1} of ${total}...` 
    : statusMessage || "Processing...";

  return (
    <div 
      className="rounded-2xl overflow-hidden border"
      style={{ 
        background: "linear-gradient(180deg, rgba(24,24,27,0.98) 0%, rgba(9,9,11,1) 100%)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left: Preview */}
        <div className="md:w-[320px] p-5 flex-shrink-0">
          <div 
            className="relative rounded-xl overflow-hidden"
            style={{ 
              background: "#09090b", 
              border: "1px solid rgba(255,255,255,0.06)",
              aspectRatio: files.length > 1 ? "auto" : "1",
              minHeight: files.length > 1 ? 200 : "auto",
            }}
          >
            {files.length === 1 && displayUrl ? (
              <>
                {isImage ? (
                  <img 
                    src={displayUrl} 
                    alt="" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video 
                    src={displayUrl} 
                    className="w-full h-full object-contain"
                    muted
                    playsInline
                  />
                )}
                {/* Scanning overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, ${config.color}10 50%, transparent 100%)`,
                    animation: "scanDown 2s ease-in-out infinite",
                  }}
                />
              </>
            ) : files.length > 1 ? (
              // Multi-file grid preview
              <div className="grid grid-cols-2 gap-2 p-3">
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
              <div className="w-full h-full flex items-center justify-center p-8">
                <Icon size={48} color={config.color} style={{ opacity: 0.3 }} />
              </div>
            )}
          </div>
          
          {/* File info */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-zinc-500 font-mono truncate flex-1">
              {files.length === 1 
                ? sanitizeFileName(primaryFile?.name ?? "").slice(0, 32)
                : `${files.length} files`
              }
            </span>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Right: Progress */}
        <div className="flex-1 p-5 border-t md:border-t-0 md:border-l border-white/[0.04]">
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: config.colorBg, border: `1px solid ${config.colorBorder}` }}
            >
              <Icon size={20} color={config.color} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">{config.title}</h3>
              <p className="text-xs text-zinc-500">{progressText}</p>
            </div>
          </div>

          {/* Metrics shimmer bars */}
          <div className="flex flex-col gap-3 mb-5">
            {config.metrics.map((metric, i) => (
              <div key={metric} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-[140px] flex-shrink-0">{metric}</span>
                <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (stageIndex + 1) * 20 + i * 5)}%`,
                      background: `linear-gradient(90deg, ${config.color}, ${config.colorLight})`,
                      transition: "width 0.6s ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.04] mb-4" />

          {/* What we're checking */}
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">
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

      <style>{`
        @keyframes scanDown {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
      `}</style>
    </div>
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
