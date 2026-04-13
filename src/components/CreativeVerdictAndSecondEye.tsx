// CreativeVerdictAndSecondEye — matches Figma node 229:2054
// Combined "Creative verdict & second eye" panel for video ads.
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Eye, TrendingDown, TrendingUp, CheckCircle,
  ChevronDown,
} from "lucide-react";
import type { SecondEyeResult } from "../services/claudeService";

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface CreativeVerdictAndSecondEyeProps {
  verdictOneLiner: string;
  verdictDetail: string;
  verdictState: "not_ready" | "needs_work" | "ready";
  secondEyeResult?: SecondEyeResult | null;
  secondEyeLoading?: boolean;
}

// ─── CONFIGS ──────────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  not_ready: {
    label: "Not ready",
    pillBg: "rgba(251,44,54,0.10)",
    pillColor: "#ff6467",
    gradient: "linear-gradient(171.28deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)",
    iconBg: "rgba(251,44,54,0.15)",
    iconColor: "#ff6467",
    labelColor: "#ff6467",
    Icon: TrendingDown,
  },
  needs_work: {
    label: "Needs work",
    pillBg: "rgba(254,154,0,0.10)",
    pillColor: "#fea000",
    gradient: "linear-gradient(171.28deg, rgba(254,154,0,0.08) 0%, rgba(254,154,0,0.02) 100%)",
    iconBg: "rgba(254,154,0,0.15)",
    iconColor: "#fea000",
    labelColor: "#fea000",
    Icon: TrendingUp,
  },
  ready: {
    label: "Strong",
    pillBg: "rgba(0,188,125,0.10)",
    pillColor: "#00d492",
    gradient: "linear-gradient(171.28deg, rgba(0,188,125,0.08) 0%, rgba(0,188,125,0.02) 100%)",
    iconBg: "rgba(0,188,125,0.15)",
    iconColor: "#00d492",
    labelColor: "#00d492",
    Icon: CheckCircle,
  },
} as const;

const CATEGORY_CONFIG: Record<string, {
  label: string;
  color: string;
  markerColor: string;
  bg: string;
  border: string;
  cardBg: string;
}> = {
  scroll_trigger: {
    label: "Scroll risk",
    color: "#ff6467",
    markerColor: "#fb2c36",
    bg: "rgba(251,44,54,0.10)",
    border: "rgba(251,44,54,0.25)",
    cardBg: "rgba(251,44,54,0.04)",
  },
  pacing: {
    label: "Pacing",
    color: "#c27aff",
    markerColor: "#ad46ff",
    bg: "rgba(173,70,255,0.10)",
    border: "rgba(173,70,255,0.25)",
    cardBg: "rgba(173,70,255,0.04)",
  },
  sound_off: {
    label: "Sound-off",
    color: "#00d492",
    markerColor: "#00bc7d",
    bg: "rgba(0,188,125,0.10)",
    border: "rgba(0,188,125,0.25)",
    cardBg: "rgba(0,188,125,0.04)",
  },
  clarity: {
    label: "Clarity",
    color: "#51a2ff",
    markerColor: "#2b7fff",
    bg: "rgba(43,127,255,0.08)",
    border: "rgba(43,127,255,0.30)",
    cardBg: "rgba(43,127,255,0.04)",
  },
};

const LEGEND_ORDER = ["scroll_trigger", "pacing", "sound_off", "clarity"];

function getCatCfg(category: string) {
  const key = category.toLowerCase().replace(/[- ]/g, "_");
  return (
    CATEGORY_CONFIG[key] ?? {
      label: category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      color: "#71717a",
      markerColor: "#71717a",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.12)",
      cardBg: "rgba(255,255,255,0.02)",
    }
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseTsSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  return 0;
}

/** Parse a timestamp or range like "0:03", "0:00-0:24", "0:05–0:12".
 *  Returns the MIDPOINT of a range so dots spread across the timeline. */
