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
  const textPrimary = isDark ? "#fff" : "#0A0A0A";
  const textSecondary = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

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
              fontFamily: "'JetBrains Mono', monospace",
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
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: "#FF6B6B",
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.2)",
              padding: "2px 8px",
              borderRadius: "4px",
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
            fontFamily: "'Outfit', sans-serif",
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
  const bg = isDark ? "#111110" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#fff" : "#0A0A0A";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Head-to-head */}
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "14px",
          padding: "24px",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.2)"
            : "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: textMuted,
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
          borderRadius: "14px",
          padding: "24px",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.2)"
            : "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: textMuted,
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
            fontFamily: "'Outfit', sans-serif",
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
            background: "rgba(200,80,192,0.06)",
            border: "1px solid rgba(200,80,192,0.15)",
            borderRadius: "12px",
          }}
        >
          <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
          <div>
            <div
              style={{
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#C850C0",
                marginBottom: "6px",
                fontWeight: 700,
              }}
            >
              HYBRID OPPORTUNITY
            </div>
            <div
              style={{
                fontSize: "13px",
                color: textSecondary,
                lineHeight: 1.6,
                fontFamily: "'Outfit', sans-serif",
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
