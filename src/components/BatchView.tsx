// BatchView.tsx — Rank Creatives: multi-file upload, parallel analysis, ranked leaderboard

import { type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  X,
  BarChart3,
  ArrowLeftRight,
  Sparkles,
  Layers,
  CloudUpload,
  Plus,
  Play,
  Image as ImageIcon,
  Check,
  Loader2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { sanitizeFileName } from "../utils/sanitize";
import { AnimatePresence, motion } from "framer-motion";
import { recalculateOverallScore, type AnalysisResult } from "../services/analyzerService";
import { UpgradeModal } from "./UpgradeModal";
import { Toast } from "./Toast";
import { AlertDialog } from "./ui/AlertDialog";
import { cn } from "@/src/lib/utils";
import {
  ACCEPTED_TYPES,
  MAX_FILES,
  MAX_SIZE_MB,
  RANK_PLATFORMS,
  RANK_TEST_TYPES,
  useRankBatch,
  type BatchItem,
  type RankTestType,
  type RankedRow,
} from "../context/RankBatchContext";

const FEATURE_CHIPS: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string }[] = [
  { icon: BarChart3, label: "AI Scoring" },
  { icon: ArrowLeftRight, label: "Head-to-head comparison" },
  { icon: Sparkles, label: "Scale recommendations" },
  { icon: Layers, label: "Multi-platform" },
];

function formatRankScoreDisplay(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function rankTestTypeLabel(testType: RankTestType): string {
  return RANK_TEST_TYPES.find((o) => o.value === testType)?.label ?? "Full Creative";
}

function rankStrengthsFromScores(scores: NonNullable<AnalysisResult["scores"]>): string {
  const pairs = [
    { label: "hook", v: scores.hook },
    { label: "CTA", v: scores.cta },
    { label: "clarity", v: scores.clarity },
    { label: "production", v: scores.production },
  ].sort((a, b) => b.v - a.v);
  const strong = pairs.filter((p) => p.v >= 7).slice(0, 2);
  if (strong.length === 0) {
    return `Balanced across dimensions (overall ${scores.overall.toFixed(1)}/10). Open the full scorecard for detail.`;
  }
  const readable = strong.map((p) =>
    p.label === "CTA" ? "CTA" : p.label.charAt(0).toUpperCase() + p.label.slice(1),
  );
  return `Strongest on ${readable.join(" and ")} — typical of creatives that hold attention in-feed.`;
}

function rankWeaknessesFromImprovements(improvements: string[]): string {
  if (!improvements.length) return "Open the full scorecard for prioritized fixes.";
  return improvements.slice(0, 2).join(" ");
}

function rankOverallScoreColorClass(overall: number): string {
  if (overall >= 7) return "text-[color:var(--success)]";
  if (overall >= 5) return "text-[color:var(--score-average)]";
  return "text-[color:var(--error)]";
}

function RankDimensionBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  const pct = (score / 10) * 100;
  const bar =
    score >= 7 ? "bg-[color:var(--success)]" : score >= 5 ? "bg-[color:var(--score-average)]" : "bg-[color:var(--error)]";
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-end justify-between">
        <span className="text-[13px] font-medium text-[color:var(--ink-secondary)]">{label}</span>
        <span className={cn("font-mono text-[13px] font-medium", rankOverallScoreColorClass(score))}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--rank-load-progress-track)]">
        <motion.div
          className={cn("h-full rounded-full", bar)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

type RankLoadCardPhase = "complete" | "analyzing" | "pending" | "error";

function rankItemLoadPhase(item: BatchItem): RankLoadCardPhase {
  if (item.status === "complete") return "complete";
  if (item.status === "analyzing") return "analyzing";
  if (item.status === "error") return "error";
  return "pending";
}

function RankStatusBadge({ phase }: { phase: RankLoadCardPhase }) {
  if (phase === "complete") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="flex size-[39px] items-center justify-center rounded-full bg-[rgba(16,185,129,0.8)]"
      >
        <Check className="size-[19.7px] text-white" strokeWidth={2.5} aria-hidden />
      </motion.div>
    );
  }
  if (phase === "analyzing") {
    return (
      <div className="flex size-[39px] items-center justify-center rounded-full bg-[rgba(99,102,241,0.8)]">
        <Loader2 className="size-[19.7px] animate-spin text-white" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div className="flex size-[39px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.8)]">
        <XCircle className="size-[17.5px] text-[color:var(--error)]" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex size-[39px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.8)]">
      <Clock className="size-[17.5px] text-[#9f9fa9]" strokeWidth={2} aria-hidden />
    </div>
  );
}

