// ProgressCard.tsx — Full-width loading state with preview + animated score placeholders

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThumbnail } from "../hooks/useThumbnail";
import { Skeleton } from "./ui/Skeleton";
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
    <div style={{ display: "flex", gap: 24, padding: "24px 0", alignItems: "flex-start", maxWidth: 900, margin: "0 auto", width: "100%" }} className="max-md:flex-col">
      {/* LEFT — Creative preview (50/50 split) */}
      <div style={{ flex: "0 0 50%", minWidth: 0 }} className="max-md:w-full">
        <div style={{
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          background: "#111113",
          position: "relative",
        }}>
          {displayUrl ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {isImage ? (
                <img src={displayUrl} alt={sanitizeFileName(file.name)} style={{ width: "100%", maxHeight: 440, objectFit: "contain", display: "block" }} />
              ) : (
                <img src={displayUrl} alt={sanitizeFileName(file.name)} style={{ width: "100%", maxHeight: 440, objectFit: "cover", display: "block" }} />
              )}
            </motion.div>
          ) : (
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}><path d="M5 3l14 9-14 9V3z"/></svg>
              </div>
            </div>
          )}

          {/* Scanning overlay */}
          <motion.div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.08) 50%, transparent 100%)",
              pointerEvents: "none",
            }}
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* File info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "0 4px" }}>
          <span style={{ fontSize: 12, color: "#52525b", fontFamily: "var(--font-mono, monospace)" }}>
            {(() => { const n = sanitizeFileName(file.name); return n.length > 30 ? n.slice(0, 27) + "..." : n; })()} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
          <button onClick={onCancel} style={{ fontSize: 11, color: "#52525b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Cancel
          </button>
        </div>
      </div>

      {/* RIGHT — Live analysis preview */}
      <div style={{ flex: 1, minWidth: 0 }} className="max-md:w-full">
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 20,
        }}>
          {/* Header with Cutsheet icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <img src="/cutsheet-logo-clear.png" alt="" style={{ width: 16, height: 16 }} />
              <div style={{
                position: "absolute", bottom: -1, right: -1,
                width: 8, height: 8, borderRadius: "50%", background: "#6366f1",
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Analyzing...</span>
          </div>

          {/* Score placeholder (skeleton shimmer) */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Skeleton width="88px" height="88px" radius="50%" />
          </div>

          {/* Metric rows with progressive reveal */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                        animate={{ width: "60%" }}
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

          {/* Progress bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${stage.pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #6366f1, #818cf8)" }}
              />
            </div>
          </div>

          {/* Stage hint */}
          <div style={{ marginTop: 12, minHeight: 20 }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={stageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 12, color: "#52525b", margin: 0, textAlign: "center" }}
              >
                {stage.label}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </div>
  );
}
