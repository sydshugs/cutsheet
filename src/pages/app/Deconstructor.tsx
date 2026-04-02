// src/pages/app/Deconstructor.tsx — Winning Ad Deconstructor

import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";
import { Helmet } from "react-helmet-async";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import {
  ScanSearch,
  Link2,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Bookmark,
  AlertCircle,
  Upload,
  CheckCircle,
  Circle,
  Play,
  FileText,
} from "lucide-react";
import {
  detectSourceType,
  deconstructAd,
  parseTeardownSections,
  getSourceLabel,
  type SourceType,
  type DeconstructResult,
  type TeardownSection,
} from "../../lib/deconstructorService";
import { cn } from "../../lib/utils";
import { InlineError } from "../../components/InlineError";
import type { AppSharedContext } from "../../components/AppLayout";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<SourceType, string> = {
  meta: "#1877F2",
  tiktok: "#69C9D0",
  youtube: "#FF0000",
};

/** API teardown heading for the brief block */
const BRIEF_TITLE = "Your Brief";
/** Figma (263-124 / 263-535) label */
const BRIEF_DISPLAY_TITLE = "Your Steal-This Brief";

const BRIEF_SECTION_TITLES = new Set<string>([BRIEF_TITLE, BRIEF_DISPLAY_TITLE]);

const SOURCE_PLATFORMS: { type: SourceType; label: string }[] = [
  { type: "meta", label: "Meta Ad Library" },
  { type: "tiktok", label: "TikTok Creative Center" },
  { type: "youtube", label: "YouTube" },
];

function sourcePillStyle(source: SourceType): CSSProperties {
  const c = SOURCE_COLORS[source];
  return {
    background: `${c}14`,
    borderColor: `${c}33`,
    color: c,
  };
}

/** Figma 263-525 — left-rail platform pill (TikTok mint, Meta/YouTube tuned) */
function resultsRailSourcePillStyle(source: SourceType): CSSProperties {
  switch (source) {
    case "tiktok":
      return {
        background: "rgba(0, 187, 167, 0.1)",
        borderColor: "rgba(0, 187, 167, 0.2)",
        color: "#5eead4",
      };
    case "meta":
      return {
        background: "rgba(24, 119, 242, 0.1)",
        borderColor: "rgba(24, 119, 242, 0.2)",
        color: "#60a5fa",
      };
    case "youtube":
      return {
        background: "rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.2)",
        color: "#f87171",
      };
    default:
      return sourcePillStyle(source);
  }
}

