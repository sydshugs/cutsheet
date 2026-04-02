// src/components/SecondEyePanel.tsx — redesigned to match screenshot
// Category icon cards + PRIORITY FIX amber card + bottom verdict bar. No timeline.
// Flows inside CreativeVerdictAndSecondEye outer card — no own card wrapper.
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, VolumeX, Activity, Info, CheckCircle, XCircle, type LucideIcon } from "lucide-react";
import type { SecondEyeResult, SecondEyeFlag } from "../services/claudeService";

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  scroll_trigger: {
    label: "Scroll Risk",
    icon: AlertTriangle,
    color: "#ff6467",
    bg: "rgba(251,44,54,0.12)",
  },
  sound_off: {
    label: "Sound-Off",
    icon: VolumeX,
    color: "#00d492",
    bg: "rgba(0,188,125,0.12)",
  },
  pacing: {
    label: "Motion",
    icon: Activity,
    color: "#c27aff",
    bg: "rgba(173,70,255,0.12)",
  },
  clarity: {
    label: "Clarity",
    icon: Info,
    color: "#51a2ff",
    bg: "rgba(43,127,255,0.12)",
  },
};

function getCategoryConfig(category: string) {
  // Normalize to lowercase so AI-returned values like "Sound_off" or "Clarity" match the config keys
  const key = category.toLowerCase();
  return CATEGORY_CONFIG[key] ?? {
    label: category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    icon: AlertTriangle,
    color: "#71717a",
    bg: "rgba(255,255,255,0.08)",
  };
}

// ─── SHIMMER ─────────────────────────────────────────────────────────────────

function ShimmerCard({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 14,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// ─── PRIORITY FIX CARD (amber) ────────────────────────────────────────────────

function PriorityFixCard({ text }: { text: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "rgba(254,154,0,0.06)",
        border: "1px solid rgba(254,154,0,0.18)",
        padding: "13px 15px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "rgba(254,154,0,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={15} color="#fea000" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            color: "#fea000",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: 4,
          }}
        >
          Priority Fix
        </span>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7", margin: 0, lineHeight: 1.5 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

// ─── CATEGORY FIX CARD ────────────────────────────────────────────────────────

function CategoryFixCard({ flag, index }: { flag: SecondEyeFlag; index: number }) {
  const cfg = getCategoryConfig(flag.category);
  const CatIcon = cfg.icon;
  const isCritical = flag.severity === "critical";
  const isWarning = flag.severity === "warning";

  const badgeColor = isCritical ? "#ff6467" : isWarning ? "#fea000" : "#71717a";
  const badgeBg = isCritical
    ? "rgba(251,44,54,0.10)"
    : isWarning
    ? "rgba(254,154,0,0.10)"
    : "rgba(255,255,255,0.06)";
  const badgeLabel = isCritical ? "High Priority" : isWarning ? "Med Priority" : "Note";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05 }}
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        padding: "13px 15px",
      }}
    >
      {/* Top row: icon box + category name + priority badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: cfg.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CatIcon size={15} color={cfg.color} />
        </div>

        <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", flex: 1 }}>
          {cfg.label}
        </span>

        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: badgeColor,
            background: badgeBg,
            borderRadius: 999,
            padding: "3px 9px",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Fix text */}
      <p
        style={{
          fontSize: 13,
          color: "#9f9fa9",
          margin: "10px 0 0",
          lineHeight: 1.55,
        }}
      >
        {flag.fix}
      </p>
    </motion.div>
  );
}

// ─── COMMUNICATES / MISSES CARD ───────────────────────────────────────────────

function CommunicatesCard({ communicates, misses }: { communicates: string; misses: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        padding: "13px 15px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {communicates && (
        <div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#00bc7d",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
              fontSize: 10,
              fontWeight: 600,
              color: "#ff6467",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
  if (!loading && !result) return null;

  const hasFlags = result && result.flags.length > 0;
  const isEmpty = result && result.flags.length === 0;

  // Pick the priority fix: scrollMoment text or first critical flag's fix
  const priorityFixText =
    result?.scrollMoment ??
    result?.flags.find((f) => f.severity === "critical")?.fix ??
    null;

  // Remaining flags (exclude the one used as priority fix if it was a flag)
  const displayFlags =
    result?.flags.filter((f) => {
      if (!result.scrollMoment && f.severity === "critical") {
        // Skip the first critical flag since it's shown as priority fix
        const firstCritical = result.flags.find((x) => x.severity === "critical");
        return f !== firstCritical;
      }
      return true;
    }) ?? [];

  const criticalCount = result?.flags.filter((f) => f.severity === "critical").length ?? 0;

  return (
    <div>
      <AnimatePresence mode="wait">
        {/* Loading */}
        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px" }}
          >
            <ShimmerCard height={72} />
            <ShimmerCard height={88} />
            <ShimmerCard height={88} />
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
            style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 16px" }}
          >
            {/* Priority Fix card */}
            {priorityFixText && <PriorityFixCard text={priorityFixText} />}

            {/* Category fix cards */}
            {displayFlags.map((flag, i) => (
              <CategoryFixCard
                key={`${flag.category}-${i}`}
                flag={flag}
                index={i}
              />
            ))}

            {/* Communicates / Misses */}
            {(result.whatItCommunicates || result.whatItFails) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: displayFlags.length * 0.05 }}
              >
                <CommunicatesCard
                  communicates={result.whatItCommunicates ?? ""}
                  misses={result.whatItFails ?? ""}
                />
              </motion.div>
            )}

            {/* Bottom verdict bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingTop: 4,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: criticalCount > 0 ? "#ff6467" : "#fea000",
                  background: criticalCount > 0 ? "rgba(251,44,54,0.10)" : "rgba(254,154,0,0.10)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                <XCircle size={11} />
                {criticalCount > 0 ? "Not Ready" : "Needs Work"}
              </span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#71717b" }}>
                {criticalCount > 0
                  ? `${criticalCount} critical ${criticalCount === 1 ? "fix" : "fixes"}`
                  : `${result.flags.length} ${result.flags.length === 1 ? "issue" : "issues"} flagged`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
