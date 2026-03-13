// PreFlightRankCard.tsx — Individual variant ranking card

import type { RankedVariant } from "../types/preflight";

interface PreFlightRankCardProps {
  variant: RankedVariant;
  isWinner: boolean;
  isDark: boolean;
}

function scoreColor(score: number): string {
  if (score >= 9) return "var(--score-excellent)";
  if (score >= 7) return "var(--score-good)";
  if (score >= 5) return "var(--score-average)";
  return "var(--score-weak)";
}

export function PreFlightRankCard({ variant, isWinner, isDark }: PreFlightRankCardProps) {
  const bg = "var(--surface-el)";
  const border = "var(--border)";
  const textPrimary = isWinner ? "#fff" : "var(--ink)";
  const textSecondary = isWinner ? "rgba(255,255,255,0.85)" : "var(--ink-muted)";
  const textMuted = isWinner ? "rgba(255,255,255,0.5)" : "var(--ink-faint)";
  const surfaceDim = "var(--surface-dim)";

  return (
    <div
      style={{
        background: bg,
        border: isWinner
          ? "1px solid transparent"
          : `1px solid ${border}`,
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        ...(isWinner
          ? {
              backgroundImage: `linear-gradient(var(--surface-el), var(--surface-el)), linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA)`,
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
              fontFamily: "var(--mono)",
              fontWeight: 900,
              color: isWinner ? "#fff" : textMuted,
              letterSpacing: "-0.02em",
            }}
          >
            #{variant.rank}
          </span>
          <span
            style={{
              fontSize: "14px",
              fontFamily: "var(--mono)",
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
            fontFamily: "var(--mono)",
            fontWeight: 900,
            color: isWinner ? "#fff" : scoreColor(variant.overallScore),
            lineHeight: 1,
          }}
        >
          {variant.overallScore}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--mono)",
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
            borderRadius: "var(--radius-sm)",
            fontSize: "11px",
            fontFamily: "var(--mono)",
            fontWeight: 600,
            background: variant.wouldScale
              ? isWinner ? "rgba(16,185,129,0.2)" : "var(--score-excellent-bg)"
              : isWinner ? "rgba(255,255,255,0.1)" : surfaceDim,
            color: variant.wouldScale
              ? isWinner ? "#6EE7B7" : "var(--success)"
              : isWinner ? "rgba(255,255,255,0.7)" : textMuted,
            border: variant.wouldScale
              ? isWinner ? "1px solid rgba(16,185,129,0.35)" : "1px solid var(--score-excellent-border)"
              : isWinner ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${border}`,
          }}
        >
          {variant.wouldScale ? "✓" : "✗"} {variant.wouldScale ? "Would scale" : "Don't scale"}
        </span>
      </div>

      {/* Strength */}
      <div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--sans)",
            fontWeight: 600,
            color: isWinner ? "rgba(255,255,255,0.7)" : "var(--label)",
            letterSpacing: "0.18em",
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
            fontFamily: "var(--sans)",
          }}
        >
          {variant.keyStrength}
        </div>
      </div>

      {/* Weakness */}
      <div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--sans)",
            fontWeight: 600,
            color: isWinner ? "rgba(255,255,255,0.7)" : "var(--label)",
            letterSpacing: "0.18em",
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
            fontFamily: "var(--sans)",
          }}
        >
          {variant.keyWeakness}
        </div>
      </div>
    </div>
  );
}
