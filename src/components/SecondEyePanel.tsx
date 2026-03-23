// src/components/SecondEyePanel.tsx — Second Eye Review (redesigned)
// Fix-first hierarchy, flag timeline, scroll alert block
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, ChevronDown } from "lucide-react";
import type { SecondEyeResult, SecondEyeFlag } from "../services/claudeService";

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────

const TAG_STYLES: Record<
  SecondEyeFlag["category"],
  { label: string; bg: string; color: string; dot: string }
> = {
  scroll_trigger: { label: "Scroll risk", bg: "rgba(239,68,68,0.12)", color: "#ef4444", dot: "#ef4444" },
  sound_off:      { label: "Sound-off",   bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  pacing:         { label: "Pacing",      bg: "rgba(168,85,247,0.12)", color: "#a855f7", dot: "#a855f7" },
  clarity:        { label: "Clarity",     bg: "rgba(59,130,246,0.12)", color: "#3b82f6", dot: "#3b82f6" },
};

// ─── SHIMMER (loading) ───────────────────────────────────────────────────────

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

// ─── SCROLL ALERT ────────────────────────────────────────────────────────────

function ScrollAlert({ scrollMoment }: { scrollMoment: string }) {
  const timestamp = scrollMoment.match(/^[\d:]+/)?.[0] ?? "";
  const reason = scrollMoment.replace(/^[\d:]+\s*[-—–]?\s*/, "");

  return (
    <div
      style={{
        borderRadius: 10,
        padding: "12px 14px",
        background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)",
        border: "1px solid rgba(239,68,68,0.15)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#ef4444",
            background: "rgba(239,68,68,0.15)",
            borderRadius: 6,
            padding: "3px 10px",
            lineHeight: "14px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
          Would scroll
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--mono)",
            color: "#ef4444",
            fontWeight: 600,
          }}
        >
          {timestamp}
        </span>
      </div>
      {reason && (
        <p style={{ fontSize: 12, color: "#a1a1aa", margin: "8px 0 0", lineHeight: 1.55 }}>
          {reason}
        </p>
      )}
    </div>
  );
}

// ─── FLAG TIMELINE ───────────────────────────────────────────────────────────

