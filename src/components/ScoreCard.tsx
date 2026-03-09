// ScoreCard.tsx
// Animated score visualization — the shareable/viral piece of the app
// Drop into src/components/ScoreCard.tsx

import { useEffect, useState } from "react";

interface Scores {
  hook: number;
  clarity: number;
  cta: number;
  production: number;
  overall: number;
}

interface ScoreCardProps {
  scores: Scores;
  fileName?: string;
  onShare?: () => void;
  isDark?: boolean;
}

const SCORE_LABELS: Record<keyof Scores, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
  overall: "Overall Ad Strength",
};

const SCORE_COLORS: Record<keyof Scores, string> = {
  hook: "#FF4444",
  clarity: "#FF7A00",
  cta: "#FFB800",
  production: "#00D4AA",
  overall: "#FF4444",
};

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: "Exceptional", color: "#00D4AA" };
  if (score >= 7) return { label: "Strong", color: "#88DD00" };
  if (score >= 5) return { label: "Average", color: "#FFB800" };
  if (score >= 3) return { label: "Weak", color: "#FF7A00" };
  return { label: "Poor", color: "#FF4444" };
}

// SVG Radial progress arc
function ScoreArc({
  score,
  color,
  size = 56,
  strokeWidth = 4,
  animated = true,
  isDark = true,
}: {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  isDark?: boolean;
}) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 10) * circumference;
  const center = size / 2;

  useEffect(() => {
    if (!animated) return;
    const start = performance.now();
    const duration = 1000 + score * 60;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayScore(parseFloat((ease * score).toFixed(1)));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [score, animated]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />
    </svg>
  );
}

function ScoreRow({
  label,
  score,
  color,
  delay = 0,
  isDark = true,
}: {
  label: string;
  score: number;
  color: string;
  delay?: number;
  isDark?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setBarWidth((score / 10) * 100), delay + 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [score, delay]);

  const { label: scoreLabel } = getScoreLabel(score);
  const muted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 0",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      }}
    >
      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          {label}
        </div>
        <div style={{ position: "relative", height: "3px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: "2px" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${barWidth}%`,
              background: color,
              borderRadius: "2px",
              transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: `0 0 8px ${color}66`,
            }}
          />
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "18px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {score}
          <span style={{ fontSize: "11px", color: muted, fontWeight: 400 }}>/10</span>
        </div>
        <div style={{ fontSize: "10px", color: muted, marginTop: "2px" }}>{scoreLabel}</div>
      </div>
    </div>
  );
}

export function ScoreCard({ scores, fileName, onShare, isDark = true }: ScoreCardProps) {
  const { label: overallLabel, color: overallColor } = getScoreLabel(scores.overall);
  const scoreKeys = Object.keys(scores).filter((k) => k !== "overall") as Array<keyof Omit<Scores, "overall">>;
  const muted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const subtle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const faint = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const btnBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <div
      style={{
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: "12px",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow effect behind overall score */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "160px",
          height: "160px",
          background: `radial-gradient(circle, ${SCORE_COLORS.overall}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div
            style={{
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              color: muted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Creative Scorecard
          </div>
          {fileName && (
            <div
              style={{
                fontSize: "12px",
                color: subtle,
                fontFamily: "'JetBrains Mono', monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
              }}
            >
              {fileName}
            </div>
          )}
        </div>

        {/* Overall score arc */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ScoreArc score={scores.overall} color={SCORE_COLORS.overall} size={72} strokeWidth={5} isDark={isDark} />
          <div
            style={{
              position: "absolute",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: SCORE_COLORS.overall,
                lineHeight: 1,
              }}
            >
              {scores.overall}
            </div>
            <div style={{ fontSize: "9px", color: faint }}>/ 10</div>
          </div>
        </div>
      </div>

      {/* Overall verdict badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: `${overallColor}18`,
          border: `1px solid ${overallColor}44`,
          borderRadius: "4px",
          padding: "4px 10px",
          marginBottom: "20px",
        }}
      >
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: overallColor }} />
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: overallColor,
            letterSpacing: "0.06em",
          }}
        >
          {overallLabel}
        </span>
      </div>

      {/* Individual scores */}
      <div>
        {scoreKeys.map((key, i) => (
          <ScoreRow
            key={key}
            label={SCORE_LABELS[key]}
            score={scores[key]}
            color={SCORE_COLORS[key]}
            delay={i * 80}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Share button */}
      {onShare && (
        <button
          onClick={onShare}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: `1px solid ${btnBorder}`,
            borderRadius: "6px",
            color: subtle,
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,68,68,0.4)";
            e.currentTarget.style.color = "#FF4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = btnBorder;
            e.currentTarget.style.color = subtle;
          }}
        >
          Copy Scorecard ↗
        </button>
      )}
    </div>
  );
}
