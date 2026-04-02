import image_879f728f39335c586a120f603af9b719c0902399 from 'figma:asset/879f728f39335c586a120f603af9b719c0902399.png';
import React, { useState } from "react";
import { Wand2, ShieldCheck, Sparkles } from "lucide-react";
import { ScoreCard } from "./ScoreCard";
import { PredictedPerformanceCard } from "./PredictedPerformanceCard";
import { BudgetRecommendationCard } from "./BudgetRecommendationCard";
import { DesignReviewCard } from "./DesignReviewCard";
import { PolicyCheckPanel } from "./PolicyCheckPanel";
import { AIRewritePanel } from "./AIRewritePanel";
import { CreativeBriefPanel } from "./CreativeBriefPanel";
import { DisplayAnalyzerMockup } from "./DisplayAnalyzerMockup";
import { AnimateToHtml5Takeover } from "./AnimateToHtml5Takeover";

export default function DisplayResultsScreen() {
  const [activePanel, setActivePanel] = useState<'default' | 'policy' | 'rewrite' | 'brief' | 'animate'>('default');

  if (activePanel === 'animate') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col bg-[#09090b]">
        {/* BACKGROUND GRADIENT */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(6,182,212,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.03) 0%, transparent 40%)'
          }}
        />
        <AnimateToHtml5Takeover 
          onClose={() => setActivePanel('default')} 
          imageSrc={image_879f728f39335c586a120f603af9b719c0902399} 
        />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full relative">
      
      {/* BACKGROUND GRADIENT */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(6,182,212,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.03) 0%, transparent 40%)'
        }}
      />

      {/* LEFT COLUMN */}
      <div className="flex-1 justify-end border-r border-white/[0.04] h-full overflow-y-auto scrollbar-hide flex z-10 relative transition-all duration-500">
        <div className="w-full p-[16px] h-fit transition-all duration-500">
          <div className="w-full flex flex-col shrink-0 gap-[12px]">
            {/* Section 1 — Image Container */}
            <DisplayAnalyzerMockup imageSrc={image_879f728f39335c586a120f603af9b719c0902399} />

            {/* Section 2 — Tool cards row (3 cards) */}
            <div className="w-full">
              <div className="grid grid-cols-3 gap-[12px]">
                <ToolCard icon={Wand2} label="AI Rewrite" colorClass="text-[#6366f1]" bgClass="bg-indigo-500/[0.12]" onClick={() => setActivePanel('rewrite')} />
                <ToolCard icon={ShieldCheck} label="Policy Check" colorClass="text-[#f59e0b]" bgClass="bg-amber-500/[0.12]" onClick={() => setActivePanel('policy')} />
                <ToolCard icon={Sparkles} label="Animate" colorClass="text-[#06b6d4]" bgClass="bg-cyan-500/[0.12]" onClick={() => setActivePanel('animate')} />
              </div>
            </div>

            {/* Section 3 — Design Review */}
            <DesignReviewCard />


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
                <ScoreCard onGenerateBrief={() => setActivePanel('brief')} />
                <PredictedPerformanceCard />
                <BudgetRecommendationCard />
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function ToolCard({ icon: Icon, label, colorClass, bgClass, onClick }: { icon: any, label: string, colorClass: string, bgClass: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-white/[0.08] p-5 flex flex-col items-center gap-3 hover:bg-[#1f1f22] hover:border-white/[0.12] transition-colors w-full group bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${bgClass} ${colorClass}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium text-zinc-200 text-center">{label}</span>
    </button>
  );
}