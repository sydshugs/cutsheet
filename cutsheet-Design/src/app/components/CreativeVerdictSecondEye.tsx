import React, { useState } from "react";
import { Eye, AlertCircle, TrendingUp, ChevronDown } from "lucide-react";

export function CreativeVerdictSecondEye() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const flags = [
    {
      id: 1,
      category: "Clarity",
      colorClass: "text-blue-400",
      bgClass: "bg-blue-500/10",
      dotClass: "bg-blue-500",
      activeBorderClass: "border-blue-500/30",
      activeCardBgClass: "bg-blue-500/[0.04]",
      glowColor: "#3b82f6",
      time: "0:00–0:24",
      timestamp: "0:00",
      fix: "Replace McDonald's storyline with dog discovering your actual product while maintaining same playful energy",
      pos: "15%"
    },
    {
      id: 2,
      category: "Scroll risk",
      colorClass: "text-red-400",
      bgClass: "bg-red-500/10",
      dotClass: "bg-red-500",
      activeBorderClass: "border-red-500/30",
      activeCardBgClass: "bg-red-500/[0.04]",
      glowColor: "#ef4444",
      time: "0:00–0:24",
      timestamp: "0:00",
      fix: "Add end-screen CTA with product showcase, price, and 'Shop Now' button for minimum 3 seconds",
      pos: "35%"
    },
    {
      id: 3,
      category: "Pacing",
      colorClass: "text-purple-400",
      bgClass: "bg-purple-500/10",
      dotClass: "bg-purple-500",
      activeBorderClass: "border-purple-500/30",
      activeCardBgClass: "bg-purple-500/[0.04]",
      glowColor: "#a855f7",
      time: "0:22–0:24",
      timestamp: "0:22",
      fix: "Transform trauma reveal into product demonstration where dog's excitement targets your product instead",
      pos: "70%"
    },
    {
      id: 4,
      category: "Sound-off",
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      dotClass: "bg-emerald-500",
      activeBorderClass: "border-emerald-500/30",
      activeCardBgClass: "bg-emerald-500/[0.04]",
      glowColor: "#10b981",
      time: "0:00–0:24",
      timestamp: "0:00",
      fix: "Add brand logo and product benefit text during dog's excited moments to bridge entertainment with value",
      pos: "85%"
    }
  ];

  return (
    <div className="w-full flex flex-col shrink-0 rounded-2xl border border-white/[0.06] bg-[#18181b] overflow-hidden">
      
      {/* SECTION 1 — Header row */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Eye size={13} className="text-zinc-500" />
          <span className="text-sm font-medium text-zinc-200">Creative verdict & second eye</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-600 italic">Fresh viewer perspective</span>
          <div className="bg-red-500/10 text-red-400 text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1">
            <AlertCircle size={10} />
            Not ready
          </div>
        </div>
      </div>

      {/* SECTION 2 — Creative Verdict band */}
      <div className="px-4 py-4 border-b border-white/[0.06] flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)' }}>
        <div className="w-8 h-8 rounded-lg bg-red-500/[0.15] flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-[#ef4444]" />
        </div>
        <div className="flex flex-col pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Creative Verdict</span>
            <span className="text-[10px] text-zinc-500">3 critical fixes</span>
          </div>
          <p className="text-sm font-medium text-zinc-100 leading-relaxed mt-1">
            Entertaining dog video lacks any conversion intent or clear product integration.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            The initial text overlay creates a strong curiosity gap...
          </p>
        </div>
      </div>

      {/* SECTION 3 — Second Eye Review */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={14} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Second Eye Review</h3>
        </div>

        {/* Scroll Alert block */}
        <div className="rounded-xl bg-red-500/[0.08] border border-red-500/15 px-3.5 py-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-red-500/15 text-red-400 text-[10px] font-semibold rounded px-2 py-0.5 flex items-center gap-1.5">
              <div className="w-[5px] h-[5px] rounded-full bg-red-400" />
              Would scroll
            </div>
            <span className="font-mono text-[11px] text-red-400 font-semibold">0:22</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Video cuts to black with no resolution, product, or CTA after promising a 'trauma' story
          </p>
        </div>

        {/* Flag timeline */}
        <div className="mb-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-[6px] h-[6px] rounded-full bg-red-500" />
              <span className="text-[9px] text-zinc-600 uppercase font-semibold tracking-wider">Scroll risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[6px] h-[6px] rounded-full bg-purple-500" />
              <span className="text-[9px] text-zinc-600 uppercase font-semibold tracking-wider">Pacing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[6px] h-[6px] rounded-full bg-emerald-500" />
              <span className="text-[9px] text-zinc-600 uppercase font-semibold tracking-wider">Sound-off</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[6px] h-[6px] rounded-full bg-blue-500" />
              <span className="text-[9px] text-zinc-600 uppercase font-semibold tracking-wider">Clarity</span>
            </div>
          </div>
          {/* Timeline Bar */}
          <div className="w-full h-[5px] rounded-full bg-white/[0.06] relative mt-7">
            {flags.map((flag) => {
              const isActive = expandedId === flag.id;
              return (
                <div 
                  key={`dot-group-${flag.id}`} 
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" 
                  style={{ left: flag.pos, transform: 'translate(-50%, -50%)' }}
                >
                  {isActive && (
                    <div className="absolute -top-8 bg-[#18181b] border border-white/[0.1] text-zinc-300 text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                      {flag.timestamp}
                    </div>
                  )}
                  <div 
                    className={`rounded-full cursor-pointer transition-all ${flag.dotClass} ${isActive ? 'w-[10px] h-[10px] border-[1.5px] border-white' : 'w-[8px] h-[8px] hover:scale-125'}`}
                    style={isActive ? { boxShadow: `0 0 6px ${flag.glowColor}` } : {}}
                    onClick={() => toggleExpand(flag.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Flag cards */}
        <div className="flex flex-col gap-2">
          {flags.map((flag) => {
            const isActive = expandedId === flag.id;
            return (
              <div 
                key={flag.id} 
                className={`rounded-xl px-4 py-3 cursor-pointer transition-all flex flex-col ${
                  isActive 
                    ? `border ${flag.activeBorderClass} ${flag.activeCardBgClass}` 
                    : 'border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
                onClick={() => toggleExpand(flag.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-semibold ${flag.bgClass} ${flag.colorClass}`}>
                    {flag.category}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-600">{flag.time}</span>
                </div>
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col flex-1">
                    <div className="text-[9px] font-semibold uppercase text-zinc-600 tracking-wider mb-1">Fix</div>
                    <p className={`text-sm text-zinc-200 leading-relaxed ${isActive ? '' : 'line-clamp-1'}`}>
                      {flag.fix}
                    </p>
                  </div>
                  <div className="shrink-0 mt-3">
                    <ChevronDown size={14} className={`text-zinc-600 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4 — Communicates / Misses */}
      <div className="mx-4 mb-4 mt-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[9px] font-medium uppercase tracking-wider text-emerald-500 mb-1">Communicates</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              A cute dog story about visiting McDonald's that entertains but sells absolutely nothing
            </p>
          </div>
          <div>
            <div className="text-[9px] font-medium uppercase tracking-wider text-red-400 mb-1">Misses</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To communicate what product is being sold, why the viewer needs it, or how to buy it
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}