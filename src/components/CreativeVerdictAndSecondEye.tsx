// CreativeVerdictAndSecondEye — redesigned to match Figma node 229:2054
// Video format only (paid + organic). Outer card shell wrapping verdict band + SecondEyePanel.
import { useMemo } from "react";
import { Eye, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { SecondEyeResult } from "../services/claudeService";
import { SecondEyePanel } from "./SecondEyePanel";

interface CreativeVerdictAndSecondEyeProps {
  verdictOneLiner: string;
  verdictDetail: string;
  verdictState: 'not_ready' | 'needs_work' | 'ready';
  secondEyeResult?: SecondEyeResult | null;
  secondEyeLoading?: boolean;
}

const VERDICT_CHIP = {
  not_ready: {
    pillBg:    "rgba(251,44,54,0.10)",
    pillColor: "#ff6467",
    label:     "Not ready",
    icon:      AlertCircle,
    gradient:  "linear-gradient(171.28deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)",
    borderColor: "rgba(255,255,255,0.06)",
    avatarBg:  "rgba(251,44,54,0.15)",
    labelColor: "#ff6467",
  },
  needs_work: {
    pillBg:    "rgba(254,154,0,0.10)",
    pillColor: "#ffb900",
    label:     "Needs work",
    icon:      TrendingUp,
    gradient:  "linear-gradient(171.28deg, rgba(254,154,0,0.08) 0%, rgba(254,154,0,0.02) 100%)",
    borderColor: "rgba(255,255,255,0.06)",
    avatarBg:  "rgba(254,154,0,0.15)",
    labelColor: "#ffb900",
  },
  ready: {
    pillBg:    "rgba(0,188,125,0.10)",
    pillColor: "#00d492",
    label:     "Strong",
    icon:      CheckCircle,
    gradient:  "linear-gradient(171.28deg, rgba(0,188,125,0.08) 0%, rgba(0,188,125,0.02) 100%)",
    borderColor: "rgba(255,255,255,0.06)",
    avatarBg:  "rgba(0,188,125,0.15)",
    labelColor: "#00d492",
  },
};

export function CreativeVerdictAndSecondEye({
  verdictOneLiner,
  verdictDetail,
  verdictState,
  secondEyeResult,
  secondEyeLoading,
}: CreativeVerdictAndSecondEyeProps) {
  const chip = VERDICT_CHIP[verdictState];
  const ChipIcon = chip.icon;

  const criticalCount = useMemo(() => {
    if (!secondEyeResult?.flags) return 0;
    return secondEyeResult.flags.filter(
      (f) => f.category === "scroll_trigger" || f.severity === "critical"
    ).length;
  }, [secondEyeResult]);

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
      {/* ── Header bar (45px) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 45,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left: icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Eye size={13} color="#52525c" />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#e4e4e7" }}>
            Creative verdict &amp; second eye
          </span>
        </div>

        {/* Right: subtitle + verdict pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#52525c" }}>Fresh viewer perspective</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              color: chip.pillColor,
              background: chip.pillBg,
              borderRadius: 999,
              padding: "3px 9px",
              whiteSpace: "nowrap",
            }}
          >
            <ChipIcon size={10} />
            {chip.label}
          </span>
        </div>
      </div>

      {/* ── Creative Verdict banner ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "16px",
          background: chip.gradient,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: chip.avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ChipIcon size={16} color={chip.labelColor} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: chip.labelColor,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Creative Verdict
            </span>
            {criticalCount > 0 && verdictState !== "ready" && (
              <span style={{ fontSize: 10, color: "#71717b" }}>
                {criticalCount} critical {criticalCount === 1 ? "fix" : "fixes"}
              </span>
            )}
          </div>

          {/* Headline */}
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#f4f4f5",
              margin: "0 0 4px",
              lineHeight: 1.5,
            }}
          >
            {verdictOneLiner}
          </p>

          {/* Detail */}
          {verdictDetail && (
            <p style={{ fontSize: 12, color: "#9f9fa9", margin: 0, lineHeight: 1.55 }}>
              {verdictDetail}
            </p>
          )}
        </div>
      </div>

      {/* ── Second Eye Review ── */}
      <SecondEyePanel
        result={secondEyeResult ?? null}
        loading={secondEyeLoading ?? false}
      />
    </div>
  );
}
