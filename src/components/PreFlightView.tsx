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
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Track per-variant status: null = pending, "analyzing" = in progress, "done" = complete, "error" = failed
  const [variantStatuses, setVariantStatuses] = useState<(null | "analyzing" | "done" | "error")[]>([]);

  const bg = isDark ? "#0D0D0D" : "#FAFAF9";
  const surface = isDark ? "#111110" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#fff" : "#0A0A0A";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const surfaceDim = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

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
    setComparison(null);
    setAnalysisProgress(0);
    setErrorMsg(null);
    setVariantStatuses([]);
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!analyses.length || !comparison) return;
    // Export the winner's analysis as PDF
    const winnerIndex = comparison.rankings.findIndex((r) => r.rank === 1);
    const winnerAnalysis = analyses[winnerIndex >= 0 ? winnerIndex : 0];
    if (winnerAnalysis) {
      try {
        await exportToPdf(winnerAnalysis);
      } catch {
        // silent
      }
    }
  }, [analyses, comparison]);

  const isRunning = phase === "analyzing" || phase === "comparing";

  // ─── UPLOAD UI ────────────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "error") {
    return (
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 24px",
          fontFamily: "'Outfit', sans-serif",
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
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: textMuted,
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
              fontFamily: "'Outfit', sans-serif",
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
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: textMuted,
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

        {/* Variant cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(180px, 1fr))`,
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {variants.map((v, i) => (
            <div
              key={v.id}
              style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                position: "relative",
              }}
            >
              {/* Remove button */}
              {variants.length > MIN_VARIANTS && (
                <button
                  onClick={() => removeVariant(i)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    border: `1px solid ${border}`,
                    background: "transparent",
                    color: textMuted,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}

              {/* Label input */}
              <input
                type="text"
                value={v.label}
                onChange={(e) => handleLabelChange(i, e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: textPrimary,
                  letterSpacing: "0.04em",
                  padding: 0,
                  width: "calc(100% - 24px)",
                }}
              />

              {/* Dropzone */}
              <VideoDropzone
                onFileSelect={(file) => handleFileSelect(i, file)}
                file={v.file ?? null}
                isDark={isDark}
                acceptImages
              />
            </div>
          ))}

          {/* Add variant button */}
          {variants.length < MAX_VARIANTS && (
            <button
              onClick={addVariant}
              style={{
                background: "transparent",
                border: `1.5px dashed ${border}`,
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                color: textMuted,
                minHeight: "200px",
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FF4444";
                e.currentTarget.style.color = "#FF4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.color = textMuted;
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                Add variant
              </span>
            </button>
          )}
        </div>

        {/* Error message */}
        {phase === "error" && errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255,68,68,0.08)",
              border: "1px solid rgba(255,68,68,0.2)",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#FF6B6B",
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
            borderRadius: "10px",
            color: canRun ? "#fff" : textMuted,
            fontSize: "13px",
            fontFamily: "var(--sans)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: canRun ? "pointer" : "not-allowed",
            boxShadow: canRun ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          Run Pre-Flight →
        </button>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
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
          fontFamily: "'Outfit', sans-serif",
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
            borderTopColor: "#C850C0",
            borderRadius: "50%",
            animation: "pfSpin 0.8s linear infinite",
            margin: "0 auto 24px",
          }}
        />
        <div
          style={{
            fontSize: "14px",
            fontFamily: "'JetBrains Mono', monospace",
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
            fontFamily: "'JetBrains Mono', monospace",
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
            borderRadius: "12px",
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
                ? "#00D4AA"
                : st === "analyzing"
                  ? "#C850C0"
                  : st === "error"
                    ? "#FF6B6B"
                    : textMuted;

            return (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
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
                fontFamily: "'JetBrains Mono', monospace",
                paddingTop: "8px",
                borderTop: `1px solid ${border}`,
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  color: "#C850C0",
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
          fontFamily: "'Outfit', sans-serif",
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
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: textMuted,
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
                borderRadius: "8px",
                color: textSecondary,
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
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
                background: "#FF4444",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
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
