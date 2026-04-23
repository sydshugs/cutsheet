// CompetitorLoadingView — Figma 473-3301 + per-file status from 473-3330

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { useThumbnail } from "../hooks/useThumbnail";

export type CompetitorFormat = "video" | "static";

export interface CompetitorLoadingViewProps {
  yourFile: File;
  competitorFile: File;
  /** Preserved for API compatibility — no longer used in the Figma-exact loading view. */
  format?: CompetitorFormat;
  statusMessage: string;
  onCancel?: () => void;
}

type CompetitorPhase = "complete" | "analyzing";

function progressFromStatus(msg: string): number {
  if (msg.toLowerCase().includes("gap")) return 78;
  if (msg.toLowerCase().includes("both")) return 42;
  return 40;
}

function headlinesForStatus(msg: string): { primary: string; secondary: string } {
  const gap = msg.toLowerCase().includes("gap");
  if (gap) {
    return {
      primary: "Running gap analysis...",
      secondary: "Building your action plan",
    };
  }
  return {
    primary: "Scoring both creatives...",
    secondary: "Then running gap analysis and building your action plan",
  };
}

function StatusBadge({ phase }: { phase: CompetitorPhase }) {
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
  return (
    <div className="flex size-[39px] items-center justify-center rounded-full bg-[rgba(99,102,241,0.8)]">
      <Loader2 className="size-[19.7px] animate-spin text-white" strokeWidth={2} aria-hidden />
    </div>
  );
}

function StatusLabel({ phase }: { phase: CompetitorPhase }) {
  const labelMap: Record<CompetitorPhase, { text: string; color: string }> = {
    complete: { text: "Complete", color: "#00d492" },
    analyzing: { text: "Analyzing…", color: "#7c86ff" },
  };
  const { text, color } = labelMap[phase];
  return (
    <p
      className="m-0 text-[9.856px] font-semibold uppercase tracking-[0.4928px]"
      style={{ color }}
    >
      {text}
    </p>
  );
}

interface CompetitorThumbProps {
  label: string;
  file: File;
  borderColor: string;
  phase: CompetitorPhase;
}

function CompetitorThumb({ label, file, borderColor, phase }: CompetitorThumbProps) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const thumb = useThumbnail(file, objectUrl);
  const displayUrl = objectUrl || thumb;
  const isImage = file.type.startsWith("image/");

  return (
    <div className="flex flex-col items-center gap-[15px]">
      <p className="m-0 text-center text-[9.216px] font-semibold uppercase tracking-[0.4608px] text-[#52525c]">
        {label}
      </p>
      <div
        className="relative h-[280px] w-full max-w-[350px] overflow-hidden rounded-[15.411px] border bg-[#c4c4c4]"
        style={{ borderColor }}
      >
        {displayUrl ? (
          isImage ? (
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <video
              src={displayUrl}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              aria-hidden
            />
          )
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <StatusBadge phase={phase} />
        </div>
      </div>
      <StatusLabel phase={phase} />
    </div>
  );
}

export function CompetitorLoadingView({
  yourFile,
  competitorFile,
  statusMessage,
  onCancel,
}: CompetitorLoadingViewProps) {
  const progressPct = progressFromStatus(statusMessage);
  const { primary, secondary } = headlinesForStatus(statusMessage);
  const bothPhase: CompetitorPhase = statusMessage.toLowerCase().includes("gap") ? "complete" : "analyzing";

  return (
    <div
      className="relative flex min-h-[calc(100vh-120px)] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy
      aria-label="Competitor analysis in progress"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(239,68,68,0.14) 0%, transparent 75%)",
        }}
        aria-hidden
      />

      <div className="relative z-[1] flex w-full max-w-[734px] flex-col items-center gap-[30.782px]">
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
          <CompetitorThumb
            label="Your Ad"
            file={yourFile}
            borderColor="rgba(255,255,255,0.12)"
            phase={bothPhase}
          />
          <CompetitorThumb
            label="Competitor Ad"
            file={competitorFile}
            borderColor="rgba(239,68,68,0.20)"
            phase={bothPhase}
          />
        </div>

        <div className="flex w-full max-w-[646px] flex-col items-center gap-[19.24px]">
          <div className="flex flex-col items-center gap-1">
            <p className="m-0 text-center text-[11.543px] font-medium text-[#9f9fa9]">
              {primary}
            </p>
            <p className="m-0 text-center text-[10.581px] text-[#71717b]">
              {secondary}
            </p>
          </div>

          <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <motion.div
              className="h-full rounded-full bg-[color:var(--accent)]"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="m-0 text-[13px] text-[#71717b]">This usually takes 20–30 seconds</p>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[#71717b] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              <X size={11} aria-hidden />
              Cancel analysis
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
