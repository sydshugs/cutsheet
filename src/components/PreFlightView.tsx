// PreFlightView.tsx — Main Pre-Flight A/B creative testing view

import { useState, useCallback } from "react";
import { VideoDropzone } from "./VideoDropzone";
import { PreFlightWinner } from "./PreFlightWinner";
import { PreFlightRankCard } from "./PreFlightRankCard";
import { PreFlightHeadToHead } from "./PreFlightHeadToHead";
import { SegmentedControl } from "./ui/SegmentedControl";
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

  // ─── UPLOAD UI ────────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
    return (
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "clamp(32px, 8vh, 80px) 24px 40px",
          fontFamily: "var(--sans)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--sans)",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--label)",
              }}
            >
              PRE-FLIGHT
            </div>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: border,
              }}
            />
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: textPrimary,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              fontFamily: "var(--sans)",
            }}
          >
            Predict the winner before you spend.
          </div>
          <div
            style={{
              fontSize: "14px",
              color: textSecondary,
              marginTop: "8px",
              lineHeight: 1.5,
            }}
          >
            Upload 2–5 creative variants. AI analyzes each, then ranks them head-to-head.
          </div>
        </div>

        {/* Test type selector */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--sans)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--label)",
              marginBottom: "8px",
            }}
          >
            TEST TYPE
          </div>
          <SegmentedControl
            options={TEST_TYPE_OPTIONS.map((o) => o.label)}
            selected={TEST_TYPE_OPTIONS.find((o) => o.value === testType)?.label ?? "Full Creative"}
            onChange={(val) =>
              setTestType(
                (TEST_TYPE_OPTIONS.find((o) => o.label === val)?.value ?? "full") as TestType
              )
            }
          />
        </div>

        {/* Variant upload slots */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          {variants.map((v, i) => {
            const fileInputId = `preflight-file-${v.id}`;
            const hasFile = !!v.file;
            return (
              <div
                key={v.id}
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: "var(--radius)",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  transition: "border-color var(--duration-fast) var(--ease-out)",
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "var(--border)";
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileSelect(i, f);
                }}
              >
                {/* Label input */}
                <input
                  type="text"
                  value={v.label}
                  maxLength={40}
                  onChange={(e) => handleLabelChange(i, e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "13px",
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    color: textPrimary,
                    letterSpacing: "0.04em",
                    padding: 0,
                    width: "90px",
                    flexShrink: 0,
                  }}
                />

                {/* File area */}
                {!hasFile ? (
                  <label
                    htmlFor={fileInputId}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      border: "1.5px dashed rgba(99,102,241,0.25)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      color: textMuted,
                      fontSize: "12px",
                      fontFamily: "var(--sans)",
                      transition: "all var(--duration-fast) var(--ease-out)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
                      e.currentTarget.style.color = textMuted;
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Drop file or click to browse</span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: "10px", opacity: 0.5 }}>
                      MP4 · MOV · PNG · JPG
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
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      background: "rgba(16,185,129,0.04)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--mono)",
                        color: textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {v.file!.name}
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: textMuted, flexShrink: 0 }}>
                      {(v.file!.size / (1024 * 1024)).toFixed(1)}MB
                    </span>
                    <button
                      onClick={() => handleFileSelect(i, null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: textMuted,
                        cursor: "pointer",
                        fontSize: "10px",
                        fontFamily: "var(--mono)",
                        padding: "2px 6px",
                        flexShrink: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Remove variant */}
                {variants.length > MIN_VARIANTS && (
                  <button
                    onClick={() => removeVariant(i)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${border}`,
                      background: "transparent",
                      color: textMuted,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      flexShrink: 0,
                      transition: "color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--error)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = textMuted; e.currentTarget.style.borderColor = border; }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Add variant button */}
          {variants.length < MAX_VARIANTS && (
            <button
              onClick={addVariant}
              style={{
                background: "transparent",
                border: `1.5px dashed ${border}`,
                borderRadius: "var(--radius)",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                color: textMuted,
                fontSize: "12px",
                fontFamily: "var(--sans)",
                fontWeight: 500,
                transition: "border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.color = textMuted;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add variant
            </button>
          )}
        </div>

        {/* Error message */}
        {phase === "error" && errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontFamily: "var(--mono)",
              color: "var(--error)",
              marginBottom: "16px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!canRun}
          style={{
            padding: "14px 28px",
            background: canRun ? "var(--grad)" : surfaceDim,
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: canRun ? "#fff" : textMuted,
            fontSize: "13px",
            fontFamily: "var(--sans)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: canRun ? "pointer" : "not-allowed",
            boxShadow: canRun ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
        >
          Run Pre-Flight →
        </button>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--mono)",
            color: textMuted,
            marginLeft: "12px",
          }}
        >
          {readyCount}/{variants.length} variants ready
        </span>
      </div>
    );
  }

  // ─── LOADING UI ──────────────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "80px 24px",
          fontFamily: "var(--sans)",
          textAlign: "center",
        }}
      >
        {/* Spinner */}
        <style>{`
          @keyframes pfSpin { to { transform: rotate(360deg); } }
          @keyframes pfPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        `}</style>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: `2px solid ${border}`,
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "pfSpin 0.8s linear infinite",
            margin: "0 auto 24px",
          }}
        />
        <div
          style={{
            fontSize: "14px",
            fontFamily: "var(--mono)",
            fontWeight: 700,
            color: textPrimary,
            marginBottom: "8px",
          }}
        >
          {phase === "analyzing"
            ? `Analyzing ${analysisProgress}/${variants.filter((v) => v.file).length}...`
            : "Running head-to-head comparison..."}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: textMuted,
            fontFamily: "var(--mono)",
            marginBottom: "32px",
          }}
        >
          {phase === "analyzing"
            ? "Each variant gets a full creative analysis"
            : "Comparing all variants and picking a winner"}
        </div>

        {/* Per-variant progress list */}
        <div
          style={{
            textAlign: "left",
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: "var(--radius)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {variants.map((v, i) => {
            if (!v.file) return null;
            const st = variantStatuses[i];
            const icon =
              st === "done" ? "✓" : st === "analyzing" ? "⟳" : st === "error" ? "✗" : "○";
            const iconColor =
              st === "done"
                ? "#10B981"
                : st === "analyzing"
                  ? "#8B5CF6"
                  : st === "error"
                    ? "#6366F1"
                    : textMuted;

            return (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                  fontFamily: "var(--mono)",
                }}
              >
                <span
                  style={{
                    color: iconColor,
                    fontWeight: 700,
                    width: "16px",
                    textAlign: "center",
                    animation:
                      st === "analyzing" ? "pfPulse 1.2s infinite" : "none",
                  }}
                >
                  {icon}
                </span>
                <span style={{ color: st === "done" || st === "analyzing" ? textPrimary : textMuted }}>
                  {v.label}
                </span>
                <span style={{ color: textMuted, marginLeft: "auto", fontSize: "10px" }}>
                  {st === "done"
                    ? "complete"
                    : st === "analyzing"
                      ? "analyzing..."
                      : st === "error"
                        ? "failed"
                        : "pending"}
                </span>
              </div>
            );
          })}

          {phase === "comparing" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "12px",
                fontFamily: "var(--mono)",
                paddingTop: "8px",
                borderTop: `1px solid ${border}`,
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  color: "#8B5CF6",
                  fontWeight: 700,
                  animation: "pfPulse 1.2s infinite",
                }}
              >
                ⟳
              </span>
              <span style={{ color: textPrimary }}>Head-to-head comparison</span>
              <span style={{ color: textMuted, marginLeft: "auto", fontSize: "10px" }}>
                comparing...
              </span>
            </div>
          )}
        </div>
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
                background: "var(--accent)",
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
