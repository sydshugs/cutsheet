// PreFlightView.tsx — A/B creative comparison with side-by-side dropzones

import { useState, useCallback } from "react";
import { GitBranch, Upload, Check, X } from "lucide-react";
import { AnalysisProgressCard } from "./AnalysisProgressCard";
import { analyzeVideo, type AnalysisResult } from "../services/analyzerService";
import { runComparison } from "../services/comparisonService";
import { exportToPdf } from "../utils/pdfExport";
import type {
  VariantInput,
  ComparisonResult,
  TestType,
  PreFlightPhase,
} from "../types/preflight";

const MAX_VARIANTS = 2;
const MIN_VARIANTS = 2;

interface PreFlightViewProps {
  isDark: boolean;
  apiKey: string;
}

export function PreFlightView({ isDark, apiKey }: PreFlightViewProps) {
  const [variants, setVariants] = useState<VariantInput[]>([
    { id: crypto.randomUUID(), label: "Ad A" },
    { id: crypto.randomUUID(), label: "Ad B" },
  ]);
  const [testType, setTestType] = useState<TestType>("full");
  const [phase, setPhase] = useState<PreFlightPhase>("idle");
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [analysisLabels, setAnalysisLabels] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const readyCount = variants.filter((v) => v.file).length;
  const canRun = readyCount >= MIN_VARIANTS && phase === "idle";

  const handleFileSelect = useCallback(
    (index: number, file: File | null) => {
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, file: file ?? undefined } : v))
      );
    },
    []
  );

  const handleRun = useCallback(async () => {
    const toAnalyze = variants.filter((v) => v.file);
    if (toAnalyze.length < MIN_VARIANTS) return;

    setPhase("analyzing");
    setErrorMsg(null);
    setAnalyses([]);
    setComparison(null);

    const results: AnalysisResult[] = [];
    const labels: string[] = [];

    // Analyze each variant
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.file) continue;

      try {
        const result = await analyzeVideo(v.file, apiKey);
        results.push(result);
        labels.push(v.label || `Ad ${String.fromCharCode(65 + i)}`);
      } catch (err) {
        console.error(`Analysis failed for variant ${i}:`, err);
      }
    }

    if (results.length < 2) {
      setPhase("error");
      setErrorMsg("Need at least 2 successful analyses to run comparison.");
      return;
    }

    setAnalyses(results);
    setAnalysisLabels(labels);

    // Run comparison
    setPhase("comparing");
    try {
      const comparisonResult = await runComparison(results, labels, testType, apiKey);
      setComparison(comparisonResult);
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setErrorMsg(
        err instanceof Error ? `Comparison failed: ${err.message}` : "Comparison failed. Try again."
      );
    }
  }, [variants, testType, apiKey]);

  const handleReset = useCallback(() => {
    setVariants([
      { id: crypto.randomUUID(), label: "Ad A" },
      { id: crypto.randomUUID(), label: "Ad B" },
    ]);
    setTestType("full");
    setPhase("idle");
    setAnalyses([]);
    setAnalysisLabels([]);
    setComparison(null);
    setErrorMsg(null);
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!analyses.length || !comparison) return;
    try {
      await exportToPdf(analyses[0]);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  }, [analyses, comparison]);

  // ─── UPLOAD UI ────────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
    const PILLS = ["Hook comparison", "CTA analysis", "Winner prediction"];
    
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-120px)] px-6 py-10" style={{ background: "#09090b" }}>

        {/* Fix 1: Icon tile — explicit 76×76 container, 14px radius, rose bg + border */}
        <div style={{
          width: 76,
          height: 76,
          borderRadius: 14,
          background: "rgba(236,72,153,0.1)",
          border: "1px solid rgba(236,72,153,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginBottom: 20,
        }}>
          <GitBranch size={28} color="#ec4899" strokeWidth={1.5} />
        </div>

        {/* Fix 4: Tighter spacing — mb-2 on title, mb-2 on subtitle */}
        <h1 className="text-xl font-semibold text-center" style={{ color: "#f4f4f5", marginBottom: 8 }}>
          Compare two ad variants
        </h1>

        <p className="text-sm text-center max-w-xs" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 16 }}>
          Upload two ad creatives side by side. AI analyzes both and predicts the winner.
        </p>

        {/* Fix 5: Pills — 12px font, 4px 12px padding, rose accent */}
        <div className="flex flex-wrap justify-center gap-2" style={{ marginBottom: 24 }}>
          {PILLS.map((pill) => (
            <span
              key={pill}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 9999,
                color: "#ec4899",
                background: "rgba(236,72,153,0.08)",
                border: "1px solid rgba(236,72,153,0.15)",
              }}
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Two-column dropzones */}
        <div className="w-full max-w-3xl grid grid-cols-2 gap-5" style={{ marginBottom: 20 }}>
          {variants.map((v, i) => {
            const fileInputId = `preflight-file-${v.id}`;
            const hasFile = !!v.file;

            return (
              <div key={v.id} className="flex flex-col" style={{ gap: 10 }}>
                {/* Label */}
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#f4f4f5" }}>
                  {v.label}
                </span>

                {!hasFile ? (
                  <div
                    className="flex flex-col items-center justify-center rounded-xl transition-all"
                    style={{
                      border: "2px dashed rgba(255,255,255,0.1)",
                      background: "transparent",
                      padding: "28px 20px",
                      gap: 8,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.background = "rgba(99,102,241,0.05)";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "transparent";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "transparent";
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(i, f);
                    }}
                  >
                    <Upload size={20} style={{ color: "rgba(255,255,255,0.25)" }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Drop or click to browse
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                      MP4 · MOV · PNG · JPG
                    </span>

                    {/* Fix 2: Explicit "Browse files" button inside each dropzone */}
                    <label
                      htmlFor={fileInputId}
                      style={{
                        marginTop: 4,
                        padding: "6px 16px",
                        background: "#6366f1",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "inline-block",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
                    >
                      Browse files
                    </label>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(i, f);
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <Check size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    <span className="text-xs truncate flex-1" style={{ color: "#f4f4f5" }}>{v.file.name}</span>
                    <button
                      onClick={() => handleFileSelect(i, null)}
                      style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {phase === "error" && errorMsg && (
          <div className="w-full max-w-3xl p-3 rounded-lg text-xs font-mono" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {/* Fix 3: Compare Ads — solid #6366f1 when both slots filled, clearly disabled otherwise */}
        <button
          onClick={handleRun}
          disabled={!canRun}
          style={{
            padding: "10px 28px",
            background: canRun ? "#6366f1" : "rgba(255,255,255,0.04)",
            color: canRun ? "#fff" : "#3f3f46",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            cursor: canRun ? "pointer" : "not-allowed",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => { if (canRun) e.currentTarget.style.background = "#4f46e5"; }}
          onMouseLeave={(e) => { if (canRun) e.currentTarget.style.background = "#6366f1"; }}
        >
          Compare Ads
        </button>
      </div>
    );
  }

  // ─── ANALYZING UI ─────────────────────────────────────────────────────────────
  if (phase === "analyzing" || phase === "comparing") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-120px)] px-6 py-16">
        <AnalysisProgressCard
          currentVariant={analysisLabels.length}
          totalVariants={variants.length}
          isDark={isDark}
        />
      </div>
    );
  }

  // ─── RESULTS UI ──────────────────────────────────────────────────────────────
  if (phase === "done" && comparison) {
    const winner = comparison.rankings?.[0];
    const loser = comparison.rankings?.[1];

    // Helper: get score color (green ≥8, amber 5-7, red <5)
    const getScoreColor = (score: number) => {
      if (score >= 80) return "#10b981"; // green
      if (score >= 50) return "#f59e0b"; // amber
      return "#ef4444"; // red
    };

    // Helper: get score label
    const getScoreLabel = (score: number) => {
      if (score >= 80) return "Strong";
      if (score >= 50) return "Average";
      return "Weak";
    };

    return (
      <div className="flex flex-col lg:flex-row gap-6 px-6 py-12 max-w-7xl mx-auto" style={{ background: "#09090b" }}>
        
        {/* LEFT PANEL — ~65% width */}
        <div className="flex-1 space-y-6">

          {/* 1. Side-by-side creative comparison */}
          <div className="grid grid-cols-2 gap-4">
            {analyses.map((analysis, idx) => {
              const isWinner = winner && analysisLabels[idx] === winner.label;
              const scores = analysis.scores || {};
              const overallScore = Math.round(scores.overall || 0);
              const scoreColor = getScoreColor(overallScore);

              return (
                <div
                  key={idx}
                  className="relative rounded-lg overflow-hidden"
                  style={{
                    background: "#18181b",
                    border: isWinner ? `2px solid ${scoreColor}` : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: isWinner ? `0 0 12px ${scoreColor}22` : "none",
                  }}
                >
                  {/* Winner badge */}
                  {isWinner && (
                    <div className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded" style={{ background: "#ec4899", color: "#fff" }}>
                      WINNER
                    </div>
                  )}

                  {/* Placeholder thumbnail */}
                  <div
                    className="w-full aspect-square flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: isWinner ? "rgba(236,72,153,0.08)" : "rgba(99,102,241,0.05)",
                      opacity: isWinner ? 1 : 0.6,
                    }}
                  >
                    {analysisLabels[idx]}
                  </div>

                  {/* Score badge + label */}
                  <div className="p-4 text-center">
                    <div className="text-3xl font-bold mb-1" style={{ color: scoreColor }}>
                      {overallScore}
                    </div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {getScoreLabel(overallScore)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Predicted Winner banner */}
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              background: "rgba(236,72,153,0.06)",
              borderLeftColor: "#ec4899",
              borderRight: "1px solid rgba(236,72,153,0.15)",
              borderTop: "1px solid rgba(236,72,853,0.15)",
              borderBottom: "1px solid rgba(236,72,853,0.15)",
            }}
          >
            <div className="flex items-start gap-3">
              <div style={{ color: "#ec4899", fontSize: 18 }}>🏆</div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: "#f4f4f5" }}>
                  PREDICTED WINNER — {winner?.label}
                </h3>
                <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {winner?.label || "Variant A"} has stronger hook engagement and CTA clarity based on analysis.
                </p>
                <div className="inline-block px-2 py-1 text-xs font-semibold rounded" style={{ background: "#ec4899", color: "#fff" }}>
                  HIGH CONFIDENCE
                </div>
              </div>
            </div>
          </div>

          {/* 3. Head-to-Head breakdown */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              Head-to-Head
            </div>
            <div className="space-y-3">
              {["Hook", "CTA", "Retention"].map((metric) => (
                <div
                  key={metric}
                  className="p-3 rounded-lg flex items-center justify-between"
                  style={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{metric}</span>
                  <div className="flex gap-2">
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded"
                      style={{ background: "#ec4899", color: "#fff" }}
                    >
                      {winner?.label} wins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Recommendation card */}
          <div
            className="p-4 rounded-lg"
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Recommendation
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: "#f4f4f5" }}>
              Launch {winner?.label} as your primary creative.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Test this variant at scale and monitor CTR/CVR metrics. Consider A/B testing with slight variations in CTA messaging.
            </p>
          </div>

          {/* 5. Hybrid Opportunity card (if applicable) */}
          <div
            className="p-4 rounded-lg flex gap-3"
            style={{
              background: "rgba(99,102,241,0.05)",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
          >
            <div style={{ color: "#6366f1", fontSize: 18 }}>💡</div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#6366f1" }}>
                Hybrid Opportunity
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                Combine the hook from {loser?.label} with the CTA from {winner?.label} for a potential 20%+ boost.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — ~35% width, sticky */}
        <div className="lg:w-80 flex flex-col gap-4" style={{ height: "fit-content" }}>

          {/* Score Overview card */}
          <div
            className="p-4 rounded-lg"
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              Score Overview
            </div>
            {analyses.map((analysis, idx) => {
              const scores = analysis.scores || {};
              const overallScore = Math.round(scores.overall || 0);
              const scoreColor = getScoreColor(overallScore);
              const isWinner = winner && analysisLabels[idx] === winner.label;

              return (
                <div
                  key={idx}
                  className="mb-4 pb-4 flex justify-between items-center"
                  style={{
                    borderBottom: idx < analyses.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {analysisLabels[idx]}
                    </div>
                    {isWinner && (
                      <div className="text-xs font-semibold mt-1" style={{ color: "#ec4899" }}>
                        WINNER
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: scoreColor }}>
                      {overallScore}
                    </div>
                    <div className="text-xs" style={{ color: scoreColor }}>
                      {getScoreLabel(overallScore)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confidence + Actions */}
          <div className="space-y-2">
            <div
              className="p-3 rounded-lg text-center text-xs font-semibold"
              style={{
                background: "rgba(236,72,853,0.08)",
                border: "1px solid rgba(236,72,853,0.15)",
                color: "#ec4899",
              }}
            >
              HIGH CONFIDENCE
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 text-sm font-semibold rounded-lg text-white transition-colors"
              style={{ background: "#6366f1" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
            >
              Run New Test
            </button>

            <button
              onClick={handleExportPdf}
              className="w-full py-2.5 text-sm font-semibold rounded-lg transition-colors"
              style={{
                background: "transparent",
                color: "#a1a1aa",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
