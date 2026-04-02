import image_272d0c1a38cb660506d2fa2ede70fcf9ea6979f4 from 'figma:asset/272d0c1a38cb660506d2fa2ede70fcf9ea6979f4.png'
import image_879f728f39335c586a120f603af9b719c0902399 from 'figma:asset/879f728f39335c586a120f603af9b719c0902399.png'
import image_93f028c2d5eca2e5697823bddd5ebdc725e369ef from 'figma:asset/93f028c2d5eca2e5697823bddd5ebdc725e369ef.png'
import React, { useState } from "react";
import { Wand2, Sparkles, ShieldCheck, Crosshair, Play, Copy, FileDown, Share2 } from "lucide-react";
import { ScoreCard } from "./ScoreCard";
import { PredictedPerformanceCard } from "./PredictedPerformanceCard";
import { BudgetRecommendationCard } from "./BudgetRecommendationCard";
import { DesignReviewCard } from "./DesignReviewCard";
import { MotionTestIdeaCard } from "./MotionTestIdeaCard";
import { PolicyCheckPanel } from "./PolicyCheckPanel";
import { AIRewritePanel } from "./AIRewritePanel";
import { SafeZoneCheckModal } from "./SafeZoneCheckModal";
import { VisualizePanel } from "./VisualizePanel";
import { CreativeBriefPanel } from "./CreativeBriefPanel";
import exampleImage from 'figma:asset/fd902ece923e9118e5e3eb20f95ca6b84dfbc111.png';

