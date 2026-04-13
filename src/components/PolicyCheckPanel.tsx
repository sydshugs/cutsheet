// src/components/PolicyCheckPanel.tsx — Figma node 228:1098 / cutsheet-Design PolicyCheckPanel parity

import { memo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  X,
  CheckCircle,
  XCircle,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { PolicyCheckResult, PolicyCategory } from "../lib/policyCheckService";
import { formatPolicyReportAsText } from "../lib/policyCheckService";

// ─── VERDICT → summary banner (semantic bands) ───────────────────────────────

const VERDICT_BANNER = {
  good: {
    wrap: "border-emerald-500/20 bg-emerald-500/[0.06]",
    title: "text-emerald-400",
    icon: ShieldCheck,
  },
  fix: {
    wrap: "border-amber-500/20 bg-amber-500/[0.06]",
    title: "text-amber-400",
    icon: ShieldAlert,
  },
  high_risk: {
    wrap: "border-red-500/20 bg-red-500/[0.06]",
    title: "text-red-400",
    icon: ShieldX,
  },
} as const;

// ─── Category status → Figma row labels ──────────────────────────────────────

const STATUS_ROW = {
  clear: {
    label: "Clear" as const,
    Icon: CheckCircle,
    pill: "bg-emerald-500/10",
    iconClass: "text-[var(--success)]",
    textClass: "text-emerald-400",
  },
  review: {
    label: "Review" as const,
    Icon: AlertTriangle,
    pill: "bg-amber-500/10",
    iconClass: "text-[var(--warn)]",
    textClass: "text-amber-400",
  },
  rejection: {
    label: "Likely Rejection" as const,
    Icon: XCircle,
    pill: "bg-red-500/10",
    iconClass: "text-[var(--error)]",
    textClass: "text-red-400",
  },
} as const;

const RISK_BADGE = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
} as const;

const RISK_LABEL: Record<PolicyCategory["riskLevel"], string> = {
  high: "HIGH RISK",
  medium: "MEDIUM RISK",
  low: "LOW RISK",
};

// ─── Category card (Figma accordion row) ─────────────────────────────────────

