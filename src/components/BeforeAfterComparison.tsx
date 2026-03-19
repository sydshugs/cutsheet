// BeforeAfterComparison.tsx — Before/After score comparison panel

import { TrendingUp, TrendingDown, Minus, CheckCircle, Circle, AlertCircle, Star, Copy } from "lucide-react";
import type { ComparisonResult } from "../services/claudeService";

function scoreColor(n: number) { return n >= 8 ? "#10b981" : n >= 5 ? "#f59e0b" : "#ef4444"; }
function diffColor(n: number) { return n > 0 ? "#10b981" : n < 0 ? "#ef4444" : "#71717a"; }
function diffLabel(n: number) { return n > 0 ? `+${n}` : String(n); }

interface Props {
  originalScores: { overall: number; hook: number; cta: number; clarity: number; production: number };
  improvedScores: { overall: number; hook: number; cta: number; clarity: number; production: number };
  comparison: ComparisonResult;
  fileName: string;
  onReanalyzeAgain: () => void;
  onStartFresh: () => void;
}

export function BeforeAfterComparison({ originalScores, improvedScores, comparison, fileName, onReanalyzeAgain, onStartFresh }: Props) {
  const verdictConfig = {
    significantly_better: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", color: "#10b981", icon: TrendingUp, label: "Significantly improved" },
    better: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", color: "#818cf8", icon: TrendingUp, label: "Improved" },
    same: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", color: "#f59e0b", icon: Minus, label: "No significant change" },
    worse: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", color: "#ef4444", icon: TrendingDown, label: "Scores dropped" },
  };
  const v = verdictConfig[comparison.verdict];
  const VIcon = v.icon;

  const metrics = [
    { label: "Overall", before: originalScores.overall, after: improvedScores.overall },
    { label: "Hook", before: originalScores.hook, after: improvedScores.hook },
    { label: "CTA", before: originalScores.cta, after: improvedScores.cta },
    { label: "Clarity", before: originalScores.clarity, after: improvedScores.clarity },
    { label: "Production", before: originalScores.production, after: improvedScores.production },
  ];

  const handleCopyShareCard = () => {
    const text = `CUTSHEET BEFORE/AFTER\n${fileName}\n\nBEFORE: ${originalScores.overall}/10\nHook: ${originalScores.hook} | CTA: ${originalScores.cta} | Clarity: ${originalScores.clarity}\n\nAFTER: ${improvedScores.overall}/10\nHook: ${improvedScores.hook} | CTA: ${improvedScores.cta} | Clarity: ${improvedScores.clarity}\n\nImprovement: ${diffLabel(comparison.scoreChange)} points\n${comparison.topWin}\n\nScored by Cutsheet — cutsheet.xyz`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 0 8px" }}>
      {/* Verdict banner */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: v.bg, border: `1px solid ${v.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <VIcon size={18} color={v.color} />
          <span style={{ fontSize: 16, fontWeight: 600, color: v.color }}>{v.label}</span>
          {comparison.scoreChange !== 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: diffColor(comparison.scoreChange), background: `${diffColor(comparison.scoreChange)}15`, borderRadius: 9999, padding: "2px 10px" }}>
              {diffLabel(comparison.scoreChange)} points
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#a1a1aa", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>{comparison.verdictText}</p>
      </div>

      {/* Score comparison table */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 30px 1fr 44px", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
          <span style={{ fontSize: 10, color: "#52525b" }}>Before</span>
          <span />
          <span />
          <span style={{ fontSize: 10, color: "#52525b", textAlign: "right" }}>After</span>
          <span style={{ fontSize: 10, color: "#52525b", textAlign: "right" }}>Diff</span>
        </div>
        {metrics.map((m) => {
          const diff = m.after - m.before;
          return (
            <div key={m.label} style={{ display: "grid", gridTemplateColumns: "50px 1fr 30px 1fr 44px", padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono, monospace)", fontWeight: 600, color: scoreColor(m.before) }}>{m.before}</span>
              <span style={{ fontSize: 12, color: m.label === "Overall" ? "#f4f4f5" : "#71717a", fontWeight: m.label === "Overall" ? 600 : 400, textAlign: "center" }}>{m.label}</span>
              <span style={{ fontSize: 12, color: diffColor(diff), textAlign: "center" }}>{diff > 0 ? "↑" : diff < 0 ? "↓" : "→"}</span>
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono, monospace)", fontWeight: 600, color: scoreColor(m.after), textAlign: "right" }}>{m.after}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono, monospace)", color: diffColor(diff), textAlign: "right" }}>{diff !== 0 ? diffLabel(diff) : "—"}</span>
            </div>
          );
        })}
      </div>

      {/* Top win */}
      {comparison.topWin && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Star size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>Biggest improvement</span>
            <p style={{ fontSize: 13, color: "#a1a1aa", margin: "4px 0 0", lineHeight: 1.5 }}>{comparison.topWin}</p>
          </div>
        </div>
      )}

      {/* Improvements addressed */}
      {comparison.improvementsAddressed.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Improvements checklist</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {comparison.improvementsAddressed.map((imp, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                {imp.addressed
                  ? <CheckCircle size={14} color={imp.confidence === "high" ? "#10b981" : "#f59e0b"} style={{ flexShrink: 0, marginTop: 2 }} />
                  : <Circle size={14} color="#52525b" style={{ flexShrink: 0, marginTop: 2 }} />
                }
                <div>
                  <span style={{ fontSize: 13, color: imp.addressed ? "#a1a1aa" : "#52525b", textDecoration: imp.addressed && imp.confidence === "high" ? "line-through" : "none" }}>
                    {imp.improvement}
                  </span>
                  {imp.addressed && imp.note && (
                    <p style={{ fontSize: 11, color: imp.confidence === "high" ? "#10b981" : "#f59e0b", fontStyle: "italic", margin: "2px 0 0" }}>{imp.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remaining work */}
      {comparison.remainingWork.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <AlertCircle size={14} color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#f59e0b" }}>Still needs work</span>
          </div>
          {comparison.remainingWork.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 3 }}>
              <span style={{ color: "#71717a", fontSize: 12 }}>•</span>
              <span style={{ fontSize: 12, color: "#71717a", lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" onClick={onReanalyzeAgain}
          style={{ flex: 1, height: 36, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#71717a", fontSize: 12, cursor: "pointer" }}>
          Re-analyze again
        </button>
        <button type="button" onClick={handleCopyShareCard}
          style={{ height: 36, padding: "0 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#71717a", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Copy size={12} /> Share
        </button>
        <button type="button" onClick={onStartFresh}
          style={{ height: 36, padding: "0 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#52525b", fontSize: 12, cursor: "pointer" }}>
          Start fresh
        </button>
      </div>
    </div>
  );
}
