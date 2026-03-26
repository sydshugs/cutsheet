// PreFlightView.tsx — A/B creative comparison (redesigned with indigo accent, side-by-side dropzones)

import { useState, useCallback, useMemo } from "react";
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

// Design system: indigo for interactive, neutrals for structure
const INDIGO_PRIMARY = "#6366f1";
const INDIGO_BG = "rgba(99,102,241,0.1)";
const INDIGO_BORDER = "rgba(99,102,241,0.2)";
const NEUTRAL_PILLS = "rgba(255,255,255,0.05)";
const NEUTRAL_PILLS_BORDER = "rgba(255,255,255,0.08)";

interface PreFlightViewProps {
  isDark: boolean;
  apiKey: string;
}

const MAX_VARIANTS = 2; // A/B only
const MIN_VARIANTS = 2;

function createVariant(index: number): VariantInput {
  return {
    id: crypto.randomUUID(),
    label: `Variant ${String.fromCharCode(65 + index)}`,
  };
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
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [variantStatuses, setVariantStatuses] = useState<(null | "analyzing" | "done" | "error")[]>([null, null]);

  const bg = "var(--surface)";
  const surface = "var(--surface-el)";
  const border = "var(--border)";
  const textPrimary = "var(--ink)";
  const textSecondary = "var(--ink-muted)";
  const textMuted = "var(--ink-faint)";
  const surfaceDim = "var(--surface-dim)";

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
    const toAnalyze = variants.filter((v) => v.file);
    if (toAnalyze.length < MIN_VARIANTS) return;

    setPhase("analyzing");
    setErrorMsg(null);
    setAnalyses([]);
    setComparison(null);
    setAnalysisProgress(0);

    const statuses = variants.map(() => null as null | "analyzing" | "done" | "error");
    setVariantStatuses([...statuses]);

    const results: AnalysisResult[] = [];
    const labels: string[] = [];
    const succeededIndices: number[] = [];

    // Stage 1: Analyze each variant sequentially
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.file) {
        statuses[i] = "error";
        setVariantStatuses([...statuses]);
        continue;
      }

      statuses[i] = "analyzing";
      setVariantStatuses([...statuses]);
      setAnalysisProgress(i + 1);

      try {
        const result = await analyzeVideo(v.file, apiKey);
        results.push(result);
        labels.push(v.label || `Variant ${String.fromCharCode(65 + i)}`);
        succeededIndices.push(i);
        statuses[i] = "done";
      } catch (err) {
        statuses[i] = "error";
        console.error(`Pre-Flight: Variant ${i} analysis failed:`, err);
      }
      setVariantStatuses([...statuses]);
    }

    if (results.length < 2) {
      setPhase("error");
      setErrorMsg("Need at least 2 successful analyses to run comparison. Some variants failed.");
      return;
    }

    setAnalyses(results);
    setAnalysisLabels(labels);

    // Stage 2: Run comparison
    setPhase("comparing");
    try {
      const comparisonResult = await runComparison(results, labels, testType, apiKey);
      setComparison(comparisonResult);
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setErrorMsg(
        err instanceof Error
          ? `Comparison failed: ${err.message}`
          : "Comparison failed. Try again."
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
    setAnalysisProgress(0);
    setErrorMsg(null);
    setVariantStatuses([null, null]);
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!analyses.length || !comparison) return;
    // Find the winner's label and map it to the correct analysis index
    const winnerLabel = comparison.winner?.label
      ?? comparison.rankings.find((r) => r.rank === 1)?.label;
    const winnerIndex = winnerLabel ? analysisLabels.indexOf(winnerLabel) : -1;
    const winnerAnalysis = analyses[winnerIndex >= 0 ? winnerIndex : 0];
    if (winnerAnalysis) {
      try {
        await exportToPdf(winnerAnalysis);
      } catch (err) {
        console.error("PDF export failed:", err);
      }
    }
  }, [analyses, analysisLabels, comparison]);

  const isRunning = phase === "analyzing" || phase === "comparing";

  // ─── UPLOAD UI ────────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
    const PILLS = ["Hook comparison", "CTA analysis", "Winner prediction"];
    
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-120px)] px-6 py-8">
        {/* Header icon */}
        <div className="w-19 h-19 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
          <FlaskConical size={28} color={INDIGO_PRIMARY} />
        </div>

        {/* Title & subtitle */}
        <h1 className="text-xl font-semibold text-[#f4f4f5] mt-5 mb-0">
          Compare two ad variants
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.5)] text-center max-w-80 mt-2.5 leading-relaxed">
          Upload two ad creatives side by side. AI analyzes both and predicts the winner.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="text-xs text-[#a1a1aa] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Two-column dropzone layout */}
        <div className="w-full max-w-2xl mt-8 grid grid-cols-2 gap-4">
          {variants.map((v, i) => {
            const fileInputId = `preflight-file-${v.id}`;
            const hasFile = !!v.file;
            return (
              <div
                key={v.id}
                className="flex flex-col"
              >
                {/* Label */}
                <label className="text-xs font-semibold text-[#f4f4f5] mb-2 uppercase tracking-wide">
                  {v.label}
                </label>

                {/* Dropzone */}
                {!hasFile ? (
                  <label
                    htmlFor={fileInputId}
                    className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl cursor-pointer transition-all hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.05)] group"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = INDIGO_BORDER;
                      e.currentTarget.style.background = INDIGO_BG;
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
                    <Upload size={20} className="text-[#71717a] mb-2 group-hover:text-[#6366f1] transition-colors" />
                    <span className="text-xs text-[#71717a] text-center group-hover:text-[#6366f1] transition-colors">
                      Drop or click to browse
                    </span>
                    <span className="text-[10px] text-[#52525b] mt-1">MP4 · MOV · PNG · JPG</span>
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
                  <div className="relative flex items-center gap-2 p-3 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-xl">
                    <Check size={14} className="text-[#10b981] flex-shrink-0" />
                    <span className="text-xs font-mono text-[#f4f4f5] truncate flex-1 min-w-0">
                      {v.file!.name}
                    </span>
                    <button
                      onClick={() => handleFileSelect(i, null)}
                      className="text-[#71717a] hover:text-[#ef4444] transition-colors flex-shrink-0"
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
          <div className="w-full max-w-2xl mt-4 p-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg text-xs font-mono text-[#ef4444]">
            {errorMsg}
          </div>
        )}

        {/* Compare button */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="px-6 py-2.5 bg-[#6366f1] text-white text-sm font-semibold rounded-full disabled:bg-[rgba(255,255,255,0.04)] disabled:text-[#52525b] disabled:cursor-not-allowed hover:enabled:bg-[#4f46e5] transition-colors"
          >
            Compare Ads
          </button>
          {canRun && (
            <span className="text-xs font-mono text-[#71717a]">2/2 ready</span>
          )}
        </div>
      </div>
    );
  }

  // ─── LOADING UI ──────────────────────────────────────────────────────────────
  // Get files with actual uploads for the progress card
  const filesWithUploads = useMemo(() => 
    variants.filter((v) => v.file).map((v) => v.file as File),
    [variants]
  );
  
  if (isRunning) {
    const currentAnalyzingIndex = variantStatuses.findIndex((s) => s === "analyzing");
    
    return (
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "48px 24px",
          fontFamily: "var(--sans)",
        }}
      >
        <AnalysisProgressCard
          pageType="ab-test"
          files={filesWithUploads}
          statusMessage={
            phase === "analyzing"
              ? `Analyzing variant ${analysisProgress} of ${filesWithUploads.length}`
              : "Running head-to-head comparison..."
          }
          currentIndex={currentAnalyzingIndex >= 0 ? currentAnalyzingIndex : analysisProgress - 1}
          totalCount={filesWithUploads.length}
          onCancel={handleReset}
        />
      </div>
    );
  }

  // ─── RESULTS UI ──────────────────────────────────────────────────────────────
  if (phase === "done" && comparison) {
    const winner = comparison.rankings?.[0];
    const loser = comparison.rankings?.[1];

    return (
      <div className="max-w-4xl mx-auto px-6 py-10 font-sans">
        {/* Results header */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.5)] mb-1">
            A/B Test Results
          </div>
          <h1 className="text-3xl font-bold text-[#f4f4f5]">
            {winner?.label} wins
          </h1>
        </div>

        {/* Two-column score panels */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {analyses.map((analysis, idx) => {
            const isWinner = winner && analysisLabels[idx] === winner.label;
            const scores = analysis.scores || {};
            
            return (
              <div
                key={idx}
                className={`relative p-6 rounded-xl border transition-all ${
                  isWinner
                    ? "border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.05)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"
                }`}
              >
                {/* Winner badge */}
                {isWinner && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-[#6366f1] text-white text-xs font-semibold rounded-full">
                    🏆 Winner
                  </div>
                )}

                {/* Ad label */}
                <h2 className="text-sm font-semibold text-[#f4f4f5] mb-4">
                  {analysisLabels[idx]}
                </h2>

                {/* Score grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <span className="text-xs text-[rgba(255,255,255,0.6)]">Hook</span>
                    <span className="text-sm font-semibold text-[#f4f4f5]">
                      {Math.round(scores.hook || 0)}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <span className="text-xs text-[rgba(255,255,255,0.6)]">Clarity</span>
                    <span className="text-sm font-semibold text-[#f4f4f5]">
                      {Math.round(scores.clarity || 0)}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <span className="text-xs text-[rgba(255,255,255,0.6)]">CTA</span>
                    <span className="text-sm font-semibold text-[#f4f4f5]">
                      {Math.round(scores.cta || 0)}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
                    <span className="text-xs text-[rgba(255,255,255,0.6)]">Production</span>
                    <span className="text-sm font-semibold text-[#f4f4f5]">
                      {Math.round(scores.production || 0)}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#6366f1] rounded-lg">
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

        {/* Loser improvements */}
        {loser && loser.improvements && loser.improvements.length > 0 && (
          <div className="p-6 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl mb-8">
            <h3 className="text-sm font-semibold text-[#f4f4f5] mb-3">
              Improve {loser.label}
            </h3>
            <ul className="space-y-2">
              {loser.improvements.slice(0, 3).map((improvement, idx) => (
                <li key={idx} className="text-xs text-[rgba(255,255,255,0.6)] flex gap-2">
                  <span className="text-[#6366f1] font-bold">→</span>
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
            className="flex-1 px-4 py-2.5 bg-[#6366f1] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors"
          >
            Test Another
          </button>
          <button
            onClick={handleExportPdf}
            className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.05)] text-[#a1a1aa] text-sm font-semibold rounded-lg border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>
    );
  }

  return null;
}
