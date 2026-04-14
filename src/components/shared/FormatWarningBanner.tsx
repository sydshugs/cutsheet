// FormatWarningBanner.tsx — Aspect ratio / platform mismatch warnings
// Renders contextual warnings before the user runs analysis.
// Zero AI calls — pure deterministic display.

import { XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "../../lib/utils";
import type { FormatWarning, Severity } from "../../utils/platformFormatWarnings";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEVERITY_ICON = {
  error: { Icon: XCircle, color: "#ef4444" },
  warning: { Icon: AlertTriangle, color: "#f59e0b" },
  info: { Icon: Info, color: "#6366f1" },
} as const;

const MESSAGE_COLOR: Record<Severity, string> = {
  error: "#f4f4f5",
  warning: "#e4e4e7",
  info: "#9f9fa9",
};

function containerStyle(warnings: FormatWarning[]): string {
  const hasError = warnings.some((w) => w.severity === "error");
  const hasWarning = warnings.some((w) => w.severity === "warning");
  if (hasError) return "border-red-500/20 bg-red-500/[0.05]";
  if (hasWarning) return "border-amber-500/20 bg-amber-500/[0.05]";
  return "border-white/[0.06] bg-white/[0.02]";
}

// ─── Component ──────────────────────────────────────────────────────────────

interface FormatWarningBannerProps {
  warnings: FormatWarning[];
  className?: string;
}

export function FormatWarningBanner({ warnings, className }: FormatWarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 mb-3",
        containerStyle(warnings),
        className,
      )}
    >
      {/* Count badge for multiple warnings */}
      {warnings.length > 1 && (
        <div className="mb-2 flex justify-end">
          <span className="text-[10px] text-[#71717a]">
            {warnings.length} issues
          </span>
        </div>
      )}

      {warnings.map((w, i) => {
        const sev = SEVERITY_ICON[w.severity];
        return (
          <div key={w.id}>
            <div className="flex items-start gap-2 py-1.5">
              <sev.Icon
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: sev.color }}
              />
              <div className="min-w-0">
                <span
                  className="text-[12px] font-medium"
                  style={{ color: MESSAGE_COLOR[w.severity] }}
                >
                  {w.message}
                </span>
                {w.tip && (
                  <p
                    className="mt-0.5 text-[11px] leading-snug"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    → {w.tip}
                  </p>
                )}
              </div>
            </div>
            {i < warnings.length - 1 && (
              <div className="border-b border-white/[0.03]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
