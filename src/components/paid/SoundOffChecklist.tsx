// SoundOffChecklist.tsx — Sound-Off Readability card for video ads
// Audits whether a video communicates value without audio (70%+ of Meta feed is watched muted).
// 0 credits — bundled into post-analysis. Video only.

import { VolumeX, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SoundOffItem {
  id: string;
  label: string;
  pass: boolean;
  severity: "critical" | "warning" | "pass";
  fix: string | null;
}

export interface SoundOffResult {
  overallPass: boolean;
  score: number;
  items: SoundOffItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function scorePill(score: number) {
  if (score >= 70) {
    return { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)" };
  }
  if (score >= 40) {
    return { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.2)" };
  }
  return { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" };
}

const SEVERITY_ICON = {
  pass: { Icon: CheckCircle2, color: "#10b981" },
  warning: { Icon: AlertCircle, color: "#f59e0b" },
  critical: { Icon: XCircle, color: "#ef4444" },
} as const;

const LABEL_COLOR = {
  pass: "#9f9fa9",
  warning: "#e4e4e7",
  critical: "#f4f4f5",
} as const;

// ─── Component ──────────────────────────────────────────────────────────────

interface SoundOffChecklistProps {
  isLoading: boolean;
  data: SoundOffResult | null;
}

export function SoundOffChecklist({ isLoading, data }: SoundOffChecklistProps) {
  const pill = data ? scorePill(data.score) : null;

  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VolumeX size={14} style={{ color: "#6366f1" }} />
          <span className="text-[13px] font-medium text-[#f4f4f5]">
            Sound-Off Check
          </span>
        </div>
        {data && pill && (
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border px-2 py-0.5 text-xs font-medium"
              style={{
                background: pill.bg,
                borderColor: pill.border,
                color: pill.text,
              }}
            >
              {data.score}
            </span>
            <span className="text-[10px] text-[#71717a]">
              {data.overallPass ? "Watchable Muted" : "Hard to Follow Muted"}
            </span>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && !data && (
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Checklist items */}
      {data && (
        <>
          <div className="flex flex-col divide-y divide-white/[0.03]">
            {data.items.map((item) => {
              const sev = SEVERITY_ICON[item.severity];
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2.5 py-2"
                >
                  <sev.Icon
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: sev.color }}
                  />
                  <div className="min-w-0">
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: LABEL_COLOR[item.severity] }}
                    >
                      {item.label}
                    </span>
                    {item.fix && (
                      <p
                        className="mt-0.5 text-[11px] leading-snug"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        → {item.fix}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className={cn("mt-3 border-t border-white/[0.06] pt-3")}>
            <p className="text-[11px] text-[#71717a]">
              {data.overallPass
                ? "This ad communicates clearly without audio."
                : "Fix critical items before publishing to Meta feed."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
