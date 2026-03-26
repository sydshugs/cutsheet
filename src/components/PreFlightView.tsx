// PreFlightView.tsx — A/B creative comparison with side-by-side dropzones

import { useState, useCallback } from "react";
import { FlaskConical, Upload, Check, X } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-120px)] px-6 py-16">
        {/* Icon */}
        <div className="w-16 h-16 rounded-lg bg-indigo-950 border border-indigo-900 flex items-center justify-center mb-6">
          <FlaskConical size={32} className="text-indigo-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-white mb-2 text-center">
          Compare two ad variants
        </h1>
        
        {/* Subtitle */}
        <p className="text-sm text-gray-400 text-center max-w-md mb-6">
          Upload two ad creatives side by side. AI analyzes both and predicts the winner.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="text-xs text-gray-400 px-3 py-1 rounded-full border border-gray-700 bg-transparent"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Two-column dropzones */}
        <div className="w-full max-w-3xl grid grid-cols-2 gap-6 mb-8">
          {variants.map((v, i) => {
            const fileInputId = `preflight-file-${v.id}`;
            const hasFile = !!v.file;
            
            return (
              <div key={v.id} className="flex flex-col">
                {/* Label */}
                <label className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                  {v.label}
                </label>

                {/* Dropzone */}
                {!hasFile ? (
                  <label
                    htmlFor={fileInputId}
                    className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-950 hover:bg-opacity-20"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("border-indigo-500", "bg-indigo-950", "bg-opacity-20");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-950", "bg-opacity-20");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-950", "bg-opacity-20");
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(i, f);
                    }}
                  >
                    <Upload size={24} className="text-gray-500 mb-2" />
                    <span className="text-sm text-gray-400">Drop or click to browse</span>
                    <span className="text-xs text-gray-600 mt-1">MP4 · MOV · PNG · JPG</span>
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
                  <div className="flex items-center gap-2 p-3 bg-green-950 bg-opacity-30 border border-green-900 rounded-lg">
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                    <span className="text-xs text-white truncate flex-1">{v.file.name}</span>
                    <button
                      onClick={() => handleFileSelect(i, null)}
                      className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
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
          <div className="w-full max-w-3xl mb-6 p-3 bg-red-950 bg-opacity-30 border border-red-900 rounded-lg text-xs text-red-400 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Compare button */}
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed hover:enabled:bg-indigo-700 transition-colors"
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Results header */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
            A/B Test Results
          </div>
          <h1 className="text-3xl font-bold text-white">
            {winner?.label} wins
          </h1>
        </div>

        {/* Score panels grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {analyses.map((analysis, idx) => {
            const isWinner = winner && analysisLabels[idx] === winner.label;
            const scores = analysis.scores || {};
            
            return (
              <div
                key={idx}
                className={`relative p-6 rounded-lg border ${
                  isWinner
                    ? "border-indigo-700 bg-indigo-950 bg-opacity-30"
                    : "border-gray-800 bg-gray-900 bg-opacity-30"
                }`}
              >
                {/* Winner badge */}
                {isWinner && (
                  <div className="absolute -top-3 -right-3 px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                    🏆 Winner
                  </div>
                )}

                {/* Ad label */}
                <h2 className="text-sm font-semibold text-white mb-4">
                  {analysisLabels[idx]}
                </h2>

                {/* Scores */}
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-800 bg-opacity-50 rounded">
                    <span className="text-xs text-gray-400">Hook</span>
                    <span className="text-sm font-semibold text-white">
                      {Math.round(scores.hook || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 bg-opacity-50 rounded">
                    <span className="text-xs text-gray-400">Clarity</span>
                    <span className="text-sm font-semibold text-white">
                      {Math.round(scores.clarity || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 bg-opacity-50 rounded">
                    <span className="text-xs text-gray-400">CTA</span>
                    <span className="text-sm font-semibold text-white">
                      {Math.round(scores.cta || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 bg-opacity-50 rounded">
                    <span className="text-xs text-gray-400">Production</span>
                    <span className="text-sm font-semibold text-white">
                      {Math.round(scores.production || 0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-indigo-600 rounded">
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

        {/* Improvements */}
        {loser && loser.improvements && loser.improvements.length > 0 && (
          <div className="p-6 bg-gray-900 bg-opacity-50 border border-gray-800 rounded-lg mb-8">
            <h3 className="text-sm font-semibold text-white mb-3">
              Improve {loser.label}
            </h3>
            <ul className="space-y-2">
              {loser.improvements.slice(0, 3).map((improvement, idx) => (
                <li key={idx} className="text-xs text-gray-400 flex gap-2">
                  <span className="text-indigo-400 font-bold">→</span>
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
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Test Another
          </button>
          <button
            onClick={handleExportPdf}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 text-sm font-semibold rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>
    );
  }

  return null;
}
