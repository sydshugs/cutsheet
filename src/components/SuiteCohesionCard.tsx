// SuiteCohesionCard.tsx — Suite cohesion analysis display

import { useState } from "react";
import { AlertTriangle, CheckCircle, ChevronDown, ArrowRight, Trophy, XCircle } from "lucide-react";
import type { SuiteCohesionResult } from "../services/claudeService";

function scoreColor(n: number) { return n >= 8 ? "#10b981" : n >= 5 ? "#f59e0b" : "#ef4444"; }

export function SuiteCohesionCard({ result, loading }: { result: SuiteCohesionResult | null; loading: boolean }) {
  const [strengthsOpen, setStrengthsOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 16, height: 16, border: "2px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <span style={{ fontSize: 13, color: "#71717a" }}>Analyzing suite cohesion...</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 32, borderRadius: 8, background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Suite score header */}
      <div style={{ padding: 20, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 4px" }}>Campaign Suite Score</p>
        <p style={{ fontSize: 40, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: scoreColor(result.suiteScore), margin: "0 0 8px", lineHeight: 1 }}>
          {result.suiteScore}<span style={{ fontSize: 16, color: "#52525b" }}>/10</span>
        </p>
        {result.verdict && (
          <p style={{ fontSize: 14, color: "#a1a1aa", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>{result.verdict}</p>
        )}
      </div>

      {/* 4 consistency metrics — 2x2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {([
          ["Brand", result.brandConsistency],
          ["Message", result.messageConsistency],
          ["Visual", result.visualConsistency],
          ["CTA", result.ctaConsistency],
        ] as [string, number][]).map(([label, score]) => (
          <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#71717a" }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: scoreColor(score) }}>{score}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: `${score * 10}%`, height: "100%", borderRadius: 2, background: scoreColor(score), transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Strongest / weakest row */}
      {(result.strongestBanner || result.weakestBanner) && (
        <div style={{ display: "flex", gap: 8 }}>
          {result.strongestBanner && (
            <span style={{ flex: 1, fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Trophy size={12} /> Strongest: {result.strongestBanner}
            </span>
          )}
          {result.weakestBanner && (
            <span style={{ flex: 1, fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <XCircle size={12} /> Weakest: {result.weakestBanner}
            </span>
          )}
        </div>
      )}

      {/* Missing formats */}
      {result.missingFormats.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>Missing: {result.missingFormats.join(", ")}</span>
            <p style={{ fontSize: 11, color: "#71717a", margin: "4px 0 0" }}>Complete suites get up to 40% more campaign reach</p>
          </div>
        </div>
      )}

      {/* Issues */}
      {result.issues.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Issues</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {result.issues.map((issue, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: 10,
                borderLeft: `2px solid ${issue.severity === "critical" ? "#ef4444" : issue.severity === "warning" ? "#f59e0b" : "#71717a"}`,
                background: issue.severity === "critical" ? "rgba(239,68,68,0.04)" : issue.severity === "warning" ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
              }}>
                <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>{issue.issue}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {issue.affectedFormats.map((f, j) => (
                    <span key={j} style={{ fontSize: 10, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "1px 6px" }}>{f}</span>
                  ))}
                </div>
                {issue.fix && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <ArrowRight size={10} color="#6366f1" />
                    <span style={{ fontSize: 11, color: "#71717a", fontStyle: "italic" }}>{issue.fix}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths — collapsible */}
      {result.strengths.length > 0 && (
        <div>
          <button type="button" onClick={() => setStrengthsOpen(!strengthsOpen)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#10b981", fontSize: 12, fontWeight: 500, cursor: "pointer", padding: 0 }}>
            <ChevronDown size={12} style={{ transform: strengthsOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
            View strengths ({result.strengths.length})
          </button>
          {strengthsOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {result.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommendations</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {result.recommendations.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", width: 16, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
}
