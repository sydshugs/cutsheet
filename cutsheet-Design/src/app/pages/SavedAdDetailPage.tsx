import React, { useState } from "react";
import { 
  ChevronLeft, 
  Trash2, 
  RotateCcw,
  Star,
  Zap,
  Eye,
  MessageSquare,
  PlayCircle,
  Hash,
  ChevronDown,
  TrendingUp,
  Target,
  Image as ImageIcon
} from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";

export default function SavedAdDetailPage() {
  const [expandedSection, setExpandedSection] = useState<string>("hook");
  
  const imgUrl = "https://images.unsplash.com/photo-1696691719115-132dcf5153ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYm90dGxlJTIwZGFyayUyMGJhY2tncm91bmQlMjB2ZXJ0aWNhbHxlbnwxfHx8fDE3NzQ3MTAzODd8MA&ixlib=rb-4.1.0&q=80&w=1080";

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 6) return "text-indigo-500";
    if (score >= 4) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-indigo-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-red-500";
  };

  const ScoreBar = ({ label, score, icon: Icon }: { label: string, score: number, icon: any }) => {
    const width = `${(score / 10) * 100}%`;
    const color = getScoreBgColor(score);
    const textColor = getScoreColor(score);
    
    return (
      <div className="flex flex-col gap-2 w-full mb-4 last:mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">{label}</span>
          </div>
          <span className={`text-sm font-bold font-mono ${textColor}`}>{score.toFixed(1)}</span>
        </div>
        <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className={`h-full rounded-full ${color}`} 
          />
        </div>
      </div>
    );
  };

  const SectionCard = ({ id, title, icon: Icon, children }: any) => {
    const isExpanded = expandedSection === id;
    
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-4 transition-colors hover:border-white/[0.1]">
        <button 
          onClick={() => setExpandedSection(isExpanded ? "" : id)}
          className="w-full flex items-center justify-between px-5 py-4 bg-transparent cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Icon size={16} className="text-zinc-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-200">{title}</span>
          </div>
          <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 border-t border-white/[0.04] text-sm text-zinc-400 leading-relaxed">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#09090b] font-['Geist',sans-serif] overflow-hidden">
      
      {/* --- TOP BAR --- */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/[0.06] shrink-0 bg-[#09090b] z-10 relative">
        <div className="flex items-center">
          <Link to="/app/saved" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group">
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Saved Ads</span>
          </Link>
          <span className="text-zinc-700 mx-2">/</span>
          <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px]">
            luxury-fragrance-tiktok-v2.mp4
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-600">Saved Mar 15, 2026</span>
          
          <div className="w-px h-4 bg-white/[0.08]" />
          
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer">
              <Trash2 size={14} />
            </button>
            <button className="rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 text-xs px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer">
              <RotateCcw size={12} />
              <span>Re-analyze</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TWO COLUMN LAYOUT --- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* LEFT COLUMN */}
        <div className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-white/[0.04] flex flex-col shrink-0 overflow-y-auto bg-[#09090b]">
          <div className="pb-8">
            {/* Ad Image/Thumbnail */}
            <div className="mx-4 mt-5 rounded-2xl border border-white/[0.06] bg-zinc-900 overflow-hidden flex flex-col shadow-sm">
              <div className="relative w-full aspect-[4/5] bg-zinc-800">
                <img src={imgUrl} alt="Ad Creative" className="w-full h-full object-cover" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-t-2xl pointer-events-none" />
              </div>
              <div className="px-4 py-3 bg-[#18181b] border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 truncate pr-2">luxury-fragrance-tiktok-v2.mp4</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">Video</span>
                  <span className="bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">TikTok</span>
                </div>
              </div>
            </div>

            {/* Meta Info Card */}
            <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-[#18181b] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star size={12} className="text-slate-500 fill-slate-500" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">SAVED AD</span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Brand</span>
                  <span className="text-sm font-medium text-zinc-200">Aura Botanica</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Niche</span>
                  <span className="text-sm font-medium text-zinc-200">Beauty & Fragrance</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Platform</span>
                  <span className="text-sm font-medium text-zinc-200">TikTok Paid</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Format</span>
                  <span className="text-sm font-medium text-zinc-200">9:16 Video</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Saved</span>
                  <span className="text-sm font-medium text-zinc-200">Mar 15, 2026</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Overall Score</span>
                  <span className={`text-lg font-bold font-mono leading-none ${getScoreColor(8.4)}`}>8.4</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-5 pt-5 border-t border-white/[0.04]">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-medium text-zinc-400 px-2.5 py-1">ASMR</span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-medium text-zinc-400 px-2.5 py-1">UGC</span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-medium text-zinc-400 px-2.5 py-1">Product Demo</span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-medium text-zinc-400 px-2.5 py-1">Aesthetic</span>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-5 pt-5 border-t border-white/[0.04]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">NOTES</span>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  Competitor ad running heavily since early March. The hook uses a great auditory trigger (bottle spray sound) combined with stark lighting. We need to test this lighting setup in our next shoot.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col px-8 py-6 overflow-y-auto bg-[#09090b] min-h-0 relative">
          <div className="max-w-3xl w-full pb-12">
            
            {/* SCORECARD */}
            <div className="w-full rounded-2xl border border-emerald-500/20 bg-[#18181b] p-6 mb-8 relative shadow-[0_0_30px_rgba(16,185,129,0.03)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl" />
              
              <div className="flex items-start justify-between mb-8 pl-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-500 mb-2 flex items-center gap-1.5">
                    <Star size={12} className="fill-emerald-500" />
                    Overall Performance
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black font-mono text-emerald-400 tracking-tight">8.4</span>
                    <span className="text-sm font-medium text-zinc-500">/ 10</span>
                  </div>
                </div>
                
                <div className="bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <TrendingUp size={14} />
                  Top 15% of niche
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pl-2">
                <div className="flex flex-col justify-center">
                  <ScoreBar label="Hook Strength" score={9.2} icon={Zap} />
                  <ScoreBar label="Clarity" score={8.0} icon={Eye} />
                </div>
                <div className="flex flex-col justify-center">
                  <ScoreBar label="Call to Action" score={7.5} icon={Target} />
                  <ScoreBar label="Production" score={8.8} icon={ImageIcon} />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-white/[0.04] my-8" />

            {/* FULL ANALYSIS SECTIONS */}
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-4 px-1">Detailed Breakdown</h3>

            <SectionCard id="hook" title="The Hook (0:00 - 0:03)" icon={Zap}>
              <p className="mb-4">
                The creative opens with a striking, high-contrast visual of the product backlit in a dark environment. Crucially, the visual is paired with a sharp, high-fidelity ASMR sound effect of the bottle spraying.
              </p>
              <div className="rounded-xl bg-zinc-900 border border-white/[0.04] p-4 flex gap-4 my-4">
                <div className="w-1 bg-emerald-500 rounded-full shrink-0" />
                <div>
                  <h4 className="text-[11px] font-semibold uppercase text-emerald-400 tracking-wider mb-1">What works</h4>
                  <p className="text-xs text-zinc-300">The combination of auditory disruption and stark lighting creates an immediate "stop-scroll" reflex. It feels premium and cinematic, standing out against native UGC content.</p>
                </div>
              </div>
              <p>
                By second 2, text overlay appears: <span className="text-zinc-200 font-medium">"The scent that makes them ask what you're wearing."</span> This is a classic social proof hook translated perfectly for fragrance.
              </p>
            </SectionCard>

            <SectionCard id="pacing" title="Visual Pacing & Retention" icon={PlayCircle}>
              <p className="mb-4">
                The edit relies on quick 1.5-second cuts between close-up macro shots of the glass bottle and wider lifestyle shots of the model applying the product.
              </p>
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="rounded-xl bg-[#09090b] border border-white/[0.04] p-4">
                  <span className="text-3xl font-mono font-bold text-zinc-200 block mb-1">1.8s</span>
                  <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wider">Average shot length</span>
                </div>
                <div className="rounded-xl bg-[#09090b] border border-white/[0.04] p-4">
                  <span className="text-3xl font-mono font-bold text-zinc-200 block mb-1">4</span>
                  <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wider">Text overlay changes</span>
                </div>
              </div>
              <p>
                The pacing slows down significantly in the final 5 seconds, which allows the viewer to absorb the offer but risks a steep drop-off just before the CTA is delivered.
              </p>
            </SectionCard>

            <SectionCard id="messaging" title="Messaging & Copy" icon={MessageSquare}>
              <p className="mb-4">
                The copy strategy relies entirely on establishing desire through perceived social status rather than describing the actual scent profile (notes, ingredients, etc).
              </p>
              <blockquote className="border-l-2 border-indigo-500/50 pl-4 py-1 my-4 text-[13px] text-zinc-300 italic font-medium">
                "It's not just a perfume. It's a statement piece for your vanity, and your signature everywhere you go."
              </blockquote>
              <p>
                This is a highly effective emotional angle. However, the lack of objective scent descriptors (e.g., "vanilla," "musk," "floral") means viewers must take a blind risk, which might explain why the CTA conversion rate benchmark is slightly lower than the hook retention rate.
              </p>
            </SectionCard>

            <SectionCard id="hashtags" title="Hashtag Strategy" icon={Hash}>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-zinc-300 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1">#PerfumeTok</span>
                <span className="text-xs text-zinc-300 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1">#SignatureScent</span>
                <span className="text-xs text-zinc-300 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1">#LuxuryBeauty</span>
                <span className="text-xs text-zinc-300 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1">#Aesthetic</span>
              </div>
              <p>
                Standard niche targeting. They are specifically avoiding broader tags like #TikTokMadeMeBuyIt to maintain the premium positioning of the brand.
              </p>
            </SectionCard>

          </div>
        </div>

      </div>
    </div>
  );
}