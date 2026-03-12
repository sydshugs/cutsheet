// PreFlightWinner.tsx — Winner callout card for Pre-Flight results

import type { ComparisonResult } from "../types/preflight";

interface PreFlightWinnerProps {
  winner: ComparisonResult["winner"];
  isDark: boolean;
}

function ConfidenceBadge({ level, isDark }: { level: string; isDark: boolean }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: "var(--score-excellent-bg)", text: "var(--success)", border: "var(--score-excellent-border)" },
    medium: { bg: "var(--score-average-bg)", text: "var(--warn)", border: "var(--score-average-border)" },
    low: {
      bg: "var(--surface-dim)",
      text: "var(--ink-faint)",
      border: "var(--border)",
    },
  };
  const c = colors[level] || colors.low;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "var(--radius-full)",
        fontSize: "10px",
        fontFamily: "var(--mono)",
        fontWeight: 700,
        color: c.text,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {level}
    </span>
  );
}

export function PreFlightWinner({ winner, isDark }: PreFlightWinnerProps) {
  const bg = "var(--surface-el)";
  const border = "var(--border)";
  const textPrimary = "var(--ink)";
  const textSecondary = "var(--ink-muted)";
  const textMuted = "var(--ink-faint)";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Subtle gradient border glow at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "var(--grad)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        }}
      />

      {/* Trophy + label row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-sm)",
            background: "var(--grad)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          🏆
        </div>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--sans)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--label)",
              marginBottom: "2px",
            }}
          >
            PREDICTED WINNER
          </div>
          <div
            style={{
              fontSize: "18px",
              fontFamily: "var(--mono)",
              fontWeight: 800,
              color: textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            {winner.label}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ConfidenceBadge level={winner.confidence} isDark={isDark} />
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: textPrimary,
          lineHeight: 1.4,
          marginBottom: "12px",
          fontFamily: "var(--sans)",
        }}
      >
        "{winner.headline}"
      </div>

      {/* Predicted lift */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "var(--score-excellent-bg)",
          border: "1px solid var(--score-excellent-border)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "16px",
          fontSize: "12px",
          fontFamily: "var(--mono)",
          color: "var(--success)",
          fontWeight: 600,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        {winner.predictedLift}
      </div>

      {/* Reasoning */}
      <div
        style={{
          fontSize: "13px",
          color: textSecondary,
          lineHeight: 1.7,
          fontFamily: "var(--sans)",
        }}
      >
        {winner.reasoning}
      </div>
    </div>
  );
}