function parseTs(ts: string): number {
  const rangeParts = ts.split(/[-–—]/);
  if (rangeParts.length >= 2) {
    const start = parseTsSeconds(rangeParts[0]);
    const end = parseTsSeconds(rangeParts[1]);
    return (start + end) / 2;
  }
  return parseTsSeconds(ts);
}

function extractScrollParts(scrollMoment: string | null): { time: string; text: string } | null {
  if (!scrollMoment) return null;
  const withSep = scrollMoment.match(/^(\d+:\d+)\s*[—–\-]\s*(.*)/s);
  if (withSep) return { time: withSep[1].trim(), text: withSep[2].trim() };
  const timeOnly = scrollMoment.match(/^(\d+:\d+)(.*)/s);
  if (timeOnly) return { time: timeOnly[1].trim(), text: timeOnly[2].replace(/^[\s—–\-]+/, "").trim() };
  return { time: "", text: scrollMoment };
}

// ─── SHIMMER ──────────────────────────────────────────────────────────────────

function Shimmer({ height = 72 }: { height?: number }) {
  return (
    <div
      className="rounded-2xl"
      style={{
        height,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
        backgroundSize: "200% 100%",
        animation: "cvsShimmer 1.5s infinite",
      }}
    />
  );
}

// ─── FLAG CARD ────────────────────────────────────────────────────────────────

type Flag = SecondEyeResult["flags"][number];

