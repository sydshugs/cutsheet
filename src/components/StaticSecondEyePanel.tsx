import { motion, AnimatePresence } from "framer-motion";
import { PenTool, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import type { StaticSecondEyeResult, StaticSecondEyeFlag } from "../services/claudeService";
import { SEVERITY_STYLES } from "../lib/severityConfig";

const AREA_META: Record<
  StaticSecondEyeFlag["area"],
  { label: string; bg: string; color: string }
> = {
  typography: { label: "Typography", bg: "var(--accent-bg)",             color: "var(--accent-text)" },
  layout:     { label: "Layout",     bg: "var(--score-excellent-bg)",    color: "var(--success)" },
  hierarchy:  { label: "Hierarchy",  bg: "var(--score-average-bg)",      color: "var(--warn)" },
  contrast:   { label: "Contrast",   bg: "var(--score-weak-bg)",         color: "var(--error)" },
};

function ShimmerRow({ width }: { width: string }) {
  return (
    <div className="cs-skeleton" style={{ height: 56, width }} />
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
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: area.color,
            background: area.bg,
            borderRadius: "var(--radius-full)",
            padding: "2px 8px",
            lineHeight: "16px",
          }}
        >
          {area.label}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
        {flag.issue}
      </p>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
        <ArrowRight size={10} color="var(--accent)" style={{ marginTop: 3, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic", lineHeight: 1.4 }}>
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
        margin: "0 16px 16px",
        borderRadius: "var(--radius)",
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PenTool size={14} color="var(--ink-faint)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Design Review
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-tertiary)", fontStyle: "italic" }}>
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
            <CheckCircle size={24} color="var(--success)" />
            <span style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
              Design looks clean
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
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
                  background: "var(--score-weak-bg)",
                  border: "1px solid var(--score-weak-border)",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={12} color="var(--error)" />
                  <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Top issue</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--error)", margin: "6px 0 0", lineHeight: 1.5 }}>
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
                  background: "var(--surface)",
                  borderRadius: "var(--radius-sm)",
                  padding: 10,
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic" }}>
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
