import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Sparkles, 
  X, 
  ArrowDown, 
  Zap, 
  Activity, 
  Eye, 
  AlertTriangle, 
  Play, 
  Download,
  Loader2
} from 'lucide-react';

interface AnimateToHtml5TakeoverProps {
  onClose: () => void;
  imageSrc: string;
}

type AnimationStyle = 'entrance' | 'pulse' | 'reveal';

export function AnimateToHtml5Takeover({ onClose, imageSrc }: AnimateToHtml5TakeoverProps) {
  const [activeStyle, setActiveStyle] = useState<AnimationStyle>('entrance');
  const [duration, setDuration] = useState<number>(15);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setHasGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full h-full font-['Geist',sans-serif] z-20 relative bg-[#09090b]">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0 bg-[#09090b]">
        {/* Left */}
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to results
        </button>

        {/* Center */}
        <div className="flex items-center absolute left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/[0.12] flex items-center justify-center">
            <Sparkles className="w-[14px] h-[14px] text-[#06b6d4]" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 ml-2">Animate to HTML5</span>
          <span className="rounded-full border border-white/[0.06] bg-white/[0.02] text-[10px] text-zinc-500 px-2.5 py-1 ml-3 whitespace-nowrap">
            300×250 · Medium Rectangle
          </span>
        </div>

        {/* Right */}
        <button onClick={onClose} className="p-1 hover:bg-white/[0.04] rounded-lg transition-colors">
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex gap-6 px-6 py-6 w-full h-full overflow-hidden relative z-10">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center pb-20">
          <div className="w-full max-w-[500px] flex flex-col">
            
            {/* ORIGINAL */}
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
              ORIGINAL
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900 overflow-hidden flex flex-col">
              <div className="w-full aspect-[300/250] bg-zinc-950 flex items-center justify-center p-4 relative">
                <img src={imageSrc} alt="Original Banner" className="w-full h-full object-contain" />
              </div>
              <div className="px-3 py-2 border-t border-white/[0.06] flex justify-between items-center bg-[#18181b]">
                <span className="text-[11px] font-mono text-zinc-600 truncate">summer_sale_display_300x250.jpg</span>
                <span className="text-[11px] text-zinc-700 whitespace-nowrap ml-4">Static · 300×250</span>
              </div>
            </div>

            <div className="my-3 flex justify-center text-zinc-700">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* ANIMATED PREVIEW */}
            <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600 mb-2">
              ANIMATED PREVIEW
            </div>
            <div className={`rounded-2xl border bg-zinc-900 overflow-hidden flex flex-col transition-colors ${hasGenerated ? 'border-cyan-500/20' : 'border-white/[0.06]'}`}>
              <div className="w-full aspect-[300/250] bg-zinc-950 relative flex flex-col items-center justify-center p-4">
                {isGenerating ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-6 h-6 text-[#06b6d4] animate-spin" />
                    <span className="text-sm text-zinc-400 mt-3">Generating animation...</span>
                    <span className="text-xs text-zinc-600 mt-1">This usually takes 15–30 seconds</span>
                  </div>
                ) : hasGenerated ? (
                  <>
                    <img src={imageSrc} alt="Animated Banner" className="w-full h-full object-contain opacity-80" />
                    <button className="absolute inset-0 flex items-center justify-center group bg-black/20 hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center backdrop-blur-sm border border-cyan-500/30 group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-1" />
                      </div>
                    </button>
                  </>
                ) : (
                   <div className="text-sm text-zinc-600">Click Generate to preview</div>
                )}
              </div>
              {(hasGenerated || isGenerating) && (
                <div className="px-3 py-2 border-t border-white/[0.06] flex justify-between items-center bg-[#18181b]">
                  <span className="text-[11px] font-mono text-zinc-600">HTML5 · 300×250 · 48KB</span>
                  <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-xs text-zinc-400 px-3 py-1.5 transition-colors disabled:opacity-50" disabled={isGenerating}>
                    <Download className="w-3 h-3" />
                    <span>Download .zip</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[380px] shrink-0 bg-[#18181b] rounded-2xl border border-white/[0.06] flex flex-col h-fit p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
            ANIMATION STYLE
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveStyle('entrance')}
              className={`rounded-xl border p-3 flex flex-col gap-1.5 items-center text-center transition-colors ${
                activeStyle === 'entrance'
                  ? 'border-indigo-500/30 bg-indigo-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]'
              }`}
            >
              <Zap className={`w-4 h-4 ${activeStyle === 'entrance' ? 'text-[#6366f1]' : 'text-zinc-500'}`} />
              <span className={`text-xs font-medium ${activeStyle === 'entrance' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                Entrance
              </span>
              <span className="text-[10px] text-zinc-600 leading-tight">Fade + slide in</span>
            </button>

            <button
              onClick={() => setActiveStyle('pulse')}
              className={`rounded-xl border p-3 flex flex-col gap-1.5 items-center text-center transition-colors ${
                activeStyle === 'pulse'
                  ? 'border-indigo-500/30 bg-indigo-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]'
              }`}
            >
              <Activity className={`w-4 h-4 ${activeStyle === 'pulse' ? 'text-[#6366f1]' : 'text-zinc-500'}`} />
              <span className={`text-xs font-medium ${activeStyle === 'pulse' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                Pulse
              </span>
              <span className="text-[10px] text-zinc-600 leading-tight">CTA highlight</span>
            </button>

            <button
              onClick={() => setActiveStyle('reveal')}
              className={`rounded-xl border p-3 flex flex-col gap-1.5 items-center text-center transition-colors ${
                activeStyle === 'reveal'
                  ? 'border-indigo-500/30 bg-indigo-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]'
              }`}
            >
              <Eye className={`w-4 h-4 ${activeStyle === 'reveal' ? 'text-[#6366f1]' : 'text-zinc-500'}`} />
              <span className={`text-xs font-medium ${activeStyle === 'reveal' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                Reveal
              </span>
              <span className="text-[10px] text-zinc-600 leading-tight">Logo + offer appear</span>
            </button>
          </div>

          <div className="mt-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-3">
              SETTINGS
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Duration</span>
                  <span className="text-xs font-mono text-zinc-300">{duration}s</span>
                </div>
                <div className="relative w-full h-[12px] flex items-center group">
                  <div className="absolute w-full h-[3px] rounded-full bg-white/[0.06]"></div>
                  <div 
                    className="absolute h-[3px] rounded-full bg-[#6366f1]" 
                    style={{ width: `${(duration / 30) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute w-[10px] h-[10px] bg-white rounded-full shadow pointer-events-none" 
                    style={{ left: `calc(${(duration / 30) * 100}% - 5px)` }}
                  ></div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Loop</span>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`w-[28px] h-[16px] rounded-full relative transition-colors ${
                    isLooping ? "bg-[#6366f1]" : "bg-white/[0.06]"
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full transition-all duration-200 ${
                      isLooping ? "left-[14px]" : "left-[2px]"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/15 px-3 py-2.5 mt-3 flex gap-2 items-start">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-[1px]" />
              <span className="text-xs text-zinc-500 leading-tight">
                GDN limits: 30s max, 3 loops, 150KB file size
              </span>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-5 rounded-xl bg-cyan-500/[0.10] border border-cyan-500/25 hover:bg-cyan-500/[0.15] py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-[14px] h-[14px] text-[#06b6d4] animate-spin" />
            ) : (
              <Sparkles className="w-[14px] h-[14px] text-[#06b6d4]" />
            )}
            <span className="text-sm font-medium text-cyan-300">
              {isGenerating ? "Generating..." : "Generate HTML5 Animation"}
            </span>
          </button>

          {hasGenerated && (
            <motion.button 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              className="w-full rounded-xl bg-[#6366f1] hover:bg-indigo-600 text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 transition-colors overflow-hidden"
            >
              <Sparkles className="w-[14px] h-[14px]" />
              Analyze This Version
            </motion.button>
          )}

        </div>
      </div>
    </div>
  );
}
