// src/components/VisualizePanel.tsx — Before/After Visualizer Panel
// Slides in below the scorecard when "Visualize It" is triggered.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Download, Copy, Sparkles, AlertCircle } from "lucide-react";
import type { VisualizeResult, VisualizeStatus, VisualizeCreditData, VisualizeMode } from "../types/visualize";
import { MotionPreviewPlayer } from "./MotionPreviewPlayer";

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
  src, label, height = 400, isAfter = false,
}: { src: string; label: string; height?: number; isAfter?: boolean }) {
  const labelColor = isAfter ? "#10b981" : "#71717a";
  const borderColor = isAfter ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)";
  
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ 
          fontSize: 11, fontWeight: 600, color: labelColor, 
          textTransform: "uppercase", letterSpacing: "0.1em" 
        }}>
          {label}
        </span>
        {isAfter && (
          <span style={{
            fontSize: 10, fontWeight: 500, color: "#10b981",
            background: "rgba(16,185,129,0.1)",
            padding: "3px 8px", borderRadius: 6,
          }}>
            AI Improved
          </span>
        )}
      </div>
      <div style={{
        height,
        borderRadius: 14,
        background: "#0f0f11",
        border: `1px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
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
  const fillPct = Math.min(100, Math.round((creditData.used / (creditData.limit || 1)) * 100));

  const isPro = creditData.tier === "pro";
  const isTeam = creditData.tier === "team";

  // Churn-prevention framing: acknowledge value delivered, then explain the path forward
  const body = isTeam
    ? "Your team's been busy. Reach out and we'll set up a custom credit limit."
    : isPro
    ? "You're getting real value from this. Upgrade to Team and get 25 AI-generated improvements every month — keep the testing momentum going."
    : "Upgrade to Pro and unlock 10 Visualize credits every month, plus all the other Pro features.";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
      padding: "48px 32px 36px", textAlign: "center",
    }}>
      {/* Gradient sparkle — keeping the icon style as requested */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          position: "absolute", inset: -12,
          background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
          border: "1px solid rgba(99,102,241,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <Sparkles size={26} color="#818cf8" />
        </div>
      </div>

      {/* Copy */}
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", lineHeight: 1.35, marginBottom: 10 }}>
          You've maxed out Visualize this month
        </p>
        <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.7 }}>
          {body}
        </p>
      </div>

      {/* Credit progress card */}
      <div style={{ 
        width: "100%", maxWidth: 320, 
        padding: "16px 20px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
              {creditData.used}
            </span>
            <span style={{ fontSize: 14, color: "#52525b", fontFamily: "var(--mono)" }}>
              / {creditData.limit}
            </span>
            <span style={{ fontSize: 12, color: "#52525b", marginLeft: 4 }}>used</span>
          </div>
          <span style={{ 
            fontSize: 11, fontWeight: 500, color: "#71717a",
            background: "rgba(255,255,255,0.04)",
            padding: "4px 10px", borderRadius: 6,
          }}>
            Resets {resetLabel}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${fillPct}%`, borderRadius: 999,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }} />
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 320 }}>
        {isTeam ? (
          <a
            href="mailto:support@cutsheet.xyz?subject=Custom Visualize limits"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", padding: "14px 28px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#fff",
              textDecoration: "none", boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              transition: "all 150ms",
            }}
          >
            Contact us for custom limits
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onUpgrade?.(isPro ? "team" : "pro")}
            style={{
              width: "100%", padding: "14px 28px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 600, color: "#fff", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.35)"; }}
          >
            {isPro ? "Upgrade to Team — 25 Visualizes/month" : "Upgrade to Pro — 10 Visualizes/month"}
          </button>
        )}

        <p style={{ fontSize: 13, color: "#52525b" }}>
          or wait until {resetLabel} for credits to reset
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 4, padding: "8px 20px", fontSize: 13, fontWeight: 500,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, color: "#71717a", cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#a1a1aa"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#71717a"; }}
        >
          Dismiss
        </button>
      </div>
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
  // Motion preview (Kling animation)
  videoUrl?: string | null;
  videoLoading?: boolean;
  videoError?: string | null;
  videoSource?: "improved" | "original" | null;
  onAnimate?: () => void;
  onAnimateOriginal?: () => void;
  format?: 'video' | 'static';
  visualizeMode?: VisualizeMode | null;
}

