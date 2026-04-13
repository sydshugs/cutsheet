// Competitor loading — Figma /app/competitor/loading (node 263-1539)

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useThumbnail } from "../hooks/useThumbnail";
import { cn } from "../lib/utils";

export type CompetitorFormat = "video" | "static";

export interface CompetitorLoadingViewProps {
  yourFile: File;
  competitorFile: File;
  format: CompetitorFormat;
  statusMessage: string;
  onCancel?: () => void;
}

function progressFromStatus(msg: string): number {
  if (msg.toLowerCase().includes("gap")) return 78;
  if (msg.toLowerCase().includes("both")) return 42;
  return 40;
}

function headlinesForStatus(msg: string): { primary: string; secondary: string } {
  const gap = msg.toLowerCase().includes("gap");
  if (gap) {
    return {
      primary: "Running gap analysis…",
      secondary: "Building your action plan",
    };
  }
  return {
    primary: "Scoring both creatives…",
    secondary: "Then running gap analysis and building your action plan",
  };
}

function CompetitorPreviewCard({
  file,
  footerLabel,
}: {
  file: File;
  footerLabel: string;
}) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const thumb = useThumbnail(file, objectUrl);
  const displayUrl = objectUrl || thumb;
  const isImage = file.type.startsWith("image/");

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden rounded-[15px] border",
        "border-[color:var(--border)] bg-[color:var(--surface)]",
      )}
    >
      <div
        className="relative mx-2 mt-2 min-h-[220px] flex-1 overflow-hidden rounded-[11px] border-2 md:min-h-[260px]"
        style={{ animation: "competitor-border-pulse 2s ease-in-out infinite", borderColor: "rgba(99,102,241,0.3)" }}
      >
        <div className="absolute inset-0 bg-[color:var(--card)]">
          {displayUrl ? (
            isImage ? (
              <img
                src={displayUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <video
                src={displayUrl}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
                aria-hidden
              />
            )
          ) : null}
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center bg-[color:var(--competitor-loading-preview-scrim)]"
          aria-hidden
        >
          <div
            className="size-11 shrink-0 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(99,102,241,0.25)", borderTopColor: "#818cf8" }}
            role="presentation"
          />
        </div>
      </div>
      <div
        className="flex items-center justify-between gap-3 border-t border-[color:var(--border)] px-3 py-2.5"
      >
        <span className="text-[11.5px] font-semibold text-[color:var(--ink)]">
          {footerLabel}
        </span>
        <span
          className="text-[10px] font-medium"
          style={{ color: "#818cf8" }}
        >
          Analyzing…
        </span>
      </div>
    </div>
  );
}

export function CompetitorLoadingView({
  yourFile,
  competitorFile,
  format,
  statusMessage,
  onCancel,
}: CompetitorLoadingViewProps) {
  const formatLabel = format === "video" ? "Full Creative" : "Static Creative";
  const progressPct = progressFromStatus(statusMessage);
  const { primary, secondary } = headlinesForStatus(statusMessage);

  return (
    <>
    <style>{`
      @keyframes competitor-border-pulse {
        0%, 100% { border-color: rgba(99,102,241,0.3); box-shadow: none; }
        50% { border-color: rgba(99,102,241,0.7); box-shadow: 0 0 14px rgba(99,102,241,0.12); }
      }
    `}</style>
    <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-10"
        role="status"
        aria-live="polite"
        aria-busy
        aria-label="Competitor analysis in progress"
      >
        <div className="flex w-full max-w-[646px] flex-col items-center">
          <h2 className="m-0 text-center text-[17px] font-semibold leading-tight text-[color:var(--ink)]">
            Analyzing Competitors
          </h2>
          <span
            className={cn(
              "mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium",
              "border-[color:var(--border)] bg-[color:var(--surface-raised)] text-[color:var(--ink-muted)]",
            )}
          >
            {formatLabel}
          </span>

          <div className="mt-8 grid w-full grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            <CompetitorPreviewCard file={yourFile} footerLabel="Your Ad" />
            <CompetitorPreviewCard file={competitorFile} footerLabel="Competitor" />
          </div>

          <p className="m-0 mt-6 text-center text-[13px] font-medium text-[color:var(--ink)]">
            {primary}
          </p>
          <p className="m-0 mt-1 max-w-[420px] text-center text-[11px] leading-relaxed text-[color:var(--ink-muted)]">
            {secondary}
          </p>

          <div className="mt-5 h-[5px] w-full max-w-[646px] overflow-hidden rounded-full bg-[color:var(--border)]">
            <motion.div
              className="h-full rounded-full bg-[color:var(--accent)]"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                "mt-5 border-none bg-transparent text-[11px] font-medium text-[color:var(--ink-muted)]",
                "cursor-pointer transition-opacity hover:text-[color:var(--ink)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]",
                "active:opacity-80",
              )}
            >
              Cancel
            </button>
          ) : null}
        </div>
    </div>
    </>
  );
}
