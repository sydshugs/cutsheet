import React, { useState, useEffect } from "react";
import { 
  Swords, 
  CloudUpload, 
  Search, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Zap,
  ChevronDown,
  BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type PageState = 'idle' | 'loading' | 'results';

export default function CompetitorPage() {
  const [pageState, setPageState] = useState<PageState>('idle');
  const [activeTab, setActiveTab] = useState<"upload" | "search">("upload");
  const [filesSelected, setFilesSelected] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const imgYours = "https://images.unsplash.com/photo-1772984711347-aa7a8375b2e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZHJpbmslMjBncmVlbiUyMGJhY2tncm91bmQlMjB2ZXJ0aWNhbHxlbnwxfHx8fDE3NzQ3MTAxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080";
  const imgTheirs = "https://images.unsplash.com/photo-1644902617085-e064a442a98d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZHJpbmslMjBibHVlJTIwYmFja2dyb3VuZCUyMHZlcnRpY2FsfGVufDF8fHx8MTc3NDcxMDExMHww&ixlib=rb-4.1.0&q=80&w=1080";

  useEffect(() => {
    if (pageState === 'loading') {
      const timers = [
        setTimeout(() => setLoadingStep(1), 800),
        setTimeout(() => setLoadingStep(2), 2500),
        setTimeout(() => setLoadingStep(3), 4500),
        setTimeout(() => setPageState('results'), 5500)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [pageState]);

  const handleRunAnalysis = () => {
    setPageState('loading');
    setLoadingStep(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-[#10b981]';
    if (score >= 5) return 'text-[#f59e0b]';
    return 'text-[#ef4444]';
  };

  const getBgScoreColor = (score: number) => {
    if (score >= 7) return 'bg-[#10b981]';
    if (score >= 5) return 'bg-[#f59e0b]';
    return 'bg-[#ef4444]';
  };

  return (
    <div className="flex-1 flex flex-col items-center h-full w-full bg-[#09090b] font-['Geist',sans-serif] overflow-y-auto min-h-0 relative">
      {/* Radial glow — sky (idle/loading states only) */}
      {pageState !== 'results' && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(14,165,233,0.08) 0%, transparent 70%)" }}
        />
      )}
      
      {pageState === 'idle' && (
        <div className="w-full max-w-[800px] mx-auto flex flex-col items-center my-auto py-10 px-6 relative z-10">
          {/* Header */}
          <div className="max-w-lg mx-auto flex flex-col items-center">
            <div className="w-[76px] h-[76px] rounded-2xl bg-sky-500/[0.12] flex items-center justify-center shrink-0 border border-sky-500/20">
              <Swords size={32} className="text-[#0ea5e9]" strokeWidth={1.5} />
            </div>
            <h1 className="text-[24px] font-bold text-zinc-100 mt-5 text-center tracking-[-0.025em]">Competitor Analysis</h1>
            <p className="text-[14px] text-zinc-500 text-center mt-2.5 max-w-sm leading-[1.6] mb-4">
              Upload your ad and a competitor's. AI finds the gap and builds your win strategy.
            </p>
            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {["Gap analysis", "Win probability", "Action plan"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border px-3 py-1 text-xs text-sky-400"
                  style={{ background: "rgba(14,165,233,0.08)", borderColor: "rgba(14,165,233,0.2)" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Two Column Upload */}
          <div className="grid grid-cols-2 w-full gap-5 mt-8">
            
            {/* Left Column: YOUR AD */}
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3 text-center">YOUR AD</div>
              <div 
                className={`rounded-2xl border ${filesSelected ? 'border-white/[0.15] bg-white/[0.05]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'} p-6 flex flex-col items-center justify-center h-[280px] cursor-pointer transition-all relative overflow-hidden`}
                onClick={() => setFilesSelected(true)}
              >
                {filesSelected ? (
                  <img src={imgYours} alt="Your Ad" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full">
                    <CloudUpload size={20} className="text-zinc-500 mb-3" />
                    <div className="text-[13px] font-medium text-zinc-300 mb-1.5">Drop your creative here</div>
                    <div className="text-[11px] text-zinc-600 font-mono">MP4 · PNG · JPG</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: COMPETITOR AD */}
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3 text-center">COMPETITOR AD</div>
              <div 
                className={`rounded-2xl border ${filesSelected ? 'border-white/[0.15] bg-white/[0.05]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'} p-6 flex flex-col items-center justify-center h-[280px] cursor-pointer transition-all relative overflow-hidden`}
                onClick={() => setFilesSelected(true)}
              >
                {filesSelected ? (
                  <img src={imgTheirs} alt="Competitor Ad" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full">
                    <CloudUpload size={20} className="text-zinc-500 mb-3" />
                    <div className="text-[13px] font-medium text-zinc-300 mb-1.5">Drop competitor here</div>
                    <div className="text-[11px] text-zinc-600 font-mono">MP4 · PNG · JPG</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-center w-full mt-8">
            <button 
              disabled={!filesSelected}
              onClick={handleRunAnalysis}
              className={`rounded-xl px-6 py-3 text-[13px] font-medium transition-colors ${
                filesSelected 
                  ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                  : 'bg-white/[0.04] border border-white/[0.06] text-zinc-600 cursor-not-allowed'
              }`}
            >
              Analyze Gap
            </button>
          </div>
        </div>
      )}

      {pageState === 'loading' && (
        <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 relative z-10 w-full">
          <div className="w-full max-w-2xl flex flex-col">
            {/* Header — centered, no icon */}
            <div className="flex flex-col items-center mb-8 gap-2">
              <h2 className="text-lg font-semibold text-zinc-100">Analyzing Competitors</h2>
              <span className="rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[11px] font-medium px-2.5 py-0.5">
                Full Creative
              </span>
            </div>

            {/* Two ad cards side by side */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* YOUR AD */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
                <div className={`relative w-full aspect-square bg-zinc-900 overflow-hidden ${loadingStep >= 0 ? 'border-2 border-indigo-500/30' : ''}`}>
                  <img src={imgYours} alt="Your Ad" className="w-full h-full object-cover" />
                  {loadingStep < 2 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-[20px] h-[20px] rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-200">Your Ad</span>
                  {loadingStep < 2 ? (
                    <span className="text-[10px] text-indigo-400 animate-pulse font-medium">Analyzing...</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-amber-500">5.8</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* COMPETITOR AD */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
                <div className={`relative w-full aspect-square bg-zinc-900 overflow-hidden ${loadingStep >= 1 ? 'border-2 border-indigo-500/30' : ''}`}>
                  <img src={imgTheirs} alt="Competitor" className="w-full h-full object-cover" />
                  {loadingStep >= 1 && loadingStep < 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-[20px] h-[20px] rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-zinc-200">Competitor</span>
                  {loadingStep < 1 ? (
                    <span className="text-[10px] text-zinc-500 border border-white/[0.04] rounded-full px-2 py-0.5">Pending</span>
                  ) : loadingStep < 3 ? (
                    <span className="text-[10px] text-indigo-400 animate-pulse font-medium">Analyzing...</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-emerald-500">8.4</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Progress below cards */}
            <div className="mt-8 flex flex-col w-full items-center">
              <span className="text-xs text-zinc-400 font-medium text-center">
                {loadingStep < 3 ? 'Scoring both creatives...' : 'Finalizing comparison...'}
              </span>
              <span className="text-[11px] text-zinc-500 mt-1 text-center">
                Then running gap analysis and building your action plan
              </span>
              <div className="h-[3px] w-full rounded-full bg-white/[0.06] mt-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-[#6366f1] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: loadingStep === 0 ? "15%" : loadingStep === 1 ? "40%" : loadingStep === 2 ? "75%" : "100%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {pageState === 'results' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full overflow-y-auto bg-[#09090b] relative scroll-smooth"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(239,68,68,0.08)_0%,transparent_100%)] pointer-events-none" />

          <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col relative z-10 pb-32">
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Swords size={18} className="text-sky-400" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Competitor Analysis</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  ANALYSIS COMPLETE
                </span>
              </div>
            </div>

            {/* CINEMATIC HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16 relative items-center">
              
              {/* YOUR AD */}
              <div className="col-span-1 lg:col-span-3 order-2 lg:order-1 relative h-[360px] rounded-2xl overflow-hidden border border-white/10 opacity-70 transition-opacity hover:opacity-100 shadow-2xl group">
                 <img src={imgYours} className="w-full h-full object-cover grayscale-[40%]" alt="Your Ad" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                 
                 {/* Top Badge */}
                 <div className="absolute top-4 left-4 border border-white/20 bg-black/40 backdrop-blur-md text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-1 rounded">
                   Target
                 </div>
                 
                 {/* Bottom Data */}
                 <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Your Ad</span>
                       <div className="flex items-center gap-2">
                         <span className="text-4xl font-light font-mono text-[#f59e0b]">5.8</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* CENTER VERDICT */}
              <div className="col-span-1 lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center items-center text-center px-4 lg:px-8 relative py-12 lg:py-0">
                 <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.2)] rotate-3">
                    <TrendingDown className="text-red-500" size={32} />
                 </div>
                 
                 <h2 className="text-[40px] lg:text-[52px] leading-[1.05] font-bold text-white tracking-[-0.03em] mb-6 drop-shadow-lg">
                    You are losing<br/>this matchup.
                 </h2>
                 
                 <div className="bg-red-500/10 border border-red-500/20 rounded-full px-5 py-2 mb-8 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(239,68,68,0.2),transparent)] -translate-x-full animate-[shimmer_2s_infinite]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                    <span className="text-red-400 text-[12px] font-bold uppercase tracking-[0.15em]">8% Win Probability</span>
                 </div>
                 
                 <p className="text-[16px] text-zinc-400 leading-[1.6] max-w-md mx-auto">
                    Your competitor is dominating attention retention. While your production quality is technically higher, their messy, fast-paced hook structure is significantly outperforming your polished, slower intro.
                 </p>
              </div>

              {/* COMPETITOR AD */}
              <div className="col-span-1 lg:col-span-3 order-3 lg:order-3 relative h-[400px] lg:-mt-[20px] rounded-2xl overflow-hidden border border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.15)] z-10 group">
                 <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay pointer-events-none" />
                 <img src={imgTheirs} className="w-full h-full object-cover" alt="Competitor" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                 
                 {/* Top Badge */}
                 <div className="absolute top-4 right-4 bg-emerald-500 text-black text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                   Winner
                 </div>
                 
                 {/* Bottom Data */}
                 <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1 shadow-sm">Competitor</span>
                       <div className="flex items-center gap-2">
                         <span className="text-5xl font-bold font-mono text-[#10b981] drop-shadow-md">8.4</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* TELEMETRY */}
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-6 pl-2">
                 <BarChart2 size={16} className="text-zinc-500" />
                 <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Score Comparison</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                 {metrics.map(m => <TelemetryCard key={m.label} {...m} />)}
              </div>
            </div>

            {/* GAP ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
               {/* WINNING */}
               <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-5 pl-2">
                     <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle size={12} className="text-emerald-500" />
                     </div>
                     <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">Where you're winning</span>
                  </div>
                  
                  <div className="bg-[#111113]/80 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden shadow-lg transition-colors hover:bg-[#151518]">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent pointer-events-none" />
                     
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white text-[16px] font-medium tracking-tight">Production Value</h4>
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2.5 py-1 border border-white/5">
                           <span className="text-[#10b981] font-mono text-sm">8.2</span>
                           <span className="text-zinc-600 font-mono text-xs">vs</span>
                           <span className="text-[#10b981] font-mono text-sm">7.0</span>
                        </div>
                     </div>
                     <p className="text-zinc-400 text-[14px] leading-[1.6]">
                        Your lighting, audio mixing, and color grading are objectively superior. This builds deeper implicit trust with the viewer compared to their raw UGC style.
                     </p>
                  </div>
               </div>

               {/* LOSING */}
               <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-5 pl-2">
                     <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <XCircle size={12} className="text-red-500" />
                     </div>
                     <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500">Where they're beating you</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                     <div className="bg-[#111113]/80 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden shadow-lg transition-colors hover:bg-[#151518]">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.03] to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-white text-[16px] font-medium tracking-tight">Hook Strength</h4>
                           <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2.5 py-1 border border-white/5">
                              <span className="text-[#f59e0b] font-mono text-sm">5.2</span>
                              <span className="text-zinc-600 font-mono text-xs">vs</span>
                              <span className="text-[#10b981] font-mono text-sm">9.1</span>
                           </div>
                        </div>
                        <p className="text-zinc-400 text-[14px] leading-[1.6]">
                           They introduce the core problem ("Always tired?") in 1.5 seconds. You take 4 seconds of beauty shots before mentioning a problem. Viewers are scrolling past you before you pitch.
                        </p>
                     </div>

                     <div className="bg-[#111113]/80 backdrop-blur-sm border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden shadow-lg transition-colors hover:bg-[#151518]">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.03] to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-white text-[16px] font-medium tracking-tight">Call to Action</h4>
                           <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2.5 py-1 border border-white/5">
                              <span className="text-[#ef4444] font-mono text-sm">3.8</span>
                              <span className="text-zinc-600 font-mono text-xs">vs</span>
                              <span className="text-[#10b981] font-mono text-sm">8.5</span>
                           </div>
                        </div>
                        <p className="text-zinc-400 text-[14px] leading-[1.6]">
                           Your CTA is a simple voiceover "Link in bio." They freeze the frame, split the screen, display a massive "Free Shaker" text, and literally point an arrow at the Shop button.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* ACTION PLAN */}
            <div className="w-full relative">
               <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-px h-10 bg-gradient-to-b from-transparent to-indigo-500/30" />
               
               <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-500/30" />
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                     <Zap size={14} className="text-indigo-400" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white">Action Plan To Win</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-500/30" />
               </div>

               <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                  {/* P1 */}
                  <div className="relative rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/20 p-6 md:p-8 overflow-hidden group shadow-[0_20px_50px_-20px_rgba(99,102,241,0.15)] flex flex-col md:flex-row gap-6 items-start">
                     {/* Glow */}
                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12)_0%,transparent_60%)] pointer-events-none" />
                     
                     <div className="rounded-lg bg-indigo-500 text-white text-xs font-bold px-2.5 py-1 mt-1 shrink-0 relative z-10">
                        P1
                     </div>
                     
                     <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                           <span className="text-indigo-400 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                              Critical Fix
                           </span>
                        </div>
                        <h3 className="text-[24px] md:text-[28px] font-semibold text-white tracking-tight leading-tight">
                           Hard-cut your first 4 seconds.
                        </h3>
                        <p className="text-indigo-100/70 text-[15px] leading-[1.6] max-w-2xl mt-1">
                           Start immediately on the shot of the messy desk and add a high-contrast text overlay asking a direct question.
                        </p>
                     </div>
                  </div>

                  {/* P2 */}
                  <div className="relative rounded-2xl bg-white/[0.01] border border-white/[0.04] p-5 md:p-6 overflow-hidden group hover:border-white/[0.08] transition-colors flex flex-col md:flex-row gap-5 items-start opacity-80 hover:opacity-100">
                     <div className="rounded-lg bg-white/[0.06] text-zinc-500 text-xs font-bold px-2.5 py-1 mt-0.5 shrink-0">
                        P2
                     </div>
                     
                     <div className="flex flex-col gap-2">
                        <h3 className="text-[18px] md:text-[20px] font-medium text-zinc-300 tracking-tight leading-tight">
                           Remix the ending sequence.
                        </h3>
                        <p className="text-zinc-500 text-[14px] leading-[1.6] max-w-2xl">
                           Build a split-screen end card that holds for the final 3 seconds showing your product bundle alongside a clear visual arrow pointing downward.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}

const metrics = [
  { label: "Overall", yours: 5.8, theirs: 8.4, diff: -2.6 },
  { label: "Hook", yours: 5.2, theirs: 9.1, diff: -3.9 },
  { label: "Clarity", yours: 7.5, theirs: 8.0, diff: -0.5 },
  { label: "CTA", yours: 3.8, theirs: 8.5, diff: -4.7 },
  { label: "Production", yours: 8.2, theirs: 7.0, diff: 1.2 },
];

function TelemetryCard({ label, yours, theirs, diff }: { label: string, yours: number, theirs: number, diff: number }) {
  const isWin = diff > 0;
  const diffText = isWin ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  
  // Outer styling
  const cardBorder = isWin ? 'border-emerald-500/20' : 'border-white/[0.04] hover:border-red-500/30';
  const cardBg = isWin ? 'bg-emerald-500/[0.03]' : 'bg-[#111113] hover:bg-[#151518]';
  const glow = isWin 
    ? <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
    : <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-red-500/10 transition-colors" />;

  const badgeClass = isWin 
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
    : 'bg-red-500/10 text-red-400 border border-red-500/20';

  const yoursPct = (yours / 10) * 100;
  const theirsPct = (theirs / 10) * 100;

  const yoursColor = isWin ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-zinc-700';
  const theirsColor = !isWin ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-zinc-700';

  const yoursText = isWin ? 'text-white' : 'text-zinc-500';
  const theirsText = !isWin ? 'text-white' : 'text-zinc-500';

  return (
    <div className={`flex flex-col rounded-2xl p-5 relative overflow-hidden transition-all shadow-sm group border ${cardBorder} ${cardBg}`}>
       {glow}
       
       <div className="flex justify-between items-start mb-6 relative z-10">
          <span className="text-[13px] font-bold uppercase tracking-wide text-zinc-200">{label}</span>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${badgeClass}`}>
            {diffText}
          </span>
       </div>
       
       <div className="flex flex-col gap-3 relative z-10 mt-auto">
         {/* Yours */}
         <div className="flex flex-col gap-1.5">
           <div className="flex justify-between items-end">
             <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Yours</span>
             <span className={`text-lg font-mono font-medium leading-none ${yoursText}`}>{yours.toFixed(1)}</span>
           </div>
           <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${yoursColor}`} style={{ width: `${yoursPct}%` }} />
           </div>
         </div>
         
         {/* Theirs */}
         <div className="flex flex-col gap-1.5">
           <div className="flex justify-between items-end">
             <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Theirs</span>
             <span className={`text-lg font-mono font-medium leading-none ${theirsText}`}>{theirs.toFixed(1)}</span>
           </div>
           <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${theirsColor}`} style={{ width: `${theirsPct}%` }} />
           </div>
         </div>
       </div>
    </div>
  );
}