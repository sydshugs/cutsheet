// PreFlightRankCard.tsx — Individual variant ranking card

import type { RankedVariant } from "../types/preflight";

interface PreFlightRankCardProps {
  variant: RankedVariant;
  isWinner: boolean;
  isDark: boolean;
}

function scoreColor(score: number): string {
  if (score >= 7) return "#00D4AA";
  if (score >= 5) return "#FFB800";
  return "#FF6B6B";
}

export function PreFlightRankCard({ variant, isWinner, isDark }: PreFlightRankCardProps) {
  const bg = isDark ? "#111110" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#fff" : "#0A0A0A";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const surfaceDim = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  return (
    <div
      style={{
        background: bg,
        border: isWinner
          ? "1px solid transparent"
          : `1px solid ${border}`,
        borderRadius: "14px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.2)"
          : "0 2px 12px rgba(0,0,0,0.04)",
        ...(isWinner
          ? {
              backgroundImage: isDark
                ? `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, #FF6B6B, #C850C0, #4158D0)`
                : `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, #FF6B6B, #C850C0, #4158D0)`,
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }
          : {}),
      }}
    >
      {/* Rank + Label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "22px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 900,
              color: variant.rank === 1 ? "#FF6B6B" : textMuted,
              letterSpacing: "-0.02em",
            }}
          >
            #{variant.rank}
          </span>
          <span
            style={{
              fontSize: "14px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: textPrimary,
            }}
          >
            {variant.label}
          </span>
        </div>
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span
          style={{
            fontSize: "32px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 900,
            color: scoreColor(variant.overallScore),
            lineHeight: 1,
          }}
        >
          {variant.overallScore}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: textMuted,
          }}
        >
          /10
        </span>
      </div>

      {/* Would scale badge */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            background: variant.wouldScale
              ? "rgba(0,212,170,0.1)"
              : surfaceDim,
            color: variant.wouldScale
              ? "#00D4AA"
              : textMuted,
            border: variant.wouldScale
              ? "1px solid rgba(0,212,170,0.2)"
              : `1px solid ${border}`,
          }}
        >
          {variant.wouldScale ? "✓" : "✗"} {variant.wouldScale ? "Would scale" : "Don't scale"}
        </span>
      </div>

      {/* Strength */}
      <div>
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            color: textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          STRENGTH
        </div>
        <div
          style={{
            fontSize: "12px",
            color: textSecondary,
            lineHeight: 1.5,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {variant.keyStrength}
        </div>
      </div>

      {/* Weakness */}
      <div>
        <div
          style={{
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            color: textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          WEAKNESS
        </div>
        <div
          style={{
            fontSize: "12px",
            color: textSecondary,
            lineHeight: 1.5,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {variant.keyWeakness}
        </div>
      </div>
    </div>
  );
}
