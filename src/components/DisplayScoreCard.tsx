// DisplayScoreCard.tsx — Display ad scorecard matching PaidAdAnalyzer ScoreCard layout

import { useState } from "react";
import {
  AlertTriangle, CheckCircle, XCircle, AlertCircle, Copy, CheckCircle as CheckCircle2,
} from "lucide-react";
import { ScoreHero } from "./ScoreHero";
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

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function DisplayScoreCard({
  result,
  format,
  network,
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push(`--- CUTSHEET DISPLAY ANALYSIS ---`);
    lines.push(`Overall Score: ${result.overallScore}/10`);
    lines.push("");
    lines.push(`Visual Hierarchy: ${scores.hierarchy}/10`);
    lines.push(`CTA Visibility: ${scores.ctaVisibility}/10`);
    lines.push(`Brand Clarity: ${scores.brandClarity}/10`);
    lines.push(`Message Clarity: ${scores.messageClarity}/10`);
    lines.push(`Visual Contrast: ${scores.visualContrast}/10`);
    lines.push("");
    lines.push(`Text Ratio: ${result.textToImageRatio}`);
    lines.push(`Placement Risk: ${result.placementRisk}`);
    if (result.improvements.length > 0) {
      lines.push("");
      lines.push("IMPROVEMENTS:");
      result.improvements.forEach((imp) => lines.push(`• ${imp}`));
    }
    lines.push("");
    lines.push("Scored by Cutsheet — cutsheet.xyz");

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = lines.join("\n");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const networkLabel = network === "google" ? "Google Display Network" : network === "affiliate" ? "Affiliate / Direct" : "All Networks";
  const heroVerdict = result.overallScore >= 8 ? "Strong" : result.overallScore >= 4 ? "Average" : "Needs Work";

  return (
    <div className="flex flex-col">
      {/* Header — matching ScoreCard */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-300">Score Overview</span>
          <span className="text-[11px] text-zinc-600 mt-0.5">{networkLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {format ? (
            <span className="text-[11px] text-cyan-400 bg-cyan-500/10 rounded-full px-2.5 py-0.5">
              {format.key} · {format.name}
            </span>
          ) : (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 rounded-full px-2.5 py-0.5">
              {dimensions.width}×{dimensions.height} · Custom
            </span>
          )}
          <button
            onClick={handleCopy}
            aria-label="Copy scores to clipboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all hover:bg-white/[0.06] px-2.5 py-1.5"
            style={{ background: 'transparent', color: copied ? '#10b981' : '#71717a' }}
          >
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Main content card — matching ScoreCard */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.015]">
        {/* ScoreHero — score number + benchmark + dimension grid */}
        <ScoreHero
          score={result.overallScore}
          verdict={heroVerdict}
          benchmark={6.5}
          platform="Google Display"
          dimensions={[
            { name: "Hierarchy", score: scores.hierarchy },
            { name: "CTA",      score: scores.ctaVisibility },
            { name: "Brand",    score: scores.brandClarity },
            { name: "Message",  score: scores.messageClarity },
            { name: "Contrast", score: scores.visualContrast },
          ]}
        />
      </div>

      {/* Verdict text */}
      <p className="text-xs text-zinc-500 text-center leading-relaxed mx-6 mt-3 mb-1">{result.verdict}</p>

      {/* Display-specific sections */}
      <div className="px-4 mt-3 flex flex-col gap-3">
        {/* Text-to-image ratio */}
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{
            background: result.textRatioFlag ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
            border: `1px solid ${result.textRatioFlag ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
          }}
        >
          {result.textRatioFlag
            ? <AlertTriangle size={14} color="#f59e0b" />
            : <CheckCircle size={14} color="#10b981" />
          }
          <span className="text-xs" style={{ color: result.textRatioFlag ? "#f59e0b" : "#10b981" }}>
            {result.textToImageRatio} text {result.textRatioFlag ? "— Google recommends under 30%" : "— within policy"}
          </span>
        </div>

        {/* Placement risk */}
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{
            background: result.placementRisk === "high" ? "rgba(239,68,68,0.06)" : result.placementRisk === "medium" ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
            border: `1px solid ${result.placementRisk === "high" ? "rgba(239,68,68,0.2)" : result.placementRisk === "medium" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {result.placementRisk === "high" && <XCircle size={14} color="#ef4444" />}
            {result.placementRisk === "medium" && <AlertCircle size={14} color="#f59e0b" />}
            {result.placementRisk === "low" && <CheckCircle size={14} color="#10b981" />}
            <span className="text-xs font-medium" style={{
              color: result.placementRisk === "high" ? "#ef4444" : result.placementRisk === "medium" ? "#f59e0b" : "#10b981",
            }}>
              {result.placementRisk === "high" ? "High" : result.placementRisk === "medium" ? "Medium" : "Low"} placement risk
            </span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed m-0">{result.placementRiskNote}</p>
        </div>

        {/* Improvements */}
        {result.improvements.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Improvements</p>
            <div className="flex flex-col gap-1.5">
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-indigo-500 text-sm leading-none shrink-0 mt-0.5">•</span>
                  <span className="text-xs text-zinc-400 leading-relaxed">{imp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Format notes */}
        {result.formatNotes && (
          <div className="bg-white/[0.02] rounded-xl px-3.5 py-2.5">
            <p className="text-xs text-zinc-500 italic leading-relaxed m-0">{result.formatNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
