// ScoreCard.tsx — Visual translation from #screen-results (prototype)

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
  winner?: boolean;
}

const SCORE_LABELS: Record<keyof Scores, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
  overall: "Overall Ad Strength",
};

/** Score band color for chips/overlays: 9-10 green, 7-8 indigo, 5-6 amber, 1-4 red (scores 0-10). */
export function getScoreColorByValue(score: number): string {
  if (score >= 9) return "#10B981";
  if (score >= 7) return "#6366F1";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number, isCTA: boolean = false): { label: string; color: string } {
  if (score === 0 && isCTA) return { label: "No CTA Detected", color: "#666666" };
  if (score === 0) return { label: "N/A", color: "#666666" };
  if (score >= 9) return { label: "Strong", color: "#10B981" };
  if (score >= 7) return { label: "Strong", color: "#6366F1" };
  if (score >= 5) return { label: "Average", color: "#F59E0B" };
  if (score >= 3) return { label: "Weak", color: "#EF4444" };
  return { label: "Poor", color: "#EF4444" };
}

function formatFileName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ");
}

const scoreKeys = ["hook", "clarity", "cta", "production"] as const;

export function ScoreCard({ scores, fileName, onShare, isDark = true, winner }: ScoreCardProps) {
  const { label: overallLabel } = getScoreLabel(scores.overall);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="scorecard"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 18,
        transition: "transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        if (window.matchMedia("(hover: hover)").matches) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "var(--mono)",
          }}
        >
          Overall Score
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: `${getScoreColorByValue(scores.overall)}1a`,
            border: `1px solid ${getScoreColorByValue(scores.overall)}40`,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: getScoreColorByValue(scores.overall),
            fontFamily: "var(--mono)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: getScoreColorByValue(scores.overall),
            }}
          />
          {overallLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        {/* Arc gauge */}
        <div style={{ position: "relative", width: 80, height: 48, flexShrink: 0 }}>
          <svg viewBox="0 0 120 70" style={{ width: "100%", height: "100%" }}>
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="var(--surface-el)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={getScoreColorByValue(scores.overall)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${mounted ? (scores.overall / 10) * 157 : 0} 157`}
              style={{
                transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                filter: `drop-shadow(0 0 4px ${getScoreColorByValue(scores.overall)}60)`,
              }}
            />
          </svg>
        </div>
        {/* Score number */}
        <div style={{ fontFamily: "var(--mono)", lineHeight: 1 }}>
          <span style={{
            fontSize: 32,
            fontWeight: 700,
            color: getScoreColorByValue(scores.overall),
          }}>
            {scores.overall}
          </span>
          <span style={{
            fontSize: 16,
            color: "var(--ink-muted)",
          }}>/10</span>
        </div>
      </div>

      {winner && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 20,
            padding: "3px 10px",
            marginBottom: 12,
            fontSize: 11,
            fontWeight: 600,
            color: "#F59E0B",
            fontFamily: "var(--mono)",
          }}
        >
          ★ Winner
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {scoreKeys.map((key) => {
          const value = scores[key];
          const pct = value <= 0 ? 0 : Math.min(100, (value / 10) * 100);
          return (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-muted)",
                    fontWeight: 500,
                  }}
                >
                  {SCORE_LABELS[key]}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: getScoreColorByValue(value),
                  }}
                >
                  {value}
                </span>
              </div>
              <div
                style={{
                  height: "var(--bar-height)",
                  background: "var(--surface-el)",
                  borderRadius: "var(--bar-radius)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: mounted ? `${pct}%` : "0%",
                    background: `linear-gradient(90deg, ${getScoreColorByValue(value)}, ${getScoreColorByValue(value)}cc)`,
                    borderRadius: "var(--bar-radius)",
                    boxShadow: `0 0 8px ${getScoreColorByValue(value)}40`,
                    transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {fileName && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            fontFamily: "var(--mono)",
            color: "var(--ink-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {formatFileName(fileName)}
        </div>
      )}

      {onShare && (
        <button
          type="button"
          onClick={onShare}
          data-html2canvas-ignore="true"
          style={{
            marginTop: 16,
            width: "100%",
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 7,
            color: "var(--ink-muted)",
            fontSize: 12,
            fontFamily: "var(--sans)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-el)";
            e.currentTarget.style.color = "var(--ink)";
            e.currentTarget.style.borderColor = "var(--border-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--ink-muted)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          Copy Scorecard
        </button>
      )}
    </div>
  );
}
