// ProgressCard.tsx — Single-column centered loading state with floating Zap icon

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

  // ZAP circle size
  const ZAP_SIZE = 56;
  const ZAP_HALF = ZAP_SIZE / 2;

  return (
    <>
      {/* Outer — full height, centered column */}
      <div style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        {/* Column wrapper — max 480px */}
        <div style={{ width: "100%", maxWidth: 480, position: "relative" }}>

          {/* ── Element 1: Floating Zap circle ── */}
          {/* Sits centered above the image card, bottom half overlapping */}
          <div style={{
            position: "absolute",
            top: -(ZAP_HALF),
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            width: ZAP_SIZE,
            height: ZAP_SIZE,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(99,102,241,0.2)",
          }}>
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap size={24} color="#6366f1" />
            </motion.div>
          </div>

          {/* ── Element 2: Image card ── */}
          <div style={{
            width: "100%",
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            overflow: "hidden",
            position: "relative",
            // Push content down so Zap circle top half is clear
            paddingTop: ZAP_HALF,
            minHeight: 240,
          }}>
            {/* Creative preview area */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 16px 0",
              minHeight: 200,
            }}>
              {displayUrl ? (
                <motion.img
                  src={displayUrl}
                  alt={sanitizeFileName(file.name)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 320,
                    objectFit: "contain",
                    display: "block",
                    borderRadius: 6,
                  }}
                />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "rgba(99,102,241,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}>
                    <path d="M5 3l14 9-14 9V3z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Scanning overlay */}
            <motion.div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.05) 50%, transparent 100%)",
                pointerEvents: "none",
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            {/* File info bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              marginTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontSize: 11, color: "#71717a", fontFamily: "var(--mono, monospace)" }}>
                {(() => { const n = sanitizeFileName(file.name); return n.length > 30 ? n.slice(0, 27) + "..." : n; })()}
                {" "}·{" "}
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                onClick={onCancel}
                style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* ── Element 3: Analyzing card ── */}
          <div style={{
            width: "100%",
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "16px 20px 0",
            marginTop: 8,
          }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--accent, #6366f1)",
                animation: "pulse-dot 1.5s ease-in-out infinite",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Analyzing...</span>
            </div>

            {/* Metric rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {METRICS.map((metric, i) => {
                const isActive = stageIndex >= i + 1;
                const isDone = stageIndex > i + 1;
                return (
                  <div key={metric} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 12,
                      color: isActive ? "#a1a1aa" : "#3f3f46",
                      width: 130,
                      flexShrink: 0,
                      transition: "color 0.3s",
                    }}>
                      {metric}
                    </span>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
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
                    {isDone ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ fontSize: 11, color: "#6366f1", width: 14, textAlign: "right", flexShrink: 0 }}
                      >
                        ✓
                      </motion.span>
                    ) : (
                      <span style={{ width: 14, flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage label + overall progress bar — flush to bottom */}
            <div style={{ paddingTop: 14, paddingBottom: 16 }}>
              <div style={{ minHeight: 18, marginBottom: 6 }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stageIndex}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontSize: 12, color: "#71717a", margin: 0, fontWeight: 500 }}
                  >
                    {stage.label}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div style={{ height: 2, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
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
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </>
  );
}