function parseMmSsToSeconds(token: string): number | null {
  const t = token.trim();
  const m = t.match(/^(\d+):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function formatSecondsAsMmSs(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Parse e.g. "The Hook (0:00 - 0:03)" → start/end seconds */
function parseHookRangeFromTitle(title: string): {
  startSec: number;
  endSec: number;
  labelStart: string;
  labelEnd: string;
} | null {
  const match = title.match(/hook\s*\(([^)]+)\)/i);
  if (!match) return null;
  const inner = match[1];
  const parts = inner.split(/\s*[-–—]\s*/).map((p) => p.trim());
  if (parts.length < 2) return null;
  const startSec = parseMmSsToSeconds(parts[0]);
  const endSec = parseMmSsToSeconds(parts[1]);
  if (startSec == null || endSec == null) return null;
  return {
    startSec,
    endSec,
    labelStart: parts[0],
    labelEnd: parts[1],
  };
}

function parseTotalDurationSeconds(raw: string): number | null {
  const t = raw.trim();
  if (!t || t === "—") return null;
  const colon = parseMmSsToSeconds(t);
  if (colon != null) return colon;
  const sec = t.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?$/i);
  if (sec) return Math.round(parseFloat(sec[1]));
  return null;
}

/** Figma results — left rail footer (placement · aspect · duration) */
function creativeFooterMeta(result: DeconstructResult): {
  placement: string;
  aspect: string;
  duration: string;
} {
  const placement =
    result.sourceType === "meta"
      ? "Feed / Reels"
      : result.sourceType === "tiktok"
        ? "TikTok"
        : "YouTube";
  const aspect = result.sourceType === "youtube" ? "16:9 Video" : "9:16 Video";
  const g = result.gemini;
  const duration =
    typeof g?.duration === "string"
      ? (g.duration as string)
      : typeof g?.videoLength === "string"
        ? (g.videoLength as string)
        : "—";
  return { placement, aspect, duration };
}

// ─── URL INPUT ────────────────────────────────────────────────────────────────

function UrlInput({
  url,
  onUrlChange,
  onSubmit,
  loading,
  autoFocus = true,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  onSubmit: (url: string, sourceType: SourceType) => void;
  loading: boolean;
  autoFocus?: boolean;
}) {
  const [urlError, setUrlError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError("Paste a URL to get started.");
      return;
    }
    const sourceType = detectSourceType(trimmed);
    if (!sourceType) {
      setUrlError(
        "Paste a valid Meta Ad Library, TikTok Creative Center, or YouTube URL."
      );
      return;
    }
    setUrlError(null);
    onSubmit(trimmed, sourceType);
  }, [url, onSubmit]);

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        className={cn(
          "flex h-[52px] w-full shrink-0 items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-el)] px-4 transition-[border-color,box-shadow] duration-200",
          "focus-within:border-[color:var(--border-hover)] focus-within:shadow-[var(--shadow-sm)]",
        )}
      >
        <div className="flex shrink-0 items-center text-[color:var(--ink-muted)]">
          <Link2 size={14} strokeWidth={1.75} aria-hidden />
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => {
            onUrlChange(e.target.value);
            if (urlError) setUrlError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a Meta Ad Library, TikTok Creative Center, or YouTube URL"
          className="min-w-0 flex-1 border-none bg-transparent py-2 text-[13px] text-[color:var(--ink)] outline-none placeholder:text-zinc-600 focus-visible:ring-0 disabled:opacity-50"
          disabled={loading}
          autoFocus={autoFocus}
        />
        {!loading && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!url.trim()}
            className={cn(
              "flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-medium text-white transition-[transform,opacity,background-color] duration-200",
              "bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
            )}
          >
            Deconstruct
          </button>
        )}
      </div>

      {urlError && (
        <p className="mt-2 flex items-center gap-1.5 pl-1 text-xs text-red-400">
          <AlertCircle size={12} />
          {urlError}
        </p>
      )}
    </div>
  );
}

// ─── TIKTOK FALLBACK ─────────────────────────────────────────────────────────

function TikTokFallback({
  onMediaUrl,
}: {
  onMediaUrl: (url: string) => void;
}) {
  const [embedUrl, setEmbedUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="w-full max-w-2xl mx-auto mt-4 rounded-xl p-4"
      style={{
        background: "rgba(105,201,208,0.05)",
        border: "1px solid rgba(105,201,208,0.15)",
      }}
    >
      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
        <span style={{ color: "#69C9D0" }} className="font-semibold">
          TikTok
        </span>{" "}
        — TikTok&apos;s API requires manual access. Optionally provide a
        screenshot or embed URL for visual analysis.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          placeholder="Paste embed/direct image URL (optional)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-500 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:border-white/20"
        />
        <button
          type="button"
          onClick={() => embedUrl.trim() && onMediaUrl(embedUrl.trim())}
          className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          Use URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} />
          Screenshot
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            // Convert to object URL for Gemini (server will fetch it as base64)
            const objectUrl = URL.createObjectURL(f);
            onMediaUrl(objectUrl);
          }
        }}
      />
    </div>
  );
}

// ─── FIGMA 263-124 — LOADING ─────────────────────────────────────────────────

