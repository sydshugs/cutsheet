// CreativeVerdictAndSecondEye — redesigned to match screenshot
// Bold verdict headline + PRIORITY FIX card + category icon cards + bottom verdict bar.
// Video format only (paid + organic).
import { useMemo } from "react";
import { AlertCircle, TrendingUp, CheckCircle } from "lucide-react";
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
    label:     "Not Ready",
    icon:      AlertCircle,
  },
  needs_work: {
    pillBg:    "rgba(254,154,0,0.10)",
    pillColor: "#fea000",
    label:     "Needs Work",
    icon:      TrendingUp,
  },
  ready: {
    pillBg:    "rgba(0,188,125,0.10)",
    pillColor: "#00d492",
    label:     "Strong",
    icon:      CheckCircle,
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
    return secondEyeResult.flags.filter((f) => f.severity === "critical").length;
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
      {/* ── Verdict headline block ── */}
      <div style={{ padding: "18px 16px 16px" }}>
        {/* Verdict state pill */}
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: chip.pillColor,
              background: chip.pillBg,
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            <ChipIcon size={11} />
            {chip.label}
            {criticalCount > 0 && verdictState !== "ready" && (
              <span style={{ opacity: 0.7 }}>
                &nbsp;· {criticalCount} critical {criticalCount === 1 ? "fix" : "fixes"}
              </span>
            )}
          </span>
        </div>

        {/* Headline */}
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#f4f4f5",
            margin: "0 0 6px",
            lineHeight: 1.45,
          }}
        >
          {verdictOneLiner}
        </p>

        {/* Detail */}
        {verdictDetail && (
          <p style={{ fontSize: 13, color: "#71717b", margin: 0, lineHeight: 1.55 }}>
            {verdictDetail}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />

      {/* ── Second Eye Review ── */}
      <SecondEyePanel
        result={secondEyeResult ?? null}
        loading={secondEyeLoading ?? false}
      />
    </div>
  );
}
