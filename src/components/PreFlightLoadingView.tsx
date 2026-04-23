// PreFlightLoadingView — A/B test analyzing UI (Figma 473-3272 + per-variant status from 473-3330)

import { motion } from "framer-motion";
import { Check, Clock, Loader2, X } from "lucide-react";
import type { VariantInput } from "../types/preflight";

type VariantPhase = "complete" | "analyzing" | "pending";

function previewUrlForFile(
  file: File | undefined,
  variants: VariantInput[],
  urls: (string | null)[]
): string | null {
  if (!file) return null;
  const i = variants.findIndex((v) => v.file === file);
  return i >= 0 ? urls[i] ?? null : null;
}

function StatusBadge({ phase }: { phase: VariantPhase }) {
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
  return (
    <div className="flex size-[39px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.8)]">
      <Clock className="size-[17.5px] text-[#9f9fa9]" strokeWidth={2} aria-hidden />
    </div>
  );
}

function StatusLabel({ phase }: { phase: VariantPhase }) {
  const labelMap: Record<VariantPhase, { text: string; color: string }> = {
    complete: { text: "Complete", color: "#00d492" },
    analyzing: { text: "Analyzing…", color: "#7c86ff" },
    pending: { text: "Pending", color: "#52525c" },
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

interface VariantThumbProps {
  label: string;
  file: File | null | undefined;
  previewUrl: string | null;
  borderColor: string;
  phase: VariantPhase;
}

function VariantThumb({ label, file, previewUrl, borderColor, phase }: VariantThumbProps) {
  const isVideo = file?.type.startsWith("video/") ?? false;

  return (
    <div className="flex flex-col items-center gap-[15px]">
      <p className="m-0 text-center text-[9.216px] font-semibold uppercase tracking-[0.4608px] text-[#52525c]">
        {label}
      </p>
      <div
        className="relative h-[280px] w-full max-w-[350px] overflow-hidden rounded-[15.411px] border bg-[#c4c4c4]"
        style={{ borderColor }}
      >
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
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <StatusBadge phase={phase} />
        </div>
      </div>
      <StatusLabel phase={phase} />
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
  const n = Math.max(1, files.length);
  const barPct = phase === "comparing" ? 100 : Math.min(100, (analysisProgress / n) * 100);

  const leftFile = files[0];
  const rightFile = files[1];
  const leftUrl = leftFile ? previewUrlForFile(leftFile, variants, variantPreviewUrls) : null;
  const rightUrl = rightFile ? previewUrlForFile(rightFile, variants, variantPreviewUrls) : null;

  const variantPhase = (i: number): VariantPhase => {
    if (phase === "comparing") return "complete";
    if (i < analysisProgress) return "complete";
    if (i === analysisProgress) return "analyzing";
    return "pending";
  };

  const primaryLine = phase === "comparing" ? "Comparing creatives..." : "Scoring both creatives...";
  const secondaryLine =
    phase === "comparing"
      ? "Building your action plan"
      : "Then running gap analysis and building your action plan";

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

      <div className="relative z-[1] flex w-full max-w-[734px] flex-col items-center gap-[30.782px]">
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
          <VariantThumb
            label="Variant A"
            file={leftFile}
            previewUrl={leftUrl}
            borderColor="rgba(255,255,255,0.12)"
            phase={variantPhase(0)}
          />
          <VariantThumb
            label="Variant B"
            file={rightFile}
            previewUrl={rightUrl}
            borderColor="rgba(129,140,248,0.10)"
            phase={variantPhase(1)}
          />
        </div>

        <div className="flex w-full max-w-[646px] flex-col items-center gap-[19.24px]">
          <div className="flex flex-col items-center gap-1">
            <p className="m-0 text-center text-[11.543px] font-medium text-[#9f9fa9]" aria-live="polite">
              {primaryLine}
            </p>
            <p className="m-0 text-center text-[10.581px] text-[#71717b]">
              {secondaryLine}
            </p>
          </div>

          <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <motion.div
              className="h-full rounded-full bg-[color:var(--accent)]"
              initial={false}
              animate={{ width: `${barPct}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="m-0 text-[13px] text-[#71717b]">This usually takes 20–30 seconds</p>
          <button
            type="button"
            onClick={onStop}
            className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[#71717b] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            <X size={11} aria-hidden />
            Cancel analysis
          </button>
        </div>
      </div>
    </div>
  );
}