function RankStatusLabel({ phase }: { phase: RankLoadCardPhase }) {
  const labelMap: Record<RankLoadCardPhase, { text: string; color: string }> = {
    complete: { text: "Complete", color: "#00d492" },
    analyzing: { text: "Analyzing…", color: "#7c86ff" },
    pending: { text: "Pending", color: "#52525c" },
    error: { text: "Failed", color: "var(--error)" },
  };
  const { text, color } = labelMap[phase];
  return (
    <p
      className="m-0 pt-[10px] text-[9.856px] font-semibold uppercase tracking-[0.4928px]"
      style={{ color }}
    >
      {text}
    </p>
  );
}

interface RankBatchLoadingViewProps {
  items: BatchItem[];
  previewUrls: Record<string, string>;
  showStopLink: boolean;
  onRequestStopAfterCurrent: () => void;
}

function RankBatchLoadingView({ items, previewUrls, showStopLink, onRequestStopAfterCurrent }: RankBatchLoadingViewProps) {
  const total = items.length;
  const finished = items.filter((i) => i.status === "complete" || i.status === "error").length;
  const analyzingNow = items.some((i) => i.status === "analyzing");
  const pct =
    total > 0 ? Math.min(100, Math.round(((finished + (analyzingNow ? 0.6 : 0)) / total) * 100)) : 0;

  return (
    <div
      className="relative flex min-h-[calc(100vh-120px)] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy
      aria-label="Ranking creatives in progress"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--rank-ambient)" }}
        aria-hidden
      />

      <div className="relative z-[1] flex w-full max-w-[1042px] flex-col items-center gap-[60px]">
        <div className="inline-flex items-center gap-[9px] rounded-full border border-[rgba(97,95,255,0.2)] bg-[rgba(99,102,241,0.08)] px-[14px] py-[5px]">
          <span className="size-[6.57px] shrink-0 rounded-full bg-[#7c86ff] opacity-80" aria-hidden />
          <span className="text-[13.141px] font-medium text-[#a3b3ff]">
            {total} {total === 1 ? "creative" : "creatives"}
          </span>
        </div>

        <div className="flex w-full flex-wrap items-start justify-center gap-x-[31px] gap-y-8">
          {items.map((item, i) => {
            const phase = rankItemLoadPhase(item);
            const name = sanitizeFileName(item.file.name);
            const displayName = name.length > 22 ? `${name.slice(0, 19)}…` : name;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex w-[min(100%,220px)] shrink-0 flex-col items-center"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[15.54px] border border-[rgba(255,255,255,0.06)] bg-[#c4c4c4]">
                  {item.format === "static" && previewUrls[item.id] ? (
                    <img src={previewUrls[item.id]} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : previewUrls[item.id] ? (
                    <video src={previewUrls[item.id]} className="absolute inset-0 size-full object-cover" muted playsInline preload="metadata" />
                  ) : null}

                  <div className="absolute right-[11px] top-[11px] flex items-center rounded-[5px] bg-[rgba(0,0,0,0.7)] px-[7px] py-px">
                    <span className="text-[11.2px] font-medium text-white">
                      {item.format === "video" ? "Video" : "Static"}
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-[rgba(0,0,0,0.8)] to-transparent pb-[10px] pt-[20px]">
                    <p className="m-0 w-full truncate px-[10px] text-[11.2px] font-medium text-white">
                      {displayName}
                    </p>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <RankStatusBadge phase={phase} />
                  </div>
                </div>
                <RankStatusLabel phase={phase} />
              </motion.div>
            );
          })}
        </div>

        <div className="flex w-full max-w-[910px] flex-col items-center gap-3">
          <div className="flex w-full items-center gap-[13.141px]">
            <p className="m-0 shrink-0 text-[14.236px] font-medium text-[#9f9fa9]" aria-live="polite">
              {finished} of {total} analyzed
            </p>
            <div className="relative h-[4.38px] min-w-0 flex-1 overflow-hidden rounded-full bg-[#27272a]">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-[color:var(--accent)]"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="m-0 shrink-0 font-mono text-[13.141px] font-medium text-[#7c86ff]">{pct}%</p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-3">
            <p className="m-0 text-[13px] text-[#71717b]">This usually takes 20–30 seconds</p>
            {showStopLink && (
              <button
                type="button"
                onClick={onRequestStopAfterCurrent}
                className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[#71717b] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              >
                <X size={11} aria-hidden />
                Cancel analysis
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RankBatchResultsViewProps {
  items: BatchItem[];
  ranked: RankedRow[];
  previewUrls: Record<string, string>;
  rankTestType: RankTestType;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  isDark: boolean;
  onRankMore: () => void;
}

/** Results — header + “test these two” hero + expandable list (prototype parity, real data) */
function RankBatchResultsView({
  items,
  ranked,
  previewUrls,
  rankTestType,
  expandedId,
  setExpandedId,
  isDark: _isDark,
  onRankMore,
}: RankBatchResultsViewProps) {
  void _isDark;
  const errorItems = items.filter((i) => i.status === "error");
  const testLabel = rankTestTypeLabel(rankTestType);
  const baseName = (row: RankedRow) => row.item.result?.fileName ?? sanitizeFileName(row.item.file.name);
  const shortBase = (row: RankedRow) => {
    const n = baseName(row);
    const dot = n.lastIndexOf(".");
    return dot > 0 ? n.slice(0, dot) : n;
  };

  return (
    <div className="relative flex min-h-[calc(100vh-120px)] flex-col bg-[color:var(--bg)] pb-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(548px,50vh)]"
        style={{ background: "var(--rank-ambient)" }}
        aria-hidden
      />
      <div className="relative z-[1] mx-auto flex w-full max-w-[1000px] flex-col px-6 pb-10 pt-8 sm:pt-10">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--accent-border)] bg-[color:var(--accent-subtle)]"
              style={{ boxShadow: "var(--shadow-glow)" }}
              aria-hidden
            >
              <Trophy className="size-[22px] text-[color:var(--accent-light)]" strokeWidth={2} />
            </div>
            <h2 className="m-0 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.025em] text-[color:var(--ink)]">
              {items.length} creatives ranked
            </h2>
          </div>
          <button
            type="button"
            onClick={onRankMore}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] text-[13px] font-medium text-white transition-[transform,background-color,opacity] duration-150 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.99] md:w-auto md:px-5"
          >
            <Zap className="size-3.5" strokeWidth={2} aria-hidden />
            Rank more
          </button>
        </div>

        <p className="m-0 mb-8 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--ink-muted)] md:text-left">
          {testLabel}
        </p>

        {ranked.length >= 2 && (
          <div className="group relative mb-10 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-md)]">
            <div
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-0.5 bg-[color:var(--success)]"
              style={{ boxShadow: "0 0 20px color-mix(in srgb, var(--success) 45%, transparent)" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, color-mix(in srgb, var(--success) 5%, transparent), transparent)",
              }}
              aria-hidden
            />
            <div className="relative z-[1] flex flex-col gap-8 p-6 sm:p-8 md:flex-row md:items-center md:gap-10 lg:p-10">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:color-mix(in_srgb,var(--success)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--success)]">
                    <TrendingUp className="size-3" strokeWidth={2.5} aria-hidden />
                    Test these two
                  </span>
                </div>
                <h3 className="m-0 text-[clamp(1.15rem,2.5vw,1.75rem)] font-semibold leading-snug tracking-tight text-[color:var(--ink)]">
                  <span className="text-[color:var(--success)]">{shortBase(ranked[0])}</span>
                  {" and "}
                  <span className="text-[color:var(--success)]">{shortBase(ranked[1])}</span>
                </h3>
                <p className="m-0 mt-2 max-w-xl text-[15px] leading-relaxed text-[color:var(--ink-secondary)]">
                  They scored highest across hook, CTA, and clarity. Prioritize spend on these before testing the rest.
                </p>
              </div>
              <div className="relative mx-auto hidden h-[160px] w-[280px] shrink-0 md:block">
                <div className="absolute right-0 top-4 w-[160px] overflow-hidden rounded-xl border border-[color:var(--border)] opacity-60 shadow-lg rotate-6 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-12">
                  {ranked[1].item.format === "static" ? (
                    <img src={previewUrls[ranked[1].item.id]} alt="" className="h-[120px] w-full object-cover grayscale-[30%]" />
                  ) : (
                    <video src={previewUrls[ranked[1].item.id]} className="h-[120px] w-full object-cover grayscale-[30%]" muted playsInline preload="metadata" />
                  )}
                  <div className="absolute right-2 top-2 rounded bg-[color:var(--rank-badge-overlay)] px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    #2
                  </div>
                </div>
                <div className="absolute left-0 top-0 w-[180px] overflow-hidden rounded-xl border-2 border-[color:color-mix(in_srgb,var(--success)_35%,transparent)] shadow-[0_10px_30px_color-mix(in_srgb,var(--success)_18%,transparent)] -rotate-2 transition-transform duration-300 group-hover:-translate-x-1 group-hover:-rotate-3">
                  {ranked[0].item.format === "static" ? (
                    <img src={previewUrls[ranked[0].item.id]} alt="" className="h-[135px] w-full object-cover" />
                  ) : (
                    <video src={previewUrls[ranked[0].item.id]} className="h-[135px] w-full object-cover" muted playsInline preload="metadata" />
                  )}
                  <div className="absolute left-2 top-2 rounded bg-[color:var(--success)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--bg)]">
                    #1
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {ranked.map(({ item, overall }, idx) => {
            const rank = idx + 1;
            const fn = item.result?.fileName ?? sanitizeFileName(item.file.name);
            const displayName = fn.length > 40 ? `${fn.slice(0, 37)}…` : fn;
            const isExpanded = expandedId === item.id;
            const wouldScale = overall >= 7;
            const scores = item.result?.scores;
            const isGold = rank === 1;
            const isSilver = rank === 2;
            const isBronze = rank === 3;
            const rankColor =
              isGold
                ? "text-[color:var(--warn)]"
                : isSilver
                  ? "text-[color:var(--ink-secondary)]"
                  : isBronze
                    ? "text-[color:var(--score-average)]"
                    : "text-[color:var(--ink-muted)]";
            const cardBorder = isGold
              ? isExpanded
                ? "border-[color:color-mix(in_srgb,var(--warn)_35%,transparent)]"
                : "border-[color:color-mix(in_srgb,var(--warn)_22%,transparent)]"
              : isExpanded
                ? "border-[color:var(--accent-border-strong)]"
                : "border-[color:var(--border)]";

            return (
              <motion.div
                layout
                key={item.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-[color:var(--card)] transition-[border-color,background-color] duration-200",
                  cardBorder,
                  isExpanded && "bg-[color:color-mix(in_srgb,var(--surface)_98%,transparent)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full cursor-pointer flex-col gap-5 p-5 text-left transition-[background-color] duration-150 hover:bg-[color:color-mix(in_srgb,var(--surface)_60%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
                    <div className={cn("w-10 shrink-0 text-center text-[28px] font-bold tabular-nums leading-none md:w-11", rankColor)}>
                      #{rank}
                    </div>
                    <div
                      className={cn(
                        "relative shrink-0 overflow-hidden border border-[color:var(--border)] bg-black/40",
                        isGold ? "size-20 rounded-xl" : "h-16 w-[100px] rounded-lg",
                      )}
                    >
                      {item.format === "static" ? (
                        <img src={previewUrls[item.id]} alt="" className="size-full object-cover opacity-90" />
                      ) : (
                        <video src={previewUrls[item.id]} className="size-full object-cover opacity-90" muted playsInline preload="metadata" />
                      )}
                      <div className="pointer-events-none absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded bg-[color:var(--rank-badge-overlay)] px-1 py-0.5 text-[8px] font-medium text-white">
                        {item.format === "video" ? (
                          <Play className="size-2 text-white" aria-hidden />
                        ) : (
                          <ImageIcon className="size-2 text-white" aria-hidden />
                        )}
                        {item.format === "video" ? "Video" : "Static"}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[15px] font-medium tracking-tight text-[color:var(--ink)]">{displayName}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {wouldScale ? (
                          <span className="inline-flex items-center gap-1 rounded border border-[color:color-mix(in_srgb,var(--success)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--success)_8%,transparent)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--success)]">
                            <Check className="size-2.5" strokeWidth={2.5} aria-hidden />
                            Would scale
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-[color:var(--border)] bg-[color:var(--surface-el)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ink-muted)]">
                            <AlertCircle className="size-2.5" strokeWidth={2} aria-hidden />
                            Needs rework
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pl-14 md:justify-end md:pl-0">
                    <div className="flex flex-col items-end">
                      <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">Overall</span>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("font-mono text-[28px] font-bold leading-none tabular-nums", rankOverallScoreColorClass(overall))}>
                          {formatRankScoreDisplay(overall)}
                        </span>
                        <span className="font-mono text-sm font-medium text-[color:var(--ink-muted)]">/10</span>
                      </div>
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-el)] text-[color:var(--ink-muted)] transition-[color,background-color] duration-150">
                      {isExpanded ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
                    </div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && scores && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_85%,transparent)]"
                    >
                      <div className="flex flex-col gap-8 p-6 md:flex-row md:p-8 lg:gap-10">
                        <div className="min-w-0 flex-1 space-y-6">
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--success)]">
                              <span className="size-1.5 rounded-full bg-[color:var(--success)] shadow-[0_0_8px_color-mix(in_srgb,var(--success)_80%,transparent)]" />
                              Strengths
                            </h4>
                            <p className="m-0 text-[14px] leading-relaxed text-[color:var(--ink-secondary)]">{rankStrengthsFromScores(scores)}</p>
                          </div>
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--error)]">
                              <span className="size-1.5 rounded-full bg-[color:var(--error)] shadow-[0_0_8px_color-mix(in_srgb,var(--error)_60%,transparent)]" />
                              Gaps
                            </h4>
                            <p className="m-0 text-[14px] leading-relaxed text-[color:var(--ink-muted)]">
                              {rankWeaknessesFromImprovements(item.result?.improvements ?? [])}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full min-w-0 flex-col gap-1 md:max-w-[360px]">
                          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">Score breakdown</h4>
                          <RankDimensionBar label="Hook" score={scores.hook} delay={0.05} />
                          <RankDimensionBar label="Clarity" score={scores.clarity} delay={0.1} />
                          <RankDimensionBar label="CTA" score={scores.cta} delay={0.15} />
                          <RankDimensionBar label="Production" score={scores.production} delay={0.2} />
                          <div className="mt-4 flex justify-end border-t border-[color:var(--border)] pt-4">
                            <Link
                              to={`scorecard/${item.id}`}
                              className="text-[13px] font-medium text-[color:var(--accent)] underline decoration-solid underline-offset-2 transition-[opacity] duration-150 hover:opacity-90 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-90"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View full scorecard →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {errorItems.map((item) => {
            const name = sanitizeFileName(item.file.name);
            const displayName = name.length > 40 ? `${name.slice(0, 37)}…` : name;
            return (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[color:var(--score-weak-border)] bg-[color:var(--score-weak-bg)] p-5 md:flex-row md:items-center md:gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-[100px] shrink-0 overflow-hidden rounded-lg border border-[color:var(--border)] opacity-70">
                    {item.format === "static" ? (
                      <img src={previewUrls[item.id]} alt="" className="size-full object-cover" />
                    ) : (
                      <video src={previewUrls[item.id]} className="size-full object-cover" muted playsInline preload="metadata" />
                    )}
                  </div>
                  <div>
                    <p className="m-0 text-[13px] font-semibold text-[color:var(--error)]">Analysis failed</p>
                    <p className="m-0 mt-1 text-[12px] text-[color:var(--ink-muted)]">{displayName}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {ranked.length === 0 && errorItems.length > 0 && (
          <p className="m-0 mt-6 text-center text-[14px] text-[color:var(--ink-muted)]">
            Every creative failed to analyze. Try different files or try again.
          </p>
        )}

        {ranked.length >= 4 && ranked[ranked.length - 1].overall <= 5 && (
          <div className="mt-8 flex items-start gap-2 rounded-xl border border-[color:var(--score-weak-border)] bg-[color:var(--score-weak-bg)] px-3.5 py-2.5">
            <X className="mt-0.5 size-3.5 shrink-0 text-[color:var(--error)]" aria-hidden />
            <div>
              <span className="text-[12px] font-medium text-[color:var(--error)]">
                Don&apos;t spend on #{ranked.length}
                {ranked.length >= 5 ? ` or #${ranked.length - 1}` : ""}
              </span>
              <p className="m-0 mt-0.5 text-[11px] text-[color:var(--ink-muted)]">Score too low to justify ad spend. Fix improvements first.</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onRankMore}
          className="mt-10 flex h-[46px] w-full items-center justify-center gap-2 rounded-[11.5px] text-[13.5px] font-semibold text-white transition-[transform,background-color,opacity] duration-150 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.99] md:hidden"
        >
          <Trophy className="size-[15px]" strokeWidth={2} aria-hidden />
          Rank more creatives
        </button>
      </div>
    </div>
  );
}

/** Rank Creatives workspace UI — state lives in RankBatchProvider (see BatchPage). */
export function BatchView() {
  const {
    isDark,
    t,
    items,
    setItems,
    isRunning,
    showUpgradeModal,
    setShowUpgradeModal,
    expandedId,
    setExpandedId,
    rejectionToast,
    setRejectionToast,
    confirmResetOpen,
    setConfirmResetOpen,
    rankPlatform,
    setRankPlatform,
    rankTestType,
    setRankTestType,
    dropzoneDrag,
    setDropzoneDrag,
    stopAfterCurrentUi,
    setStopAfterCurrentUi,
    stopRequestedRef,
    fileInputRef,
    allDone,
    ranked,
    previewUrls,
    addFiles,
    removeItem,
    runBatch,
    canStartRanking,
  } = useRankBatch();

  // ── RENDER: Figma 286-677 batch loading ───────────────────────────────────
  if (!allDone && isRunning && items.length > 0) {
    return (
      <>
        <RankBatchLoadingView
          items={items}
          previewUrls={previewUrls}
          showStopLink={!stopAfterCurrentUi}
          onRequestStopAfterCurrent={() => {
            stopRequestedRef.current = true;
            setStopAfterCurrentUi(true);
            setItems([]);
          }}
        />
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}
        {rejectionToast && (
          <Toast message={rejectionToast.message} variant="warning" duration={4000} onClose={() => setRejectionToast(null)} />
        )}
        <AlertDialog
          open={confirmResetOpen}
          onClose={() => setConfirmResetOpen(false)}
          onConfirm={() => {
            setItems([]);
            setExpandedId(null);
          }}
          title="Start a new batch?"
          description="Your current rankings will be cleared. Consider exporting first."
          confirmLabel="Clear & Start Over"
          variant="default"
        />
      </>
    );
  }

  // ── RENDER: Figma 264-2926 workspace ─────────────────────────────────────
  if (!allDone) {
    return (
      <>
        <div
          className={cn(
            "relative flex w-full flex-1 flex-col overflow-y-auto bg-[color:var(--bg)] py-[62px]",
            items.length === 0
              ? "min-h-[min(100%,calc(100vh-120px))] justify-center"
              : "min-h-[calc(100vh-120px)] justify-start",
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[min(480px,45vh)]"
            style={{ background: "var(--rank-ambient)" }}
            aria-hidden
          />
          <div className="relative z-[1] mx-auto flex w-full max-w-[732px] flex-col items-stretch gap-[31px] px-6">
            <div className="flex w-full flex-col items-center gap-[22px]">
              <div
                className="flex size-[76px] shrink-0 items-center justify-center rounded-[16px] border border-[color:var(--rank-tile-border)] bg-[color:var(--rank-tile-bg)]"
                aria-hidden
              >
                <Trophy className="size-[32px] text-[color:var(--rank-tile-icon)]" strokeWidth={1.75} />
              </div>
              <div className="flex flex-col items-center gap-[12px]">
                <div className="flex flex-col items-center gap-[6px]">
                  <h2 className="m-0 text-center text-[19px] font-semibold leading-tight text-[color:var(--ink)]">
                    Rank your creatives
                  </h2>
                  <p className="m-0 max-w-[390px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
                    Upload up to 10 ad creatives. Cutsheet ranks them by predicted performance so you know exactly where to put your budget.
                  </p>
                </div>
                <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
                  {FEATURE_CHIPS.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex h-[27px] items-center gap-1.5 rounded-full border border-[color:var(--rank-feature-pill-border)] bg-[color:var(--rank-feature-pill-bg)] px-3 text-[11.5px] text-[color:var(--rank-feature-pill-text)]"
                    >
                      <Icon className="size-[11.5px] shrink-0 opacity-90" aria-hidden />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[11px]">
              <div className="flex min-w-0 w-full flex-col gap-[7.7px]">
                <p className="m-0 text-[9.6px] font-semibold uppercase tracking-[0.12em] text-[color:var(--rank-section-label)]">Platform</p>
                <div className="flex flex-wrap items-center gap-[5.8px]">
                  {RANK_PLATFORMS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRankPlatform(opt.value)}
                      className={cn(
                        "inline-flex h-[27px] shrink-0 items-center justify-center rounded-full border px-3 text-[12.5px] font-medium transition-[background-color,border-color,color,opacity,transform] duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                        "active:scale-[0.99]",
                        rankPlatform === opt.value
                          ? "border-[color:var(--ab-test-type-active-border)] bg-[color:var(--ab-test-type-active-bg)] text-[color:var(--ab-test-type-active-text)]"
                          : "border-[color:var(--ab-test-type-inactive-border)] bg-[color:var(--ab-test-type-inactive-bg)] text-[color:var(--ab-test-type-inactive-text)] hover:border-[color:var(--border-hover)]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {items.length < MAX_FILES && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropzoneDrag(true);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropzoneDrag(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropzoneDrag(false);
                    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
                  }}
                  className={cn(
                    "flex min-h-[223px] w-full cursor-pointer flex-col items-center justify-center gap-[23px] rounded-[15px] border px-4 transition-[border-color,background-color] duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                    dropzoneDrag
                      ? "border-[color:var(--accent-border)] bg-[color:var(--ab-drag-hover-bg)]"
                      : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)]",
                  )}
                >
                  <CloudUpload className="size-[27px] shrink-0 text-[color:var(--ink-muted)]" strokeWidth={2} aria-hidden />
                  <div className="flex flex-col items-center gap-[5px] text-center">
                    <p className="m-0 text-[14px] font-medium leading-tight text-[color:var(--ink)]">Drop your ad here</p>
                    <button
                      type="button"
                      className="text-[12.5px] font-normal leading-[15px] text-[color:var(--rank-browse-link)] transition-opacity duration-150 hover:opacity-90 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      or browse files
                    </button>
                  </div>
                  <p className="m-0 text-[11.5px] font-normal leading-[15px] text-[color:var(--rank-add-more-text)]">MP4 · MOV · JPG · PNG · up to 500MB</p>
                </div>
              )}
            </div>

            <div className="flex min-w-0 w-full flex-col gap-[7.7px]">
              <p className="m-0 text-[9.6px] font-semibold uppercase tracking-[0.12em] text-[color:var(--rank-section-label)]">Test type</p>
              <div className="flex flex-wrap items-center gap-[5.8px]">
                {RANK_TEST_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRankTestType(opt.value)}
                    className={cn(
                      "inline-flex h-[27px] shrink-0 items-center justify-center rounded-full border px-3 text-[11.5px] font-medium transition-[background-color,border-color,color,opacity,transform] duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                      "active:scale-[0.99]",
                      rankTestType === opt.value
                        ? "border-[color:var(--ab-test-type-active-border)] bg-[color:var(--ab-test-type-active-bg)] text-[color:var(--ab-test-type-active-text)]"
                        : "border-[color:var(--ab-test-type-inactive-border)] bg-[color:var(--ab-test-type-inactive-bg)] text-[color:var(--ab-test-type-inactive-text)] hover:border-[color:var(--border-hover)]",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <p className="m-0 text-[10.6px] font-semibold uppercase tracking-[0.12em] text-[color:var(--rank-queue-label)]">
                  Queue · {items.length} {items.length === 1 ? "creative" : "creatives"}
                </p>
                {items.length < MAX_FILES && items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[color:var(--rank-add-more-text)] transition-[color,opacity] duration-150 hover:text-[color:var(--ink-muted)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-90"
                  >
                    <Plus className="size-3" aria-hidden />
                    Add more
                  </button>
                )}
              </div>
              {items.length > 0 && (
                <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 px-1 [scrollbar-width:thin]">
                  {items.map((item) => {
                    const name = sanitizeFileName(item.file.name);
                    const displayName = name.length > 22 ? `${name.slice(0, 19)}…` : name;
                    return (
                      <div
                        key={item.id}
                        className="relative h-[280px] w-[160px] shrink-0 overflow-hidden rounded-[23px] border border-[color:var(--border)] bg-[color:var(--card)] sm:h-[309px] sm:w-[174px]"
                      >
                        <div className="absolute inset-0 opacity-80">
                          {item.format === "static" ? (
                            <img src={previewUrls[item.id]} alt="" className="size-full object-cover" />
                          ) : (
                            <video src={previewUrls[item.id]} className="size-full object-cover" muted playsInline />
                          )}
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52px] bg-gradient-to-t from-[rgba(0,0,0,0.8)] to-transparent px-2 pt-3">
                          <p className="m-0 truncate text-[8.7px] font-medium text-white">{displayName}</p>
                        </div>
                        <div className="pointer-events-none absolute bottom-14 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.7px] font-medium text-white bg-[color:var(--rank-badge-overlay)]">
                          {item.format === "video" ? (
                            <Play className="size-[7px] shrink-0 text-white" aria-hidden />
                          ) : (
                            <ImageIcon className="size-[7px] shrink-0 text-white" aria-hidden />
                          )}
                          {item.format === "video" ? "Video" : "Static"}
                        </div>
                        {item.status === "analyzing" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div
                              className="size-8 rounded-full border-2 border-[color:var(--accent)] border-t-transparent"
                              style={{ animation: "batch-spin 0.65s linear infinite" }}
                              aria-hidden
                            />
                          </div>
                        )}
                        {item.status === "complete" && item.result?.scores && (
                          <div className="absolute right-2 top-2 rounded-md bg-[color:var(--rank-badge-overlay)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                            {(recalculateOverallScore(item.result.scores) ?? item.result.scores).overall}
                          </div>
                        )}
                        {item.status === "error" && (
                          <div className="absolute right-2 top-2 rounded-md bg-[color:var(--error)]/90 px-1.5 py-0.5 text-[9px] font-medium text-white">Error</div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-lg border border-[color:var(--border)] bg-black/50 text-[color:var(--ink-muted)] transition-[color,background-color,opacity] duration-150 hover:bg-black/70 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-90"
                          aria-label={`Remove ${name}`}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex w-full justify-center">
              <button
                type="button"
                onClick={runBatch}
                disabled={!canStartRanking}
                className={cn(
                  "inline-flex h-[45px] w-[158px] items-center justify-center gap-2 rounded-[45px] border text-[13.5px] font-semibold transition-[transform,opacity,border-color,background-color] duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                  canStartRanking
                    ? "border-[rgba(129,140,248,0.3)] bg-[rgba(129,140,248,0.1)] text-[#818cf8] hover:bg-[rgba(129,140,248,0.15)] active:scale-[0.98]"
                    : "cursor-not-allowed border-[rgba(129,140,248,0.12)] bg-[rgba(129,140,248,0.04)] text-[rgba(129,140,248,0.4)]",
                )}
              >
                <Trophy className="size-[15px]" strokeWidth={2} aria-hidden />
                Start Ranking
              </button>
            </div>
          </div>
        </div>

        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}
        {rejectionToast && (
          <Toast message={rejectionToast.message} variant="warning" duration={4000} onClose={() => setRejectionToast(null)} />
        )}
        <AlertDialog
          open={confirmResetOpen}
          onClose={() => setConfirmResetOpen(false)}
          onConfirm={() => {
            setItems([]);
            setExpandedId(null);
          }}
          title="Start a new batch?"
          description="Your current rankings will be cleared. Consider exporting first."
          confirmLabel="Clear & Start Over"
          variant="default"
        />
        <style>{`@keyframes batch-spin { to { transform: rotate(360deg) } }`}</style>
      </>
    );
  }

  // ── RESULTS: Figma 286-677 card row (complete state) + detail ─────────────
  return (
    <>
      <RankBatchResultsView
        items={items}
        ranked={ranked}
        previewUrls={previewUrls}
        rankTestType={rankTestType}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        isDark={isDark}
        onRankMore={() => setConfirmResetOpen(true)}
      />

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={t} />}

      {rejectionToast && <Toast message={rejectionToast.message} variant="warning" duration={4000} onClose={() => setRejectionToast(null)} />}

      <AlertDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setItems([]);
          setExpandedId(null);
        }}
        title="Start a new batch?"
        description="Your current rankings will be cleared. Consider exporting first."
        confirmLabel="Clear & Start Over"
        variant="default"
      />
    </>
  );
}
