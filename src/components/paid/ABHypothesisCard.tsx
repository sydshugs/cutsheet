// src/components/paid/ABHypothesisCard.tsx
// Post-analysis card: identifies weakest dimension → generates one A/B hypothesis

import { FlaskConical } from "lucide-react";
import type { ABHypothesisResult } from "../../services/claudeService";

interface ABHypothesisCardProps {
  isLoading: boolean;
  data: ABHypothesisResult | null;
}

function scoreColor(score: number) {
  if (score >= 7) return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", text: "#10b981" };
  if (score >= 5) return { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" };
  return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "#ef4444" };
}

function liftColor(score: number) {
  if (score >= 5 && score < 7) return "#f59e0b";
  return "#10b981";
}

export function ABHypothesisCard({ isLoading, data }: ABHypothesisCardProps) {
  if (!isLoading && !data) return null;

  const colors = data ? scoreColor(data.weakestScore) : null;

  return (
    <div className="bg-[#18181b] border border-white/[0.06] rounded-[16px] pt-[25px] px-[25px] pb-px">
      <div className="flex flex-col gap-[12px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <FlaskConical size={14} color="#6366f1" />
            <span className="font-medium text-[13px] leading-[19.5px] text-[#f4f4f5]">
              A/B Hypothesis
            </span>
          </div>

          {isLoading && (
            <div className="h-[20px] w-[96px] rounded-full bg-white/[0.06] opacity-[0.66] animate-pulse" />
          )}

          {data && colors && (
            <div
              className="shrink-0 rounded-full flex items-center px-[9px] py-[3px] border"
              style={{ background: colors.bg, borderColor: colors.border }}
            >
              <span
                className="font-medium text-[10px] leading-[10px] whitespace-nowrap"
                style={{ color: colors.text }}
              >
                {data.weakestDimension} · {data.weakestScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Hypothesis block */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-[12px] pt-[13px] px-[13px] pb-px">
          {isLoading && (
            <div className="flex flex-col gap-[10px] pb-[13px]">
              <div className="h-[12px] w-[304px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
              <div className="h-[12px] w-[258px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
              <div className="h-[12px] w-[182px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
            </div>
          )}

          {data && (
            <p className="font-medium text-[13px] leading-[21.125px] text-[#f4f4f5] pb-[13px]">
              {data.hypothesis}
            </p>
          )}
        </div>

        {/* Control / Variant columns */}
        <div className="relative w-full">
          <div className="flex gap-[12px]">
            {/* Control */}
            <div className="flex-1 flex flex-col gap-[6px] min-w-0">
              <p className="font-semibold text-[9px] leading-[9px] tracking-[0.9px] uppercase text-[#52525b]">
                CONTROL
              </p>
              {isLoading ? (
                <div className="flex flex-col gap-[6px]">
                  <div className="h-[10px] w-[143px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
                  <div className="h-[10px] w-[111px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
                </div>
              ) : (
                <p className="text-[11px] leading-[15.125px] text-[#9f9fa9]">
                  {data?.control}
                </p>
              )}
            </div>

            {/* Variant */}
            <div className="flex-1 flex flex-col gap-[6px] min-w-0">
              <p className="font-semibold text-[9px] leading-[9px] tracking-[0.9px] uppercase text-[#6366f1]">
                VARIANT
              </p>
              {isLoading ? (
                <div className="flex flex-col gap-[6px]">
                  <div className="h-[10px] w-[143px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
                  <div className="h-[10px] w-[111px] max-w-full rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
                </div>
              ) : (
                <p className="text-[11px] leading-[15.125px] text-[#e4e4e7]">
                  {data?.variant}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer — Predicted lift */}
        <div className="border-t border-white/[0.06] pt-[13px] flex items-center justify-between">
          <span className="text-[11px] leading-[16.5px] text-[#71717a]">
            Predicted lift
          </span>
          {isLoading ? (
            <div className="h-[12px] w-[64px] rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
          ) : data ? (
            <span
              className="font-semibold text-[12px] leading-[18px]"
              style={{ color: liftColor(data.weakestScore) }}
            >
              {data.liftMin}–{data.liftMax}% {data.metric}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
