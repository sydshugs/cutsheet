// PreFlightWinner.tsx — Winner callout card for Pre-Flight results

import type { ComparisonResult } from "../types/preflight";

interface PreFlightWinnerProps {
  winner: ComparisonResult["winner"];
  isDark: boolean;
}

function ConfidenceBadge({ level, isDark }: { level: string; isDark: boolean }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: "rgba(0,212,170,0.12)", text: "#00D4AA", border: "rgba(0,212,170,0.3)" },
    medium: { bg: "rgba(255,186,0,0.12)", text: "#FFB800", border: "rgba(255,186,0,0.3)" },
    low: {
      bg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      text: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
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
        borderRadius: "100px",
        fontSize: "10px",
        fontFamily: "'JetBrains Mono', monospace",
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
  const bg = isDark ? "#111110" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#fff" : "#0A0A0A";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const textMuted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "16px",
        padding: "32px",
        position: "relative",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 8px 40px rgba(0,0,0,0.3)"
          : "0 4px 24px rgba(0,0,0,0.06)",
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
          background: "linear-gradient(90deg, #FF6B6B, #C850C0, #4158D0)",
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* Trophy + label row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #FF6B6B, #C850C0)",
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
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: textMuted,
              marginBottom: "2px",
            }}
          >
            PREDICTED WINNER
          </div>
          <div
            style={{
              fontSize: "18px",
              fontFamily: "'JetBrains Mono', monospace",
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
          fontFamily: "'Outfit', sans-serif",
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
          background: "rgba(0,212,170,0.08)",
          border: "1px solid rgba(0,212,170,0.2)",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace",
          color: "#00D4AA",
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
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {winner.reasoning}
      </div>
    </div>
  );
}
