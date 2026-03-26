// PreFlightView.tsx — Main Pre-Flight A/B creative testing view

import { useState, useCallback, useMemo } from "react";
import { GitBranch, Plus, X, Upload, Check } from "lucide-react";
import { VideoDropzone } from "./VideoDropzone";
import { PreFlightWinner } from "./PreFlightWinner";
import { AnalysisProgressCard } from "./AnalysisProgressCard";
import { PreFlightRankCard } from "./PreFlightRankCard";
import { PreFlightHeadToHead } from "./PreFlightHeadToHead";
import { analyzeVideo, type AnalysisResult } from "../services/analyzerService";
import { runComparison } from "../services/comparisonService";
import { exportToPdf } from "../utils/pdfExport";
import type {
  VariantInput,
  ComparisonResult,
  TestType,
  PreFlightPhase,
} from "../types/preflight";

// Brand color for Pre-Flight: Rose/Pink
const BRAND_COLOR = "#ec4899";
const BRAND_COLOR_LIGHT = "#f472b6";
const BRAND_BG = "rgba(236,72,153,0.08)";
const BRAND_BORDER = "rgba(236,72,153,0.15)";

interface PreFlightViewProps {
  isDark: boolean;
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

export function PreFlightView({ isDark, apiKey }: PreFlightViewProps) {
  const [variants, setVariants] = useState<VariantInput[]>([
    createVariant(0),
    createVariant(1),
  ]);
  const [testType, setTestType] = useState<TestType>("full");
  const [phase, setPhase] = useState<PreFlightPhase>("idle");
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [analysisLabels, setAnalysisLabels] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Track per-variant status: null = pending, "analyzing" = in progress, "done" = complete, "error" = failed
  const [variantStatuses, setVariantStatuses] = useState<(null | "analyzing" | "done" | "error")[]>([]);

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

  // ─── UPLOAD UI ────────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
    const PILLS = ["Hook comparison", "CTA analysis", "Winner prediction"];

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)" }}>
        {/* Rose icon tile */}
        <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GitBranch size={28} color={BRAND_COLOR} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
          Compare two ad variants
        </h1>
        <p style={{ fontSize: 14, color: "#a1a1aa", textAlign: "center", maxWidth: 380, marginTop: 10, lineHeight: 1.6 }}>
          Upload two ad creatives side by side. AI analyzes both and predicts the winner.
        </p>

