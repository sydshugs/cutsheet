import { motion, AnimatePresence } from "framer-motion";
import { PenTool, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import type { StaticSecondEyeResult, StaticSecondEyeFlag } from "../services/claudeService";

const AREA_META: Record<
  StaticSecondEyeFlag["area"],
  { label: string; bg: string; text: string }
> = {
  typography: { label: "Typography", bg: "rgba(99,102,241,0.1)", text: "#818cf8" },
  layout:     { label: "Layout",     bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  hierarchy:  { label: "Hierarchy",  bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  contrast:   { label: "Contrast",   bg: "rgba(239,68,68,0.1)",  text: "#ef4444" },
};

const SEVERITY_STYLES: Record<
  StaticSecondEyeFlag["severity"],
  { borderColor: string; bg: string }
> = {
  critical: { borderColor: "#ef4444", bg: "rgba(239,68,68,0.04)" },
  warning:  { borderColor: "#f59e0b", bg: "rgba(245,158,11,0.04)" },
  note:     { borderColor: "#71717a", bg: "rgba(255,255,255,0.02)" },
};

function ShimmerRow({ width }: { width: string }) {
  return (
    <div
      style={{
        height: 56,
        borderRadius: 8,
        background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        width,
      }}
    />
  );
}

function FlagRow({ flag, index }: { flag: StaticSecondEyeFlag; index: number }) {
  const sev = SEVERITY_STYLES[flag.severity];
  const area = AREA_META[flag.area];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      style={{
        borderLeft: `2px solid ${sev.borderColor}`,
        background: sev.bg,
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: area.text,
            background: area.bg,
            borderRadius: 9999,
            padding: "2px 8px",
            lineHeight: "16px",
          }}
        >
          {area.label}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#a1a1aa", margin: "4px 0 0", lineHeight: 1.5 }}>
        {flag.issue}
      </p>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
        <ArrowRight size={10} color="#6366f1" style={{ marginTop: 3, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#71717a", fontStyle: "italic", lineHeight: 1.4 }}>
          {flag.fix}
        </span>
      </div>
    </motion.div>
  );
}

export function StaticSecondEyePanel({
  result,
  loading,
}: {
  result: StaticSecondEyeResult | null;
  loading: boolean;
}) {
  if (!loading && !result) return null;

  const hasFlags = result && result.flags.length > 0;
  const isEmpty = result && result.flags.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        margin: "12px 16px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PenTool size={14} color="#71717a" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
            Design Review
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#52525b", fontStyle: "italic" }}>
          Typography & layout
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <ShimmerRow width="100%" />
            <ShimmerRow width="92%" />
            <ShimmerRow width="96%" />
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
          </motion.div>
        )}

        {/* Empty */}
        {isEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 0",
              gap: 6,
            }}
          >
            <CheckCircle size={24} color="#10b981" />
            <span style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 500 }}>
              Design looks clean
            </span>
            <span style={{ fontSize: 12, color: "#71717a" }}>
              No major typography or layout issues found.
            </span>
          </motion.div>
        )}

        {/* Flags */}
        {hasFlags && result && (
          <motion.div
            key="flags"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {/* Top issue */}
            {result.topIssue && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={12} color="#ef4444" />
                  <span style={{ fontSize: 11, color: "#71717a" }}>Top issue</span>
                </div>
                <p style={{ fontSize: 13, color: "#ef4444", margin: "6px 0 0", lineHeight: 1.5 }}>
                  {result.topIssue}
                </p>
              </motion.div>
            )}

            {/* Flag list */}
            {result.flags.map((flag, i) => (
              <FlagRow key={`${flag.area}-${i}`} flag={flag} index={i} />
            ))}

            {/* Verdict */}
            {result.overallDesignVerdict && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: result.flags.length * 0.06 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 12, color: "#71717a", fontStyle: "italic" }}>
                  Overall: {result.overallDesignVerdict}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
