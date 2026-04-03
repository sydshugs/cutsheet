// PreFlightView.tsx — Main Pre-Flight A/B creative testing view

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Plus, X, CloudUpload, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useSwipeFile } from "../hooks/useSwipeFile";
import { PreFlightLoadingView } from "./PreFlightLoadingView";
import { PreFlightResultsView } from "./PreFlightResultsView";
import { analyzeVideo, type AnalysisResult } from "../services/analyzerService";
import { runComparison } from "../services/comparisonService";
import { exportToPdf } from "../utils/pdfExport";
import type {
  VariantInput,
  ComparisonResult,
  TestType,
  PreFlightPhase,
} from "../types/preflight";

interface PreFlightViewProps {
  apiKey: string;
}

const TEST_TYPE_OPTIONS: { value: TestType; label: string }[] = [
  { value: "hook", label: "Hook Battle" },
  { value: "cta", label: "CTA Showdown" },
  { value: "full", label: "Full Creative" },
];

const MAX_VARIANTS = 5;
const MIN_VARIANTS = 2;

function createVariant(index: number): VariantInput {
  return {
    id: crypto.randomUUID(),
    label: `Variant ${String.fromCharCode(65 + index)}`,
  };
}

export function PreFlightView({ apiKey }: PreFlightViewProps) {
  const navigate = useNavigate();
  const { addItem: addSwipeItem } = useSwipeFile();
  const [variants, setVariants] = useState<VariantInput[]>([
    createVariant(0),
    createVariant(1),
  ]);
  const [dragHoverIdx, setDragHoverIdx] = useState<number | null>(null);
  const [testType, setTestType] = useState<TestType>("full");
  const [phase, setPhase] = useState<PreFlightPhase>("idle");
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [analysisLabels, setAnalysisLabels] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Track per-variant status: null = pending, "analyzing" = in progress, "done" = complete, "error" = failed
  const [variantStatuses, setVariantStatuses] = useState<(null | "analyzing" | "done" | "error")[]>([]);

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

  const handleLabelChange = useCallback(
    (index: number, label: string) => {
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, label } : v))
      );
    },
    []
  );

  const addVariant = useCallback(() => {
    setVariants((prev) => {
      if (prev.length >= MAX_VARIANTS) return prev;
      return [...prev, createVariant(prev.length)];
    });
  }, []);

  const removeVariant = useCallback((index: number) => {
    setVariants((prev) => {
      if (prev.length <= MIN_VARIANTS) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleRun = useCallback(async () => {
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
    setVariants([createVariant(0), createVariant(1)]);
    setTestType("full");
    setPhase("idle");
    setAnalyses([]);
    setAnalysisLabels([]);
    setComparison(null);
    setAnalysisProgress(0);
    setErrorMsg(null);
    setVariantStatuses([]);
  }, []);

  const handleSaveWinnerToLibrary = useCallback(() => {
    if (!comparison) return;
    const winnerLabel = comparison.winner.label;
    const idx = analysisLabels.indexOf(winnerLabel);
    const ar = idx >= 0 ? analyses[idx] : null;
    if (!ar) return;
    addSwipeItem({
      fileName: ar.fileName,
      timestamp: ar.timestamp.toISOString(),
      scores: ar.scores,
      markdown: ar.markdown,
      brand: "",
      format: "",
      niche: "",
      platform: "",
      tags: ["ab-winner"],
      notes: `A/B winner (${comparison.rankings.length} variants).`,
    });
    navigate("/app/swipe-file");
  }, [comparison, analysisLabels, analyses, addSwipeItem, navigate]);

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

  // Must be declared before any early returns — Rules of Hooks
  const filesWithUploads = useMemo(() =>
    variants.filter((v) => v.file).map((v) => v.file as File),
    [variants]
  );

  // Object URLs for variant thumbnails — must be before early returns (Rules of Hooks)
  const variantThumbnailUrls = useMemo(() =>
    variants.map((v) => v.file ? URL.createObjectURL(v.file) : null),
    [variants]
  );
  useEffect(() => {
    return () => {
      variantThumbnailUrls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
    };
  }, [variantThumbnailUrls]);

  // ─── UPLOAD UI — Figma /app/a-b-test (263-720) ─────────────────────────────────
  if (phase === "idle" || phase === "error") {
    const PILLS = ["Hook comparison", "CTA analysis", "Winner prediction"];

    return (
      <div className="relative flex min-h-[calc(100vh-120px)] flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "var(--ab-ambient-gradient)" }}
          aria-hidden
        />

        <div className="relative z-[1] flex w-full max-w-[640px] flex-col items-center">
          <div
            className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[14px] border"
            style={{
              background: "var(--ab-tile-bg)",
              borderColor: "var(--ab-tile-border)",
            }}
          >
            <GitBranch className="h-7 w-7 text-[color:var(--ab-icon)]" strokeWidth={2} aria-hidden />
          </div>

          <h1 className="mt-5 text-center text-[clamp(1.5rem,4vw,2.375rem)] font-semibold leading-tight tracking-tight text-[color:var(--ink)]">
            Run an A/B Test
          </h1>
          <p className="mt-2.5 max-w-md text-center text-sm leading-relaxed text-[color:var(--ink-faint)]">
            Upload two variants. Our AI extracts visual features, pacing, and hooks to predict the undisputed winner.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--ab-pill-bg)",
                  borderColor: "var(--ab-pill-border)",
                  color: "var(--ab-pill-text)",
                }}
              >
                {pill}
              </span>
            ))}
          </div>

          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            {variants.map((v, i) => {
              const fileInputId = `preflight-file-${v.id}`;
              const hasFile = !!v.file;
              const isDrag = dragHoverIdx === i;
              return (
                <div key={v.id} className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center justify-center gap-1 px-0.5">
                    <input
                      type="text"
                      value={v.label}
                      maxLength={40}
                      onChange={(e) => handleLabelChange(i, e.target.value)}
                      className="min-w-0 flex-1 bg-transparent px-1 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ab-variant-label)] outline-none transition-opacity focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                      aria-label={`Variant label ${i + 1}`}
                    />
                    {variants.length > MIN_VARIANTS && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border border-[color:var(--border)] bg-transparent text-[color:var(--ab-variant-label)] transition-[color,border-color] duration-150 hover:border-[color:rgba(239,68,68,0.3)] hover:text-[color:var(--error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.98]"
                        aria-label={`Remove ${v.label}`}
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-[15px] border p-5 transition-[border-color,background-color] duration-150",
                      !hasFile && !isDrag && "bg-[color:var(--ab-dropzone-bg)]",
                      !hasFile && isDrag && "bg-[color:var(--ab-drag-hover-bg)]",
                      hasFile && "bg-[color:var(--ab-dropzone-bg)]",
                    )}
                    style={{
                      borderColor: hasFile
                        ? "var(--score-good-border)"
                        : isDrag
                          ? "var(--ab-drag-hover-border)"
                          : "var(--ab-dropzone-border)",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragHoverIdx(i);
                    }}
                    onDragLeave={(e) => {
                      const related = e.relatedTarget as Node | null;
                      if (related && e.currentTarget.contains(related)) return;
                      setDragHoverIdx(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragHoverIdx(null);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(i, f);
                    }}
                  >
                    {!hasFile ? (
                      <label
                        htmlFor={fileInputId}
                        className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 py-2 transition-opacity duration-150 hover:opacity-90 focus-within:opacity-100"
                      >
                        <CloudUpload className="h-8 w-8 text-[color:var(--ink-muted)]" strokeWidth={1.75} aria-hidden />
                        <span className="text-sm font-medium text-[color:var(--ink-secondary)]">Drop creative here</span>
                        <span className="font-mono text-[11px] text-[color:var(--ab-variant-label)]">MP4 · MOV · JPG</span>
                        <input
                          id={fileInputId}
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/jpg,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileSelect(i, f);
                          }}
                        />
                      </label>
                    ) : (
                      <div className="flex min-h-[200px] flex-col justify-center gap-2">
                        <div
                          className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
                          style={{
                            background: "var(--score-good-bg)",
                            borderColor: "var(--score-good-border)",
                          }}
                        >
                          <Check className="h-[13px] w-[13px] shrink-0 text-[color:var(--success)]" aria-hidden />
                          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[color:var(--ink)]">
                            {v.file!.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-[color:var(--ink-muted)]">
                            {(v.file!.size / (1024 * 1024)).toFixed(1)}MB
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFileSelect(i, null)}
                            className="cursor-pointer bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--ink-muted)] transition-colors duration-150 hover:text-[color:var(--error)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.98]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {variants.length < MAX_VARIANTS && (
              <button
                type="button"
                onClick={addVariant}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--border)] bg-transparent px-5 py-3.5 text-[13px] font-medium text-[color:var(--ink-muted)] transition-[border-color,color] duration-150 hover:border-[color:var(--accent-border)] hover:text-[color:var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] active:scale-[0.99]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add variant
              </button>
            )}
          </div>

          <p className="mt-8 w-full text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ab-variant-label)]">
            Test type
          </p>
          <div className="mt-2 flex w-full flex-wrap gap-2">
            {TEST_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTestType(opt.value)}
                className={cn(
                  "rounded-[10px] border px-4 py-2 text-[13px] font-medium transition-[background-color,border-color,color] duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                  "active:scale-[0.99]",
                  testType === opt.value
                    ? "border-[color:var(--ab-test-type-active-border)] bg-[color:var(--ab-test-type-active-bg)] text-[color:var(--ab-test-type-active-text)]"
                    : "border-[color:var(--ab-test-type-inactive-border)] bg-[color:var(--ab-test-type-inactive-bg)] text-[color:var(--ab-test-type-inactive-text)] hover:border-[color:var(--border-hover)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {phase === "error" && errorMsg && (
            <div
              className="mt-4 w-full rounded-lg border px-4 py-3 font-mono text-xs text-[color:var(--error)]"
              style={{
                background: "var(--score-weak-bg)",
                borderColor: "var(--score-weak-border)",
              }}
              role="alert"
            >
              {errorMsg}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun}
              className={cn(
                "rounded-[10px] px-8 py-3 text-sm font-semibold transition-[transform,background-color,border-color,color] duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                canRun
                  ? "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)] active:scale-[0.99]"
                  : "cursor-not-allowed border border-[color:var(--ab-run-disabled-border)] bg-[color:var(--ab-run-disabled-bg)] text-[color:var(--ab-run-disabled-text)]",
              )}
            >
              Run Comparison
            </button>
            <span className="font-mono text-xs text-[color:var(--ink-muted)]">
              {readyCount}/{variants.length} variants ready
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOADING UI — Figma 263-900 ─────────────────────────────────────────────
  if (isRunning) {
    return (
      <PreFlightLoadingView
        files={filesWithUploads}
        phase={phase === "analyzing" ? "analyzing" : "comparing"}
        analysisProgress={analysisProgress}
        variants={variants}
        variantPreviewUrls={variantThumbnailUrls}
        onStop={handleReset}
      />
    );
  }

  // ─── RESULTS UI — Figma 263-1070 ─────────────────────────────────────────────
  if (phase === "done" && comparison) {
    return (
      <PreFlightResultsView
        comparison={comparison}
        analyses={analyses}
        analysisLabels={analysisLabels}
        variants={variants}
        variantThumbnailUrls={variantThumbnailUrls}
        testType={testType}
        onBack={handleReset}
        onExportPdf={handleExportPdf}
        onRunAnotherTest={handleReset}
        onSaveWinnerToLibrary={handleSaveWinnerToLibrary}
      />
    );
  }

  return null;
}
