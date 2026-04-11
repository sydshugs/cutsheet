import image_879f728f39335c586a120f603af9b719c0902399 from 'figma:asset/879f728f39335c586a120f603af9b719c0902399.png';
import React, { useState } from "react";
import { Wand2, ShieldCheck, Crosshair, RotateCcw } from "lucide-react";
import { ScoreCard } from "./ScoreCard";
import { PredictedPerformanceCard } from "./PredictedPerformanceCard";
import { DesignReviewCard } from "./DesignReviewCard";
import { PolicyCheckPanel } from "./PolicyCheckPanel";
import { AIRewritePanel } from "./AIRewritePanel";
import { SafeZoneCheckModal } from "./SafeZoneCheckModal";
import { CreativeBriefPanel } from "./CreativeBriefPanel";
import { PlatformOptimizationCard } from "./PlatformOptimizationCard";

export default function OrganicStaticResultsScreen() {
  const [activePanel, setActivePanel] = useState<'default' | 'policy' | 'rewrite' | 'brief'>('default');
  const [isSafeZoneModalOpen, setIsSafeZoneModalOpen] = useState(false);

  return (
    <div className="flex w-full h-full relative">
      
      {/* BACKGROUND GRADIENT */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(16,185,129,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.03) 0%, transparent 40%)'
        }}
      />

      {/* LEFT COLUMN */}
      <div className="flex-1 justify-end border-r border-white/[0.04] h-full overflow-y-auto scrollbar-hide flex z-10 relative transition-all duration-500">
        <div className="w-full p-[16px] h-fit transition-all duration-500">
          <div className="w-full flex flex-col shrink-0 gap-[12px]">
            {/* Section 1 — Image Container */}
            <div className="w-full h-[55vh] max-h-[420px] relative flex flex-col group shrink-0 rounded-2xl border border-white/[0.06] bg-black/20">
              <div className="flex-1 w-full relative flex items-center justify-center rounded-t-2xl overflow-hidden bg-zinc-900">
                <img 
                  src={image_879f728f39335c586a120f603af9b719c0902399} 
                  alt="Organic content preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* File Info Bar */}
              <div className="w-full flex items-center justify-between border-t border-white/[0.05] px-4 py-3 shrink-0">
                <span className="font-mono text-xs text-zinc-500">
                  organic-content-v1.mp4
                </span>
                <span className="text-xs text-zinc-500">
                  0:28 · 4.6 MB
                </span>
              </div>
            </div>

            {/* Section 2 — Tool cards row */}
            <div className="w-full">
              <div className="grid grid-cols-3 gap-[12px]">
                <ToolCard icon={Wand2} label="AI Rewrite" colorClass="text-[#10b981]" bgClass="bg-[#10b981]/[0.15]" onClick={() => setActivePanel('rewrite')} />
                <ToolCard icon={ShieldCheck} label="Policy Check" colorClass="text-[#f59e0b]" bgClass="bg-[#f59e0b]/[0.15]" onClick={() => setActivePanel('policy')} />
                <ToolCard icon={Crosshair} label="Safe Zone" colorClass="text-[#0ea5e9]" bgClass="bg-[#0ea5e9]/[0.15]" onClick={() => setIsSafeZoneModalOpen(true)} />
              </div>
            </div>

            {/* Section 3 — Design Review */}
            <DesignReviewCard />

            {/* Section 4 — Platform Optimization */}
            <PlatformOptimizationCard variant="organic-static" />

            {/* Section 5 — Action Buttons */}
            <div className="w-full flex items-center gap-[12px] mt-2 mb-4">
              <button className="flex-1 flex items-center justify-center gap-[6px] rounded-xl border border-white/[0.08] bg-[#18181b] text-zinc-300 text-sm font-medium py-3 hover:bg-white/[0.04] transition-colors shadow-sm">
                <RotateCcw size={14} className="text-zinc-400" />
                Re-analyze
              </button>
              <button 
                onClick={() => setActivePanel('brief')}
                className="flex-1 flex items-center justify-center rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium py-3 transition-colors shadow-sm"
              >
                Generate Brief
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-[380px] shrink-0 h-full overflow-y-auto scrollbar-hide bg-[#111113] z-10 relative">
        <div className="w-full min-h-full p-[24px] flex flex-col">
          <div className="w-full flex flex-col gap-[16px]">
            {activePanel === 'policy' ? (
              <PolicyCheckPanel onClose={() => setActivePanel('default')} />
            ) : activePanel === 'rewrite' ? (
              <AIRewritePanel onClose={() => setActivePanel('default')} />
            ) : activePanel === 'brief' ? (
              <CreativeBriefPanel onClose={() => setActivePanel('default')} />
            ) : (
              <>
                <ScoreCard onGenerateBrief={() => setActivePanel('brief')} defaultOpenHashtags={true} platforms={["Meta", "Instagram", "Pinterest"]} defaultPlatform="Meta" />
                <PredictedPerformanceCard />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Safe Zone Check Modal */}
      {isSafeZoneModalOpen && (
        <SafeZoneCheckModal 
          onClose={() => setIsSafeZoneModalOpen(false)} 
          imageSrc={image_879f728f39335c586a120f603af9b719c0902399} 
        />
      )}

    </div>
  );
}

function ToolCard({ icon: Icon, label, colorClass, bgClass, onClick }: { icon: any, label: string, colorClass: string, bgClass: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-white/[0.08] bg-[#18181b] p-5 flex flex-col items-center gap-3 hover:bg-[#1f1f22] hover:border-white/[0.12] transition-colors w-full group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${bgClass} ${colorClass}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium text-zinc-200 text-center">{label}</span>
    </button>
  );
}