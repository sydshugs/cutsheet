// InlineError.tsx — Reusable error card with severity, recovery text, and actions

import { AlertCircle, Info, X } from "lucide-react";

type Severity = "red" | "amber" | "gray";

interface InlineErrorProps {
  severity: Severity;
  message: string;
  recovery?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
}

const SEVERITY_STYLES: Record<Severity, { bg: string; border: string; iconColor: string }> = {
  red:   { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", iconColor: "#ef4444" },
  amber: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", iconColor: "#f59e0b" },
  gray:  { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)", iconColor: "#52525b" },
};

export function InlineError({
  severity,
  message,
  recovery,
  primaryAction,
  secondaryAction,
  dismissible,
  onDismiss,
  compact,
}: InlineErrorProps) {
  const s = SEVERITY_STYLES[severity];
  const Icon = severity === "gray" ? Info : AlertCircle;

  return (
    <div style={{
      padding: compact ? "8px 12px" : "14px 16px",
      borderRadius: compact ? 8 : 12,
      background: s.bg,
      border: `1px solid ${s.border}`,
      position: "relative",
    }}>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: 2 }}
        >
          <X size={14} />
        </button>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Icon size={compact ? 14 : 16} color={s.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: compact ? 12 : 14, fontWeight: 500, color: "#f4f4f5", margin: 0, lineHeight: 1.4, paddingRight: dismissible ? 20 : 0 }}>
            {message}
          </p>
          {recovery && (
            <p style={{ fontSize: compact ? 11 : 13, color: "#a1a1aa", margin: "4px 0 0", lineHeight: 1.5 }}>
              {recovery}
            </p>
          )}
          {(primaryAction || secondaryAction) && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  style={{
                    height: compact ? 28 : 32,
                    padding: compact ? "0 10px" : "0 14px",
                    borderRadius: 9999,
                    border: "none",
                    background: "#6366f1",
                    color: "white",
                    fontSize: compact ? 11 : 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 150ms",
                  }}
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  style={{
                    height: compact ? 28 : 32,
                    padding: compact ? "0 10px" : "0 14px",
                    borderRadius: 9999,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#71717a",
                    fontSize: compact ? 11 : 12,
                    cursor: "pointer",
                  }}
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
