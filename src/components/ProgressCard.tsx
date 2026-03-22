// ProgressCard.tsx — Centered viewport loading state with side-by-side cards

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useThumbnail } from "../hooks/useThumbnail";
import { sanitizeFileName } from "../utils/sanitize";

interface ProgressCardProps {
  file: File;
  status: "uploading" | "processing";
  statusMessage: string;
  onCancel: () => void;
}

const STAGES = [
  { label: "Reading creative...", metric: null, pct: 10 },
  { label: "Scoring hook strength...", metric: "Hook", pct: 30 },
  { label: "Evaluating message clarity...", metric: "Clarity", pct: 50 },
  { label: "Analyzing CTA effectiveness...", metric: "CTA", pct: 70 },
  { label: "Assessing production quality...", metric: "Production", pct: 85 },
  { label: "Generating report...", metric: null, pct: 95 },
];

const METRICS = ["Hook Strength", "Message Clarity", "CTA Effectiveness", "Production Quality"];

export function ProgressCard({ file, status, onCancel }: ProgressCardProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const thumbnailDataUrl = useThumbnail(file);
  const isImage = file.type.startsWith("image/");

  const previewUrl = useMemo(() => {
    if (isImage) return URL.createObjectURL(file);
    return null;
  }, [file, isImage]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (status !== "processing") { setStageIndex(0); return; }
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [status]);

  const stage = STAGES[stageIndex];
  const displayUrl = thumbnailDataUrl || previewUrl;

  return (
    <>
      {/* Outer container — fixed, full viewport, centered */}
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, marginTop: -40,
        zIndex: 10, pointerEvents: "none",
      }}>
        {/* Inner grid */}
        <div
          style={{
            display: "grid",
            gap: 24,
            width: "100%",
            maxWidth: 900,
            alignItems: "stretch",
            pointerEvents: "auto",
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {/* LEFT — Creative preview card */}
          <div style={{
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: 400,
            overflow: "hidden",
            position: "relative",
          }}>
            {displayUrl ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
              >
                <img
                  src={displayUrl}
                  alt={sanitizeFileName(file.name)}
                  style={{
                    maxWidth: "100%", maxHeight: "100%",
                    objectFit: "contain", display: "block",
                  }}
                />
              </motion.div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "rgba(99,102,241,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}><path d="M5 3l14 9-14 9V3z"/></svg>
                </div>
              </div>
            )}

            {/* Scanning overlay */}
            <motion.div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.06) 50%, transparent 100%)",
                pointerEvents: "none",
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* File info bar at bottom */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ fontSize: 11, color: "#71717a", fontFamily: "var(--font-mono, monospace)" }}>
                {(() => { const n = sanitizeFileName(file.name); return n.length > 28 ? n.slice(0, 25) + "..." : n; })()} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button onClick={onCancel} style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT — Analysis progress card */}
          <div style={{
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            display: "flex", flexDirection: "column",
            padding: 24,
          }}>
            {/* Centered content — Zap icon + Analyzing */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              {/* Pulsing dot + label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--accent, #6366f1)",
                  animation: "pulse-dot 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>Analyzing...</span>
              </div>

              {/* Zap icon circle */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={28} color="#6366f1" />
              </div>

              {/* Metric rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {METRICS.map((metric, i) => {
                  const isActive = stageIndex >= i + 1;
                  const isDone = stageIndex > i + 1;
                  return (
                    <div key={metric} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontSize: 12, color: isActive ? "#a1a1aa" : "#3f3f46",
                        width: 120, flexShrink: 0, transition: "color 0.3s",
                      }}>
                        {metric}
                      </span>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        {isDone ? (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ height: "100%", borderRadius: 2, background: "#6366f1" }}
                          />
                        ) : isActive ? (
                          <div style={{
                            height: "100%", width: "100%", borderRadius: 2,
                            background: "linear-gradient(90deg, rgba(99,102,241,0.1) 25%, rgba(99,102,241,0.3) 50%, rgba(99,102,241,0.1) 75%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.5s infinite",
                          }} />
                        ) : null}
                      </div>
                      {isDone && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ fontSize: 11, color: "#6366f1", fontFamily: "var(--font-mono, monospace)", width: 16, textAlign: "right" }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress bar + stage label — pinned to bottom */}
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              {/* Stage label */}
              <div style={{ minHeight: 20, marginBottom: 8 }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stageIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontSize: 13, color: "#a1a1aa", margin: 0, fontWeight: 500 }}
                  >
                    {stage.label}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress bar */}
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${stage.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #6366f1, #818cf8)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </>
  );
}