function PolicyCategoryCard({ category }: { category: PolicyCategory }) {
  const [open, setOpen] = useState(category.status !== "clear");
  const row = STATUS_ROW[category.status];
  const StatusIcon = row.Icon;
  const riskClass = RISK_BADGE[category.riskLevel];

  return (
    <div className="mb-2 flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full min-w-0 items-start justify-between gap-2 px-4 py-3 text-left",
          "hover:bg-white/[0.04] transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        )}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5", row.pill)}>
              <StatusIcon size={12} className={row.iconClass} aria-hidden />
              <span className={cn("text-[10px] font-semibold", row.textClass)}>{row.label}</span>
            </div>
            {category.status !== "clear" && (
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase", riskClass)}>
                {RISK_LABEL[category.riskLevel]}
              </span>
            )}
          </div>
          <p className="break-words text-sm font-medium leading-snug text-zinc-200">{category.name}</p>
        </div>
        <div className="shrink-0 pt-0.5">
          {open ? (
            <ChevronUp size={14} className="text-zinc-500" aria-hidden />
          ) : (
            <ChevronDown size={14} className="text-zinc-500" aria-hidden />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.04] px-4 pb-4">
          <p className="mb-3 mt-3 break-words text-sm leading-relaxed text-zinc-400">{category.finding}</p>
          {category.status !== "clear" && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2.5">
              <Wrench size={12} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden />
              <p className="min-w-0 break-words text-sm leading-snug text-[var(--accent-light)]">{category.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category list + show clear (Figma order) ────────────────────────────────

function PolicyCategoryList({ categories }: { categories: PolicyCategory[] }) {
  const flagged = categories.filter((c) => c.status !== "clear");
  const clearOnly = categories.filter((c) => c.status === "clear");
  const [showClear, setShowClear] = useState(false);

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col">
      {flagged.map((c) => (
        <PolicyCategoryCard key={c.id} category={c} />
      ))}

      {clearOnly.length > 0 && (
        <div className="mb-2 mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setShowClear((v) => !v)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 py-2 text-xs text-zinc-500",
              "hover:text-zinc-300 transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            )}
          >
            {showClear ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
            <span>
              {showClear ? "Hide" : "Show"} {clearOnly.length} clear {clearOnly.length === 1 ? "item" : "items"}
            </span>
          </button>
        </div>
      )}

      {showClear && clearOnly.map((c) => <PolicyCategoryCard key={c.id} category={c} />)}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PolicyCheckPanelProps {
  result: PolicyCheckResult;
  onClose?: () => void;
  /** Right-rail / narrow column: hide duplicate “Back” and stack header so Copy/actions fit */
  embedded?: boolean;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export const PolicyCheckPanel = memo(function PolicyCheckPanel({ result, onClose, embedded = false }: PolicyCheckPanelProps) {
  const [activeTab, setActiveTab] = useState<"meta" | "tiktok">(
    result.platform === "tiktok" ? "tiktok" : "meta"
  );
  const [copied, setCopied] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const banner = VERDICT_BANNER[result.verdict];
  const BannerIcon = banner.icon;

  const showTabs = result.platform === "both";
  const activeCategories = activeTab === "meta" ? result.metaCategories : result.tiktokCategories;
  const flaggedCount = activeCategories.filter((c) => c.status !== "clear").length;

  const platformSubtitle =
    result.platform === "both"
      ? "Meta & TikTok · Ad policy scan"
      : result.platform === "tiktok"
        ? "TikTok · Ad policy scan"
        : "Meta · Ad policy scan";

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatPolicyReportAsText(result));
    } catch {
      /* clipboard blocked */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col overflow-x-hidden font-[family-name:var(--sans)]">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="group mb-4 flex w-fit cursor-pointer items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <ChevronLeft size={12} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="text-xs font-medium">Back to Scores</span>
        </button>
      )}

      {/* Header — stack in embedded rail (~270px content); row on full-width page */}
      <div
        className={cn(
          "mb-4 flex gap-3",
          embedded ? "min-w-0 flex-col" : "min-w-0 flex-col sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "border border-amber-500/[0.08] bg-amber-500/[0.12]"
            )}
          >
            <ShieldCheck size={16} className="text-[var(--warn)]" aria-hidden />
          </div>
          <div className="min-w-0 flex flex-col">
            <h2 className="text-sm font-semibold leading-tight text-zinc-100">Policy Check</h2>
            <span className="mt-0.5 break-words text-xs text-zinc-500">{platformSubtitle}</span>
          </div>
        </div>
        <div className={cn("flex shrink-0 flex-wrap items-center gap-2", embedded ? "w-full justify-end" : "justify-end")}>
          <button
            type="button"
            onClick={handleCopyReport}
            title="Copy full policy report to clipboard"
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-xs text-zinc-400",
              "hover:bg-white/[0.04] hover:text-zinc-300 transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            )}
          >
            {copied ? <Check size={12} className="text-[var(--success)]" aria-hidden /> : <Copy size={12} aria-hidden />}
            {copied ? "Copied" : embedded ? "Copy" : "Copy Report"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close policy check"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400",
                "hover:bg-white/[0.04] hover:text-zinc-300 transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              )}
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Verdict summary — Figma banner */}
      <div className={cn("mb-3 flex w-full min-w-0 items-start rounded-2xl border p-4", banner.wrap)}>
        <div className="flex min-w-0 gap-3">
          <BannerIcon className={cn("mt-0.5 size-[18px] shrink-0", banner.title)} aria-hidden />
          <div className="min-w-0 flex flex-col">
            <span className={cn("break-words text-sm font-semibold", banner.title)}>{result.verdictLabel}</span>
            <span className="mt-0.5 break-words text-xs text-zinc-500">
              {flaggedCount > 0
                ? `${flaggedCount} item${flaggedCount !== 1 ? "s" : ""} need${flaggedCount === 1 ? "s" : ""} attention`
                : "No issues found"}
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 fixes — Figma amber card */}
      {result.topFixes.length > 0 && result.verdict !== "good" && (
        <div className="mb-3 flex min-w-0 flex-col rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-[var(--warn)]" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Top 3 Fixes</span>
          </div>
          <div className="flex min-w-0 flex-col">
            {result.topFixes.map((fix, i, arr) => (
              <div
                key={i}
                className={cn(
                  "flex min-w-0 items-start gap-2 py-2",
                  i !== arr.length - 1 && "border-b border-white/[0.04]"
                )}
              >
                <ChevronRight size={10} className="mt-1 shrink-0 text-[var(--warn)]" aria-hidden />
                <span className="min-w-0 break-words text-sm leading-snug text-zinc-300">{fix}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2 mt-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        Policy Categories
      </div>

      {showTabs && (
        <div className="mb-3 flex min-w-0 flex-wrap gap-2">
          {(["meta", "tiktok"] as const).map((p) => {
            const cats = p === "meta" ? result.metaCategories : result.tiktokCategories;
            const flags = cats.filter((c) => c.status !== "clear").length;
            const isActive = activeTab === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActiveTab(p)}
                className={cn(
                  "inline-flex h-[31px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-[0_1px_4px_rgba(99,102,241,0.3)]"
                    : "border border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300"
                )}
              >
                {p === "meta" ? "Meta" : "TikTok"}
                {flags > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {flags}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <PolicyCategoryList categories={activeCategories} />

      {result.reviewerNotes && (
        <div className="mt-2 flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className={cn(
              "flex w-full min-w-0 cursor-pointer items-start justify-between gap-2 px-3 py-3 text-left sm:items-center sm:gap-3 sm:px-4",
              "hover:bg-white/[0.04] transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={14} className="shrink-0 text-zinc-500" aria-hidden />
              <span className="min-w-0 text-sm font-medium text-zinc-300">Reviewer Notes</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {!embedded && (
                <span className="hidden text-xs text-zinc-600 sm:inline">For appeal if flagged</span>
              )}
              {embedded && (
                <span className="sr-only">For appeal if flagged</span>
              )}
              {notesOpen ? (
                <ChevronUp size={14} className="text-zinc-500" aria-hidden />
              ) : (
                <ChevronDown size={14} className="text-zinc-500" aria-hidden />
              )}
            </div>
          </button>
          {notesOpen && (
            <div className="border-t border-white/[0.04] px-3 pb-4 sm:px-4">
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-400">
                {result.reviewerNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
