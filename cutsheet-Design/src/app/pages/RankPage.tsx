import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Wand2,
  ShieldCheck,
  Crosshair,
  Zap,
  Trophy,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CloudUpload,
  Clock,
  Loader2,
  X,
  Plus,
  BarChart2,
  Layers,
  GitCompare,
  Sparkles,
} from "lucide-react";
import { PageTitleContext } from "../components/AppLayout";
import { ScoreCard } from "../components/ScoreCard";
import { PredictedPerformanceCard } from "../components/PredictedPerformanceCard";
import { BudgetRecommendationCard } from "../components/BudgetRecommendationCard";
import { DesignReviewCard } from "../components/DesignReviewCard";
import { PolicyCheckPanel } from "../components/PolicyCheckPanel";
import { AIRewritePanel } from "../components/AIRewritePanel";
import { SafeZoneCheckModal } from "../components/SafeZoneCheckModal";
import { VisualizePanel } from "../components/VisualizePanel";
import { CreativeBriefPanel } from "../components/CreativeBriefPanel";

// --- TYPES ---
type Tab = "upload" | "loading" | "results" | "scorecard";

// --- DATA ---
const UPLOAD_CREATIVES = [
  {
    id: 1,
    filename: "creative-3.mp4",
    format: "Video",
    thumb:
      "https://images.unsplash.com/photo-1617804131012-71c8e220325b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 2,
    filename: "creative-1.mp4",
    format: "Video",
    thumb:
      "https://images.unsplash.com/photo-1614714053570-6c6b6aa54a6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 3,
    filename: "static-offer-v2.jpg",
    format: "Static",
    thumb:
      "https://images.unsplash.com/photo-1754817408912-49aa34c270c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 4,
    filename: "creative-4.mp4",
    format: "Video",
    thumb:
      "https://images.unsplash.com/photo-1738523686534-7055df5858d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 5,
    filename: "founder-intro.mp4",
    format: "Video",
    thumb:
      "https://images.unsplash.com/photo-1651993690908-c74df3c39d5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
];

type LoadingStatus = "complete" | "analyzing" | "pending";

const LOADING_CREATIVES: {
  id: number;
  filename: string;
  format: string;
  thumb: string;
  status: LoadingStatus;
  score?: number;
}[] = [
  {
    id: 1,
    filename: "creative-3.mp4",
    format: "Video",
    thumb: UPLOAD_CREATIVES[0].thumb,
    status: "complete",
    score: 9.2,
  },
  {
    id: 2,
    filename: "creative-1.mp4",
    format: "Video",
    thumb: UPLOAD_CREATIVES[1].thumb,
    status: "complete",
    score: 8.8,
  },
  {
    id: 3,
    filename: "static-offer-v2.jpg",
    format: "Static",
    thumb: UPLOAD_CREATIVES[2].thumb,
    status: "analyzing",
  },
  {
    id: 4,
    filename: "creative-4.mp4",
    format: "Video",
    thumb: UPLOAD_CREATIVES[3].thumb,
    status: "pending",
  },
  {
    id: 5,
    filename: "founder-intro.mp4",
    format: "Video",
    thumb: UPLOAD_CREATIVES[4].thumb,
    status: "pending",
  },
];

const RANKINGS = [
  {
    id: 1,
    rank: 1,
    filename: "creative-3.mp4",
    format: "Video",
    score: 9.2,
    wouldScale: true,
    strengths:
      "Incredible pacing in the first 3 seconds. The hook immediately establishes the problem, and the CTA is high-contrast and impossible to miss.",
    weaknesses:
      "Slight dip in visual quality during the transition at 0:15, but it doesn't meaningfully affect retention.",
    scores: { hook: 9.5, clarity: 9.0, cta: 9.2, production: 8.8, overall: 9.2 },
    thumb: UPLOAD_CREATIVES[0].thumb,
  },
  {
    id: 2,
    rank: 2,
    filename: "creative-1.mp4",
    format: "Video",
    score: 8.8,
    wouldScale: true,
    strengths:
      "Production value is top-tier. Builds incredible brand trust. The pacing is slightly slower than #1 but retains the target audience perfectly.",
    weaknesses:
      "The CTA relies entirely on voiceover. Adding a visual overlay would push this to a 9.0+.",
    scores: { hook: 8.2, clarity: 8.8, cta: 7.5, production: 9.6, overall: 8.8 },
    thumb: UPLOAD_CREATIVES[1].thumb,
  },
  {
    id: 3,
    rank: 3,
    filename: "static-offer-v2.jpg",
    format: "Static",
    score: 6.5,
    wouldScale: false,
    strengths:
      "The offer is clearly stated and the text hierarchy guides the eye directly to the discount code.",
    weaknesses:
      "Fails to interrupt the scroll pattern. Feels too much like a generic banner ad and lacks organic blending.",
    scores: { hook: 5.0, clarity: 8.5, cta: 6.5, production: 7.0, overall: 6.5 },
    thumb: UPLOAD_CREATIVES[2].thumb,
  },
  {
    id: 4,
    rank: 4,
    filename: "creative-4.mp4",
    format: "Video",
    score: 5.2,
    wouldScale: false,
    strengths:
      "Good use of raw user-generated content style which feels native to the platform feed.",
    weaknesses:
      "Takes 6 seconds to get to the point. Viewers are dropping off before the product is even introduced.",
    scores: { hook: 3.5, clarity: 6.0, cta: 5.5, production: 6.5, overall: 5.2 },
    thumb: UPLOAD_CREATIVES[3].thumb,
  },
  {
    id: 5,
    rank: 5,
    filename: "founder-intro.mp4",
    format: "Video",
    score: 3.8,
    wouldScale: false,
    strengths:
      "Authentic founder presence. Might work for middle-of-funnel retargeting where trust is already established.",
    weaknesses:
      "Terrible for cold acquisition. Too much talking, zero visual demonstration of the product value in the critical first 10 seconds.",
    scores: { hook: 2.0, clarity: 4.5, cta: 3.0, production: 5.5, overall: 3.8 },
    thumb: UPLOAD_CREATIVES[4].thumb,
  },
];

// --- HELPERS ---
const getScoreColor = (score: number) => {
  if (score >= 7) return "text-[#10b981]";
  if (score >= 5) return "text-[#f59e0b]";
  return "text-[#ef4444]";
};

const getScoreBg = (score: number) => {
  if (score >= 7) return "bg-[#10b981]";
  if (score >= 5) return "bg-[#f59e0b]";
  return "bg-[#ef4444]";
};

// ─────────────────────────────────────────────
// UPLOAD TAB
// ─────────────────────────────────────────────
function UploadTab({ onStart }: { onStart: () => void }) {
  const [platform, setPlatform] = useState("All");
  const [testType, setTestType] = useState("Full Creative");
  const [creatives, setCreatives] = useState(UPLOAD_CREATIVES);
  const [isDragging, setIsDragging] = useState(false);

  const PLATFORMS = ["All", "Meta", "TikTok", "YouTube"];
  const TEST_TYPES = ["Hook Battle", "CTA Showdown", "Full Creative"];

  const removeCreative = (id: number) => {
    setCreatives((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-8"
    >
      {/* Hero */}
      <div className="flex flex-col items-center text-center gap-4 pt-4">
        <div
          className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center border border-violet-500/25"
          style={{ background: "rgba(139,92,246,0.12)" }}
        >
          <Trophy size={32} className="text-violet-400" />
        </div>
        <div className="flex flex-col gap-2">
          <h1
            className="text-[#f4f4f5] leading-tight"
            style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            Rank your creatives
          </h1>
          <p
            className="text-[rgba(255,255,255,0.5)] max-w-[480px] mx-auto"
            style={{ fontSize: 14, lineHeight: 1.6 }}
          >
            Upload up to 10 ad creatives. Cutsheet ranks them by predicted
            performance so you know exactly where to put your budget.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {[
            { icon: <BarChart2 size={12} />, label: "AI Scoring" },
            { icon: <GitCompare size={12} />, label: "Head-to-head comparison" },
            { icon: <Sparkles size={12} />, label: "Scale recommendations" },
            { icon: <Layers size={12} />, label: "Multi-platform" },
          ].map((pill) => (
            <span
              key={pill.label}
              className="flex items-center gap-1.5 px-3 text-zinc-400 border border-white/[0.06] rounded-full"
              style={{
                height: 28,
                fontSize: 12,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <span className="text-zinc-500">{pill.icon}</span>
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      {/* Platform + Test Type Selectors */}
      <div className="flex flex-row gap-8 items-start">
        {/* Platform */}
        <div className="flex flex-col gap-2">
          <span
            className="text-zinc-600 uppercase tracking-[0.12em]"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            Platform
          </span>
          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className="transition-colors"
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 500,
                  border: platform === p
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: platform === p
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(255,255,255,0.04)",
                  color: platform === p ? "#a5b4fc" : "#71717a",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Test Type */}
        <div className="flex flex-col gap-2">
          <span
            className="text-zinc-600 uppercase tracking-[0.12em]"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            Test Type
          </span>
          <div className="flex items-center gap-1.5">
            {TEST_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTestType(t)}
                className="transition-colors"
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 500,
                  border: testType === t
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: testType === t
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(255,255,255,0.04)",
                  color: testType === t ? "#a5b4fc" : "#71717a",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors py-8"
        style={{
          borderColor: isDragging
            ? "rgba(139,92,246,0.4)"
            : "rgba(255,255,255,0.08)",
          background: isDragging
            ? "rgba(139,92,246,0.04)"
            : "rgba(255,255,255,0.01)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06]"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <CloudUpload size={18} className="text-zinc-400" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[#f4f4f5]"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Drop creatives here or{" "}
            <span className="text-violet-400 cursor-pointer hover:text-violet-300 transition-colors">
              browse files
            </span>
          </span>
          <span
            className="text-zinc-500"
            style={{ fontSize: 12 }}
          >
            MP4, MOV, JPG, PNG · Max 200MB per file
          </span>
        </div>
      </div>

      {/* Creative Grid */}
      {creatives.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className="text-zinc-400 uppercase tracking-[0.12em]"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              Queue · {creatives.length} creatives
            </span>
            <button
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              <Plus size={12} />
              Add more
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {creatives.map((c) => (
              <div
                key={c.id}
                className="relative rounded-xl overflow-hidden border border-white/[0.06] group"
                style={{ aspectRatio: "9/16", background: "#18181b" }}
              >
                <img
                  src={c.thumb}
                  alt={c.filename}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                {/* Format badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded"
                  style={{ fontSize: 9, fontWeight: 500 }}>
                  {c.format === "Video" ? (
                    <Play size={7} fill="currentColor" />
                  ) : (
                    <ImageIcon size={7} />
                  )}
                  {c.format}
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeCreative(c.id)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-white hover:bg-red-500/80"
                >
                  <X size={10} />
                </button>
                {/* Filename */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-6 pt-4">
                  <span
                    className="text-white truncate block w-full"
                    style={{ fontSize: 9, fontWeight: 500 }}
                  >
                    {c.filename}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 text-white transition-colors"
        style={{
          height: 48,
          borderRadius: 12,
          background: "#8b5cf6",
          fontSize: 14,
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#7c3aed";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#8b5cf6";
        }}
      >
        <Trophy size={16} />
        Start Ranking
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// LOADING TAB
// ─────────────────────────────────────────────
function LoadingTab({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(40);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return Math.min(100, p + 0.4);
      });
    }, 120);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const completedCount = LOADING_CREATIVES.filter(
    (c) => c.status === "complete"
  ).length;

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-[calc(100vh-56px)] flex flex-col justify-center gap-8"
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 pt-4">
        <div
          className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center border border-violet-500/25 relative"
          style={{ background: "rgba(139,92,246,0.12)" }}
        >
          <Trophy size={32} className="text-violet-400" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-2xl border border-violet-500/20 animate-ping opacity-40" />
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h1
            className="text-[#f4f4f5] leading-tight"
            style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            Ranking Creatives
          </h1>
          <span
            className="flex items-center gap-2 px-3 text-indigo-300 border border-indigo-500/20 rounded-full"
            style={{
              height: 28,
              fontSize: 12,
              fontWeight: 500,
              background: "rgba(99,102,241,0.08)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            5 creatives · Full Creative
          </span>
        </div>
      </div>

      {/* Creative Status Grid */}
      <div className="grid grid-cols-5 gap-3 max-w-4xl mx-auto w-full">
        {LOADING_CREATIVES.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col rounded-xl overflow-hidden border"
            style={{
              borderColor:
                c.status === "complete"
                  ? "rgba(16,185,129,0.2)"
                  : c.status === "analyzing"
                  ? "rgba(99,102,241,0.25)"
                  : "rgba(255,255,255,0.06)",
              background:
                c.status === "complete"
                  ? "rgba(16,185,129,0.04)"
                  : c.status === "analyzing"
                  ? "rgba(99,102,241,0.05)"
                  : "rgba(255,255,255,0.02)",
            }}
          >
            {/* Thumbnail */}
            <div
              className="relative overflow-hidden"
              style={{ aspectRatio: "9/16" }}
            >
              <img
                src={c.thumb}
                alt={c.filename}
                className="w-full h-full object-cover"
                style={{
                  filter:
                    c.status === "pending"
                      ? "grayscale(80%) brightness(0.5)"
                      : c.status === "analyzing"
                      ? "brightness(0.75)"
                      : "brightness(0.85)",
                }}
              />

              {/* Status Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {c.status === "complete" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.9)" }}
                  >
                    <CheckCircle2 size={18} className="text-white" />
                  </motion.div>
                )}
                {c.status === "analyzing" && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.85)" }}
                  >
                    <Loader2 size={18} className="text-white animate-spin" />
                  </div>
                )}
                {c.status === "pending" && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.55)" }}
                  >
                    <Clock size={16} className="text-zinc-400" />
                  </div>
                )}
              </div>

              {/* Score badge for complete */}
              {c.status === "complete" && c.score !== undefined && (
                <div
                  className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md"
                  style={{ fontSize: 11, fontWeight: 700, color: c.score >= 7 ? "#10b981" : c.score >= 5 ? "#f59e0b" : "#ef4444" }}
                >
                  {c.score}
                </div>
              )}

              {/* Format badge */}
              <div
                className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded"
                style={{ fontSize: 9, fontWeight: 500 }}
              >
                {c.format === "Video" ? (
                  <Play size={7} fill="currentColor" />
                ) : (
                  <ImageIcon size={7} />
                )}
                {c.format}
              </div>
            </div>

            {/* Status Label */}
            <div
              className="px-2 py-2 flex items-center gap-1.5"
              style={{ minHeight: 36 }}
            >
              {c.status === "complete" && (
                <span
                  className="text-emerald-400 font-semibold uppercase tracking-wider"
                  style={{ fontSize: 9 }}
                >
                  Complete
                </span>
              )}
              {c.status === "analyzing" && (
                <span
                  className="text-indigo-400 font-semibold uppercase tracking-wider"
                  style={{ fontSize: 9 }}
                >
                  Analyzing…
                </span>
              )}
              {c.status === "pending" && (
                <span
                  className="text-zinc-600 font-semibold uppercase tracking-wider"
                  style={{ fontSize: 9 }}
                >
                  Pending
                </span>
              )}
            </div>

            {/* Filename */}
            <div
              className="px-2 pb-2 truncate text-zinc-400"
              style={{ fontSize: 10 }}
            >
              {c.filename}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Block */}
      <div className="flex flex-col gap-3">
        {/* Inline row: label + bar + percentage */}
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 shrink-0" style={{ fontSize: 13, fontWeight: 500 }}>
            {completedCount} of {LOADING_CREATIVES.length} analyzed
          </span>
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: 4, background: "#27272a" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "#6366f1",
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span
            className="text-indigo-400 font-mono shrink-0"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            {Math.round(progress)}%
          </span>
        </div>

        {/* Stop link */}
        <div className="flex items-center justify-center">
          <button
            onClick={onComplete}
            className="text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
            style={{ fontSize: 12 }}
          >
            Stop after current
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// RESULTS TAB
// ─────────────────────────────────────────────
function ResultsTab({
  expandedId,
  setExpandedId,
  onRankMore,
  onViewScorecard,
}: {
  expandedId: number | null;
  setExpandedId: React.Dispatch<React.SetStateAction<number | null>>;
  onRankMore: () => void;
  onViewScorecard: () => void;
}) {
  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Trophy size={22} className="text-indigo-400" />
          </div>
          <h1
            className="text-[#f4f4f5] leading-none"
            style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            5 creatives ranked
          </h1>
        </div>
        <button
          onClick={onRankMore}
          className="h-10 px-5 rounded-[10px] bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          <Zap size={14} />
          Rank More
        </button>
      </div>

      {/* Hero Recommendation Banner */}
      <div className="mb-12 relative rounded-2xl bg-[#111113] border border-white/[0.06] overflow-hidden group shadow-xl">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-transparent pointer-events-none" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center p-8 lg:p-10 gap-10">
          <div className="flex-1 flex flex-col items-start z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase px-3 py-1 rounded-full"
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>
                <TrendingUp size={12} strokeWidth={2.5} />
                Test These Two
              </span>
            </div>
            <h2
              className="text-white tracking-tight leading-[1.2] mb-3"
              style={{ fontSize: 28, fontWeight: 600 }}
            >
              <span className="text-emerald-400">creative-3.mp4</span> and{" "}
              <span className="text-emerald-400">creative-1.mp4</span>
            </h2>
            <p
              className="text-[#a1a1aa] max-w-xl"
              style={{ fontSize: 15, lineHeight: 1.6 }}
            >
              They scored highest across hook, CTA, and clarity. Shift your
              spend to these variants to immediately improve bottom-of-funnel
              conversion rates.
            </p>
          </div>

          <div className="relative w-[280px] h-[160px] shrink-0 z-10 hidden md:block">
            <div className="absolute right-0 top-4 w-[160px] h-[120px] rounded-xl overflow-hidden border border-white/10 shadow-2xl opacity-60 rotate-6 transform transition-transform group-hover:rotate-12 group-hover:translate-x-2">
              <img src={RANKINGS[1].thumb} alt="Rank 2" className="w-full h-full object-cover grayscale-[30%]" />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded font-bold"
                style={{ fontSize: 10 }}>#2</div>
            </div>
            <div className="absolute left-0 top-0 w-[180px] h-[135px] rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] transform transition-transform group-hover:-rotate-3 group-hover:-translate-x-2">
              <img src={RANKINGS[0].thumb} alt="Rank 1" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-emerald-500 text-black px-2 py-0.5 rounded uppercase tracking-widest shadow-md"
                style={{ fontSize: 10, fontWeight: 700 }}>#1 Winner</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranked List */}
      <div className="flex flex-col gap-4">
        {RANKINGS.map((item) => {
          const isExpanded = expandedId === item.id;
          const isGold = item.rank === 1;
          const isSilver = item.rank === 2;
          const isBronze = item.rank === 3;

          let rankColor = "text-zinc-600";
          if (isGold)
            rankColor =
              "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]";
          if (isSilver)
            rankColor =
              "text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]";
          if (isBronze)
            rankColor =
              "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]";

          const cardBorder = isGold
            ? isExpanded
              ? "border-amber-500/30"
              : "border-amber-500/20"
            : isExpanded
            ? "border-[#6366f1]/30"
            : "border-white/[0.06]";

          const cardBg = isExpanded ? "bg-white/[0.03]" : "bg-[#18181b]";

          return (
            <motion.div
              layout
              key={item.id}
              className={`flex flex-col rounded-xl overflow-hidden border transition-colors duration-300 ${cardBorder} ${cardBg} shadow-sm relative`}
            >
              <div
                className="flex flex-col md:flex-row md:items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors relative z-10 gap-5 md:gap-0"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="flex items-center gap-5 md:gap-6">
                  <div
                    className={`w-[40px] text-center font-bold tracking-tighter ${rankColor}`}
                    style={{ fontSize: 32 }}
                  >
                    #{item.rank}
                  </div>
                  <div
                    className={`relative overflow-hidden border border-white/10 shrink-0 bg-black/40 ${
                      isGold
                        ? "w-[80px] h-[80px] rounded-xl"
                        : "w-[100px] h-[64px] rounded-lg"
                    }`}
                  >
                    <img
                      src={item.thumb}
                      alt={item.filename}
                      className="w-full h-full object-cover object-center opacity-90"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur text-white px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ fontSize: 9, fontWeight: 500 }}>
                      {item.format === "Video" ? (
                        <Play size={8} fill="currentColor" />
                      ) : (
                        <ImageIcon size={8} />
                      )}
                      {item.format}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center">
                    <span className="text-white tracking-tight" style={{ fontSize: 15, fontWeight: 500 }}>
                      {item.filename}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.wouldScale && (
                        <span
                          className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{ fontSize: 11, fontWeight: 600 }}
                        >
                          <CheckCircle2 size={10} />
                          Would Scale
                        </span>
                      )}
                      {!item.wouldScale && (
                        <span
                          className="flex items-center gap-1 text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{ fontSize: 11, fontWeight: 600 }}
                        >
                          <AlertCircle size={10} />
                          Needs Rework
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 md:pl-0 pl-[65px]">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-zinc-500 uppercase tracking-[0.15em] mb-0.5"
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      Overall
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-bold leading-none font-mono tracking-tighter ${getScoreColor(item.score)}`}
                        style={{ fontSize: 28 }}
                      >
                        {item.score.toFixed(1)}
                      </span>
                      <span className="text-zinc-600 text-sm font-medium font-mono">
                        /10
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="border-t border-white/[0.04] bg-black/40 overflow-hidden"
                  >
                    <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-10">
                      <div className="flex-1 flex flex-col gap-6">
                        <div>
                          <h4
                            className="text-emerald-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2"
                            style={{ fontSize: 12, fontWeight: 700 }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            Strengths
                          </h4>
                          <p className="text-zinc-300" style={{ fontSize: 14, lineHeight: 1.6 }}>
                            {item.strengths}
                          </p>
                        </div>
                        <div>
                          <h4
                            className="text-red-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2"
                            style={{ fontSize: 12, fontWeight: 700 }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            Weaknesses
                          </h4>
                          <p className="text-zinc-400" style={{ fontSize: 14, lineHeight: 1.6 }}>
                            {item.weaknesses}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 lg:max-w-[360px] flex flex-col gap-1.5">
                        <h4
                          className="text-zinc-500 uppercase tracking-[0.15em] mb-3"
                          style={{ fontSize: 11, fontWeight: 600 }}
                        >
                          Score Breakdown
                        </h4>
                        <ScoreRow label="Hook" score={item.scores.hook} delay={0.1} />
                        <ScoreRow label="Clarity" score={item.scores.clarity} delay={0.2} />
                        <ScoreRow label="CTA" score={item.scores.cta} delay={0.3} />
                        <ScoreRow label="Production" score={item.scores.production} delay={0.4} />

                        <div className="mt-5 pt-4 border-t border-white/[0.06] flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewScorecard(); }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 group transition-colors"
                            style={{ fontSize: 13 }}
                          >
                            View full scorecard
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SCORE ROW (shared)
// ─────────────────────────────────────────────
function ScoreRow({
  label,
  score,
  delay,
}: {
  label: string;
  score: number;
  delay: number;
}) {
  const percent = (score / 10) * 100;
  // Use inline hex to guarantee color regardless of Tailwind JIT
  const barHex =
    score >= 7.0
      ? "#10b981"  // emerald
      : score >= 5.0
      ? "#f59e0b"  // amber
      : "#ef4444"; // red

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex justify-between items-end">
        <span className="text-zinc-300" style={{ fontSize: 13, fontWeight: 500 }}>
          {label}
        </span>
        <span className={`font-mono ${getScoreColor(score)}`} style={{ fontSize: 13, fontWeight: 500 }}>
          {score.toFixed(1)}
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 6, background: "#27272a" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barHex }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCORECARD TOOL CARD (helper)
// ─────────────────────────────────────────────
function ScorecardToolCard({
  icon: Icon,
  label,
  colorClass,
  bgClass,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  colorClass: string;
  bgClass: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border border-white/[0.06] bg-[#18181b] p-5 flex flex-col items-center gap-3 hover:bg-white/[0.04] hover:border-white/[0.12] transition-colors w-full group`}
    >
      <div
        className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${bgClass} ${colorClass}`}
      >
        <Icon size={16} />
      </div>
      <span className="text-zinc-200 text-center" style={{ fontSize: 14, fontWeight: 500 }}>
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// RANK SCORECARD TAB
// ─────────────────────────────────────────────
function RankScorecardTab({ onBack }: { onBack: () => void }) {
  const { setTitle } = useContext(PageTitleContext);
  const [activePanel, setActivePanel] = useState<
    "default" | "policy" | "rewrite" | "visualize" | "brief"
  >("default");
  const [isSafeZoneOpen, setIsSafeZoneOpen] = useState(false);

  useEffect(() => {
    setTitle("creative-3.mp4");
    return () => setTitle(null);
  }, [setTitle]);

  const creative = RANKINGS[0]; // creative-3.mp4, rank #1

  return (
    <motion.div
      key="scorecard"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Breadcrumb + rank context */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 w-fit cursor-pointer hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={12} className="text-zinc-500" />
          <span className="text-zinc-500" style={{ fontSize: 12 }}>
            Back to Rankings
          </span>
        </button>
        <span
          className="self-start rounded-full px-2.5 py-1 text-amber-400"
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: "rgba(245,158,11,0.10)",
          }}
        >
          #1 of 5 creatives
        </span>
      </div>

      {/* Two-column layout */}
      <div
        className={`flex gap-6 ${
          activePanel === "visualize" ? "flex-col" : "items-start"
        }`}
      >
        {/* ── LEFT COLUMN ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {activePanel === "visualize" ? (
            <VisualizePanel
              onClose={() => setActivePanel("default")}
              originalImageSrc={creative.thumb}
            />
          ) : (
            <>
              {/* Creative preview */}
              <div className="w-full relative flex flex-col group shrink-0 rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden">
                <div
                  className="w-full relative flex items-center justify-center overflow-hidden bg-zinc-900"
                  style={{ height: 380 }}
                >
                  <img
                    src={creative.thumb}
                    alt={creative.filename}
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Play hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                      <Play size={20} className="text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
                {/* File info bar */}
                <div className="w-full flex items-center justify-between border-t border-white/[0.05] px-4 py-3 shrink-0">
                  <span className="font-mono text-zinc-500" style={{ fontSize: 12 }}>
                    {creative.filename}
                  </span>
                  <span className="text-zinc-500" style={{ fontSize: 12 }}>
                    0:28 · 4.6 MB
                  </span>
                </div>
              </div>

              {/* Tool cards */}
              <div className="grid grid-cols-4 gap-3">
                <ScorecardToolCard
                  icon={Wand2}
                  label="AI Rewrite"
                  colorClass="text-[#6366f1]"
                  bgClass="bg-[#6366f1]/[0.15]"
                  onClick={() => setActivePanel("rewrite")}
                />
                <ScorecardToolCard
                  icon={Sparkles}
                  label="Visualize"
                  colorClass="text-[#10b981]"
                  bgClass="bg-[#10b981]/[0.15]"
                  onClick={() => setActivePanel("visualize")}
                />
                <ScorecardToolCard
                  icon={ShieldCheck}
                  label="Policy Check"
                  colorClass="text-[#f59e0b]"
                  bgClass="bg-[#f59e0b]/[0.15]"
                  onClick={() => setActivePanel("policy")}
                />
                <ScorecardToolCard
                  icon={Crosshair}
                  label="Safe Zone"
                  colorClass="text-[#0ea5e9]"
                  bgClass="bg-[#0ea5e9]/[0.15]"
                  onClick={() => setIsSafeZoneOpen(true)}
                />
              </div>

              {/* Design Review */}
              <DesignReviewCard />
            </>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        {activePanel !== "visualize" && (
          <div className="w-[380px] shrink-0 flex flex-col gap-4">
            {activePanel === "policy" ? (
              <PolicyCheckPanel onClose={() => setActivePanel("default")} />
            ) : activePanel === "rewrite" ? (
              <AIRewritePanel onClose={() => setActivePanel("default")} />
            ) : activePanel === "brief" ? (
              <CreativeBriefPanel onClose={() => setActivePanel("default")} />
            ) : (
              <>
                <ScoreCard
                  onGenerateBrief={() => setActivePanel("brief")}
                  overrideScore={9.2}
                  overridePlatformAvg={6.1}
                  overrideBadgeText="WOULD SCALE"
                  overrideBadgeVariant="emerald"
                  overrideDimensions={[
                    { id: "hook", name: "Hook", score: 9.5 },
                    { id: "clarity", name: "Clarity", score: 9.0 },
                    { id: "cta", name: "CTA", score: 9.2 },
                    { id: "production", name: "Production", score: 8.8 },
                  ]}
                  overrideBenchmarkDiff="+3.1 pts"
                />
                <PredictedPerformanceCard />
                <BudgetRecommendationCard />
              </>
            )}
          </div>
        )}
      </div>

      {/* Safe Zone Modal */}
      {isSafeZoneOpen && (
        <SafeZoneCheckModal
          onClose={() => setIsSafeZoneOpen(false)}
          imageSrc={creative.thumb}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ROOT PAGE
// ─────────────────────────────────────────────
export default function RankPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const TAB_LABELS: Record<Tab, string> = {
    upload: "Upload",
    loading: "Loading",
    results: "Results",
    scorecard: "Scorecard",
  };

  return (
    <div
      className="flex-1 flex flex-col h-full w-full bg-[#09090b] overflow-y-auto overflow-x-hidden relative scroll-smooth"
      style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
    >
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay" />

      <div className="max-w-[1000px] mx-auto w-full px-6 py-12 flex flex-col relative z-10 pb-32 gap-8">
        {/* Top bar: title + tab switcher */}
        <div className="flex items-center justify-between">
          

          {/* Tab Switcher */}
          <div
            className="flex items-center gap-1 border border-white/[0.06] rounded-xl p-1"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {(["upload", "loading", "results"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="transition-colors rounded-lg"
                style={{
                  height: 32,
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  background:
                    activeTab === tab ? "#6366f1" : "transparent",
                  color: activeTab === tab ? "#ffffff" : "#71717a",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#e4e4e7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#71717a";
                  }
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "upload" && (
            <UploadTab
              key="upload"
              onStart={() => setActiveTab("loading")}
            />
          )}
          {activeTab === "loading" && (
            <LoadingTab
              key="loading"
              onComplete={() => setActiveTab("results")}
            />
          )}
          {activeTab === "results" && (
            <ResultsTab
              key="results"
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onRankMore={() => setActiveTab("upload")}
              onViewScorecard={() => setActiveTab("scorecard")}
            />
          )}
          {activeTab === "scorecard" && (
            <RankScorecardTab
              key="scorecard"
              onBack={() => setActiveTab("results")}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}