export default function ResultsScreen() {
  const [activePanel, setActivePanel] = useState<'default' | 'policy' | 'rewrite' | 'rewrite-priority' | 'visualize' | 'brief'>('default');
  const [isSafeZoneModalOpen, setIsSafeZoneModalOpen] = useState(false);

  return (
    <div className="flex w-full h-full relative">
      
      {/* BACKGROUND GRADIENT */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.04) 0%, transparent 40%)'
        }}
      />

      {/* LEFT COLUMN (38%) */}
      <div className={`${activePanel === 'visualize' ? 'w-full justify-center' : 'flex-1 justify-end border-r border-white/[0.04]'} h-full overflow-y-auto scrollbar-hide flex z-10 relative transition-all duration-500`}>
        <div className={`w-full ${activePanel === 'visualize' ? 'max-w-[1000px] p-[32px] pb-[80px]' : 'p-[16px] pb-[80px]'} h-fit transition-all duration-500`}>
            {activePanel === 'visualize' ? (
              <VisualizePanel onClose={() => setActivePanel('default')} originalImageSrc={image_879f728f39335c586a120f603af9b719c0902399} />
            ) : (
              <div className="w-full flex flex-col shrink-0 gap-[12px]">
                {/* Section 1 — Image Container */}
                <div className="w-full h-[55vh] max-h-[420px] relative flex flex-col group shrink-0 rounded-2xl border border-white/[0.06] bg-black/20">
                  {/* Image Placeholder for video thumbnail */}
                  <div className="flex-1 w-full relative flex items-center justify-center rounded-t-2xl overflow-hidden bg-zinc-900">
                    <img 
                      src={image_272d0c1a38cb660506d2fa2ede70fcf9ea6979f4} 
                      alt="Ad preview" 
                      className="w-full h-full object-cover"
                    />
                    {/* Play Button Overlay */}
                    
                  </div>
                  
                  {/* File Info Bar */}
                  <div className="w-full flex items-center justify-between border-t border-white/[0.05] px-4 py-3 shrink-0">
                    <span className="font-mono text-xs text-zinc-500">
                      juicy-oil-meta-v2.mp4
                    </span>
                    <span className="text-xs text-zinc-500">
                      0:28 · 4.6 MB
                    </span>
                  </div>
                </div>

                {/* Section 2 — Tool cards row */}
                <div className="w-full">
                  <div className="grid grid-cols-4 gap-[12px]">
                    <ToolCard icon={Wand2} label="AI Rewrite" colorClass="text-[#6366f1]" bgClass="bg-[#6366f1]/[0.15]" onClick={() => setActivePanel('rewrite')} />
                    <ToolCard icon={Sparkles} label="Visualize" colorClass="text-[#10b981]" bgClass="bg-[#10b981]/[0.15]" onClick={() => setActivePanel('visualize')} />
                    <ToolCard icon={ShieldCheck} label="Policy Check" colorClass="text-[#f59e0b]" bgClass="bg-[#f59e0b]/[0.15]" onClick={() => setActivePanel('policy')} />
                    <ToolCard icon={Crosshair} label="Safe Zone" colorClass="text-[#0ea5e9]" bgClass="bg-[#0ea5e9]/[0.15]" onClick={() => setIsSafeZoneModalOpen(true)} />
                  </div>
                </div>

                {/* Section 3 — Design Review */}
                <DesignReviewCard onFixWithAI={() => setActivePanel('rewrite-priority')} />

                {/* Section 4 — Motion Test Idea */}
                <MotionTestIdeaCard />
              </div>
            )}
        </div>
      </div>

      {/* RIGHT COLUMN (62%) */}
      {activePanel !== 'visualize' && (
        <div className="w-[380px] shrink-0 h-full overflow-y-auto scrollbar-hide bg-[#111113] z-10 relative">
          <div className="w-full min-h-full p-[24px] pb-[72px] flex flex-col">
            {/* Container to constrain cards to their max-width, matching the design */}
            <div className="w-full flex flex-col gap-[16px]">
              {activePanel === 'policy' ? (
                <PolicyCheckPanel onClose={() => setActivePanel('default')} />
              ) : activePanel === 'rewrite' ? (
                <AIRewritePanel onClose={() => setActivePanel('default')} />
              ) : activePanel === 'rewrite-priority' ? (
                <AIRewritePanel onClose={() => setActivePanel('default')} fromPriorityFix />
              ) : activePanel === 'brief' ? (
                <CreativeBriefPanel onClose={() => setActivePanel('default')} />
              ) : (
                <>
                  <ScoreCard onGenerateBrief={() => setActivePanel('brief')} platforms={["Meta"]} defaultPlatform="Meta" />
                  <PredictedPerformanceCard />
                  <BudgetRecommendationCard />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safe Zone Check Modal */}
      {isSafeZoneModalOpen && (
        <SafeZoneCheckModal 
          onClose={() => setIsSafeZoneModalOpen(false)} 
          imageSrc={image_879f728f39335c586a120f603af9b719c0902399} 
        />
      )}

      {/* FIXED BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-[48px] bg-[#111113] border-t border-white/[0.06] flex items-center justify-end px-6 gap-[12px] z-50">
        <button className="h-8 px-[12px] rounded-lg border border-white/[0.06] bg-transparent text-zinc-400 flex items-center gap-1.5 text-[13px] font-medium hover:text-zinc-300 hover:bg-white/[0.02] transition-colors">
          <Copy size={14} />
          Copy
        </button>
        <button className="h-8 px-[12px] rounded-lg border border-white/[0.06] bg-transparent text-zinc-400 flex items-center gap-1.5 text-[13px] font-medium hover:text-zinc-300 hover:bg-white/[0.02] transition-colors">
          <FileDown size={14} />
          PDF
        </button>
        <button className="h-8 px-[12px] rounded-lg bg-[#6366f1] text-white flex items-center gap-1.5 text-[13px] font-medium hover:bg-[#4f46e5] transition-colors">
          <Share2 size={14} />
          Share
        </button>
      </div>

    </div>
  );
}

function ToolCard({ icon: Icon, label, colorClass, bgClass, onClick }: { icon: any, label: string, colorClass: string, bgClass: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-white/[0.06] bg-[#18181b] p-5 flex flex-col items-center gap-3 hover:bg-[#1f1f22] hover:border-white/[0.12] transition-colors w-full group">
      <div className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${bgClass} ${colorClass}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium text-zinc-200 text-center">{label}</span>
    </button>
  );
}