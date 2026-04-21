// src/components/deconstructor/DeconstructorLoading.tsx — Figma 473-3442

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle, X } from "lucide-react";
import { getSourceLabel } from "../../lib/deconstructorService";
import type { SourceType } from "../../lib/deconstructorService";
import { cn } from "../../lib/utils";

const STEPS = [
  "Fetching ad creative...",
  "Reading the hook and structure...",
  "Analyzing what makes it work...",
  "Building your steal-this brief...",
] as const;

function LoadingStepRow({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-[13px] py-[8.7px]">
      <div className="flex h-[17px] w-[17px] shrink-0 items-center justify-center">
        {status === "done" && (
          <CheckCircle className="h-[17px] w-[17px] text-[#10b981]" aria-hidden />
        )}
        {status === "active" && (
          <div
            className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-[rgba(97,95,255,0.2)] border-t-[color:var(--accent)]"
            aria-hidden
          />
        )}
        {status === "pending" && (
          <Circle className="h-[17px] w-[17px] text-[#3f3f47]" aria-hidden />
        )}
      </div>
      <span
        className={cn(
          "text-[15px] leading-[21.8px] transition-colors duration-300",
          status === "done" && "text-[#71717b]",
          status === "active" && "font-medium text-[#e4e4e7]",
          status === "pending" && "text-[#3f3f47]",
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

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      {/* Card */}
      <div className="w-full rounded-[17px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)]">

        {/* Header: source badge + URL */}
        <div className="flex items-center gap-[13px] border-b border-[rgba(255,255,255,0.12)] px-[26px] pb-[18px] pt-[26px]">
          <div className="shrink-0 rounded-[4px] border border-[rgba(255,255,255,0.05)] bg-[rgba(24,24,27,0.05)] px-[8.7px] py-[2.2px]">
            <span className="text-[10.9px] font-medium uppercase tracking-[0.5px] text-[#71717b]">
              {getSourceLabel(source)}
            </span>
          </div>
          <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-[#52525c]">{url}</span>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-[4px] px-[26px] pb-[20px] pt-[26px]">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const status: "done" | "active" | "pending" =
              step > stepNum ? "done" : step === stepNum ? "active" : "pending";
            return <LoadingStepRow key={label} label={label} status={status} />;
          })}
        </div>

        {/* Progress bar */}
        <div className="mx-[26px] h-[3px] overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="h-full rounded-full bg-[#6366f1]"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Status text */}
        <p className="mb-0 mt-4 pb-[26px] text-center text-[13px] text-[#52525c]">
          Studying the ad from a first-time viewer&apos;s perspective...
        </p>
      </div>

      {/* Cancel */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
        >
          <X size={11} aria-hidden />
          Cancel analysis
        </button>
      </div>
    </motion.div>
  );
}
