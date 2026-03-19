// DisplayScoreCard.tsx — Display ad scorecard with placement mockup

import {
  AlertTriangle, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import type { DisplayFormat } from "../utils/displayAdUtils";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface DisplayResult {
  overallScore: number;
  scores: {
    hierarchy: number;
    ctaVisibility: number;
    brandClarity: number;
    messageClarity: number;
    visualContrast: number;
  };
  textToImageRatio: string;
  textRatioFlag: boolean;
  improvements: string[];
  formatNotes: string;
  verdict: string;
  placementRisk: "low" | "medium" | "high";
  placementRiskNote: string;
}

// ─── SCORE ARC ──────────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const pct = score / 10;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct * 0.75);
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" transform="rotate(135 50 50)" />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(135 50 50)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "var(--font-mono, monospace)" }}>{score}</span>
        <span style={{ fontSize: 10, color: "#52525b" }}>/10</span>
      </div>
    </div>
  );
}

// ─── METRIC BAR ─────────────────────────────────────────────────────────────

function MetricBar({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#a1a1aa", width: 110, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${score * 10}%`, height: "100%", borderRadius: 2, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, color, fontFamily: "var(--font-mono, monospace)", width: 20, textAlign: "right" }}>{score}</span>
    </div>
  );
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function DisplayScoreCard({
  result,
  format,
  network,
  mockupUrl,
  mockupLoading,
  dimensions,
}: {
  result: DisplayResult;
  format: DisplayFormat | null;
  network: string;
  mockupUrl: string | null;
  mockupLoading: boolean;
  dimensions: { width: number; height: number };
}) {
  const { scores } = result;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header + format badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>Score Overview</p>
          <p style={{ fontSize: 11, color: "#52525b", margin: "2px 0 0" }}>{network === "google" ? "Google Display Network" : network === "affiliate" ? "Affiliate / Direct" : "All Networks"}</p>
        </div>
        {format && (
          <span style={{ fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "3px 10px" }}>
            {format.key} · {format.name}
          </span>
        )}
        {!format && (
          <span style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.1)", borderRadius: 9999, padding: "3px 10px" }}>
            {dimensions.width}×{dimensions.height} · Custom
          </span>
        )}
      </div>

      {/* Score arc */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ScoreArc score={result.overallScore} />
      </div>

      {/* Verdict */}
      <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5, margin: 0 }}>{result.verdict}</p>

      {/* Metric bars */}
      <div>
        <MetricBar label="Visual Hierarchy" score={scores.hierarchy} />
        <MetricBar label="CTA Visibility" score={scores.ctaVisibility} />
        <MetricBar label="Brand Clarity" score={scores.brandClarity} />
        <MetricBar label="Message Clarity" score={scores.messageClarity} />
        <MetricBar label="Visual Contrast" score={scores.visualContrast} />
      </div>

      {/* Text-to-image ratio */}
      <div style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: result.textRatioFlag ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
        border: `1px solid ${result.textRatioFlag ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {result.textRatioFlag
          ? <AlertTriangle size={14} color="#f59e0b" />
          : <CheckCircle size={14} color="#10b981" />
        }
        <span style={{ fontSize: 12, color: result.textRatioFlag ? "#f59e0b" : "#10b981" }}>
          {result.textToImageRatio} text {result.textRatioFlag ? "— Google recommends under 30%" : "— within policy"}
        </span>
      </div>

      {/* Placement risk */}
      <div style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: result.placementRisk === "high" ? "rgba(239,68,68,0.06)" : result.placementRisk === "medium" ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
        border: `1px solid ${result.placementRisk === "high" ? "rgba(239,68,68,0.2)" : result.placementRisk === "medium" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          {result.placementRisk === "high" && <XCircle size={14} color="#ef4444" />}
          {result.placementRisk === "medium" && <AlertCircle size={14} color="#f59e0b" />}
          {result.placementRisk === "low" && <CheckCircle size={14} color="#10b981" />}
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: result.placementRisk === "high" ? "#ef4444" : result.placementRisk === "medium" ? "#f59e0b" : "#10b981",
          }}>
            {result.placementRisk === "high" ? "High" : result.placementRisk === "medium" ? "Medium" : "Low"} placement risk
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.4 }}>{result.placementRiskNote}</p>
      </div>

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Improvements</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {result.improvements.map((imp, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#6366f1", fontSize: 14, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>•</span>
                <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format notes */}
      {result.formatNotes && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, color: "#71717a", fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>{result.formatNotes}</p>
        </div>
      )}

      {/* Mockup is rendered in the main layout, not here */}
    </div>
  );
}