function FlagTimeline({
  flags,
  activeIndex,
  onDotClick,
}: {
  flags: SecondEyeFlag[];
  activeIndex: number | null;
  onDotClick: (index: number) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parse timestamp "M:SS" to seconds for positioning
  const parseTime = (ts: string): number => {
    const match = ts.match(/(\d+):(\d+)/);
    if (!match) return 0;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  // Get max time for normalization
  const times = flags.map(f => parseTime(f.timestamp.split("-")[0].trim()));
  const maxTime = Math.max(...times, 1);

  // Deduplicate legend entries
  const legendEntries = [...new Map(flags.map(f => [f.category, TAG_STYLES[f.category]])).entries()];

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
        {legendEntries.map(([cat, style]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "#52525b" }}>{style.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      <div
        style={{
          position: "relative",
          height: 5,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 99,
          width: "100%",
        }}
      >
        {flags.map((flag, i) => {
          const pct = (times[i] / maxTime) * 92 + 4; // 4-96% range to keep dots visible
          const cat = TAG_STYLES[flag.category];
          const isActive = activeIndex === i;
          const isHovered = hoveredIndex === i;
          const showLabel = isActive || isHovered;

          return (
            <div
              key={`${flag.timestamp}-${i}`}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                cursor: "pointer",
                zIndex: isActive ? 2 : 1,
              }}
              onClick={() => onDotClick(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Dot */}
              <div
                style={{
                  width: isActive ? 10 : 8,
                  height: isActive ? 10 : 8,
                  borderRadius: "50%",
                  background: cat.dot,
                  border: isActive ? "1.5px solid white" : "none",
                  transition: "all 150ms",
                  boxShadow: isActive ? `0 0 6px ${cat.dot}` : "none",
                }}
              />
              {/* Timestamp tooltip */}
              {showLabel && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 9,
                    fontFamily: "var(--mono)",
                    color: cat.color,
                    background: "rgba(0,0,0,0.8)",
                    borderRadius: 4,
                    padding: "1px 5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {flag.timestamp.split("-")[0].trim()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FLAG CARD (fix-first, expandable) ───────────────────────────────────────

function FlagCard({
  flag,
  index,
  isActive,
  onClick,
}: {
  flag: SecondEyeFlag;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const cat = TAG_STYLES[flag.category];
  const isScrollRisk = flag.category === 'scroll_trigger';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      style={{
        border: isActive 
          ? "1px solid rgba(255,255,255,0.12)" 
          : isScrollRisk 
            ? "1px solid rgba(239,68,68,0.1)" 
            : "1px solid rgba(255,255,255,0.05)",
        background: isActive 
          ? "rgba(255,255,255,0.025)" 
          : isScrollRisk
            ? "linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(255,255,255,0.01) 100%)"
            : "rgba(255,255,255,0.01)",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "border-color 150ms, background 150ms",
      }}
    >
      {/* Top row: tag + timestamp */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: cat.color,
            background: cat.bg,
            borderRadius: 6,
            padding: "3px 8px",
            lineHeight: "14px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span 
            style={{ 
              width: 5, 
              height: 5, 
              borderRadius: "50%", 
              background: cat.dot,
            }} 
          />
          {cat.label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--mono)",
            color: "#52525b",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          {flag.timestamp}
        </span>
      </div>

      {/* Fix label + fix text (always visible, primary) */}
      <div style={{ marginTop: 10 }}>
        <span style={{ fontSize: 9, color: "#52525b", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 500 }}>
          FIX
        </span>
        <p style={{ fontSize: 13, color: "#e4e4e7", fontWeight: 500, margin: "4px 0 0", lineHeight: 1.55 }}>
          {flag.fix}
        </p>
      </div>

      {/* Issue (expandable) */}
      <div
        style={{
          maxHeight: isActive ? 120 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease-in-out",
        }}
      >
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 10, paddingTop: 10 }}>
          <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.55 }}>
            {flag.issue}
          </p>
        </div>
      </div>

      {/* Expand indicator */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <ChevronDown
          size={12}
          color="#3f3f46"
          style={{
            transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        />
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!loading && !result) return null;

  const hasFlags = result && result.flags.length > 0;
  const isEmpty = result && result.flags.length === 0;

  const handleCardClick = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        margin: "16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.05)",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
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

        {/* Empty state */}
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
            {/* 1. Scroll alert — separate from cards */}
            {result.scrollMoment && <ScrollAlert scrollMoment={result.scrollMoment} />}

            {/* 2. Flag timeline */}
            <FlagTimeline
              flags={result.flags}
              activeIndex={activeIndex}
              onDotClick={handleCardClick}
            />

            {/* 3. Flag cards — fix-first, expandable */}
            {result.flags.map((flag, i) => (
              <FlagCard
                key={`${flag.timestamp}-${i}`}
                flag={flag}
                index={i}
                isActive={activeIndex === i}
                onClick={() => handleCardClick(i)}
              />
            ))}

            {/* Summary - What video communicates/misses */}
            {(result.whatItCommunicates || result.whatItFails) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: result.flags.length * 0.04 }}
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.015)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {result.whatItCommunicates && (
                  <div style={{ marginBottom: result.whatItFails ? 10 : 0 }}>
                    <span 
                      style={{ 
                        fontSize: 9, 
                        fontWeight: 500, 
                        color: "#10b981", 
                        textTransform: "uppercase" as const, 
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Communicates
                    </span>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#a1a1aa",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {result.whatItCommunicates}
                    </p>
                  </div>
                )}
                {result.whatItFails && (
                  <div>
                    <span 
                      style={{ 
                        fontSize: 9, 
                        fontWeight: 500, 
                        color: "#ef4444", 
                        textTransform: "uppercase" as const, 
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Misses
                    </span>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#a1a1aa",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {result.whatItFails}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
