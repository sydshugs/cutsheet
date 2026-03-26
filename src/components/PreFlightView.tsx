// PreFlightView.tsx — Main Pre-Flight A/B creative testing view

import { useState, useCallback, useMemo, useEffect } from "react";
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
    // Score color helper
    const scoreCol = (s: number) => s >= 8 ? '#10b981' : s >= 4 ? '#f59e0b' : '#ef4444';

    // Confidence badge colors
    const confColor = comparison.winner.confidence === "high"
      ? { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' }
      : comparison.winner.confidence === "medium"
      ? { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' }
      : { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' };

    // Build label → variant and label → url maps
    const labelToVariant = new Map<string, typeof variants[0]>();
    variants.forEach((v) => labelToVariant.set(v.label, v));
    const labelToUrl = new Map<string, string | null>();
    variants.forEach((v, i) => labelToUrl.set(v.label, variantThumbnailUrls[i]));

    // Head-to-head rows
    const h2hRows = [
      { dim: "Hook", winner: comparison.headToHead.hookWinner, reason: comparison.headToHead.hookReason },
      { dim: "CTA", winner: comparison.headToHead.ctaWinner, reason: comparison.headToHead.ctaReason },
      { dim: "Retention", winner: comparison.headToHead.retentionWinner, reason: comparison.headToHead.retentionReason },
    ];

    return (
      <div className="flex h-full" style={{ minHeight: 'calc(100vh - 56px)' }}>

        {/* ── Left panel ────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">

            {/* 1. Thumbnail row */}
            <div className="grid grid-cols-2 gap-3">
              {comparison.rankings.map((rv) => {
                const url = labelToUrl.get(rv.label);
                const v = labelToVariant.get(rv.label);
                const isWinner = rv.rank === 1;
                const isVideo = v?.file?.type.startsWith('video/');
                return (
                  <div key={rv.variant} className="flex flex-col gap-1.5">
                    <div
                      className={`relative rounded-xl overflow-hidden bg-[#18181b] ${isVideo ? 'aspect-video' : 'aspect-square'}`}
                      style={isWinner
                        ? { boxShadow: '0 0 0 2px #ec4899' }
                        : { border: '1px solid rgba(255,255,255,0.06)' }
                      }
                    >
                      {url ? (
                        isVideo ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={url} alt={rv.label} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-zinc-600 font-mono">{rv.label}</span>
                        </div>
                      )}
                      {isWinner && (
                        <div className="absolute bottom-2 left-2">
                          <span
                            className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#ec4899' }}
                          >
                            Winner
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 truncate">{rv.label}</span>
                  </div>
                );
              })}
            </div>

            {/* 2. Predicted winner banner */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#18181b', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #ec4899' }}
            >
              <div className="px-5 py-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Predicted Winner</span>
                <p className="text-base font-semibold text-zinc-100 mt-1">{comparison.winner.headline}</p>
                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{comparison.winner.reasoning}</p>
                <span
                  className="inline-flex mt-3 text-[11px] font-mono rounded-full px-3 py-0.5"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  ↑ {comparison.winner.predictedLift}
                </span>
              </div>
            </div>

            {/* 3. Head-to-head breakdown */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Head-to-Head</p>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {h2hRows.map((row, i) => {
                  const isWinnerDim = row.winner === comparison.winner.label;
                  const pillStyle = isWinnerDim
                    ? { background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)' }
                    : { background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' };
                  return (
                    <div
                      key={row.dim}
                      className="flex items-start gap-3 px-5 py-3.5"
                      style={i < h2hRows.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : undefined}
                    >
                      <span className="text-xs font-medium text-zinc-400 w-20 flex-shrink-0">{row.dim}</span>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={pillStyle}
                      >
                        {row.winner}
                      </span>
                      <span className="text-xs text-zinc-500 flex-1">{row.reason}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Recommendation */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Recommendation</p>
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm text-zinc-300 leading-relaxed">{comparison.recommendation}</p>
              </div>
            </div>

            {/* 5. Hybrid opportunity (conditional) */}
            {comparison.hybridNote !== null && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#18181b', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #f59e0b' }}
              >
                <div className="px-5 py-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Hybrid Opportunity</span>
                  <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{comparison.hybridNote}</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Right panel ───────────────────────────────────── */}
        <div
          className="shrink-0 w-[440px] overflow-y-auto pb-12"
          style={{ background: 'rgba(24,24,27,0.5)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Section label */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-5 pt-5 pb-3">Score Comparison</p>

          {/* Score comparison cards */}
          {comparison.rankings.map((rv) => {
            const isWinner = rv.rank === 1;
            const sc = scoreCol(rv.overallScore);
            return (
              <div
                key={rv.variant}
                className="mx-4 mb-3 rounded-2xl overflow-hidden"
                style={isWinner
                  ? { background: '#18181b', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #ec4899' }
                  : { background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-zinc-200">{rv.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">#{rv.rank}</span>
                  </div>
                  <span className="text-3xl font-mono font-bold" style={{ color: sc }}>{rv.overallScore.toFixed(1)}</span>
                  <p className="text-xs mt-2" style={{ color: '#10b981' }}>↑ {rv.keyStrength}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">↓ {rv.keyWeakness}</p>
                  <span
                    className="inline-flex mt-2 text-[10px] font-medium rounded-full px-2 py-0.5"
                    style={rv.wouldScale
                      ? { color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }
                      : { color: '#a1a1aa', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {rv.wouldScale ? 'Ready to scale' : 'Needs work'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Confidence badge */}
          <div className="mx-4 mb-4">
            <div
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-center"
              style={{ background: confColor.bg, color: confColor.text, border: `1px solid ${confColor.border}` }}
            >
              {comparison.winner.confidence.toUpperCase()} CONFIDENCE
            </div>
          </div>

          {/* Run New Test button */}
          <div className="mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
            <button
              onClick={handleReset}
              className="w-full text-white text-sm font-medium rounded-xl px-4 py-3"
              style={{ background: '#6366f1' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#5254cc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1'; }}
            >
              Run New Test
            </button>
          </div>

          {/* Export PDF button */}
          <div className="mx-4 mb-4" style={{ width: 'calc(100% - 2rem)' }}>
            <button
              onClick={handleExportPdf}
              className="w-full text-sm font-medium rounded-xl px-4 py-3"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
