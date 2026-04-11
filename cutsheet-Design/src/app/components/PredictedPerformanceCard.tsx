import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Target, Clock, Activity } from "lucide-react";

export function PredictedPerformanceCard() {
  const [openSection, setOpenSection] = useState(false);

  return (
    <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-5 flex flex-col gap-5 font-['Geist',sans-serif] text-[#f4f4f5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PREDICTED PERFORMANCE
        </span>
        <div className="px-2 py-1 rounded-md border text-[11px] font-medium tracking-wide bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          High confidence
        </div>
      </div>

      {/* EST. CTR Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              EST. CTR
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-bold leading-none tracking-tight text-[#f4f4f5]">
                0.8% <span className="text-zinc-500 font-medium text-[24px] mx-0.5">–</span> 1.4%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 mb-1">
            <span className="text-[12px] font-medium text-zinc-400">YouTube avg · 0.6%</span>
          </div>
        </div>

        {/* Range Bar */}
        <div className="relative pt-6 pb-2 mt-1">
          {/* Labels */}
          <div className="absolute top-0 left-0 text-[10px] text-zinc-500 font-medium">0%</div>
          <div className="absolute top-0 right-0 text-[10px] text-zinc-500 font-medium">3%+</div>
          
          <div className="relative h-1 w-full bg-[#27272a] rounded-full">
            {/* Platform Average Marker */}
            <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-zinc-400 z-10" style={{ left: '20%' }} />
            
            {/* Highlighted Range */}
            <motion.div
              initial={{ left: '26.6%', width: 0 }}
              animate={{ left: '26.6%', width: '20%' }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 bottom-0 bg-[#6366f1] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">CVR POTENTIAL</span>
          </div>
          <span className="text-[18px] font-semibold text-zinc-200">1.2% – 2.1%</span>
        </div>
        
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">CREATIVE FATIGUE</span>
          </div>
          <span className="text-[18px] font-semibold text-zinc-200">~14 days</span>
        </div>
      </div>

      {/* AI Insight */}
      <p className="text-[14px] text-zinc-400 leading-[1.6]">
        Strong hook and clear message drive above-average CTR potential. Brand recall at <span className="text-[#f59e0b] font-medium">4.2</span> is the limiting factor — expect fatigue after 2 weeks without creative refresh.
      </p>

      {/* Deep Dive Row */}
      <div className="flex flex-col mt-2 border-t border-white/[0.04]">
        <button
          onClick={() => setOpenSection(!openSection)}
          className="flex items-center justify-between h-[44px] group"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6366f1]" />
            <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">
              What's driving this
            </span>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
              openSection ? "rotate-90" : ""
            }`}
          />
        </button>
        {openSection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="pb-4 text-[13px] text-zinc-400 leading-[1.6]"
          >
            The video's Hook Score (9.1) strongly correlates with high early CTR. However, the low Brand Score (4.2) indicates users may not retain the core value proposition, leading to faster ad fatigue as the audience cycles through the creative.
          </motion.div>
        )}
      </div>
    </div>
  );
}