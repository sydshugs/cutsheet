// src/components/SecondEyePanel.tsx — redesigned to match Figma node 229:2054
// Flows inside CreativeVerdictAndSecondEye outer card — no own card wrapper.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, ChevronDown } from "lucide-react";
import type { SecondEyeResult, SecondEyeFlag } from "../services/claudeService";

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────

const TAG_STYLES: Record<
  SecondEyeFlag["category"],
  { label: string; bg: string; color: string; dot: string; activeBg: string; activeBorder: string }
> = {
  scroll_trigger: {
    label: "Scroll risk",
    bg: "rgba(251,44,54,0.10)",
    color: "#ff6467",
    dot: "#fb2c36",
    activeBg: "rgba(251,44,54,0.04)",
    activeBorder: "rgba(251,44,54,0.20)",
  },
  sound_off: {
    label: "Sound-off",
    bg: "rgba(0,188,125,0.10)",
    color: "#00d492",
    dot: "#00bc7d",
    activeBg: "rgba(0,188,125,0.04)",
    activeBorder: "rgba(0,188,125,0.20)",
  },
  pacing: {
    label: "Pacing",
    bg: "rgba(173,70,255,0.10)",
    color: "#c27aff",
    dot: "#ad46ff",
    activeBg: "rgba(173,70,255,0.04)",
    activeBorder: "rgba(173,70,255,0.20)",
  },
  clarity: {
    label: "Clarity",
    bg: "rgba(43,127,255,0.10)",
    color: "#51a2ff",
    dot: "#2b7fff",
    activeBg: "rgba(43,127,255,0.04)",
    activeBorder: "rgba(43,127,255,0.30)",
  },
};

// ─── LOADING SHIMMER ─────────────────────────────────────────────────────────

function ShimmerRow({ width }: { width: string }) {
  return (
    <div
      style={{
        height: 56,
        borderRadius: 24,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        width,
      }}
    />
  );
}

// ─── SCROLL ALERT CARD ───────────────────────────────────────────────────────

function ScrollAlert({ scrollMoment }: { scrollMoment: string }) {
  const timestamp = scrollMoment.match(/^[\d:]+/)?.[0] ?? "";
  const reason = scrollMoment.replace(/^[\d:]+\s*[-—–]?\s*/, "");

  return (
    <div
      style={{
        borderRadius: 24,
        padding: "13px 15px",
        background: "rgba(251,44,54,0.08)",
        border: "1px solid rgba(251,44,54,0.15)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* "Would scroll" badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 600,
            color: "#ff6467",
            background: "rgba(251,44,54,0.15)",
            borderRadius: 999,
            padding: "3px 10px",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#ff6467", flexShrink: 0 }}
          />
          Would scroll
        </span>
        {/* Timestamp */}
        {timestamp && (
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono, 'SF Mono', monospace)",
              fontWeight: 600,
              color: "#ff6467",
            }}
          >
            {timestamp}
          </span>
        )}
      </div>
      {reason && (
        <p style={{ fontSize: 12, color: "#9f9fa9", margin: "8px 0 0", lineHeight: 1.55 }}>
          {reason}
        </p>
      )}
    </div>
  );
}

