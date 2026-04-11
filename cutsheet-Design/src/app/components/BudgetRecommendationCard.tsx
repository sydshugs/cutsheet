import React from "react";
import { Info, Layers, Banknote, CalendarDays } from "lucide-react";

export function BudgetRecommendationCard() {
  return (
    <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-6 flex flex-col gap-6 font-['Geist',sans-serif] text-[#f4f4f5]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          BUDGET
        </span>
        <span className="text-[12px] font-medium text-zinc-400">
          Est. CPM $8–14 · YouTube
        </span>
      </div>

      {/* Hero Section */}
      <div className="flex items-center gap-3 flex-nowrap overflow-visible">
        <div className="text-[28px] font-bold tracking-tight text-[#f4f4f5] leading-none whitespace-nowrap shrink-0">
          $500 <span className="text-zinc-600 font-medium text-[28px] mx-1">–</span> $1,500
        </div>
        <div className="px-2.5 py-1 rounded-full bg-indigo-500/[0.15] text-indigo-300 text-[10px] font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap">
          TEST
        </div>
      </div>

      {/* Suggested Split Grid (Tiles) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col justify-center gap-1 p-3 h-[60px] rounded-[10px] bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
            Ad Sets
          </span>
          <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
            3
          </span>
        </div>
        <div className="flex flex-col justify-center gap-1 p-3 h-[60px] rounded-[10px] bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
            Per Set
          </span>
          <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
            $150–500
          </span>
        </div>
        <div className="flex flex-col justify-center gap-1 p-3 h-[60px] rounded-[10px] bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
            Window
          </span>
          <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
            7 Days
          </span>
        </div>
      </div>

      {/* Insight Line */}
      <div className="flex gap-3 items-start p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.04]">
        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[14px] text-zinc-400 leading-[1.6]">
          Score suggests strong hook but weak brand recall. Test at low spend before scaling.
        </p>
      </div>
    </div>
  );
}
