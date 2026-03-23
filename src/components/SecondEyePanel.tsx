// src/components/SecondEyePanel.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ArrowRight, CheckCircle } from "lucide-react";
import type { SecondEyeResult, SecondEyeFlag } from "../services/claudeService";
import { SEVERITY_STYLES, CATEGORY_META } from "../lib/severityConfig";

// ─── SHIMMER ROWS (loading state) ────────────────────────────────────────────

function ShimmerRow({ width }: { width: string }) {
  return (
    <div className="cs-skeleton" style={{ height: 56, width }} />
  );
}

// ─── FLAG ROW ────────────────────────────────────────────────────────────────

function FlagRow({ flag, index }: { flag: SecondEyeFlag; index: number }) {
  const sev = SEVERITY_STYLES[flag.severity];
  const cat = CATEGORY_META[flag.category];

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
      {/* Top row: category badge + timestamp */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: cat.color,
            background: cat.bg,
            borderRadius: "var(--radius-full)",
            padding: "2px 8px",
            lineHeight: "16px",
          }}
        >
          {cat.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--mono)",
            color: "var(--ink-tertiary)",
            flexShrink: 0,
          }}
        >
          {flag.timestamp}
        </span>
      </div>

      {/* Issue */}
      <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
        {flag.issue}
      </p>

      {/* Fix */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
        <ArrowRight size={10} color="var(--accent)" style={{ marginTop: 3, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic", lineHeight: 1.4 }}>
          {flag.fix}
        </span>
      </div>
    </motion.div>
  );
}

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────

export function SecondEyePanel({
  result,
  loading,
}: {
  result: SecondEyeResult | null;
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
          <Eye size={14} color="var(--ink-faint)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            Second Eye Review
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-tertiary)", fontStyle: "italic" }}>
          Fresh viewer perspective
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading state */}
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

        {/* Empty state — no issues */}
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
              No major issues found
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              This looks clean to a first-time viewer.
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
            {/* Scroll moment (prominent, at top) */}
            {result.scrollMoment && (
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
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--error)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Would scroll at</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--mono)",
                      color: "var(--error)",
                      fontWeight: 500,
                    }}
                  >
                    {result.scrollMoment.match(/^[\d:]+/)?.[0] ?? ""}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--error)", margin: "6px 0 0", lineHeight: 1.5 }}>
                  {result.scrollMoment.replace(/^[\d:]+\s*[-—–]?\s*/, "")}
                </p>
              </motion.div>
            )}

            {/* Flag list */}
            {result.flags.map((flag, i) => (
              <FlagRow key={`${flag.timestamp}-${i}`} flag={flag} index={i} />
            ))}

            {/* Summary row */}
            {(result.whatItCommunicates || result.whatItFails) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: result.flags.length * 0.06 }}
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 4,
                  flexWrap: "wrap",
                }}
              >
                {result.whatItCommunicates && (
                  <span
                    title={result.whatItCommunicates}
                    style={{
                      fontSize: 12,
                      color: "var(--ink-faint)",
                      background: "var(--surface)",
                      borderRadius: "var(--radius-sm)",
                      padding: "6px 10px",
                      flex: "1 1 auto",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Communicates: {result.whatItCommunicates.length > 60
                      ? result.whatItCommunicates.slice(0, 60) + "…"
                      : result.whatItCommunicates}
                  </span>
                )}
                {result.whatItFails && (
                  <span
                    title={result.whatItFails}
                    style={{
                      fontSize: 12,
                      color: "var(--ink-muted)",
                      background: "var(--score-weak-bg)",
                      borderRadius: "var(--radius-sm)",
                      padding: "6px 10px",
                      flex: "1 1 auto",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Misses: {result.whatItFails.length > 60
                      ? result.whatItFails.slice(0, 60) + "…"
                      : result.whatItFails}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
