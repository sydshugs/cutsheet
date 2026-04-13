// src/components/display/DisplaySingleResults.tsx
// Single-mode results section extracted from DisplayAnalyzer — pure presentation.

import { Eye, Sparkles, ShieldCheck } from "lucide-react";
import { DisplayAnalyzerMockup } from "../DisplayAnalyzerMockup";
import { DesignReviewCard } from "../DesignReviewCard";
import type { DisplayResult } from "../../types/display";
import type { DisplayFormat } from "../../utils/displayAdUtils";

export interface DisplaySingleResultsProps {
  result: DisplayResult;
  previewUrl: string | null;
  mockupUrl: string | null;
  detectedFormat: DisplayFormat | null;
  ctaRewrites: string[] | null;
  ctaLoading: boolean;
  policyLoading: boolean;
  onSwitchToSuite: () => void;
  onCTARewrite: () => void;
  onCheckPolicies: () => void;
  onAnimate: () => void;
}

export function DisplaySingleResults({
  result,
  previewUrl,
  mockupUrl,
  detectedFormat,
  ctaRewrites,
  ctaLoading,
  policyLoading,
  onSwitchToSuite,
  onCTARewrite,
  onCheckPolicies,
  onAnimate,
}: DisplaySingleResultsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>

      {/* 1. Placement mockup */}
      <DisplayAnalyzerMockup
        imageSrc={previewUrl ?? ""}
        detectedFormatKey={detectedFormat?.key}
        onSwitchToSuite={onSwitchToSuite}
        onDownload={
          mockupUrl
            ? () => {
                const a = document.createElement("a");
                a.href = mockupUrl;
                a.download = `cutsheet-mockup-${detectedFormat?.key ?? "display"}.png`;
                a.click();
              }
            : undefined
        }
      />

      {/* 2. Tools grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {/* AI Rewrite */}
        <button
          type="button"
          onClick={onCTARewrite}
          disabled={ctaLoading}
          className="flex flex-col items-center justify-center gap-3 py-5 rounded-2xl border cursor-pointer"
          style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.05)", opacity: ctaLoading ? 0.6 : 1, transition: "border-color 150ms" }}
          onMouseEnter={(e) => { if (!ctaLoading) e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(129,140,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {ctaLoading
              ? <div style={{ width: 16, height: 16, border: "2px solid rgba(129,140,248,0.3)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              : <Sparkles size={16} color="#818cf8" />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7" }}>AI Rewrite</span>
        </button>

        {/* Policy Check */}
        <button
          type="button"
          onClick={onCheckPolicies}
          disabled={policyLoading}
          className="flex flex-col items-center justify-center gap-3 py-5 rounded-2xl border cursor-pointer"
          style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.05)", opacity: policyLoading ? 0.5 : 1, transition: "border-color 150ms" }}
          onMouseEnter={(e) => { if (!policyLoading) e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {policyLoading
              ? <div style={{ width: 16, height: 16, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              : <ShieldCheck size={16} color="#f59e0b" />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7" }}>Policy Check</span>
        </button>

        {/* Animate to HTML5 */}
        <button
          type="button"
          onClick={onAnimate}
          className="flex flex-col items-center justify-center gap-3 py-5 rounded-2xl border cursor-pointer"
          style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.05)", transition: "border-color 150ms" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(6,182,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye size={16} color="#06b6d4" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7" }}>Animate</span>
        </button>
      </div>

      {/* 3. AI Rewrite results */}
      {ctaRewrites && ctaRewrites.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, borderRadius: 14, background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#818cf8" }}>AI Rewrites</span>
          </div>
          {ctaRewrites.map((rewrite, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 13, color: "#f4f4f5", margin: 0, lineHeight: 1.5 }}>{rewrite}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Design Review Card */}
      {result.verdict && result.improvements && (
        <DesignReviewCard
          verdictState={result.overallScore >= 8 ? "ready" : result.overallScore >= 5 ? "needs_work" : "not_ready"}
          verdictHeadline={result.verdict}
          priorityFix={result.improvements[0]?.fix}
          flags={result.improvements.map((imp) => ({
            category: imp.category,
            severity: imp.severity as "critical" | "warning" | "info" | "high" | "medium" | "low",
            issue: imp.fix,
            fix: imp.fix,
          }))}
          onFixWithAI={onCTARewrite}
        />
      )}
    </div>
  );
}
