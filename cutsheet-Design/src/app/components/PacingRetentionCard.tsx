import React from "react";
import { Zap } from "lucide-react";

export function PacingRetentionCard() {
  return (
    <div className="w-full flex flex-col shrink-0 rounded-2xl border border-white/[0.06] bg-[#18181b] overflow-hidden">
      
      {/* HEADER */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/[0.10] border border-indigo-500/15 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-[#6366f1]" />
        </div>
        <span className="text-sm font-semibold text-zinc-200">Pacing & Retention</span>
        <div className="ml-auto text-xs font-semibold rounded-lg px-3 py-1.5 bg-amber-500/10 text-amber-400">
          Moderate
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 flex flex-col">
        
        {/* Metric Tiles */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Tile 1 — AVG SCENE */}
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              AVG SCENE
            </span>
            <span className="text-sm font-medium text-zinc-100">
              4.8s
            </span>
          </div>

          {/* Tile 2 — PACING */}
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              PACING
            </span>
            <span className="text-sm font-semibold text-amber-400">
              Moderate
            </span>
          </div>
        </div>

        {/* Retention Curve bar */}
        <div className="mb-5 flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            RETENTION CURVE
          </span>
          <div 
            className="w-full h-[6px] rounded-full overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 20%, #10b981 40%, #10b981 60%, #f59e0b 80%, #ef4444 100%)' }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-mono text-zinc-600">0s</span>
            <span className="text-[10px] font-mono text-zinc-600">25%</span>
            <span className="text-[10px] font-mono text-zinc-600">50%</span>
            <span className="text-[10px] font-mono text-zinc-600">75%</span>
            <span className="text-[10px] font-mono text-zinc-600">100%</span>
          </div>
        </div>

        {/* Key insight text */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">
          The initial text overlay is the primary hook. The dog's excitement and the owner's interaction with the unseen employee keep the viewer engaged, waiting for the 'traumatizing' event.
        </p>

        {/* Drop-off Risk section */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            DROP-OFF RISK
          </span>
          <div className="rounded-xl p-4 bg-red-500/[0.08] border border-red-500/15 flex items-start gap-3.5">
            <div className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 shrink-0">
              Overall
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-zinc-200">
                The abrupt cut to black at 0:22s without a clear resolution or explanation of the 'trauma' could lead to drop
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                off, especially since the promised event isn't fully shown. For a conversion ad, the lack of a CTA is the biggest drop
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0 mt-1" />
          </div>
        </div>

      </div>
    </div>
  );
}