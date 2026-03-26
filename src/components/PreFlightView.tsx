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
      <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-120px)] px-6 py-16" style={{ background: "#09090b" }}>
        {/* Icon tile — 76×76px, rose accent */}
        <div className="w-19 h-19 rounded-lg flex items-center justify-center mb-6" style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)" }}>
          <GitBranch size={28} color="#ec4899" strokeWidth={1.5} />
        </div>

        {/* Title — fontSize 20, fontWeight 600 */}
        <h1 className="text-xl font-semibold text-center mb-3" style={{ color: "#f4f4f5" }}>
          Compare two ad variants
        </h1>
        
        {/* Subtitle — maxWidth 320, centered, secondary text */}
        <p className="text-sm text-center max-w-80 mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Upload two ad creatives side by side. AI analyzes both and predicts the winner.
        </p>

        {/* Feature pills — NEUTRAL style only */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="px-3 py-1 rounded-full"
              style={{
                fontSize: "12px",
                color: "#a1a1aa",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Two-column dropzones — "Ad A" and "Ad B" */}
        <div className="w-full max-w-3xl grid grid-cols-2 gap-6 mb-8">
          {variants.map((v, i) => {
            const fileInputId = `preflight-file-${v.id}`;
            const hasFile = !!v.file;
            
            return (
              <div key={v.id} className="flex flex-col">
                {/* Label */}
                <label className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#f4f4f5" }}>
                  {v.label}
                </label>

                {/* Dropzone — dashed border, rounded-xl */}
                {!hasFile ? (
                  <label
                    htmlFor={fileInputId}
                    className="relative flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: "2px dashed rgba(255,255,255,0.1)",
                      background: "transparent",
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
                    <Upload size={24} style={{ color: "rgba(255,255,255,0.3)", marginBottom: "8px" }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Drop or click to browse</span>
                    <span className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>MP4 · MOV · PNG · JPG</span>
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
                  </label>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <Check size={14} color="#10b981" className="flex-shrink-0" />
                    <span className="text-xs truncate flex-1" style={{ color: "#f4f4f5" }}>{v.file.name}</span>
                    <button
                      onClick={() => handleFileSelect(i, null)}
                      className="hover:text-red-400 transition-colors flex-shrink-0"
                      style={{ color: "rgba(255,255,255,0.5)" }}
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
          <div className="w-full max-w-3xl mb-6 p-3 rounded-lg text-xs font-mono" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {errorMsg}
          </div>
        )}

        {/* Compare button — indigo fill, disabled state */}
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors"
          style={{
            background: canRun ? "#6366f1" : "rgba(255,255,255,0.04)",
            color: canRun ? "#fff" : "#52525b",
            cursor: canRun ? "pointer" : "not-allowed",
          }}
          onMouseEnter={(e) => {
            if (canRun) e.currentTarget.style.background = "#4f46e5";
          }}
          onMouseLeave={(e) => {
            if (canRun) e.currentTarget.style.background = "#6366f1";
          }}
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

    return (
      <div className="max-w-4xl mx-auto px-6 py-12" style={{ background: "#09090b" }}>
        {/* Results header */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            A/B Test Results
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#f4f4f5" }}>
            {winner?.label} wins
          </h1>
        </div>

        {/* Score panels grid — two columns, winner has indigo accent */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {analyses.map((analysis, idx) => {
            const isWinner = winner && analysisLabels[idx] === winner.label;
            const scores = analysis.scores || {};
            
            return (
              <div
                key={idx}
                className="relative p-6 rounded-lg"
                style={{
                  border: isWinner ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  background: isWinner ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)",
                }}
              >
                {/* Winner badge */}
                {isWinner && (
                  <div className="absolute -top-3 -right-3 px-2 py-1 text-xs font-semibold rounded-full text-white" style={{ background: "#6366f1" }}>
                    🏆 Winner
                  </div>
                )}

                {/* Ad label */}
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#f4f4f5" }}>
                  {analysisLabels[idx]}
                </h2>

                {/* Scores grid */}
                <div className="space-y-2">
                  <div className="flex justify-between p-3 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Hook</span>
                    <span className="text-sm font-semibold" style={{ color: "#f4f4f5" }}>
                      {Math.round(scores.hook || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Clarity</span>
                    <span className="text-sm font-semibold" style={{ color: "#f4f4f5" }}>
                      {Math.round(scores.clarity || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>CTA</span>
                    <span className="text-sm font-semibold" style={{ color: "#f4f4f5" }}>
                      {Math.round(scores.cta || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Production</span>
                    <span className="text-sm font-semibold" style={{ color: "#f4f4f5" }}>
                      {Math.round(scores.production || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded" style={{ background: "#6366f1" }}>
                    <span className="text-xs font-semibold text-white">Overall</span>
                    <span className="text-lg font-bold text-white">
                      {Math.round(scores.overall || 0)}/100
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Improvements section */}
        {loser && loser.improvements && loser.improvements.length > 0 && (
          <div className="p-6 rounded-lg mb-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#f4f4f5" }}>
              Improve {loser.label}
            </h3>
            <ul className="space-y-2">
              {loser.improvements.slice(0, 3).map((improvement, idx) => (
                <li key={idx} className="text-xs flex gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: "#6366f1", fontWeight: "bold" }}>→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors text-white"
            style={{ background: "#6366f1" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; }}
          >
            Test Another
          </button>
          <button
            onClick={handleExportPdf}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            Export PDF
          </button>
        </div>
      </div>
    );
  }

  return null;
}
