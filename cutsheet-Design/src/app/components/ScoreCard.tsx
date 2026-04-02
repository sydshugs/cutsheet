import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, BarChart2, Activity, Hash, PlaySquare, RotateCcw, TrendingUp, TrendingDown, Lightbulb, Info } from "lucide-react";

// Types
type Platform = "TikTok" | "Meta" | "YouTube" | "Instagram" | "Pinterest";

interface Dimension {
  id: string;
  name: string;
  score: number;
  rangeLow?: number;
  rangeHigh?: number;
  delta?: number;
}

// Hashtag Data — keyed to match the Score Overview platform pills
const HASHTAG_DATA: Record<Platform, string[]> = {
  "Meta":      ["#metaads", "#facebookads", "#adcreative", "#marketing", "#roas", "#ugc"],
  "TikTok":    ["#tiktokads", "#fyp", "#tiktokmademebuyit", "#performancemarketing", "#trend", "#creator"],
  "YouTube":   ["#youtubeshorts", "#shorts", "#shortvideo", "#marketingtips", "#growth", "#youtubeads"],
  "Instagram": ["#instagram", "#instagramreels", "#reels", "#contentcreator", "#explore", "#ugc"],
  "Pinterest": ["#pinterest", "#pinterestmarketing", "#pinterestads", "#inspiration", "#visual", "#discover"],
};

