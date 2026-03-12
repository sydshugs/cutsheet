// PreFlightHeadToHead.tsx — Head-to-head metric breakdown + recommendation

import type { ComparisonResult } from "../types/preflight";

interface PreFlightHeadToHeadProps {
  headToHead: ComparisonResult["headToHead"];
  recommendation: string;
  hybridNote: string | null;
  isDark: boolean;
}

function MetricRow({
  label,
  icon,
  winner,
  reason,
  isDark,
}: {
  label: string;
  icon: string;
  winner: string;
  reason: string;
  isDark: boolean;
}) {
  const textPrimary = "var(--ink)";
  const textSecondary = "var(--ink-muted)";
  const textMuted = "var(--ink-faint)";
  const border = "var(--border)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "14px 0",
        borderBottom: `1px solid ${border}`,
      }}
    >
      <div style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              color: textPrimary,
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              color: "var(--accent)",
              background: "var(--accent-subtle)",
              border: "1px solid var(--accent-muted)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              letterSpacing: "0.04em",
            }}
          >
            {winner} wins
          </span>
        </div>
        <div
          style={{
            fontSize: "12px",
            color: textSecondary,
            lineHeight: 1.5,
            fontFamily: "var(--sans)",
          }}
        >
          {reason}
        </div>
      </div>
    </div>
  );
}

export function PreFlightHeadToHead({
  headToHead,
  recommendation,
  hybridNote,
  isDark,
}: PreFlightHeadToHeadProps) {
  const bg = "var(--surface-el)";
  const border = "var(--border)";
  const textPrimary = "var(--ink)";
  const textSecondary = "var(--ink-muted)";
  const textMuted = "var(--ink-faint)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Head-to-head */}
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-md)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--sans)",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--label)",
            marginBottom: "16px",
          }}
        >
          HEAD-TO-HEAD
        </div>

        <MetricRow
          label="Hook"
          icon="🎣"
          winner={headToHead.hookWinner}
          reason={headToHead.hookReason}
          isDark={isDark}
        />
        <MetricRow
          label="CTA"
          icon="📢"
          winner={headToHead.ctaWinner}
          reason={headToHead.ctaReason}
          isDark={isDark}
        />
        <div style={{ borderBottom: "none" }}>
          <MetricRow
            label="Retention"
            icon="⚡"
            winner={headToHead.retentionWinner}
            reason={headToHead.retentionReason}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-md)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--sans)",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--label)",
            marginBottom: "12px",
          }}
        >
          RECOMMENDATION
        </div>
        <div
          style={{
            fontSize: "14px",
            color: textPrimary,
            lineHeight: 1.7,
            fontFamily: "var(--sans)",
            fontWeight: 500,
          }}
        >
          {recommendation}
        </div>
      </div>

      {/* Hybrid note */}
      {hybridNote && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "16px 20px",
            background: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: "var(--radius)",
          }}
        >
          <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
          <div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--sans)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--label)",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              HYBRID OPPORTUNITY
            </div>
            <div
              style={{
                fontSize: "13px",
                color: textSecondary,
                lineHeight: 1.6,
                fontFamily: "var(--sans)",
              }}
            >
              {hybridNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