        {/* Feature pills — rose accent */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
          {PILLS.map((pill) => (
            <span key={pill} style={{ fontSize: 12, color: BRAND_COLOR, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)", borderRadius: 9999, padding: "4px 12px" }}>
              {pill}
            </span>
          ))}
        </div>

        {/* Analysis mode tabs — indigo active state */}
        <div style={{ display: "flex", gap: 4, marginTop: 24, padding: 4, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {TEST_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTestType(opt.value)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, transition: "all 150ms",
                background: testType === opt.value ? "#ec4899" : "transparent",
                color: testType === opt.value ? "white" : "#71717a",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Variant upload cards — 2-column side-by-side grid */}
        <div style={{ width: "100%", maxWidth: 640, marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {variants.map((v, i) => {
            const fileInputId = `preflight-file-${v.id}`;
            const hasFile = !!v.file;
            return (
              <div
                key={v.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: hasFile ? "1px solid rgba(16,185,129,0.2)" : "1.5px dashed rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  minHeight: 180,
                  transition: "all 150ms",
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(236,72,153,0.4)"; e.currentTarget.style.background = "rgba(236,72,153,0.04)"; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = hasFile ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = hasFile ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileSelect(i, f);
                }}
              >
                {/* Label row + remove button */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <input
                    type="text"
                    value={v.label}
                    maxLength={40}
                    onChange={(e) => handleLabelChange(i, e.target.value)}
                    style={{
                      background: "transparent", border: "none", outline: "none",
                      fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                      color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: 0, minWidth: 0,
                    }}
                  />
                  {variants.length > MIN_VARIANTS && (
                    <button
                      onClick={() => removeVariant(i)}
                      style={{
                        width: 22, height: 22, borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)",
                        background: "transparent", color: "#52525b", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 0, transition: "all 150ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* File area */}
                {!hasFile ? (
                  <label
                    htmlFor={fileInputId}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 12, cursor: "pointer", paddingTop: 8, paddingBottom: 8,
                    }}
                  >
                    <Upload size={20} color="#52525b" />
                    <div
                      style={{
                        padding: "8px 20px", background: "#6366f1", border: "none",
                        borderRadius: 9999, color: "white", fontSize: 12,
                        fontWeight: 600, pointerEvents: "none",
                      }}
                    >
                      Browse files
                    </div>
                    <span style={{ fontSize: 10, color: "#52525b", fontFamily: "monospace" }}>
                      MP4 · PNG · JPG · MOV
                    </span>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(i, f);
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8 }}>
                      <Check size={13} color="#10b981" />
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                        {v.file!.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#71717a" }}>
                        {(v.file!.size / (1024 * 1024)).toFixed(1)}MB
                      </span>
                      <button
                        onClick={() => handleFileSelect(i, null)}
                        style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 10, fontFamily: "monospace", padding: "2px 6px", transition: "all 150ms" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add variant — spans both columns */}
          {variants.length < MAX_VARIANTS && (
            <button
              onClick={addVariant}
              style={{
                gridColumn: "1 / -1",
                background: "transparent",
                border: "1.5px dashed rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "14px 20px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer", color: "#52525b", fontSize: 13, fontWeight: 500, transition: "all 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = BRAND_BORDER; e.currentTarget.style.color = BRAND_COLOR_LIGHT; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#52525b"; }}
            >
              <Plus size={14} />
              Add variant
            </button>
          )}
        </div>

        {/* Error message */}
        {phase === "error" && errorMsg && (
          <div style={{ width: "100%", maxWidth: 640, marginTop: 16, padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: "#ef4444" }}>
            {errorMsg}
          </div>
        )}

        {/* Compare Ads button — indigo */}
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleRun}
            disabled={!canRun}
            style={{
              padding: "12px 32px",
              background: canRun ? "#6366f1" : "rgba(255,255,255,0.04)",
              border: "none",
              borderRadius: 9999,
              color: canRun ? "#fff" : "#52525b",
              fontSize: 14,
              fontWeight: 600,
              cursor: canRun ? "pointer" : "not-allowed",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => { if (canRun) e.currentTarget.style.background = "#5254cc"; }}
            onMouseLeave={(e) => { if (canRun) e.currentTarget.style.background = "#6366f1"; }}
          >
            Compare Ads
          </button>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "#71717a" }}>
            {readyCount}/{variants.length} variants ready
          </span>
        </div>
      </div>
    );
  }

  // ─── LOADING UI ──────────────────────────────────────────────────────────────
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
    return (
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 24px",
          fontFamily: "var(--sans)",
        }}
      >
        {/* Results header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--sans)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--label)",
                marginBottom: "4px",
              }}
            >
              PRE-FLIGHT RESULTS
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {comparison.rankings.length} variants tested
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleExportPdf}
              style={{
                padding: "8px 16px",
                background: surfaceDim,
                border: `1px solid ${border}`,
                borderRadius: "var(--radius-sm)",
                color: textSecondary,
                fontSize: "11px",
                fontFamily: "var(--mono)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Export PDF
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                background: BRAND_COLOR,
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "11px",
                fontFamily: "var(--mono)",
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              New Test
            </button>
          </div>
        </div>

        {/* Winner card */}
        <div style={{ marginBottom: "24px" }}>
          <PreFlightWinner winner={comparison.winner} isDark={isDark} />
        </div>

        {/* Ranked cards row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(comparison.rankings.length, 3)}, 1fr)`,
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {comparison.rankings.map((rv) => (
            <PreFlightRankCard
              key={rv.variant}
              variant={rv}
              isWinner={rv.rank === 1}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Head-to-head + Recommendation */}
        <PreFlightHeadToHead
          headToHead={comparison.headToHead}
          recommendation={comparison.recommendation}
          hybridNote={comparison.hybridNote}
          isDark={isDark}
        />
      </div>
    );
  }

  return null;
}