export function VisualizePanel({
  status, result, originalImageUrl, error, creditData, onClose, onBack, onAnalyzeVersion, onUpgrade,
  videoUrl, videoLoading, videoError, videoSource, onAnimate, onAnimateOriginal, format, visualizeMode,
}: VisualizePanelProps) {
  const isVideo = format === 'video';
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
              {isVideo ? "MVP — Hook Frame" : "MVP — Static Ads"}
            </span>
            {visualizeMode === "text_overlay" && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: "#f59e0b",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 4, padding: "2px 6px",
              }}>
                Direction Mode
              </span>
            )}
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
        {status === "credit_limit" && (
          <motion.div key="credit_limit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {creditData
              ? <CreditLimitPanel creditData={creditData} onClose={onClose} onUpgrade={onUpgrade} />
              : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, color: "#a1a1aa" }}>You've reached your Visualize credit limit for this month.</p>
                  <button type="button" onClick={onClose} style={{ padding: "6px 16px", fontSize: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#a1a1aa", cursor: "pointer" }}>Dismiss</button>
                </div>
              )
            }
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
            {/* Before / After comparison */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: 20, 
              marginBottom: 24,
            }}>
              {originalImageUrl && (
                <ImagePanel src={originalImageUrl} label={isVideo ? "Hook Frame" : "Before"} height={380} />
              )}

              {result.generatedImageUrl ? (
                <ImagePanel src={result.generatedImageUrl} label={isVideo ? "Improved Hook Frame" : "After"} height={380} />
              ) : result.visualBrief ? (
                visualizeMode === "text_overlay" ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Creative Direction
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyBrief}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "none", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                          fontSize: 11, color: "#818cf8",
                          transition: "all 150ms",
                        }}
                      >
                        <Copy size={11} />
                        {briefCopied ? "Copied!" : "Copy Brief"}
                      </button>
                    </div>
                    <div style={{
                      borderRadius: 12,
                      background: "#18181b",
                      border: "1px solid rgba(245,158,11,0.12)",
                      borderLeft: "3px solid #f59e0b",
                      padding: "16px 20px",
                      overflow: "auto",
                      maxHeight: 420,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Creative Direction — share with your designer
                      </p>
                      <p style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {result.visualBrief}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
                      High-production ad — AI suggests copy and layout changes only
                    </p>
                  </div>
                ) : (
                  <VisualBriefPanel
                    brief={result.visualBrief}
                    onCopy={handleCopyBrief}
                    copied={briefCopied}
                  />
                )
              ) : null}
            </div>

            {/* What Changed - Redesigned card */}
            {(result.improvementSummary || (result.changesApplied?.length ?? 0) > 0) && (
              <div style={{ 
                marginBottom: 24,
                padding: "20px 24px",
                background: "rgba(16,185,129,0.03)",
                border: "1px solid rgba(16,185,129,0.1)",
                borderRadius: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "rgba(16,185,129,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={16} color="#10b981" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    What Changed
                  </span>
                </div>
                
                {result.improvementSummary && (
                  <p style={{ fontSize: 14, color: "#d4d4d8", lineHeight: 1.7, marginBottom: 16 }}>
                    {result.improvementSummary}
                  </p>
                )}
                
                {result.changesApplied?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.changesApplied.map((change, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.08 }}
                        style={{ 
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "12px 14px",
                          background: "rgba(255,255,255,0.025)",
                          borderRadius: 10,
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6,
                          background: "rgba(16,185,129,0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginTop: 1,
                        }}>
                          <Check size={12} color="#10b981" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.6 }}>{change}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Motion Preview (Kling animation) — dual entry point */}
            {result.generatedImageUrl && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "rgba(99,102,241,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={14} color="#818cf8" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Motion Preview
                  </span>
                  {videoSource && (
                    <span style={{ fontSize: 11, color: "#71717a" }}>
                      — Animating {videoSource === "improved" ? "improved version" : "original"}
                    </span>
                  )}
                </div>

                {/* Dual buttons: show when no video is generating or ready */}
                {!videoUrl && !videoLoading && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {onAnimate && (
                      <button
                        type="button"
                        onClick={onAnimate}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          padding: "10px 16px",
                          background: "rgba(99,102,241,0.12)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: 8, cursor: "pointer",
                          fontSize: 13, fontWeight: 500, color: "#a5b4fc",
                          transition: "all 150ms",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
                      >
                        ▷ Animate this version →
                      </button>
                    )}
                    {onAnimateOriginal && (
                      <button
                        type="button"
                        onClick={onAnimateOriginal}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          padding: "10px 16px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8, cursor: "pointer",
                          fontSize: 13, fontWeight: 500, color: "#71717a",
                          transition: "all 150ms",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#a1a1aa"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#71717a"; }}
                      >
                        Animate original instead
                      </button>
                    )}
                  </div>
                )}

                <MotionPreviewPlayer
                  videoUrl={videoUrl}
                  stillFrameUrl={videoSource === "original" ? (originalImageUrl ?? undefined) : result.generatedImageUrl}
                  isLoading={!!videoLoading}
                  loadingLabel="Generating 5s video clip..."
                  error={videoError}
                />
              </div>
            )}

            {/* Action row - Redesigned buttons */}
            <div style={{ 
              display: "flex", gap: 10, flexWrap: "wrap", 
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              {result.generatedImageUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    height: 42, padding: "0 18px",
                    background: downloadTouched ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 10, cursor: "pointer",
                    fontSize: 13, fontWeight: 500, color: "#a5b4fc",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = downloadTouched ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)"; }}
                >
                  <Download size={14} />
                  Download Improved Version
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyBrief}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  height: 42, padding: "0 18px",
                  background: briefCopied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${briefCopied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 500, color: briefCopied ? "#10b981" : "#a1a1aa",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => { if (!briefCopied) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { if (!briefCopied) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                {briefCopied ? <Check size={14} /> : <Copy size={14} />}
                {briefCopied ? "Copied!" : "Copy Visual Brief"}
              </button>
              {result.generatedImageUrl && onAnalyzeVersion && (
                <button
                  type="button"
                  onClick={handleAnalyzeVersion}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    height: 42, padding: "0 18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, cursor: "pointer",
                    fontSize: 13, fontWeight: 500, color: "#a1a1aa",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >
                  Analyze This Version
                </button>
              )}
            </div>

            {/* Video — coming soon note */}
            {isVideo && (
              <p style={{ marginTop: 12, fontSize: 11, color: "#3f3f46", textAlign: "center" }}>
                Full video generation coming soon — hook frame improvement only in v1
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
