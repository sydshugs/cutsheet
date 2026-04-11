import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Sparkles, X, CheckCircle, Download, Copy, Play
} from 'lucide-react';
import image_879f728f39335c586a120f603af9b719c0902399 from 'figma:asset/879f728f39335c586a120f603af9b719c0902399.png';
import image_93f028c2d5eca2e5697823bddd5ebdc725e369ef from 'figma:asset/93f028c2d5eca2e5697823bddd5ebdc725e369ef.png';

interface VisualizePanelProps {
  onClose: () => void;
  originalImageSrc: string;
}

export function VisualizePanel({ onClose, originalImageSrc }: VisualizePanelProps) {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    // Simulate generation steps
    const timer1 = setTimeout(() => setLoadingStep(1), 1500);
    const timer2 = setTimeout(() => setLoadingStep(2), 3000);
    const timer3 = setTimeout(() => setLoadingStep(3), 4500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const isComplete = loadingStep >= 3;

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* HEADER ROW */}
      <div className="flex flex-col w-full mb-4">
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors w-fit group mb-4"
        >
          <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-medium">Back to analysis</span>
        </button>
        
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.12] flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-[#6366f1]" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">Visualized Improvement</h2>
                <span className="rounded border border-white/[0.06] bg-white/[0.02] text-[10px] text-zinc-500 px-2 py-0.5">
                  MVP — Static Ads
                </span>
              </div>
              <span className="text-xs text-zinc-500">AI-generated based on your scorecard</span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isComplete ? (
        // LOADING STATE
        <div className="w-full flex flex-col mt-4">
          <div className="flex flex-col gap-4 mb-8">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              {loadingStep > 0 ? (
                <CheckCircle size={18} className="text-[#10b981]" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              )}
              <span className={`text-sm ${loadingStep > 0 ? 'text-zinc-100' : 'text-zinc-400'}`}>
                Analyzing scene composition and text layers...
              </span>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-center gap-3">
              {loadingStep > 1 ? (
                <CheckCircle size={18} className="text-[#10b981]" />
              ) : loadingStep === 1 ? (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-white/[0.1] bg-transparent"></div>
              )}
              <span className={`text-sm ${loadingStep > 1 ? 'text-zinc-100' : loadingStep === 1 ? 'text-zinc-100' : 'text-zinc-400'}`}>
                Applying "Priority Fix" contrast guidelines...
              </span>
            </div>
            
            {/* Step 3 */}
            <div className="flex items-center gap-3">
              {loadingStep > 2 ? (
                <CheckCircle size={18} className="text-[#10b981]" />
              ) : loadingStep === 2 ? (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-white/[0.1] bg-transparent"></div>
              )}
              <span className={`text-sm ${loadingStep > 2 ? 'text-zinc-100' : loadingStep === 2 ? 'text-zinc-100' : 'text-zinc-400'}`}>
                Rendering visual output...
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Before</span>
              <div className="w-full rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden flex items-center justify-center">
                <img src={originalImageSrc} alt="Original" className="w-full h-auto max-h-[380px] object-contain opacity-70" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">After</span>
              <div className="w-full h-[380px] rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06] flex items-center justify-center">
                <Sparkles className="text-white/10 w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // COMPLETE STATE
        <div className="w-full flex flex-col mt-2 animate-in fade-in duration-500">
          
          {/* Before/After Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Before</span>
              <div className="w-full rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden flex items-center justify-center">
                <img src={originalImageSrc} alt="Original" className="w-full h-auto max-h-[380px] object-contain" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#10b981]">After</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded px-1.5 py-0.5">AI Improved</span>
              </div>
              <div className="w-full rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden flex items-center justify-center relative">
                <img src={image_93f028c2d5eca2e5697823bddd5ebdc725e369ef} alt="Improved" className="w-full h-auto max-h-[380px] object-contain" />
              </div>
            </div>
          </div>

          {/* What Changed Card */}
          <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/[0.10] flex items-center justify-center shrink-0">
                <CheckCircle size={14} className="text-[#10b981]" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#10b981]">What Changed</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mt-3 mb-4">
              We redesigned the hook frame to address the Priority Fix items. The text is now legible with proper contrast backing, and the key product benefit is front and center.
            </p>
            
            <div className="flex flex-col gap-2">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 flex items-start gap-3">
                <CheckCircle size={12} className="text-[#10b981] shrink-0 mt-1" />
                <span className="text-sm text-zinc-300">Added high-contrast dark gradient behind text hook to fix legibility.</span>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 flex items-start gap-3">
                <CheckCircle size={12} className="text-[#10b981] shrink-0 mt-1" />
                <span className="text-sm text-zinc-300">Simplified hook text from 12 words to 6 words for instant comprehension.</span>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 flex items-start gap-3">
                <CheckCircle size={12} className="text-[#10b981] shrink-0 mt-1" />
                <span className="text-sm text-zinc-300">Shifted logo and UI elements out of the native platform danger zones.</span>
              </div>
            </div>
          </div>

          {/* Motion Preview section */}
          <div className="w-full flex flex-col mt-4">
            <div className="flex items-center gap-2 mt-4 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/[0.10] flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Motion Preview</span>
            </div>
            
            <div className="flex items-center gap-3 w-full">
              <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] text-indigo-300 text-sm font-medium hover:bg-indigo-500/[0.1] hover:border-indigo-500/30 transition-colors">
                <Play size={14} className="fill-indigo-300" />
                Animate this version
              </button>
              <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-500 text-sm font-medium hover:bg-white/[0.04] hover:text-zinc-300 transition-colors">
                Animate original instead
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="border-t border-white/[0.06] pt-4 flex gap-3 flex-wrap mt-4">
            <button className="h-10 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-300 text-sm flex items-center gap-2 hover:bg-white/[0.04] transition-colors font-medium">
              <Download size={14} />
              Download Improved Version
            </button>
            <button className="h-10 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-300 text-sm flex items-center gap-2 hover:bg-white/[0.04] transition-colors font-medium">
              <Copy size={14} />
              Copy Visual Brief
            </button>
            <button className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-400 transition-colors ml-auto">
              <Sparkles size={14} />
              Analyze This Version
            </button>
          </div>

        </div>
      )}
      
    </div>
  );
}
