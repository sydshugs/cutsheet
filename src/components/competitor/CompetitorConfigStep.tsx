// src/components/competitor/CompetitorConfigStep.tsx
// Step 2 — configure platform/format and trigger analysis

import { Swords, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { FilePreview } from "./CompetitorUploadStep";

const BRAND_COLOR = "var(--accent)";

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
const FORMATS = ["video", "static"] as const;
type Platform = (typeof PLATFORMS)[number];
type Format = (typeof FORMATS)[number];

const SLIDE = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

interface CompetitorConfigStepProps {
  yourFile: File | null;
  competitorFile: File | null;
  platform: Platform;
  format: Format;
  error: string | null;
  canAnalyze: boolean;
  onPlatformChange: (p: Platform) => void;
  onFormatChange: (f: Format) => void;
  onYourFileRemove: () => void;
  onCompetitorFileRemove: () => void;
  onBack: () => void;
  onAnalyze: () => void;
  onRetry: () => void;
  onReset: () => void;
}

export function CompetitorConfigStep({
  yourFile,
  competitorFile,
  platform,
  format,
  error,
  canAnalyze,
  onPlatformChange,
  onFormatChange,
  onYourFileRemove,
  onCompetitorFileRemove,
  onBack,
  onAnalyze,
  onRetry,
  onReset,
}: CompetitorConfigStepProps) {
  return (
    <motion.div
      key="s2"
      {...SLIDE}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24 }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#52525b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}
      >
        <ChevronLeft size={14} /> Back
      </button>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", margin: "0 0 20px", textAlign: "center" }}>
        Ready to compare
      </h3>

      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Both file previews side by side */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Your Ad",    file: yourFile,       onRemove: onYourFileRemove },
            { label: "Competitor", file: competitorFile, onRemove: onCompetitorFileRemove },
          ].map(({ label, file: f, onRemove }) => (
            <div key={label} style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: "#52525b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{label}</p>
              {f ? (
                <FilePreview file={f} onRemove={onRemove} />
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 12 }}>
                  <span style={{ fontSize: 12, color: "#52525b" }}>—</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Platform selector */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#52525b", marginBottom: 8, fontWeight: 500 }}>Platform</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPlatformChange(p)}
                style={{
                  height: 34, padding: "0 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  background: platform === p ? BRAND_COLOR : "rgba(255,255,255,0.03)",
                  border: `1px solid ${platform === p ? BRAND_COLOR : "rgba(255,255,255,0.08)"}`,
                  color: platform === p ? "white" : "#71717a",
                  fontWeight: platform === p ? 500 : 400,
                  transition: "background-color 150ms, border-color 150ms, color 150ms",
                }}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#52525b", marginBottom: 8, fontWeight: 500 }}>Format</p>
          <div style={{ display: "flex", gap: 6 }}>
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                style={{
                  height: 34, padding: "0 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  background: format === f ? BRAND_COLOR : "rgba(255,255,255,0.03)",
                  border: `1px solid ${format === f ? BRAND_COLOR : "rgba(255,255,255,0.08)"}`,
                  color: format === f ? "white" : "#71717a",
                  fontWeight: format === f ? 500 : 400,
                  transition: "background-color 150ms, border-color 150ms, color 150ms",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0, lineHeight: 1.5 }}>{error}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={onRetry}
                style={{ height: 32, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "background-color 150ms, border-color 150ms" }}
              >
                Retry
              </button>
              <button
                type="button"
                onClick={onReset}
                style={{ height: 32, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#71717a", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "background-color 150ms, border-color 150ms" }}
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Analyze button */}
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!yourFile || !competitorFile || !canAnalyze}
          style={{ width: "100%", height: 50, borderRadius: 9999, border: "none", background: BRAND_COLOR, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background-color 150ms, opacity 150ms" }}
        >
          <Swords size={18} /> Compare Ads
        </button>
      </div>
    </motion.div>
  );
}
