// BudgetCard — redesigned to match Figma spec (node 217:933)

import { Info } from "lucide-react";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { BudgetRecommendation } from "../../services/analyzerService";

interface BudgetCardProps {
  engineBudget?: EngineBudgetRecommendation | null;
  budget?: BudgetRecommendation | null;
  onNavigateSettings?: () => void;
}

const ACTION_BADGE = {
  test:    { label: 'TEST',  style: 'bg-indigo-500/[0.15] text-indigo-300' },
  limited: { label: 'LIMIT', style: 'bg-amber-500/[0.15] text-amber-300' },
  hold:    { label: 'HOLD',  style: 'bg-red-500/[0.15] text-red-400' },
} as const;

export function BudgetCard({ engineBudget, budget, onNavigateSettings }: BudgetCardProps) {
  // Engine-based budget (primary path)
  if (engineBudget) {
    const badge = ACTION_BADGE[engineBudget.action];
    const weeklyMin = engineBudget.dailyBudget ? engineBudget.dailyBudget.min * 7 : null;
    const weeklyMax = engineBudget.dailyBudget ? engineBudget.dailyBudget.max * 7 : null;

    return (
      <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-6 flex flex-col gap-6 font-['Geist',sans-serif] text-[#f4f4f5]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            BUDGET
          </span>
          <span className="text-[12px] font-medium text-zinc-400">
            Est. CPM {engineBudget.platformCPM} · {engineBudget.platform === 'all' ? 'All platforms' : engineBudget.platform}
          </span>
        </div>

        {/* Hero */}
        {engineBudget.action !== 'hold' && weeklyMin !== null && weeklyMax !== null ? (
          <>
            <div className="flex items-center gap-3 flex-nowrap">
              <div className="text-[28px] font-bold tracking-tight text-[#f4f4f5] leading-none whitespace-nowrap shrink-0">
                ${weeklyMin} <span className="text-zinc-600 font-medium text-[28px] mx-1">–</span> ${weeklyMax}
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap ${badge.style}`}>
                {badge.label}
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col justify-center gap-1 p-3 h-[60px] rounded-[10px] bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Ad Sets</span>
                <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">3</span>
              </div>
              <div className="flex flex-col justify-center gap-1 p-3 h-[60px] rounded-[10px] bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Per Set</span>
                <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
                  ${engineBudget.dailyBudget!.min}–{engineBudget.dailyBudget!.max}/day
                </span>
              </div>
              <div className="flex flex-col justify-center gap-1 p-3 h-[60px] rounded-[10px] bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Window</span>
                <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">{engineBudget.testDuration}</span>
              </div>
            </div>
          </>
        ) : (
          /* Hold state */
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badge.style}`}>
              {badge.label}
            </div>
            <span className="text-sm text-zinc-400">Fix creative before spending</span>
          </div>
        )}

        {/* Insight */}
        <div className="flex gap-3 items-start p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.04]">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[14px] text-zinc-400 leading-[1.6]">
            {engineBudget.scaleSignal ?? engineBudget.advice}
          </p>
        </div>

        {engineBudget.niche === "Other" && onNavigateSettings && (
          <button
            type="button"
            onClick={onNavigateSettings}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-transparent border-none cursor-pointer p-0 transition-colors -mt-4"
          >
            Set niche for personalized budgets →
          </button>
        )}
      </div>
    );
  }

  // Legacy budget fallback
  if (budget) {
    return (
      <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-6 flex flex-col gap-4 font-['Geist',sans-serif] text-[#f4f4f5]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">BUDGET</span>
          <span className="text-[13px] font-medium text-zinc-300">{budget.verdict}</span>
        </div>
        {budget.daily && (
          <div className="text-[28px] font-bold tracking-tight leading-none">
            {budget.daily}<span className="text-zinc-600 text-[18px] font-medium ml-1">/day</span>
          </div>
        )}
        <div className="flex gap-3 items-start p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.04]">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[14px] text-zinc-400 leading-[1.6]">{budget.reason}</p>
        </div>
      </div>
    );
  }

  return null;
}
