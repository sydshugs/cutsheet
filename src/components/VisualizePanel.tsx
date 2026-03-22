// src/components/VisualizePanel.tsx — Before/After Visualizer Panel
// Slides in below the scorecard when "Visualize It" is triggered.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Download, Copy, Sparkles, AlertCircle, ImageOff } from "lucide-react";
import type { VisualizeResult, VisualizeStatus, VisualizeCreditData } from "../types/visualize";

// ─── LOADING STEPS ────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { label: "Reading your scorecard...", durationMs: 1500 },
  { label: "Writing improvement brief...", durationMs: 4000 },
  { label: "Generating your improved ad...", durationMs: Infinity },
] as const;

function LoadingSteps() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const advance = (idx: number) => {
      if (idx < LOADING_STEPS.length - 1 && LOADING_STEPS[idx].durationMs !== Infinity) {
        timeout = setTimeout(() => {
          setStepIndex(idx + 1);
          advance(idx + 1);
        }, LOADING_STEPS[idx].durationMs);
      }
    };
    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {LOADING_STEPS.map((step, i) => {
        const isActive = i === stepIndex;
        const isDone = i < stepIndex;
        return (
          <div
            key={step.label}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              opacity: isActive ? 1 : isDone ? 0.5 : 0.25,
              transition: "opacity 400ms ease",
            }}
          >
            {isDone ? (
              <Check size={14} color="#10b981" strokeWidth={2.5} />
            ) : isActive ? (
              <div style={{
                width: 14, height: 14,
                border: "2px solid rgba(99,102,241,0.3)",
                borderTopColor: "#6366f1",
                borderRadius: "50%",
                flexShrink: 0,
                animation: "spin 0.7s linear infinite",
              }} />
            ) : (
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, color: isActive ? "#e4e4e7" : "#71717a" }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SHIMMER PLACEHOLDER ─────────────────────────────────────────────────────

function ShimmerBlock({ height = 400 }: { height?: number }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        animation: "shimmer 1.8s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─── IMAGE PANEL ─────────────────────────────────────────────────────────────

function ImagePanel({
  src, label, height = 400,
}: { src: string; label: string; height?: number }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <div style={{
        height,
        borderRadius: 12,
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <img
          src={src}
          alt={label}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

// ─── VISUAL BRIEF PANEL ──────────────────────────────────────────────────────

function VisualBriefPanel({
  brief, onCopy, copied,
}: { brief: string; onCopy: () => void; copied: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          After (Visual Brief)
        </span>
        <button
          type="button"
          onClick={onCopy}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "3px 8px", cursor: "pointer",
            fontSize: 11, color: "#818cf8",
            transition: "all 150ms",
          }}
        >
          <Copy size={11} />
          {copied ? "Copied!" : "Copy Brief"}
        </button>
      </div>
      <div style={{
        borderRadius: 12,
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.06)",
        borderLeft: "3px solid #6366f1",
        padding: "16px 20px",
        overflow: "auto",
        maxHeight: 420,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#818cf8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Visual Brief — share with your designer
        </p>
        <p style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {brief}
        </p>
      </div>
      <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
        Image generation unavailable — showing design brief instead
      </p>
    </div>
  );
}

// ─── CREDIT LIMIT STATE ─────────────────────────────────────────────────────

function CreditLimitPanel({
  creditData, onClose, onUpgrade,
}: { creditData: VisualizeCreditData; onClose: () => void; onUpgrade?: (feature: string) => void }) {
  const resetDate = new Date(creditData.resetDate);
  const resetLabel = resetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const tier = creditData.tier;
  const isPro = tier === "pro";
  const isTeam = tier === "team";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ImageOff size={24} color="#52525b" />
      </div>

      <div>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", lineHeight: 1.4 }}>
          You've used all {creditData.limit} Visualize credits this month
        </p>
        {!isPro && !isTeam && (
          <p style={{ fontSize: 14, color: "#71717a", marginTop: 4 }}>
            Free accounts get {creditData.limit} Visualize per month.
          </p>
        )}
      </div>

      <p style={{ fontSize: 13, color: "#71717a", fontFamily: "var(--mono)" }}>
        {creditData.used} / {creditData.limit} used · Resets {resetLabel}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 320, marginTop: 4 }}>
        {!isTeam && (
          <button
            type="button"
            onClick={() => onUpgrade?.(isPro ? "team" : "pro")}
            style={{
              width: "100%", padding: "10px 24px",
              background: "#6366f1", border: "none", borderRadius: 9999,
              fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "#5254cc"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "#6366f1"; }}
          >
            {isPro ? "Upgrade to Team — 25 Visualizes/month" : "Upgrade to Pro — 10 Visualizes/month"}
          </button>
        )}

        {!isPro && !isTeam && (
          <button
            type="button"
            onClick={() => onUpgrade?.("team")}
            style={{
              width: "100%", padding: "10px 24px",
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999,
              fontSize: 14, fontWeight: 500, color: "#d4d4d8", cursor: "pointer",
            }}
          >
            Upgrade to Team — 25 Visualizes/month
          </button>
        )}

        {isTeam && (
          <a
            href="mailto:support@cutsheet.xyz?subject=Custom Visualize limits"
            style={{
              display: "block", width: "100%", padding: "10px 24px",
              background: "#6366f1", border: "none", borderRadius: 9999,
              fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer",
              textAlign: "center", textDecoration: "none",
            }}
          >
            Contact us for custom limits
          </a>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
        or wait until {resetLabel} for your credits to reset
      </p>

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 4, padding: "4px 12px", fontSize: 11,
          background: "none", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6, color: "#52525b", cursor: "pointer",
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export interface VisualizePanelProps {
  status: VisualizeStatus;
  result: VisualizeResult | null;
  originalImageUrl: string | null;
  error?: string | null;
  creditData?: VisualizeCreditData | null;
  onClose: () => void;
  onBack?: () => void;
  onAnalyzeVersion?: (file: File) => void;
  onUpgrade?: (feature: string) => void;
}

export function VisualizePanel({
  status, result, originalImageUrl, error, creditData, onClose, onBack, onAnalyzeVersion, onUpgrade,
}: VisualizePanelProps) {
  const [briefCopied, setBriefCopied] = useState(false);
  const [downloadTouched, setDownloadTouched] = useState(false);

  const handleCopyBrief = useCallback(async () => {
    const text = result?.visualBrief ?? result?.improvementSummary ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2000);
    } catch { /* ignore */ }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result?.generatedImageUrl) return;
    setDownloadTouched(true);
    const a = document.createElement("a");
    a.href = result.generatedImageUrl;
    a.download = "improved-ad.png";
    a.click();
    setTimeout(() => setDownloadTouched(false), 1500);
  }, [result]);

  const handleAnalyzeVersion = useCallback(async () => {
    if (!result?.generatedImageUrl || !onAnalyzeVersion) return;
    try {
      const resp = await fetch(result.generatedImageUrl);
      const blob = await resp.blob();
      const file = new File([blob], "improved-ad.png", { type: blob.type || "image/png" });
      onAnalyzeVersion(file);
    } catch {
      // Silently fail — the button will just not respond
    }
  }, [result, onAnalyzeVersion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        margin: "0 16px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: 20,
        overflow: "hidden",
      }}
    >
      {/* ── Keyframes injected once ─────────────────────────── */}
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Back button ─────────────────────────────────────── */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#a1a1aa", fontSize: 13,
            background: "transparent", border: "none", cursor: "pointer",
            marginBottom: 16, padding: 0,
          }}
        >
          ← Back to analysis
        </button>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} color="#818cf8" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Visualized Improvement</span>
            <span style={{
              fontSize: 10, fontWeight: 500, color: "#52525b",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4, padding: "2px 6px",
            }}>
              MVP — Static Ads
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>
            AI-generated based on your scorecard
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#52525b", padding: 4, borderRadius: 6,
            display: "flex", alignItems: "center",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#52525b"; }}
        >
          <X size={16} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Loading ───────────────────────────────────────── */}
        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{
              display: "flex", flexDirection: "column",
              gap: 12, marginBottom: 16,
            }}>
              <LoadingSteps />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {originalImageUrl && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Before</span>
                  <div style={{
                    height: 300, borderRadius: 12, background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    <img src={originalImageUrl} alt="Original" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>After</span>
                <ShimmerBlock height={300} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Credit Limit ────────────────────────────────────── */}
        {status === "credit_limit" && creditData && (
          <motion.div key="credit_limit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CreditLimitPanel creditData={creditData} onClose={onClose} onUpgrade={onUpgrade} />
          </motion.div>
        )}

        {/* ── Error ─────────────────────────────────────────── */}
        {status === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 12, padding: "24px 20px", textAlign: "center",
            }}>
              <AlertCircle size={20} color="#ef4444" />
              <span style={{ fontSize: 14, color: "#fca5a5", lineHeight: 1.5 }}>
                {error === "RATE_LIMITED"
                  ? "You've used all your Visualize credits this month. Credits reset on the 1st."
                  : "Generation failed — please try again."}
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  marginTop: 4, padding: "6px 16px", fontSize: 12,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#a1a1aa", cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Complete ──────────────────────────────────────── */}
        {status === "complete" && result && (
          <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Before / After images */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              {originalImageUrl && (
                <ImagePanel src={originalImageUrl} label="Before" height={380} />
              )}

              {result.generatedImageUrl ? (
                <ImagePanel src={result.generatedImageUrl} label="After" height={380} />
              ) : result.visualBrief ? (
                <VisualBriefPanel
                  brief={result.visualBrief}
                  onCopy={handleCopyBrief}
                  copied={briefCopied}
                />
              ) : null}
            </div>

            {/* What Changed */}
            {(result.improvementSummary || (result.changesApplied?.length ?? 0) > 0) && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  What Changed
                </p>
                {result.improvementSummary && (
                  <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.65, marginBottom: 12 }}>
                    {result.improvementSummary}
                  </p>
                )}
                {result.changesApplied?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.changesApplied.map((change, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.06 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                      >
                        <Check size={13} color="#10b981" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.5 }}>{change}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
              {result.generatedImageUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px",
                    background: downloadTouched ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.35)",
                    borderRadius: 8, cursor: "pointer",
                    fontSize: 13, fontWeight: 500, color: "#818cf8",
                    transition: "all 150ms",
                  }}
                >
                  <Download size={13} />
                  Download Improved Version
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyBrief}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, cursor: "pointer",
                  fontSize: 13, color: "#a1a1aa",
                  transition: "all 150ms",
                }}
              >
                <Copy size={13} />
                {briefCopied ? "Copied!" : "Copy Visual Brief"}
              </button>
              {result.generatedImageUrl && onAnalyzeVersion && (
                <button
                  type="button"
                  onClick={handleAnalyzeVersion}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, cursor: "pointer",
                    fontSize: 13, color: "#a1a1aa",
                    transition: "all 150ms",
                  }}
                >
                  Analyze This Version
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