// ─── FLAG TIMELINE ────────────────────────────────────────────────────────────

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

  const parseTime = (ts: string): number => {
    const match = ts.match(/(\d+):(\d+)/);
    if (!match) return 0;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  const times = flags.map((f) => parseTime(f.timestamp.split("-")[0].trim()));
  const maxTime = Math.max(...times, 1);

  // Unique categories for legend (preserve insertion order)
  const legendEntries = [...new Map(flags.map((f) => [f.category, TAG_STYLES[f.category]])).entries()];

  return (
    <div style={{ padding: "12px 0 0" }}>
      {/* Legend row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        {legendEntries.map(([cat, style]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ width: 6, height: 6, borderRadius: "50%", background: style.dot, flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "#52525c",
                textTransform: "uppercase",
                letterSpacing: "0.45px",
              }}
            >
              {style.label}
            </span>
          </div>
        ))}
      </div>

      {/* Track */}
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
          const pct = (times[i] / maxTime) * 90 + 5; // 5–95% to keep dots on-track
          const cat = TAG_STYLES[flag.category];
          const isActive = activeIndex === i;
          const isHovered = hoveredIndex === i;
          const showTooltip = isActive || isHovered;

          return (
            <div
              key={`dot-${i}`}
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
              {/* Dot / handle */}
              <div
                style={{
                  width: isActive ? 10 : 8,
                  height: isActive ? 10 : 8,
                  borderRadius: "50%",
                  background: cat.dot,
                  border: isActive ? "1.5px solid #fff" : "none",
                  boxShadow: isActive ? `0 0 6px ${cat.dot}` : "none",
                  transition: "all 150ms",
                }}
              />
              {/* Tooltip */}
              {showTooltip && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono, 'SF Mono', monospace)",
                      color: "#d4d4d8",
                    }}
                  >
                    {flag.timestamp.split("-")[0].trim()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FLAG CARD ────────────────────────────────────────────────────────────────

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      onClick={onClick}
      style={{
        borderRadius: 24,
        border: isActive
          ? `1px solid ${cat.activeBorder}`
          : "1px solid rgba(255,255,255,0.06)",
        background: isActive ? cat.activeBg : "rgba(255,255,255,0.02)",
        padding: "13px 17px 13px 17px",
        cursor: "pointer",
        transition: "border-color 150ms, background 150ms",
        position: "relative",
      }}
    >
      {/* Top row: category badge + timestamp + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Category badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 600,
            color: cat.color,
            background: cat.bg,
            borderRadius: 999,
            padding: "3px 8px",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: cat.dot }} />
          {cat.label}
        </span>

        {/* Timestamp */}
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--mono, 'SF Mono', monospace)",
            color: "#52525c",
          }}
        >
          {flag.timestamp}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={14}
          color="#52525c"
          style={{
            marginLeft: "auto",
            transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
            flexShrink: 0,
          }}
        />
      </div>

      {/* FIX label + fix text */}
      <div style={{ marginTop: 10 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "#52525c",
            textTransform: "uppercase",
            letterSpacing: "0.45px",
          }}
        >
          FIX
        </span>
        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#e4e4e7",
            margin: "4px 0 0",
            lineHeight: 1.5,
          }}
        >
          {flag.fix}
        </p>
      </div>

      {/* Issue text — expanded only */}
      <div
        style={{
          maxHeight: isActive ? 120 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease-in-out",
        }}
      >
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 10, paddingTop: 10 }}>
          <p style={{ fontSize: 12, color: "#71717b", margin: 0, lineHeight: 1.55 }}>
            {flag.issue}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── COMMUNICATES / MISSES CARD ───────────────────────────────────────────────

function CommunicatesCard({ communicates, misses }: { communicates: string; misses: string }) {
  return (
    <div
      style={{
        borderRadius: 24,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        padding: "13px 17px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {communicates && (
        <div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: "#00bc7d",
              textTransform: "uppercase",
              letterSpacing: "0.45px",
              display: "block",
              marginBottom: 4,
            }}
          >
            Communicates
          </span>
          <p style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.55 }}>
            {communicates}
          </p>
        </div>
      )}
      {misses && (
        <div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: "#ff6467",
              textTransform: "uppercase",
              letterSpacing: "0.45px",
              display: "block",
              marginBottom: 4,
            }}
          >
            Misses
          </span>
          <p style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.55 }}>
            {misses}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────
// No own card wrapper — flows inside CreativeVerdictAndSecondEye outer card.

export function SecondEyePanel({
  result,
  loading,
}: {
  result: SecondEyeResult | null;
  loading: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  if (!loading && !result) return null;

  const hasFlags = result && result.flags.length > 0;
  const isEmpty = result && result.flags.length === 0;

  const handleCardClick = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div>
      {/* Sub-header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "16px 16px 0",
        }}
      >
        <Eye size={14} color="#71717b" />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7" }}>
          Second Eye Review
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "12px 16px 16px",
            }}
          >
            <ShimmerRow width="100%" />
            <ShimmerRow width="94%" />
            <ShimmerRow width="97%" />
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
              padding: "24px 16px",
              gap: 8,
            }}
          >
            <CheckCircle size={22} color="#00bc7d" />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#f4f4f5" }}>
              No major issues found
            </span>
            <span style={{ fontSize: 12, color: "#71717b" }}>
              Looks clean to a first-time viewer.
            </span>
          </motion.div>
        )}

        {/* Flags */}
        {hasFlags && result && (
          <motion.div
            key="flags"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: 0 }}
          >
            {/* Scroll alert */}
            {result.scrollMoment && (
              <div style={{ padding: "12px 16px 0" }}>
                <ScrollAlert scrollMoment={result.scrollMoment} />
              </div>
            )}

            {/* Timeline */}
            <div style={{ padding: "0 16px" }}>
              <FlagTimeline
                flags={result.flags}
                activeIndex={activeIndex}
                onDotClick={handleCardClick}
              />
            </div>

            {/* Fix cards */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "12px 16px 0",
              }}
            >
              {result.flags.map((flag, i) => (
                <FlagCard
                  key={`${flag.timestamp}-${i}`}
                  flag={flag}
                  index={i}
                  isActive={activeIndex === i}
                  onClick={() => handleCardClick(i)}
                />
              ))}
            </div>

            {/* Communicates / Misses */}
            {(result.whatItCommunicates || result.whatItFails) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: result.flags.length * 0.04 }}
                style={{ padding: "8px 16px 16px" }}
              >
                <CommunicatesCard
                  communicates={result.whatItCommunicates ?? ""}
                  misses={result.whatItFails ?? ""}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
