// src/components/StaticSecondEyePanel.tsx — Design Review (redesigned)
// Fix-first hierarchy, category filter bar, severity dots
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import type { StaticSecondEyeResult, StaticSecondEyeFlag } from "../services/claudeService";

// ─── CATEGORY + SEVERITY CONFIG ──────────────────────────────────────────────

const AREA_STYLES: Record<
  StaticSecondEyeFlag["area"],
  { label: string; bg: string; color: string }
> = {
  hierarchy:  { label: "Hierarchy",  bg: "rgba(129,140,248,0.08)", color: "#818cf8" },
  typography: { label: "Typography", bg: "rgba(251,191,36,0.1)",   color: "#d97706" },
  layout:     { label: "Layout",     bg: "rgba(16,185,129,0.08)",  color: "#10b981" },
  contrast:   { label: "Contrast",   bg: "rgba(239,68,68,0.08)",   color: "#ef4444" },
};

const SEVERITY_DOT: Record<StaticSecondEyeFlag["severity"], string> = {
  critical: "#ef4444",
  warning:  "#f59e0b",
  note:     "rgba(113,113,122,0.5)",
};

// ─── SHIMMER ─────────────────────────────────────────────────────────────────

function ShimmerRow({ width }: { width: string }) {
  return (
    <div
      style={{
        height: 44,
        borderRadius: 8,
        background: "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        width,
      }}
    />
  );
}

// ─── TOP ISSUE BLOCK ─────────────────────────────────────────────────────────

function TopIssueBlock({ topIssue, topFlag }: { topIssue: string; topFlag?: StaticSecondEyeFlag }) {
  // Use the first critical flag's fix as the headline if available, otherwise show topIssue as-is
  const fixText = topFlag?.fix;
  const issueText = topFlag?.issue ?? topIssue;

  return (
    <div
      style={{
        background: "rgba(239,68,68,0.07)",
        border: "0.5px solid rgba(239,68,68,0.2)",
        borderRadius: 10,
        padding: "11px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <AlertCircle size={11} color="#ef4444" />
        <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 500 }}>Top issue</span>
      </div>
      {fixText ? (
        <>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7", margin: "6px 0 0", lineHeight: 1.5 }}>
            {fixText}
          </p>
          <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0", lineHeight: 1.5 }}>
            {issueText}
          </p>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "#ef4444", margin: "6px 0 0", lineHeight: 1.5 }}>
          {topIssue}
        </p>
      )}
    </div>
  );
}

// ─── CATEGORY FILTER BAR ─────────────────────────────────────────────────────

type FilterCategory = "all" | StaticSecondEyeFlag["area"];

function CategoryFilterBar({
  flags,
  active,
  onFilter,
}: {
  flags: StaticSecondEyeFlag[];
  active: FilterCategory;
  onFilter: (cat: FilterCategory) => void;
}) {
  // Count per category
  const counts: Record<string, number> = { all: flags.length };
  for (const f of flags) counts[f.area] = (counts[f.area] ?? 0) + 1;

  const categories: { key: FilterCategory; label: string; color?: string; bg?: string }[] = [
    { key: "all", label: "All" },
    ...(counts.hierarchy ? [{ key: "hierarchy" as const, ...AREA_STYLES.hierarchy }] : []),
    ...(counts.typography ? [{ key: "typography" as const, ...AREA_STYLES.typography }] : []),
    ...(counts.layout ? [{ key: "layout" as const, ...AREA_STYLES.layout }] : []),
    ...(counts.contrast ? [{ key: "contrast" as const, ...AREA_STYLES.contrast }] : []),
  ];

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
      {categories.map((cat) => {
        const isActive = active === cat.key;
        const count = counts[cat.key] ?? 0;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onFilter(cat.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 99,
              cursor: "pointer",
              transition: "all 150ms",
              background: cat.key === "all"
                ? "rgba(255,255,255,0.04)"
                : cat.bg ?? "rgba(255,255,255,0.04)",
              color: cat.key === "all"
                ? (isActive ? "#e4e4e7" : "#71717a")
                : cat.color ?? "#71717a",
              border: isActive
                ? `0.5px solid ${cat.color ?? "rgba(255,255,255,0.15)"}`
                : "0.5px solid transparent",
            }}
          >
            {cat.key !== "all" && (
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
            )}
            {cat.label ?? cat.key}
          </button>
        );
      })}
    </div>
  );
}

// ─── FLAG CARD ───────────────────────────────────────────────────────────────

function DesignReviewCard({
  flag,
  index,
  isExpanded,
  onClick,
}: {
  flag: StaticSecondEyeFlag;
  index: number;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const area = AREA_STYLES[flag.area];
  const sevColor = SEVERITY_DOT[flag.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      style={{
        border: isExpanded ? "1px solid rgba(255,255,255,0.15)" : "0.5px solid rgba(255,255,255,0.06)",
        background: isExpanded ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 150ms, background 150ms",
      }}
    >
      {/* Top row: tag + severity dot */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: area.color,
            background: area.bg,
            borderRadius: 99,
            padding: "2px 8px",
            lineHeight: "16px",
          }}
        >
          {area.label}
        </span>
        <span
          style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor, flexShrink: 0 }}
          title={flag.severity}
        />
      </div>

      {/* Fix — always visible, primary, no label */}
      <p style={{ fontSize: 13, color: "#e4e4e7", fontWeight: 500, margin: "8px 0 0", lineHeight: 1.5 }}>
        {flag.fix}
      </p>

      {/* Issue — expandable */}
      <div
        style={{
          maxHeight: isExpanded ? 100 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease-in-out",
        }}
      >
        <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", marginTop: 8, paddingTop: 8 }}>
          <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.55 }}>
            {flag.issue}
          </p>
        </div>
      </div>

      {/* Expand indicator */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <ChevronDown
          size={12}
          color="#3f3f46"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────

export function StaticSecondEyePanel({
  result,
  loading,
}: {
  result: StaticSecondEyeResult | null;
  loading: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!loading && !result) return null;

  const hasFlags = result && result.flags.length > 0;
  const isEmpty = result && result.flags.length === 0;

  const visibleFlags = result
    ? activeFilter === "all"
      ? result.flags
      : result.flags.filter(f => f.area === activeFilter)
    : [];

  const handleCardClick = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  const handleFilter = (cat: FilterCategory) => {
    setActiveFilter(cat);
    setExpandedIndex(null);
  };

  // Find the first critical flag for the top issue block
  const topCriticalFlag = result?.flags.find(f => f.severity === "critical");

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
            {/* 1. Top issue block */}
            {result.topIssue && (
              <TopIssueBlock topIssue={result.topIssue} topFlag={topCriticalFlag} />
            )}

            {/* 2. Category filter bar */}
            <CategoryFilterBar
              flags={result.flags}
              active={activeFilter}
              onFilter={handleFilter}
            />

            {/* 3. Flag cards */}
            {visibleFlags.map((flag, i) => (
              <DesignReviewCard
                key={`${flag.area}-${i}`}
                flag={flag}
                index={i}
                isExpanded={expandedIndex === i}
                onClick={() => handleCardClick(i)}
              />
            ))}

            {/* 4. Overall summary */}
            {result.overallDesignVerdict && (
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 10, color: "#52525b", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                  Overall
                </span>
                <p style={{ fontSize: 12, color: "#a1a1aa", margin: "4px 0 0", lineHeight: 1.6 }}>
                  {result.overallDesignVerdict}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