function LoadingStepRow({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        {status === "done" && (
          <CheckCircle className="h-4 w-4 text-[color:var(--success)]" aria-hidden />
        )}
        {status === "active" && (
          <div
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/10 border-t-[color:var(--accent)]"
            aria-hidden
          />
        )}
        {status === "pending" && <Circle className="h-4 w-4 text-zinc-700" aria-hidden />}
      </div>
      <span
        className={cn(
          "text-sm transition-colors duration-300",
          status === "done" && "text-zinc-500",
          status === "active" && "font-medium text-[color:var(--ink)]",
          status === "pending" && "text-zinc-700",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function DeconstructLoadingPanel({
  url,
  source,
  onCancel,
}: {
  url: string;
  source: SourceType;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    setStep(1);
    const timers = [
      window.setTimeout(() => setStep(2), 1500),
      window.setTimeout(() => setStep(3), 3500),
      window.setTimeout(() => setStep(4), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [url, source]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 w-full max-w-2xl"
    >
      <div className="mb-3 flex flex-col gap-1.5">
        <span className="text-[9px] tracking-wide text-zinc-700">
          Source detected from your URL
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {SOURCE_PLATFORMS.map(({ type, label }) => (
            <span
              key={type}
              className="rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={sourcePillStyle(type)}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="mb-8 flex items-center gap-3 border-b border-white/[0.04] pb-4">
          <span
            className="rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={sourcePillStyle(source)}
          >
            {getSourceLabel(source)}
          </span>
          <span className="flex-1 truncate font-mono text-xs text-zinc-600">{url}</span>
        </div>

        <div className="mb-8 flex flex-col gap-1">
          <LoadingStepRow
            label="Fetching ad creative..."
            status={step > 1 ? "done" : step === 1 ? "active" : "pending"}
          />
          <LoadingStepRow
            label="Reading the hook and structure..."
            status={step > 2 ? "done" : step === 2 ? "active" : "pending"}
          />
          <LoadingStepRow
            label="Analyzing what makes it work..."
            status={step > 3 ? "done" : step === 3 ? "active" : "pending"}
          />
          <LoadingStepRow
            label="Building your steal-this brief..."
            status={step > 4 ? "done" : step === 4 ? "active" : "pending"}
          />
        </div>

        <div className="mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="h-full rounded-full bg-[color:var(--accent)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <p className="text-center text-xs italic text-zinc-600">
          Studying the ad from a first-time viewer&apos;s perspective...
        </p>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-white/[0.04] pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
          >
            Cancel analysis
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TEARDOWN SECTION ─────────────────────────────────────────────────────────

/** Figma 263-525 — standard teardown accordion (not the brief block) */
function TeardownSectionCard({
  section,
  defaultOpen = false,
  totalDurationStr,
}: {
  section: TeardownSection;
  defaultOpen?: boolean;
  /** Total ad length for Hook timeline (e.g. from API meta) */
  totalDurationStr?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hookRange = parseHookRangeFromTitle(section.title);
  const totalSec =
    totalDurationStr != null ? parseTotalDurationSeconds(totalDurationStr) : null;
  const hookBarPct =
    hookRange && totalSec && totalSec > 0
      ? Math.min(100, Math.max(0, (hookRange.endSec / totalSec) * 100))
      : null;

  return (
    <div className="overflow-hidden rounded-[15px] border border-white/[0.06] bg-[color:var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-h-[50px] w-full items-center justify-between px-5 py-0 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
      >
        <span className="pr-3 text-[13px] font-semibold leading-snug text-[color:var(--ink)]">
          {section.title}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-[color:var(--ink-muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-5 pb-5 text-[13px] leading-relaxed text-[color:var(--ink-secondary)] teardown-content"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              <style>{`
                .teardown-content p { margin: 8px 0; color: var(--ink-secondary); }
                .teardown-content strong { color: var(--ink); font-weight: 600; }
                .teardown-content ul, .teardown-content ol { padding-left: 18px; margin: 8px 0; }
                .teardown-content li { margin: 4px 0; color: var(--ink-secondary); }
                .teardown-content h3, .teardown-content h4 {
                  font-size: 11px; font-weight: 600; text-transform: uppercase;
                  letter-spacing: 0.08em; color: var(--ink-muted);
                  margin: 14px 0 6px;
                }
                .teardown-content hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
                .teardown-content blockquote {
                  margin: 12px 0;
                  padding: 12px 16px 12px 19px;
                  border-left: 3px solid var(--accent);
                  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
                  background: var(--accent-subtle);
                }
                .teardown-content blockquote p { margin: 4px 0; color: var(--ink); }
              `}</style>
              <div className="pt-4">
                {hookRange && totalSec != null && hookBarPct != null && (
                  <div className="mb-5 flex items-center gap-2">
                    <div
                      className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-300"
                        style={{ width: `${hookBarPct}%` }}
                      />
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1 font-mono text-[10px] tabular-nums">
                      <span className="text-[color:var(--accent-light)]">
                        {hookRange.labelStart} — {hookRange.labelEnd}
                      </span>
                      <span className="text-[color:var(--ink-muted)]">
                        / {formatSecondsAsMmSs(totalSec)}
                      </span>
                    </div>
                  </div>
                )}
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{section.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── WHY IT WORKS CARD ────────────────────────────────────────────────────────

function WhyItWorksCard({ content }: { content: string }) {
  return (
    <div
      className="shrink-0 rounded-[15px] border px-5 pb-5 pt-5"
      style={{
        background: "rgba(99, 102, 241, 0.04)",
        borderColor: "rgba(99, 102, 241, 0.2)",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="size-[6px] shrink-0 rounded-full bg-[color:var(--accent)]" />
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.05em] text-[color:var(--accent-light)]">
          Why it works
        </span>
      </div>
      <div className="why-works-md text-[13px] leading-[22px] text-[color:var(--ink-secondary)]">
        <style>{`
          .why-works-md p { margin: 0; }
          .why-works-md p + p { margin-top: 10px; }
          .why-works-md strong { color: var(--ink); font-weight: 600; }
        `}</style>
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

/** Figma 263-535 — dedicated brief card below teardown sections */
function StealThisBriefCard({ content }: { content: string }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mb-6 shrink-0 overflow-hidden rounded-[15px] border"
      style={{
        background: "rgba(99,102,241,0.06)",
        borderColor: "rgba(99,102,241,0.25)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[50px] w-full items-center justify-between px-5 py-0 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
          <span className="text-[13px] font-semibold text-[color:var(--accent-light)]">
            {BRIEF_DISPLAY_TITLE}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-[color:var(--accent-light)]/50 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="border-t px-5 pb-5 pt-4"
              style={{ borderColor: "rgba(99,102,241,0.1)" }}
            >
              <div
                className="mb-4 flex items-center justify-between border-b pb-3"
                style={{ borderColor: "rgba(99,102,241,0.1)" }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[color:var(--accent-light)]" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-light)]">
                    Steal-this brief
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleCopy();
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs text-[color:var(--accent-light)] transition-[background-color,opacity] duration-200 hover:bg-[color:var(--accent-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="brief-body-markdown font-mono text-[12px] leading-[1.7] text-[color:var(--accent-light)]/80">
                <style>{`
                  .brief-body-markdown p { margin: 0.5em 0; }
                  .brief-body-markdown ul, .brief-body-markdown ol { padding-left: 1.1em; margin: 0.5em 0; }
                  .brief-body-markdown strong { font-weight: 600; color: var(--accent-light); }
                `}</style>
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FIGMA 263-535 — TWO-COLUMN RESULTS ───────────────────────────────────────

function ResultsSplit({
  result,
  submittedUrl,
  onReset,
  onSaveToSwipeFile,
}: {
  result: DeconstructResult;
  submittedUrl: string;
  onReset: () => void;
  onSaveToSwipeFile: () => void;
}) {
  const sections = parseTeardownSections(result.teardown);
  const whySection = sections.find((s) => s.title === "Why This Ad Works");
  const withoutWhy = sections.filter((s) => s.title !== "Why This Ad Works");
  const briefSection = withoutWhy.find((s) => BRIEF_SECTION_TITLES.has(s.title));
  const middleSections = withoutWhy.filter((s) => !BRIEF_SECTION_TITLES.has(s.title));
  const footerMeta = creativeFooterMeta(result);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:h-full lg:min-h-0 lg:flex-row"
    >
      {/* Left — creative + meta (Figma 263-525) */}
      <div className="flex w-full shrink-0 flex-col overflow-y-auto border-b border-white/[0.04] bg-[color:var(--bg)] lg:w-[min(22.75rem,100%)] lg:max-w-[380px] lg:border-b-0 lg:border-r lg:border-white/[0.04]">
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] px-4 pb-3 pt-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span
              className="w-fit rounded-full border px-2.5 py-0.5 text-[9.5px] font-semibold uppercase leading-tight tracking-wide"
              style={resultsRailSourcePillStyle(result.sourceType)}
            >
              {getSourceLabel(result.sourceType)}
            </span>
            <h2 className="line-clamp-3 text-[13px] font-medium leading-snug text-[color:var(--ink)]">
              {result.adTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex shrink-0 items-center gap-1 pt-0.5 text-[11.5px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Analyze another</span>
          </button>
        </div>

        <div className="group relative mx-4 mt-4 flex flex-col overflow-hidden rounded-[15px] border border-[color:var(--border)] bg-[color:var(--card)]">
          <div className="relative flex aspect-[9/16] w-full items-center justify-center overflow-hidden bg-black">
            {result.thumbnailUrl ? (
              <>
                <img
                  src={result.thumbnailUrl}
                  alt={result.adTitle}
                  className="h-full w-full object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-60"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-[border-color,background-color] duration-200"
                    style={{
                      borderColor: "var(--border-strong)",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Play className="ml-0.5 h-5 w-5 text-[color:var(--ink)]" fill="currentColor" aria-hidden />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--ink-muted)]">
                No preview
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[color:var(--border)] bg-black/40 px-3 py-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[10.5px] font-medium text-[color:var(--ink-secondary)]">
                {footerMeta.placement}
              </span>
              <span
                className="size-1 shrink-0 rounded-full"
                style={{ background: "var(--elevated)" }}
              />
              <span className="shrink-0 text-[10.5px] text-[color:var(--ink-muted)]">
                {footerMeta.aspect}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[10.5px] text-[color:var(--ink-muted)]">
              {footerMeta.duration}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveToSwipeFile}
          className="mx-4 mb-6 mt-3 flex h-10 items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[13px] text-[color:var(--ink-secondary)] transition-[transform,opacity,background-color,border-color] duration-200 hover:bg-[color:var(--surface-el)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] active:scale-[0.99]"
        >
          <Bookmark className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span>Save to Library</span>
        </button>
      </div>

      {/* Right — URL + why + sections + brief (Figma 263-525) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[color:var(--bg)] px-6 py-5">
        <div className="mb-5 flex h-9 items-center justify-between gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-muted)]" aria-hidden />
            <span className="truncate font-mono text-[11.5px] text-[color:var(--ink-muted)]">
              {submittedUrl}
            </span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex shrink-0 items-center gap-1 text-[11.5px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>New</span>
          </button>
        </div>

        {whySection && (
          <div className="mb-4 shrink-0">
            <WhyItWorksCard content={whySection.content} />
          </div>
        )}

        <div className="mb-4 flex shrink-0 flex-col gap-2">
          {middleSections.map((section, i) => (
            <TeardownSectionCard
              key={section.title}
              section={section}
              defaultOpen={i === 0}
              totalDurationStr={footerMeta.duration}
            />
          ))}
        </div>

        {briefSection && <StealThisBriefCard content={briefSection.content} />}

        <p className="mt-auto pb-4 pt-8 text-center font-mono text-[10.5px] text-[color:var(--ink-muted)] opacity-80">
          Powered by Gemini + Claude
        </p>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Deconstructor() {
  const { addSwipeItem, onUpgradeRequired, isPro } =
    useOutletContext<AppSharedContext>();

  const deconstructRunId = useRef(0);
  const [urlInput, setUrlInput] = useState("");
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState<{
    url: string;
    source: SourceType;
  } | null>(null);
  const [result, setResult] = useState<DeconstructResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<SourceType | null>(null);
  const [tiktokMediaUrl, setTikTokMediaUrl] = useState<string | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setInfoToast(msg);
    setTimeout(() => setInfoToast(null), 2500);
  };

  const handleSubmit = useCallback(
    async (url: string, sourceType: SourceType, mediaUrl?: string) => {
      setError(null);
      setResult(null);

      // If TikTok with no media yet, prompt the fallback
      if (sourceType === "tiktok" && !mediaUrl && !tiktokMediaUrl) {
        setPendingUrl(url);
        setPendingSource(sourceType);
        return;
      }

      const runId = ++deconstructRunId.current;
      setLoading(true);
      setLoadingJob({ url, source: sourceType });
      try {
        const data = await deconstructAd(
          url,
          sourceType,
          mediaUrl ?? tiktokMediaUrl ?? undefined
        );
        if (runId !== deconstructRunId.current) return;
        setLastSubmittedUrl(url);
        setResult(data);
        setPendingUrl(null);
        setPendingSource(null);
        setTikTokMediaUrl(null);
      } catch (err) {
        if (runId !== deconstructRunId.current) return;
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        if (msg.startsWith("RATE_LIMITED:")) {
          const wait = msg.replace("RATE_LIMITED:", "");
          setError(
            isPro
              ? `Rate limit reached — try again in ${wait}.`
              : `You've used all 3 free deconstructions today. Try again in ${wait} or upgrade to Pro for unlimited.`
          );
          if (!isPro) onUpgradeRequired("deconstruct");
        } else {
          setError(msg);
        }
      } finally {
        if (runId === deconstructRunId.current) {
          setLoading(false);
          setLoadingJob(null);
        }
      }
    },
    [tiktokMediaUrl, isPro, onUpgradeRequired]
  );

  const handleCancelDeconstruct = useCallback(() => {
    deconstructRunId.current += 1;
    setLoading(false);
    setLoadingJob(null);
  }, []);

  const handleTikTokMediaUrl = (url: string) => {
    setTikTokMediaUrl(url);
    if (pendingUrl && pendingSource) {
      handleSubmit(pendingUrl, pendingSource, url);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPendingUrl(null);
    setPendingSource(null);
    setTikTokMediaUrl(null);
    setUrlInput("");
    setLastSubmittedUrl("");
  };

  const handleSaveToSwipeFile = () => {
    if (!result) return;
    addSwipeItem({
      fileName: result.adTitle,
      timestamp: new Date().toISOString(),
      scores: null,
      markdown: result.teardown,
      brand: "",
      format: "video",
      niche: "",
      platform: result.sourceType,
      tags: ["deconstruction"],
      notes: "",
    });
    showToast("Saved to your library");
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-auto bg-[color:var(--bg)]"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      <Helmet>
        <title>Ad Breakdown — Cutsheet</title>
        <meta
          name="description"
          content="Paste any ad URL. Get a full teardown: hook analysis, psychological triggers, structure breakdown, and a ready-to-use creative brief."
        />
        <link
          rel="canonical"
          href="https://cutsheet.xyz/app/deconstructor"
        />
      </Helmet>

      {!result && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {result && !loading ? (
          <ResultsSplit
            result={result}
            submittedUrl={lastSubmittedUrl}
            onReset={handleReset}
            onSaveToSwipeFile={handleSaveToSwipeFile}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center px-6 py-12">
            {/* Figma 263-124 — hero only on idle */}
            {!result && !loading && (
              <div className="mb-8 shrink-0 text-center">
                <div
                  className="mx-auto mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-2xl border"
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    borderColor: "rgba(245, 158, 11, 0.2)",
                  }}
                >
                  <ScanSearch size={40} color="#f59e0b" strokeWidth={1.5} aria-hidden />
                </div>
                <h1 className="mb-2.5 text-2xl font-bold leading-tight tracking-[-0.025em] text-[color:var(--ink)]">
                  Ad Breakdown
                </h1>
                <p className="mx-auto mb-4 max-w-[380px] text-sm leading-relaxed text-[color:var(--ink-muted)]">
                  Paste any ad URL. Get a full AI breakdown in 30 seconds.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SOURCE_PLATFORMS.map(({ type, label }) => (
                    <span
                      key={type}
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{
                        color: "var(--warn)",
                        background: "rgba(245, 158, 11, 0.08)",
                        borderColor: "rgba(245, 158, 11, 0.2)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!result && (
              <>
                <UrlInput
                  url={urlInput}
                  onUrlChange={setUrlInput}
                  onSubmit={(u, st) => handleSubmit(u, st)}
                  loading={loading}
                />
                {!loading && pendingSource === "tiktok" && (
                  <TikTokFallback onMediaUrl={handleTikTokMediaUrl} />
                )}
              </>
            )}

            {loading && loadingJob && (
              <DeconstructLoadingPanel
                url={loadingJob.url}
                source={loadingJob.source}
                onCancel={handleCancelDeconstruct}
              />
            )}

            {loading && (
              <p className="mt-8 pb-8 text-center font-mono text-[11px] text-zinc-700">
                Powered by Gemini + Claude Sonnet
              </p>
            )}

            {error && !loading && (
              <div className="mx-auto mt-6 w-full max-w-2xl">
                <InlineError
                  severity="red"
                  message={error}
                  dismissible
                  onDismiss={() => setError(null)}
                  primaryAction={
                    error.includes("3 free") || error.includes("Rate limit")
                      ? undefined
                      : { label: "Try again", onClick: handleReset }
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {infoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]"
        >
          {infoToast}
        </div>
      )}
    </div>
  );
}