// Helpers
const getScoreColor = (score: number) => {
  if (score >= 7) return "#10b981"; // emerald
  if (score >= 5) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

const getScoreColorAlpha = (score: number, alpha: number): string => {
  if (score >= 7) return `rgba(16,185,129,${alpha})`;
  if (score >= 5) return `rgba(245,158,11,${alpha})`;
  return `rgba(239,68,68,${alpha})`;
};

// Data
const DEFAULT_PLATFORMS: Platform[] = ["TikTok", "Meta", "YouTube"];
const DIMENSIONS: Dimension[] = [
  { id: "hook",    name: "Hook",    score: 6.2, rangeLow: 5.5, rangeHigh: 7.0, delta: 1.2  },
  { id: "message", name: "Message", score: 8.0, rangeLow: 7.4, rangeHigh: 8.6, delta: 0.8  },
  { id: "visual",  name: "Visual",  score: 7.5, rangeLow: 6.8, rangeHigh: 8.1, delta: -0.3 },
  { id: "brand",   name: "Brand",   score: 4.2, rangeLow: 3.5, rangeHigh: 5.0, delta: 0.5  },
];

export function ScoreCard({
  onGenerateBrief,
  defaultOpenHashtags = false,
  overrideScore,
  overridePlatformAvg,
  overrideBadgeText,
  overrideBadgeVariant,
  overrideDimensions,
  overrideBenchmarkDiff,
  platforms,
  defaultPlatform,
}: {
  onGenerateBrief?: () => void;
  defaultOpenHashtags?: boolean;
  overrideScore?: number;
  overridePlatformAvg?: number;
  overrideBadgeText?: string;
  overrideBadgeVariant?: "indigo" | "emerald";
  overrideDimensions?: Dimension[];
  overrideBenchmarkDiff?: string;
  platforms?: Platform[];
  defaultPlatform?: Platform;
}) {
  const activePlatforms = platforms ?? DEFAULT_PLATFORMS;
  const [activePlatform, setActivePlatform] = useState<Platform>(defaultPlatform ?? activePlatforms[activePlatforms.length - 1]);
  const [showChanges, setShowChanges] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hook: false,
    hashtags: defaultOpenHashtags,
  });

  const overallScore = overrideScore ?? 7.2;
  const platformAvg = overridePlatformAvg ?? 6.4;
  const badgeText = overrideBadgeText ?? "Good Potential";
  const activeDimensions = overrideDimensions ?? DIMENSIONS;
  const benchmarkDiff = overrideBenchmarkDiff ?? "+0.8 pts";

  const badgeStyles =
    (overrideBadgeVariant ?? "indigo") === "emerald"
      ? "bg-emerald-500/[0.15] border-emerald-500/[0.3] text-emerald-400"
      : "bg-[#6366f1]/[0.15] border-[#6366f1]/[0.3] text-[#818cf8]";

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-5 flex flex-col gap-5 font-['Geist',sans-serif] text-[#f4f4f5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          SCORE OVERVIEW
        </span>
        <div className="flex items-center gap-2">
          {activePlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`h-[28px] px-[12px] rounded-full text-[13px] font-medium transition-colors border ${
                activePlatform === platform
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Score Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              OVERALL SCORE
            </span>
            <div className="flex items-center gap-3">
              <span 
                className="text-[52px] font-bold leading-none tracking-tight"
                style={{ color: getScoreColor(overallScore) }}
              >
                {overallScore}
              </span>
              <span className="text-[24px] font-bold leading-none text-zinc-600 self-end pb-1">/10</span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-md border text-[12px] font-semibold tracking-wide uppercase mb-1 ${badgeStyles}`}>
            {badgeText}
          </div>
        </div>
        

        {/* Benchmark */}
        <div className="flex flex-col gap-2 pt-4">
          <div className="flex items-center justify-between w-full flex-nowrap gap-2">
            <span className="text-sm text-zinc-500 whitespace-nowrap shrink-0">
              You · {overallScore}
            </span>
            <div className="rounded-full border border-emerald-500/20 font-mono text-emerald-400 px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[11px] bg-[#ffffff00]">
              <span>↑ {benchmarkDiff.replace('+', '')} above avg · {activePlatform}</span>
              <Info className="w-3 h-3 text-zinc-600 shrink-0" />
            </div>
          </div>
          <div className="relative h-1.5 w-full bg-[#3f3f46] rounded-full overflow-hidden">
            {/* Average Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-zinc-500 z-10"
              style={{ left: `${(platformAvg / 10) * 100}%` }}
            />
            {/* Score Fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(overallScore / 10) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 bottom-0 left-0 rounded-full"
              style={{ backgroundColor: getScoreColor(overallScore) }}
            />
          </div>
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Dimension Scores
          </span>
          <button
            onClick={() => setShowChanges(!showChanges)}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
              showChanges
                ? "border border-indigo-500/20 bg-indigo-500/[0.06] text-indigo-400"
                : "border border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {showChanges ? "Hide changes" : "Show changes"}
          </button>
        </div>
        <div className="flex flex-col gap-3.5">
          {activeDimensions.map((dim) => (
            <div key={dim.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-400">{dim.name}</span>
                  {showChanges && dim.delta !== undefined && dim.delta !== 0 && (
                    <span 
                      className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                        dim.delta > 0 
                          ? "text-emerald-500 bg-emerald-500/[0.06]" 
                          : "text-red-400 bg-red-500/[0.06]"
                      }`}
                    >
                      {dim.delta > 0 ? "↑" : "↓"}{Math.abs(dim.delta).toFixed(1)}
                    </span>
                  )}
                </div>
                <span
                  className="text-sm font-bold leading-none"
                  style={{ color: getScoreColor(dim.score) }}
                >
                  {dim.score.toFixed(1)}
                </span>
              </div>
              <div className="relative h-1 w-full bg-[#27272a] rounded-full overflow-hidden">
                {/* Range band — back layer */}
                {showChanges && dim.rangeLow !== undefined && dim.rangeHigh !== undefined && (
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-white/[0.12] transition-opacity duration-300"
                    style={{
                      left: `${(dim.rangeLow / 10) * 100}%`,
                      width: `${((dim.rangeHigh - dim.rangeLow) / 10) * 100}%`,
                    }}
                  />
                )}
                {/* Score bar — front layer */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dim.score / 10) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="absolute top-0 bottom-0 left-0 rounded-full z-10"
                  style={{ backgroundColor: getScoreColor(dim.score) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deep Dive Rows */}
      <div className="flex flex-col mt-2 border-t border-white/[0.04]">
        {/* Hook Analysis Row */}
        <div className="flex flex-col border-b border-white/[0.04]">
          <button
            onClick={() => toggleSection("hook")}
            className="flex items-center justify-between h-[44px] group"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#6366f1]" />
              <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                Hook Analysis
              </span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
                openSections.hook ? "rotate-90" : ""
              }`}
            />
          </button>
          {openSections.hook && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="pb-4 flex flex-col gap-2"
            >
              <div className="p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.04] flex flex-col gap-3.5">
                <p className="text-[13px] text-zinc-300 leading-[1.6]">
                  The first 3 seconds achieve a strong visual disrupt, but the audio cue is delayed by 0.5s. Syncing the VO drop with the text overlay will improve retention by an estimated 14%.
                </p>

                <div className="flex items-start gap-2.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded-[4px] bg-white/[0.06] border border-white/[0.04] text-[11px] font-medium text-zinc-300 shrink-0">
                    Pattern Interrupt
                  </span>
                  <p className="text-[12px] text-zinc-500 leading-[1.5] pt-[1px]">
                    Pattern Interrupt hooks on TikTok have 31% higher scroll-stop rate than Benefit Led hooks
                  </p>
                </div>
              </div>

              {activeDimensions.find(d => d.id === "hook")?.score !== undefined &&
                (activeDimensions.find(d => d.id === "hook")?.score ?? 10) < 7 && (
                <div className="relative overflow-hidden p-4 rounded-[12px] bg-indigo-500/[0.03] border border-indigo-500/10 flex items-start gap-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                  <Lightbulb size={14} className="text-indigo-400 shrink-0 mt-[2px] relative z-10" />
                  <p className="text-[13px] text-indigo-200/80 leading-[1.6] relative z-10">
                    Try a <span className="text-indigo-300 font-medium">Problem First</span> hook instead — opening with the viewer's pain point typically outperforms Benefit Led on Meta for DTC brands.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Hashtags Row */}
        <div className="flex flex-col border-b border-white/[0.04]">
          <div className="flex items-center justify-between h-[44px]">
            <button
              onClick={() => toggleSection("hashtags")}
              className="flex items-center gap-2 group flex-1"
            >
              <Hash className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                Hashtags
              </span>
              <span className="text-[12px] text-zinc-500">
                ({HASHTAG_DATA[activePlatform].length})
              </span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Copy all
              </button>
              <button onClick={() => toggleSection("hashtags")}>
                <ChevronRight
                  className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
                    openSections.hashtags ? "rotate-90" : ""
                  }`}
                />
              </button>
            </div>
          </div>
          {openSections.hashtags && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="pb-4 flex flex-col gap-3"
            >
              <div className="flex flex-wrap gap-1.5">
                {HASHTAG_DATA[activePlatform].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.06] text-[12px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button className="flex-1 flex items-center justify-center gap-[6px] rounded-xl border border-white/[0.08] bg-transparent text-zinc-300 text-sm font-medium py-2.5 hover:bg-white/[0.04] transition-colors">
          <RotateCcw size={13} className="text-zinc-400" />
          Re-analyze
        </button>
        <button 
          onClick={onGenerateBrief}
          className="flex-1 flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2.5 transition-colors"
        >
          Generate Brief
        </button>
      </div>
    </div>
  );
}