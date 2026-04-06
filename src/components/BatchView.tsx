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
} from "lucide-react";
import { sanitizeFileName } from "../utils/sanitize";
import { AnimatePresence, motion } from "framer-motion";
import { recalculateOverallScore } from "../services/analyzerService";
import { ScoreCard } from "./ScoreCard";
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

/** Shared hero — Figma Rank page 264-2926 / 286-677 */
function RankPageHero({ title, creativeCount, testTypeLabel }: { title: string; creativeCount: number; testTypeLabel: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        className="relative flex size-[83px] shrink-0 items-center justify-center overflow-visible rounded-[17.5px] border border-[color:var(--rank-tile-border)] bg-[color:var(--rank-tile-bg)]"
        aria-hidden
      >
        <div
          className="pointer-events-none absolute -inset-[38px] rounded-[17.5px] border border-[color:var(--rank-tile-border)] opacity-30"
          aria-hidden
        />
        <Trophy className="relative z-[1] size-[35px] text-[color:var(--rank-tile-icon)]" strokeWidth={1.75} />
      </div>
      <h2 className="m-0 text-center text-[clamp(2rem,5vw,2.75rem)] font-bold tracking-[-0.025em] text-[color:var(--ink)]">{title}</h2>
      <div className="inline-flex h-[31px] items-center gap-2 rounded-full border border-[color:var(--rank-loading-meta-pill-border)] bg-[color:var(--rank-loading-meta-pill-bg)] px-3.5">
        <span className="size-[6.5px] shrink-0 rounded-full bg-[color:var(--rank-loading-meta-dot)] opacity-90" aria-hidden />
        <span className="text-[13px] font-medium text-[color:var(--rank-loading-meta-text)]">
          {creativeCount} {creativeCount === 1 ? "creative" : "creatives"} · {testTypeLabel}
        </span>
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

interface RankBatchLoadingViewProps {
  items: BatchItem[];
  previewUrls: Record<string, string>;
  rankTestType: RankTestType;
  showStopLink: boolean;
  onRequestStopAfterCurrent: () => void;
}

function RankBatchLoadingView({ items, previewUrls, rankTestType, showStopLink, onRequestStopAfterCurrent }: RankBatchLoadingViewProps) {
  const total = items.length;
  const finished = items.filter((i) => i.status === "complete" || i.status === "error").length;
  const analyzingNow = items.some((i) => i.status === "analyzing");
  const pct =
    total > 0 ? Math.min(100, Math.round(((finished + (analyzingNow ? 0.6 : 0)) / total) * 100)) : 0;

  return (
    <div className="relative flex min-h-[calc(100vh-120px)] flex-col bg-[color:var(--bg)] pb-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(548px,50vh)]"
        style={{ background: "var(--rank-ambient)" }}
        aria-hidden
      />
      <div className="relative z-[1] mx-auto flex w-full max-w-[1042px] flex-col items-center gap-10 px-6 pt-8 sm:pt-12">
        <RankPageHero
          title="Ranking Creatives"
          creativeCount={total}
          testTypeLabel={rankTestTypeLabel(rankTestType)}
        />

        <div className="flex w-full gap-[13px] overflow-x-auto pb-2 [scrollbar-width:thin]">
          {items.map((item) => {
            const phase = rankItemLoadPhase(item);
            const name = sanitizeFileName(item.file.name);
            const displayName = name.length > 24 ? `${name.slice(0, 21)}…` : name;
            const score =
              item.result?.scores != null ? (recalculateOverallScore(item.result.scores) ?? item.result.scores).overall : null;

            const shell = cn(
              "relative flex h-[min(393px,70vh)] w-[186px] shrink-0 flex-col overflow-hidden rounded-[26px] border",
              phase === "complete" &&
                "border-[color:var(--rank-load-card-complete-border)] bg-[color:var(--rank-load-card-complete-bg)]",
              phase === "analyzing" &&
                "border-[color:var(--rank-load-card-analyzing-border)] bg-[color:var(--rank-load-card-analyzing-bg)]",
              (phase === "pending" || phase === "error") &&
                "border-[color:var(--rank-load-card-pending-border)] bg-[color:var(--rank-load-card-pending-bg)]",
            );

            return (
              <div key={item.id} className={shell}>
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <div className="absolute inset-0 opacity-80">
                    {item.format === "static" ? (
                      <img src={previewUrls[item.id]} alt="" className="size-full object-cover" />
                    ) : (
                      <video src={previewUrls[item.id]} className="size-full object-cover" muted playsInline preload="metadata" />
                    )}
                  </div>

                  <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.9px] font-medium text-white bg-[color:var(--rank-badge-overlay)]">
                    {item.format === "video" ? (
                      <Play className="size-2 shrink-0 text-white" aria-hidden />
                    ) : (
                      <ImageIcon className="size-2 shrink-0 text-white" aria-hidden />
                    )}
                    {item.format === "video" ? "Video" : "Static"}
                  </div>

                  {phase === "complete" && score != null && (
                    <div className="absolute right-2 top-2 rounded-md bg-[color:var(--rank-load-score-badge-bg)] px-2 py-0.5 font-bold tabular-nums text-[12px] text-[color:var(--rank-load-score-text)]">
                      {score}
                    </div>
                  )}

                  {phase === "complete" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--rank-load-complete-check-bg)] shadow-sm">
                        <Check className="size-5 text-white" strokeWidth={2.5} aria-hidden />
                      </div>
                    </div>
                  )}

                  {phase === "analyzing" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--rank-load-analyzing-spinner-bg)]">
                        <Loader2 className="size-5 animate-spin text-white" strokeWidth={2} aria-hidden />
                      </div>
                    </div>
                  )}

                  {phase === "pending" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--rank-load-pending-icon-bg)]">
                        <Clock className="size-[18px] text-[color:var(--ink-muted)]" strokeWidth={2} aria-hidden />
                      </div>
                    </div>
                  )}
                  {phase === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--rank-load-pending-icon-bg)]">
                        <XCircle className="size-[18px] text-[color:var(--error)]" strokeWidth={2} aria-hidden />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-0.5 px-2.5 pb-2.5 pt-1">
                  <p
                    className={cn(
                      "m-0 text-[9.9px] font-semibold uppercase tracking-[0.05em]",
                      phase === "complete" && "text-[color:var(--rank-load-complete-label)]",
                      phase === "analyzing" && "text-[color:var(--rank-load-analyzing-label)]",
                      phase === "pending" && "text-[color:var(--rank-load-pending-label)]",
                      phase === "error" && "text-[color:var(--error)]",
                    )}
                  >
                    {phase === "complete" && "Complete"}
                    {phase === "analyzing" && "Analyzing…"}
                    {phase === "pending" && "Pending"}
                    {phase === "error" && "Failed"}
                  </p>
                  <p className="m-0 truncate text-[11px] leading-snug text-[color:var(--rank-feature-pill-text)]">{displayName}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex w-full max-w-[1042px] flex-col gap-3">
          <div className="flex w-full items-center gap-3">
            <p className="m-0 shrink-0 text-[14px] font-medium text-[color:var(--rank-load-progress-label)]" aria-live="polite">
              {finished} of {total} analyzed
            </p>
            <div className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[color:var(--rank-load-progress-track)]">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[color:var(--rank-load-progress-fill)] transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="m-0 w-10 shrink-0 text-right font-mono text-[13px] font-medium text-[color:var(--rank-load-progress-pct)]">{pct}%</p>
          </div>
          {showStopLink && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onRequestStopAfterCurrent}
                className="border-0 bg-transparent p-0 text-[13px] font-normal text-[color:var(--rank-load-stop-link)] underline decoration-solid underline-offset-2 transition-[color,opacity] duration-150 hover:text-[color:var(--ink-muted)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-90"
              >
                Stop after current
              </button>
            </div>
          )}
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

