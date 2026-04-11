// PreFlightLoadingView — A/B test analyzing UI (Figma 263-900 /app/a-b-test_Loading)

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { sanitizeFileName } from "../utils/sanitize";
import type { VariantInput } from "../types/preflight";

const SUBTITLES_ANALYZING = [
  "Analyzing hook structure...",
  "Comparing visual hierarchy...",
  "Scoring CTA clarity...",
  "Evaluating pacing...",
];

const SUBTITLE_INTERVAL_MS = 2800;

function previewUrlForFile(
  file: File | undefined,
  variants: VariantInput[],
  urls: (string | null)[]
): string | null {
  if (!file) return null;
  const i = variants.findIndex((v) => v.file === file);
  return i >= 0 ? urls[i] ?? null : null;
}

function formatKind(file: File): string {
  if (file.type === "video/quicktime") return "MOV";
  if (file.type === "video/webm") return "WEBM";
  if (file.type.startsWith("video/")) return "MP4";
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "JPG";
  if (file.type === "image/webp") return "WEBP";
  return "FILE";
}

function truncateName(name: string, max = 28): string {
  const n = sanitizeFileName(name);
  return n.length > max ? `${n.slice(0, max - 1)}…` : n;
}

interface VariantAnalyzingCardProps {
  file: File;
  previewUrl: string | null;
}

function VariantAnalyzingCard({ file, previewUrl }: VariantAnalyzingCardProps) {
  const isVideo = file.type.startsWith("video/");
  const truncated = truncateName(file.name);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border bg-[color:var(--surface)]",
        isVideo ? "aspect-video" : "aspect-[4/5] min-h-[200px] sm:aspect-square sm:min-h-0",
      )}
      style={{
        borderColor: "var(--ab-loading-card-border)",
        boxShadow: "var(--ab-loading-card-glow)",
      }}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 opacity-80">
        {isVideo && previewUrl ? (
          <video
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            onLoadedData={(e) => {
              const v = e.currentTarget;
              if (v.readyState >= 2) {
                v.currentTime = Math.min(0.5, (v.duration || 10) * 0.08);
              }
            }}
          />
        ) : !isVideo && previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[color:var(--surface-el)]" />
        )}
      </div>

      {/* Inner violet frame (Figma) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] opacity-[0.67]"
        style={{ borderColor: "var(--ab-loading-card-inner-border)" }}
        aria-hidden
      />

      {/* Dim overlay + spinner */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "var(--ab-loading-overlay)" }}
      >
        <div
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
          style={{ borderWidth: 3, borderStyle: "solid", borderColor: "var(--ab-loading-spinner-ring)" }}
          aria-hidden
        >
          <Loader2
            className="h-7 w-7 animate-spin text-[color:var(--decon-accent-light)]"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>

      {/* Analyzing badge */}
      <div
        className="absolute left-3 top-3 flex h-7 items-center gap-2 rounded-lg border pl-2 pr-2.5"
        style={{
          background: "var(--ab-loading-badge-bg)",
          borderColor: "var(--ab-loading-badge-border)",
        }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full opacity-[0.67]"
          style={{ background: "var(--ab-loading-badge-dot)" }}
          aria-hidden
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--decon-accent-light)]">
          Analyzing...
        </span>
      </div>

      {/* Filename + format */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
        <p
          className="min-w-0 truncate text-[11.5px] font-medium text-[color:var(--ink)]"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.35)" }}
        >
          {truncated}
        </p>
        <span
          className="shrink-0 rounded border px-2 py-0.5 text-[9.5px] font-medium text-[color:var(--ink)]"
          style={{
            background: "var(--ab-loading-format-bg)",
            borderColor: "var(--ab-loading-format-border)",
          }}
        >
          {formatKind(file)}
        </span>
      </div>
    </div>
  );
}

export interface PreFlightLoadingViewProps {
  files: File[];
  phase: "analyzing" | "comparing";
  analysisProgress: number;
  variants: VariantInput[];
  variantPreviewUrls: (string | null)[];
  onStop: () => void;
}

export function PreFlightLoadingView({
  files,
  phase,
  analysisProgress,
  variants,
  variantPreviewUrls,
  onStop,
}: PreFlightLoadingViewProps) {
  const [subtitleIdx, setSubtitleIdx] = useState(0);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = window.setInterval(() => {
      setSubtitleIdx((i) => (i + 1) % SUBTITLES_ANALYZING.length);
    }, SUBTITLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase]);

  const n = Math.max(1, files.length);
  const barPct = phase === "comparing" ? 100 : Math.min(100, (analysisProgress / n) * 100);

  const leftFile = files[0];
  const rightFile = files[1];
  const leftUrl = leftFile ? previewUrlForFile(leftFile, variants, variantPreviewUrls) : null;
  const rightUrl = rightFile ? previewUrlForFile(rightFile, variants, variantPreviewUrls) : null;

  const statusLine =
    phase === "comparing"
      ? `${n} of ${n} analyzed`
      : `${Math.min(analysisProgress, n)} of ${n} analyzing`;

  const subtitleText =
    phase === "comparing" ? "Running head-to-head comparison..." : SUBTITLES_ANALYZING[subtitleIdx];

  return (
    <div
      className="relative flex min-h-[calc(100vh-120px)] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-label="Comparing ad variants"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--ab-ambient-gradient)" }}
        aria-hidden
      />

      <div className="relative z-[1] flex w-full max-w-[680px] flex-col items-center gap-8 sm:gap-10">
        <div className="flex flex-col items-center gap-5 sm:gap-6">
          <div
            className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[15px] border sm:h-[76px] sm:w-[76px]"
            style={{
              background: "var(--ab-loading-hero-tile-bg)",
              borderColor: "var(--ab-tile-border)",
            }}
          >
            <GitBranch className="h-6 w-6 text-[color:var(--ab-icon)] sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="text-center text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-[2.375rem] sm:leading-tight">
            Comparing Creatives
          </h1>
        </div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          {leftFile ? (
            <VariantAnalyzingCard file={leftFile} previewUrl={leftUrl} />
          ) : (
            <div className="aspect-video rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
          )}
          {rightFile ? (
            <VariantAnalyzingCard file={rightFile} previewUrl={rightUrl} />
          ) : (
            <div className="aspect-video rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[color:var(--ab-test-type-inactive-text)]" aria-live="polite">
              {statusLine}
            </p>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
            <motion.div
              className="h-full rounded-full bg-[color:var(--accent)]"
              initial={false}
              animate={{ width: `${barPct}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="flex min-h-[18px] justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={subtitleText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-center text-[11.5px] text-[color:var(--decon-accent-light)]"
              >
                {subtitleText}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onStop}
              className="border-none bg-transparent p-0 text-[12.5px] text-[color:var(--ab-run-disabled-text)] underline decoration-solid underline-offset-2 transition-colors duration-150 hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Stop after current
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
