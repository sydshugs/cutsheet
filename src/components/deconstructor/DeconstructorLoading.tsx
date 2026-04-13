// src/components/deconstructor/DeconstructorLoading.tsx — Loading state components

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";
import { getSourceLabel } from "../../lib/deconstructorService";
import type { SourceType } from "../../lib/deconstructorService";
import { cn } from "../../lib/utils";
import { SOURCE_PLATFORMS, sourcePillStyle } from "./deconstructorUtils";

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

export function DeconstructLoadingPanel({
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
