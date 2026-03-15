// ReportCover.tsx — Page 1 of PDF report (cover)
import type { AnalysisResult } from "../services/analyzerService";

const ACCENT = "#6366F1";

function StaticScoreArc({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={ACCENT}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
      />
    </svg>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          color: "rgba(255,255,255,0.5)",
          width: "80px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: ACCENT,
            borderRadius: "3px",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: "12px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          width: "28px",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function ReportCover({ result }: { result: AnalysisResult }) {
  const overall = result.scores?.overall ?? 0;
  const scores = result.scores;
  const dateStr = result.timestamp.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      style={{
        width: "794px",
        height: "1123px",
        background: "#0A0A0A",
        color: "#fff",
        fontFamily: "var(--sans)",
        padding: "56px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo + wordmark top left */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "64px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            background: ACCENT,
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="0,0 10,0 14,4 14,14 0,14" fill="white" opacity="0.95" />
            <line x1="9.5" y1="0.5" x2="13.5" y2="4.5" stroke={ACCENT} strokeWidth="1" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "0.04em",
            color: "#fff",
          }}
        >
          CUTSHEET
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "var(--mono)",
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.95)",
          margin: "0 0 16px 0",
        }}
      >
        Creative Analysis Report
      </h1>

      {/* Filename + date */}
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "12px",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        <div style={{ marginBottom: "4px" }}>{result.fileName}</div>
        <div>{dateStr}</div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "48px 0" }} />

      {/* Overall score gauge — centered */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          marginBottom: "56px",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StaticScoreArc score={overall} size={160} strokeWidth={10} />
          <div
            style={{
              position: "absolute",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "42px",
                fontFamily: "var(--mono)",
                fontWeight: 700,
                color: ACCENT,
                lineHeight: 1,
              }}
            >
              {overall}
            </span>
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.35)", marginLeft: "2px" }}>/ 10</span>
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Overall Ad Strength
        </div>
      </div>

      {/* Sub-scores breakdown */}
      {scores && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            maxWidth: "480px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <ScoreBar label="Hook" value={scores.hook} />
          <ScoreBar label="Clarity" value={scores.clarity} />
          <ScoreBar label="CTA" value={scores.cta} />
          <ScoreBar label="Production" value={scores.production} />
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "20px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10px",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.06em",
          }}
        >
          Powered by Gemini + Claude
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10px",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.06em",
          }}
        >
          cutsheet.xyz
        </span>
      </div>
    </div>
  );
}
