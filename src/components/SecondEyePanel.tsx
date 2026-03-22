// src/components/SecondEyePanel.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ArrowRight, CheckCircle } from "lucide-react";
import type { SecondEyeResult, SecondEyeFlag } from "../services/claudeService";

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  SecondEyeFlag["category"],
  { label: string; bg: string; text: string }
> = {
  scroll_trigger: { label: "Scroll risk", bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
  sound_off:     { label: "Sound-off",   bg: "rgba(99,102,241,0.1)", text: "#818cf8" },
  pacing:        { label: "Pacing",       bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  clarity:       { label: "Clarity",      bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

const SEVERITY_STYLES: Record<
  SecondEyeFlag["severity"],
  { borderColor: string; bg: string }
> = {
  critical: { borderColor: "#ef4444", bg: "rgba(239,68,68,0.04)" },
  warning:  { borderColor: "#f59e0b", bg: "rgba(245,158,11,0.04)" },
  note:     { borderColor: "#71717a", bg: "rgba(255,255,255,0.02)" },
};

// ─── SHIMMER ROWS (loading state) ────────────────────────────────────────────

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
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      {/* Top row: category badge + timestamp */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: cat.text,
            background: cat.bg,
            borderRadius: 9999,
            padding: "2px 8px",
            lineHeight: "16px",
          }}
        >
          {cat.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-geist-mono, 'Geist Mono', monospace)",
            color: "#52525b",
            flexShrink: 0,
          }}
        >
          {flag.timestamp}
        </span>
      </div>

      {/* Issue */}
      <p style={{ fontSize: 13, color: "#a1a1aa", margin: "4px 0 0", lineHeight: 1.5 }}>
        {flag.issue}
      </p>

      {/* Fix */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 6 }}>
        <ArrowRight size={10} color="#6366f1" style={{ marginTop: 3, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#71717a", fontStyle: "italic", lineHeight: 1.4 }}>
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
        margin: "20px 16px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Eye size={14} color="#71717a" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
            Second Eye Review
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#52525b", fontStyle: "italic" }}>
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
            <CheckCircle size={24} color="#10b981" />
            <span style={{ fontSize: 14, color: "#f4f4f5", fontWeight: 500 }}>
              No major issues found
            </span>
            <span style={{ fontSize: 12, color: "#71717a" }}>
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
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
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
                      background: "#ef4444",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>Would scroll at</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: "var(--font-geist-mono, 'Geist Mono', monospace)",
                      color: "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {result.scrollMoment.match(/^[\d:]+/)?.[0] ?? ""}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#ef4444", margin: "6px 0 0", lineHeight: 1.5 }}>
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
                      color: "#71717a",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8,
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
                      color: "#a1a1aa",
                      background: "rgba(239,68,68,0.06)",
                      borderRadius: 8,
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