function FlagCard({
  flag,
  index,
  isExpanded,
  onToggle,
}: {
  flag: Flag;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const cfg = getCatCfg(flag.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05 }}
      className="rounded-xl border cursor-pointer"
      style={{
        backgroundColor: isExpanded ? cfg.cardBg : "rgba(255,255,255,0.02)",
        borderColor: isExpanded ? cfg.border : "rgba(255,255,255,0.06)",
        transition: "background-color 200ms ease, border-color 200ms ease",
      }}
      onClick={onToggle}
    >
      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div
            className="h-[19px] flex items-center px-2 rounded"
            style={{ background: cfg.bg }}
          >
            <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px]" style={{ color: "#52525c" }}>
              {flag.timestamp}
            </span>
            <ChevronDown
              size={14}
              style={{
                color: "#52525c",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div>
          <p
            className="text-[9px] font-semibold uppercase tracking-[0.45px] mb-1"
            style={{ color: "#52525c" }}
          >
            Fix
          </p>
          <p
            className={isExpanded ? "" : "truncate"}
            style={{ fontSize: 14, color: "#e4e4e7", margin: 0, lineHeight: 1.625 }}
          >
            {flag.fix}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

function Timeline({
  flags,
  expandedIdx,
  onToggle,
}: {
  flags: Flag[];
  expandedIdx: number | null;
  onToggle: (i: number) => void;
}) {
  const presentCategories = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const f of flags) {
      const key = f.category.toLowerCase().replace(/[- ]/g, "_");
      if (!seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
    return LEGEND_ORDER.filter((k) => seen.has(k)).concat(
      order.filter((k) => !LEGEND_ORDER.includes(k))
    );
  }, [flags]);

  const maxSecs = useMemo(() => {
    let max = 10;
    for (const f of flags) {
      const rangeParts = f.timestamp.split(/[-–—]/);
      if (rangeParts.length >= 2) {
        max = Math.max(max, parseTsSeconds(rangeParts[1]));
      } else {
        max = Math.max(max, parseTsSeconds(f.timestamp));
      }
    }
    return max;
  }, [flags]);

  return (
    <div className="flex flex-col gap-[28px]">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {presentCategories.map((key) => {
          const cfg = getCatCfg(key);
          return (
            <div key={key} className="flex items-center gap-[6px]">
              <div
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ background: cfg.markerColor }}
              />
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.45px]"
                style={{ color: "#52525c" }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrubber track — mt-7 reserves space for the tooltip above */}
      <div className="relative h-[5px] w-full rounded-full mt-7" style={{ background: "rgba(255,255,255,0.06)" }}>
        {flags.map((flag, i) => {
          const secs = parseTs(flag.timestamp);
          const pct = maxSecs > 0 ? (secs / maxSecs) * 100 : 0;
          const cfg = getCatCfg(flag.category);
          const isActive = expandedIdx === i;

          return (
            <div
              key={i}
              className="absolute flex flex-col items-center cursor-pointer"
              style={{
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => onToggle(i)}
            >
              {/* Timestamp tooltip above when active */}
              {isActive && (
                <div
                  className="absolute -top-8 bg-[#18181b] border border-white/[0.10] text-zinc-300 text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10"
                  style={{ transform: "translateX(-50%)", left: "50%" }}
                >
                  {flag.timestamp}
                </div>
              )}
              {/* Dot */}
              <div
                className={`rounded-full transition-all ${
                  isActive
                    ? "w-[10px] h-[10px] border-[1.5px] border-white"
                    : "w-[8px] h-[8px] hover:scale-125"
                }`}
                style={{
                  background: cfg.markerColor,
                  ...(isActive ? { boxShadow: `0 0 6px ${cfg.markerColor}` } : {}),
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CreativeVerdictAndSecondEye({
  verdictOneLiner,
  verdictDetail,
  verdictState,
  secondEyeResult,
  secondEyeLoading,
}: CreativeVerdictAndSecondEyeProps) {
  const vc = VERDICT_CONFIG[verdictState];
  const VerdictIcon = vc.Icon;

  const criticalCount = useMemo(
    () => (secondEyeResult?.flags ?? []).filter((f) => f.severity === "critical").length,
    [secondEyeResult]
  );

  const scrollParts = extractScrollParts(secondEyeResult?.scrollMoment ?? null);

  // First critical scroll_trigger flag for "Would scroll" card
  const scrollFlag = useMemo(
    () =>
      secondEyeResult?.flags.find(
        (f) =>
          f.severity === "critical" &&
          f.category.toLowerCase().replace(/[- ]/g, "_") === "scroll_trigger"
      ) ?? secondEyeResult?.flags.find((f) => f.severity === "critical"),
    [secondEyeResult]
  );

  const hasFlags = (secondEyeResult?.flags?.length ?? 0) > 0;

  // ── Interactive timeline state ──────────────────────────────────────────────
  const [expandedFlagIdx, setExpandedFlagIdx] = useState<number | null>(0);

  function toggleFlag(i: number) {
    setExpandedFlagIdx((prev) => (prev === i ? null : i));
  }

  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "'Geist', sans-serif",
        marginTop: 12,
      }}
    >
      {/* ── Header bar ── */}
      <div
        style={{
          height: 45,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left: icon + title */}
        <div className="flex items-center gap-2">
          <Eye size={13} color="#71717a" />
          <span
            className="text-[14px] font-medium whitespace-nowrap"
            style={{ color: "#e4e4e7" }}
          >
            Creative verdict &amp; second eye
          </span>
        </div>

        {/* Right: subtitle + state pill */}
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] whitespace-nowrap hidden sm:block"
            style={{ color: "#52525c" }}
          >
            Fresh viewer perspective
          </span>
          <div
            className="flex items-center gap-[6px] h-[19px] px-2 rounded-full"
            style={{ background: vc.pillBg }}
          >
            <div
              className="w-[10px] h-[10px]"
              style={{ flexShrink: 0 }}
            >
              <VerdictIcon size={10} color={vc.pillColor} />
            </div>
            <span
              className="text-[10px] font-semibold whitespace-nowrap"
              style={{ color: vc.pillColor }}
            >
              {vc.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Creative Verdict block ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "16px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundImage: vc.gradient,
        }}
      >
        {/* Icon box */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: vc.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <VerdictIcon size={16} color={vc.iconColor} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-[10px]">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.5px]"
              style={{ color: vc.labelColor }}
            >
              Creative Verdict
            </span>
            {criticalCount > 0 && (
              <span
                className="text-[10px]"
                style={{ color: "#71717b" }}
              >
                {criticalCount} critical {criticalCount === 1 ? "fix" : "fixes"}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#f4f4f5",
              margin: "0 0 6px",
              lineHeight: 1.625,
            }}
          >
            {verdictOneLiner}
          </p>
          {verdictDetail && (
            <p
              style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.625 }}
            >
              {verdictDetail}
            </p>
          )}
        </div>
      </div>

      {/* ── Second Eye Review ── */}
      <div style={{ padding: "16px 16px 16px" }}>
        {/* Section heading */}
        <div className="flex items-center gap-2 mb-[20px]">
          <Eye size={14} color="#9f9fa9" />
          <span
            className="text-[14px] font-semibold"
            style={{ color: "#e4e4e7" }}
          >
            Second Eye Review
          </span>
        </div>

        {/* Loading state */}
        {secondEyeLoading && !secondEyeResult && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <Shimmer height={72} />
            <Shimmer height={72} />
            <Shimmer height={88} />
            <style>{`@keyframes cvsShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          </motion.div>
        )}

        {/* Empty state */}
        {!secondEyeLoading && secondEyeResult && !hasFlags && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-6"
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

        {/* Null / not-yet-loaded */}
        {!secondEyeLoading && !secondEyeResult && (
          <div
            style={{
              fontSize: 12,
              color: "#52525c",
              padding: "12px 0",
            }}
          >
            Second Eye review will appear after analysis completes.
          </div>
        )}

        {/* Flags */}
        {secondEyeResult && hasFlags && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {/* "Would scroll" highlight card */}
            {(scrollParts || scrollFlag) && (
              <div
                className="rounded-3xl border px-4 py-3 flex flex-col gap-2"
                style={{
                  background: "rgba(251,44,54,0.08)",
                  borderColor: "rgba(251,44,54,0.15)",
                }}
              >
                <div className="flex items-center gap-2">
                  {/* "Would scroll" badge */}
                  <div
                    className="h-[19px] flex items-center gap-[6px] px-2 rounded"
                    style={{ background: "rgba(251,44,54,0.15)" }}
                  >
                    <div
                      className="w-[5px] h-[5px] rounded-full"
                      style={{ background: "#ff6467" }}
                    />
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "#ff6467" }}
                    >
                      Would scroll
                    </span>
                  </div>
                  {/* Timestamp */}
                  {(scrollParts?.time || scrollFlag?.timestamp) && (
                    <span
                      className="font-mono text-[11px] font-semibold"
                      style={{ color: "#ff6467" }}
                    >
                      {scrollParts?.time || scrollFlag?.timestamp}
                    </span>
                  )}
                </div>
                <p
                  style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.625 }}
                >
                  {scrollParts?.text || scrollFlag?.issue}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="my-1">
              <Timeline flags={secondEyeResult.flags} expandedIdx={expandedFlagIdx} onToggle={toggleFlag} />
            </div>

            {/* Fix cards */}
            <div className="flex flex-col gap-2 mt-2">
              {secondEyeResult.flags.map((flag, i) => (
                <FlagCard
                  key={`${flag.category}-${flag.timestamp}-${i}`}
                  flag={flag}
                  index={i}
                  isExpanded={expandedFlagIdx === i}
                  onToggle={() => toggleFlag(i)}
                />
              ))}
            </div>

            {/* Communicates / Misses */}
            {(secondEyeResult.whatItCommunicates || secondEyeResult.whatItFails) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: secondEyeResult.flags.length * 0.05 }}
                className="rounded-3xl border flex flex-col gap-3 px-[17px] py-[13px] mt-1"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.04)",
                }}
              >
                {secondEyeResult.whatItCommunicates && (
                  <div>
                    <span
                      className="block text-[9px] font-medium uppercase tracking-[0.45px] mb-1"
                      style={{ color: "#00bc7d" }}
                    >
                      Communicates
                    </span>
                    <p style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.625 }}>
                      {secondEyeResult.whatItCommunicates}
                    </p>
                  </div>
                )}
                {secondEyeResult.whatItFails && (
                  <div>
                    <span
                      className="block text-[9px] font-medium uppercase tracking-[0.45px] mb-1"
                      style={{ color: "#ff6467" }}
                    >
                      Misses
                    </span>
                    <p style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.625 }}>
                      {secondEyeResult.whatItFails}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
