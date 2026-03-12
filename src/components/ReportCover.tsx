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

export function ReportCover({ result }: { result: AnalysisResult }) {
  const overall = result.scores?.overall ?? 0;
  const dateStr = result.timestamp.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#0A0A0A",
        color: "#fff",
        fontFamily: "var(--sans)",
        padding: "48px 56px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo + wordmark top left */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
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
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.9)",
          margin: "0 0 24px 0",
        }}
      >
        Creative Analysis Report
      </h1>

      {/* Filename + date */}
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "12px",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "80px",
        }}
      >
        <div style={{ marginBottom: "4px" }}>{result.fileName}</div>
        <div>{dateStr}</div>
      </div>

      {/* Overall score large and centered */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StaticScoreArc score={overall} size={140} strokeWidth={10} />
          <div
            style={{
              position: "absolute",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "36px",
                fontFamily: "var(--mono)",
                fontWeight: 700,
                color: ACCENT,
                lineHeight: 1,
              }}
            >
              {overall}
            </span>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginLeft: "2px" }}>/ 10</span>
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.08em",
          }}
        >
          Overall Ad Strength
        </div>
      </div>
    </div>
  );
}