/** Results — same shell + complete-style cards as Figma 286-677 (loading row), no progress strip */
function RankBatchResultsView({
  items,
  ranked,
  previewUrls,
  rankTestType,
  expandedId,
  setExpandedId,
  isDark,
  onRankMore,
}: RankBatchResultsViewProps) {
  const errorItems = items.filter((i) => i.status === "error");
  const testLabel = rankTestTypeLabel(rankTestType);
  const expandedRow = ranked.find((r) => r.item.id === expandedId);

  return (
    <div className="relative flex min-h-[calc(100vh-120px)] flex-col bg-[color:var(--bg)] pb-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(548px,50vh)]"
        style={{ background: "var(--rank-ambient)" }}
        aria-hidden
      />
      <div className="relative z-[1] mx-auto flex w-full max-w-[1042px] flex-col gap-8 px-6 pb-10 pt-8 sm:gap-10 sm:pt-12">
        <RankPageHero title="Creatives ranked" creativeCount={items.length} testTypeLabel={testLabel} />

        {ranked.length >= 2 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[color:var(--ab-results-hybrid-card-border)] bg-[color:var(--ab-results-hybrid-card-bg)] px-4 py-3.5">
            <Trophy className="mt-0.5 size-4 shrink-0 text-[color:var(--decon-accent-light)]" strokeWidth={2} aria-hidden />
            <div className="min-w-0">
              <p className="m-0 text-[14px] font-semibold text-[color:var(--ink)]">
                Test these two: {ranked[0].item.result!.fileName.split(".")[0]} and {ranked[1].item.result!.fileName.split(".")[0]}
              </p>
              <p className="m-0 mt-1 text-[12px] text-[color:var(--ink-muted)]">They scored highest across hook, CTA, and clarity.</p>
            </div>
          </div>
        )}

        <div className="flex w-full gap-[13px] overflow-x-auto pb-1 [scrollbar-width:thin]">
          {ranked.map(({ item, overall }, idx) => {
            const rank = idx + 1;
            const fn = item.result?.fileName ?? sanitizeFileName(item.file.name);
            const displayName = fn.length > 24 ? `${fn.slice(0, 21)}…` : fn;
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex h-[min(393px,70vh)] w-[186px] shrink-0 flex-col overflow-hidden rounded-[26px] border border-[color:var(--rank-load-card-complete-border)] bg-[color:var(--rank-load-card-complete-bg)] transition-[box-shadow] duration-150",
                  isExpanded && "shadow-[0_0_0_2px_var(--accent)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  aria-expanded={isExpanded}
                  className="relative min-h-0 flex-1 overflow-hidden text-left transition-opacity duration-150 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:opacity-90"
                >
                  <div className="absolute inset-0 opacity-80">
                    {item.format === "static" ? (
                      <img src={previewUrls[item.id]} alt="" className="size-full object-cover" />
                    ) : (
                      <video src={previewUrls[item.id]} className="size-full object-cover" muted playsInline preload="metadata" />
                    )}
                  </div>
                  <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.9px] font-medium text-white bg-[color:var(--rank-badge-overlay)]">
                    {item.format === "video" ? (
                      <Play className="size-2 shrink-0 text-white" aria-hidden />
                    ) : (
                      <ImageIcon className="size-2 shrink-0 text-white" aria-hidden />
                    )}
                    {item.format === "video" ? "Video" : "Static"}
                  </div>
                  <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-[color:var(--rank-load-score-badge-bg)] px-2 py-0.5 font-bold tabular-nums text-[12px] text-[color:var(--rank-load-score-text)]">
                    {formatRankScoreDisplay(overall)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--rank-load-complete-check-bg)] shadow-sm">
                      <Check className="size-5 text-white" strokeWidth={2.5} aria-hidden />
                    </div>
                  </div>
                </button>
                <div className="flex shrink-0 flex-col gap-0.5 px-2.5 pb-2.5 pt-1">
                  <p className="m-0 text-[9.9px] font-semibold uppercase tracking-[0.05em] text-[color:var(--rank-load-complete-label)]">#{rank}</p>
                  <p className="m-0 truncate text-[11px] leading-snug text-[color:var(--rank-feature-pill-text)]">{displayName}</p>
                </div>
              </div>
            );
          })}
          {errorItems.map((item) => {
            const name = sanitizeFileName(item.file.name);
            const displayName = name.length > 24 ? `${name.slice(0, 21)}…` : name;
            return (
              <div
                key={item.id}
                className="flex h-[min(393px,70vh)] w-[186px] shrink-0 flex-col overflow-hidden rounded-[26px] border border-[color:var(--rank-load-card-pending-border)] bg-[color:var(--rank-load-card-pending-bg)]"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <div className="absolute inset-0 opacity-50">
                    {item.format === "static" ? (
                      <img src={previewUrls[item.id]} alt="" className="size-full object-cover" />
                    ) : (
                      <video src={previewUrls[item.id]} className="size-full object-cover" muted playsInline preload="metadata" />
                    )}
                  </div>
                  <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.9px] font-medium text-white bg-[color:var(--rank-badge-overlay)]">
                    {item.format === "video" ? (
                      <Play className="size-2 shrink-0 text-white" aria-hidden />
                    ) : (
                      <ImageIcon className="size-2 shrink-0 text-white" aria-hidden />
                    )}
                    {item.format === "video" ? "Video" : "Static"}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--rank-load-pending-icon-bg)]">
                      <XCircle className="size-[18px] text-[color:var(--error)]" strokeWidth={2} aria-hidden />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5 px-2.5 pb-2.5 pt-1">
                  <p className="m-0 text-[9.9px] font-semibold uppercase tracking-[0.05em] text-[color:var(--error)]">Failed</p>
                  <p className="m-0 truncate text-[11px] leading-snug text-[color:var(--rank-feature-pill-text)]">{displayName}</p>
                </div>
              </div>
            );
          })}
        </div>

        {ranked.length === 0 && errorItems.length > 0 && (
          <p className="m-0 text-center text-[14px] text-[color:var(--ink-muted)]">Every creative failed to analyze. Try different files or try again.</p>
        )}

        <AnimatePresence initial={false}>
          {expandedRow?.item.result?.scores && (
            <motion.div
              key={expandedRow.item.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]"
            >
              <div className="flex flex-col">
                <ScoreCard
                  scores={expandedRow.item.result.scores}
                  improvements={expandedRow.item.result.improvements}
                  budget={expandedRow.item.result.budget}
                  hashtags={expandedRow.item.result.hashtags}
                  fileName={expandedRow.item.result.fileName}
                  isDark={isDark}
                  format={expandedRow.item.format}
                />
                <div className="flex justify-center border-t border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
                  <Link
                    to={`scorecard/${expandedRow.item.id}`}
                    className="text-[13px] font-medium text-[color:var(--accent)] underline decoration-solid underline-offset-2 transition-[color,opacity] duration-150 hover:opacity-90 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-90"
                  >
                    View full scorecard
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {ranked.length >= 4 && ranked[ranked.length - 1].overall <= 5 && (
          <div className="flex items-start gap-2 rounded-xl border border-[color:var(--score-weak-border)] bg-[color:var(--score-weak-bg)] px-3.5 py-2.5">
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
          className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[11.5px] text-[13.5px] font-semibold text-white transition-[transform,background-color,opacity] duration-150 bg-[color:var(--rank-cta-bg)] hover:bg-[color:var(--rank-cta-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.99]"
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
          rankTestType={rankTestType}
          showStopLink={!stopAfterCurrentUi}
          onRequestStopAfterCurrent={() => {
            stopRequestedRef.current = true;
            setStopAfterCurrentUi(true);
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
        <div className="relative flex min-h-[calc(100vh-120px)] flex-col bg-[color:var(--bg)] pb-10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[min(480px,45vh)]"
            style={{ background: "var(--rank-ambient)" }}
            aria-hidden
          />
          <div className="relative z-[1] mx-auto flex w-full max-w-[916px] flex-col items-stretch gap-8 px-6 pt-10">
            <div className="flex w-full flex-col items-center gap-2">
              <div
                className="flex size-[73px] shrink-0 items-center justify-center rounded-[15px] border border-[color:var(--rank-tile-border)] bg-[color:var(--rank-tile-bg)]"
                aria-hidden
              >
                <Trophy className="size-[31px] text-[color:var(--rank-tile-icon)]" strokeWidth={1.75} />
              </div>
              <h2 className="m-0 text-center text-[clamp(1.75rem,4vw,2.4rem)] font-bold tracking-[-0.025em] text-[color:var(--ink)]">
                Rank your creatives
              </h2>
              <p className="m-0 max-w-[390px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
                Upload up to 10 ad creatives. Cutsheet ranks them by predicted performance so you know exactly where to put your budget.
              </p>
              <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-2">
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

            <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-[7.7px]">
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
              <div className="flex min-w-0 flex-1 flex-col gap-[7.7px]">
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
                  "flex min-h-[155px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[15px] border border-dashed px-4 py-8 transition-[border-color,background-color] duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                  dropzoneDrag ? "border-[color:var(--accent-border)] bg-[color:var(--ab-drag-hover-bg)]" : "border-[color:var(--border)] bg-[color:var(--rank-dropzone-bg)]",
                )}
              >
                <div className="flex size-[38px] items-center justify-center rounded-[23px] border border-[color:var(--rank-feature-pill-border)] bg-[color:var(--rank-dropzone-inner-icon-bg)]">
                  <CloudUpload className="size-[17px] text-[color:var(--ink-muted)]" aria-hidden />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="m-0 text-[13.5px] font-medium text-[color:var(--ink)]">
                    Drop creatives here or{" "}
                    <button
                      type="button"
                      className="text-[color:var(--rank-browse-link)] underline-offset-2 transition-opacity duration-150 hover:opacity-90 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      browse files
                    </button>
                  </p>
                  <p className="m-0 text-[11.5px] text-[color:var(--rank-add-more-text)]">MP4, MOV, JPG, PNG · Max 200MB per file</p>
                </div>
              </div>
            )}

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

            <button
              type="button"
              onClick={runBatch}
              disabled={!canStartRanking}
              className={cn(
                "flex h-[46px] w-full items-center justify-center gap-2 rounded-[11.5px] text-[13.5px] font-semibold text-white transition-[transform,background-color,opacity] duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                canStartRanking
                  ? "bg-[color:var(--rank-cta-bg)] hover:bg-[color:var(--rank-cta-hover)] active:scale-[0.99]"
                  : "cursor-not-allowed bg-[color:var(--rank-cta-disabled-bg)] text-[color:var(--rank-cta-disabled-text)]",
              )}
            >
              <Trophy className="size-[15px]" strokeWidth={2} aria-hidden />
              Start Ranking
            </button>
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
