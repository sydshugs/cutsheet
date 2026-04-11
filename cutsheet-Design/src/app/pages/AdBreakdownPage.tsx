import React, { useState, useEffect } from "react";
import { 
  ScanSearch, 
  Link as LinkIcon, 
  CheckCircle, 
  Circle, 
  RotateCcw, 
  Bookmark, 
  ChevronDown, 
  Copy,
  Play,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type BreakdownState = 'idle' | 'loading' | 'results';

export default function AdBreakdownPage() {
  const [url, setUrl] = useState("");
  const [appState, setAppState] = useState<BreakdownState>('idle');
  const [loadingStep, setLoadingStep] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'hook': false,
    'visuals': false,
    'copy': false,
    'offer': false,
    'brief': true // Default expanded
  });

  // Handle simulation of loading steps
  useEffect(() => {
    if (appState === 'loading') {
      const timers = [
        setTimeout(() => setLoadingStep(2), 1500),
        setTimeout(() => setLoadingStep(3), 3500),
        setTimeout(() => setLoadingStep(4), 5500),
        setTimeout(() => setAppState('results'), 7500)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [appState]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDeconstruct = () => {
    if (!url) return;
    setAppState('loading');
    setLoadingStep(1);
  };

  const handleReset = () => {
    setAppState('idle');
    setUrl("");
    setLoadingStep(1);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] relative font-['Geist',sans-serif] overflow-hidden">
      {/* Radial glow — amber (idle/loading states only) */}
      {appState !== 'results' && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(245,158,11,0.08) 0%, transparent 70%)" }}
        />
      )}
      
      {appState !== 'results' ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center w-full max-w-[720px] mx-auto px-6 py-12 relative z-10 min-h-[calc(100vh-56px)]">
          {/* --- HEADER SECTION (Always visible in idle/loading) --- */}
          {appState === 'idle' && (
            <div className="flex flex-col items-center mb-8 shrink-0">
              <div className="w-[76px] h-[76px] rounded-2xl bg-amber-500/[0.12] border border-amber-500/20 flex items-center justify-center mb-6">
                <ScanSearch size={40} color="#f59e0b" strokeWidth={1.5} />
              </div>
              <h1 className="text-[24px] font-bold text-zinc-100 mb-2.5 tracking-[-0.025em] leading-tight text-center">
                Ad Breakdown
              </h1>
              <p className="text-[14px] text-zinc-500 text-center leading-[1.6] max-w-[380px] mb-4">
                Paste any ad URL. Get a full AI breakdown in 30 seconds.
              </p>
              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {["Meta Ad Library", "TikTok Creative Center", "YouTube"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border px-3 py-1 text-xs text-amber-400"
                    style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL Input Row */}
          <div className={`w-full flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 h-[52px] shrink-0 transition-all duration-500 ${appState !== 'idle' ? 'max-w-2xl' : ''}`}>
            <LinkIcon size={14} className="text-zinc-500 shrink-0" strokeWidth={1.75} />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste a Meta Ad Library, TikTok Creative Center, or YouTube URL"
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-[13px] text-zinc-100 placeholder-zinc-600 disabled:opacity-50"
              disabled={appState === 'loading'}
              onKeyDown={(e) => e.key === 'Enter' && handleDeconstruct()}
            />
            {appState === 'idle' && (
              <button
                onClick={handleDeconstruct}
                disabled={!url}
                className="shrink-0 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 transition-colors cursor-pointer text-[13px] font-medium h-[36px] whitespace-nowrap"
              >
                Deconstruct
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {appState === 'loading' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl mt-6"
              >
                {/* Design reference: source pill variants */}
                <div className="flex flex-col gap-1.5 mb-3">
                  <span className="text-[9px] text-zinc-700 tracking-wide">Source pill updates based on URL detected</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      Meta Ad Library
                    </span>
                    <span className="rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      TikTok Creative Center
                    </span>
                    <span className="rounded bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      YouTube
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  
                  {/* Top Row */}
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/[0.04]">
                    <span className="rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      TikTok Creative Center
                    </span>
                    <span className="text-xs font-mono text-zinc-600 truncate flex-1">
                      {url || "tiktok.com/business/creativecenter/inspiration/id=7293847561234"}
                    </span>
                  </div>

                  {/* Loading Steps */}
                  <div className="flex flex-col gap-1 mb-8">
                    <LoadingStep 
                      label="Fetching ad creative..." 
                      status={loadingStep > 1 ? 'done' : loadingStep === 1 ? 'active' : 'pending'} 
                    />
                    <LoadingStep 
                      label="Reading the hook and structure..." 
                      status={loadingStep > 2 ? 'done' : loadingStep === 2 ? 'active' : 'pending'} 
                    />
                    <LoadingStep 
                      label="Analyzing what makes it work..." 
                      status={loadingStep > 3 ? 'done' : loadingStep === 3 ? 'active' : 'pending'} 
                    />
                    <LoadingStep 
                      label="Building your steal-this brief..." 
                      status={loadingStep > 4 ? 'done' : loadingStep === 4 ? 'active' : 'pending'} 
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-[3px] bg-white/[0.04] rounded-full overflow-hidden mb-3">
                    <motion.div 
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(loadingStep / 4) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs text-zinc-600 italic">
                      Studying the ad from a first-time viewer's perspective...
                    </span>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {appState === 'loading' && (
             <div className="w-full text-center mt-12 pb-8">
               <span className="text-[11px] font-mono text-zinc-700">
                 Powered by Gemini + Claude
               </span>
             </div>
          )}
        </div>
      ) : (
        /* --- RESULTS STATE (TWO COLUMNS) --- */
        <motion.div 
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex w-full h-full overflow-hidden"
        >
          {/* LEFT COLUMN */}
          <div className="w-[380px] shrink-0 border-r border-white/[0.04] overflow-y-auto flex flex-col relative bg-[#09090b]">
            {/* Top Meta Row */}
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="bg-teal-500/[0.10] text-teal-300 border border-teal-500/20 text-[10px] font-semibold uppercase rounded-full px-2.5 py-0.5 w-fit mb-1">
                  TIKTOK CREATIVE CENTER
                </span>
                <h2 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug">
                  Athletic Greens - "Morning Routine" Video Ad
                </h2>
              </div>
              <button onClick={handleReset} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 pt-1">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Analyze another</span>
              </button>
            </div>

            {/* Ad Creative Card */}
            <div className="mx-4 mt-4 rounded-2xl border border-white/[0.06] bg-zinc-900 overflow-hidden flex flex-col group">
              <div className="relative w-full aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                  alt="Ad Preview" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
              {/* File Info Bar */}
              <div className="px-3 py-2.5 border-t border-white/[0.06] flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-zinc-400">Instagram Reels</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="text-[11px] text-zinc-500">9:16 Video</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-600">0:15</span>
              </div>
            </div>

            {/* Save Button */}
            <button className="mx-4 mt-3 mb-6 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-300 text-sm py-2.5 transition-colors">
              <Bookmark className="w-4 h-4" />
              <span>Save to Library</span>
            </button>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col bg-[#09090b]">
            
            {/* URL Input Bar */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 flex items-center gap-2 mb-5 justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs font-mono text-zinc-600 truncate">
                  {url || "https://www.facebook.com/ads/library/?id=123456789"}
                </span>
              </div>
              <button onClick={handleReset} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* WHY IT WORKS CARD */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5 mb-4 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                  WHY IT WORKS
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                This creative thrives on high-contrast visual pacing and immediate problem-resolution. By establishing the "morning grogginess" pain point in the first 2 seconds, it instantly filters for its target audience. The subsequent rapid transition to a vibrant, energetic product demonstration creates a strong psychological association between the product and the desired state of feeling energized.
              </p>
            </div>

            {/* TEARDOWN SECTIONS */}
            <div className="flex flex-col gap-2 mb-4 shrink-0">
              
              <SectionCard 
                title="The Hook (0:00 - 0:03)"
                isExpanded={expandedSections['hook']}
                onToggle={() => toggleSection('hook')}
              >
                {/* Timeline visual anchor */}
                <div className="flex items-center gap-3 mb-5 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex relative">
                    <div className="h-full bg-indigo-500 w-[20%]" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                    <span className="text-indigo-400 font-semibold">0:00 — 0:03</span>
                    <span className="text-zinc-600">/ 0:15</span>
                  </div>
                </div>

                <p className="mb-3">
                  <strong className="text-zinc-200 font-semibold">Visual:</strong> Close-up, slightly desaturated shot of an alarm clock being hit, followed immediately by a messy kitchen counter. Text overlay: "Tired of complicated mornings?"
                </p>
                <p className="mb-3">
                  <strong className="text-zinc-200 font-semibold">Audio:</strong> Jarring alarm sound that cuts abruptly to silence, then upbeat lo-fi hip hop starts.
                </p>
                <p>
                  <strong className="text-zinc-200 font-semibold">Analysis:</strong> The jarring audio pattern interrupt grabs attention immediately. The messy kitchen visual creates empathy and validates the viewer's current state before introducing the solution.
                </p>
              </SectionCard>

              <SectionCard 
                title="Visual Pacing & Composition"
                isExpanded={expandedSections['visuals']}
                onToggle={() => toggleSection('visuals')}
              >
                {/* Stat Tile */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center justify-between mb-4 mt-1">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-zinc-100 leading-none">1.2s</span>
                    <span className="text-xs text-zinc-500 mt-1">avg scene length</span>
                  </div>
                  <div className="bg-emerald-500/[0.08] text-emerald-400 text-xs font-medium rounded-full px-2.5 py-1">
                    Momentum: High
                  </div>
                </div>

                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong className="text-zinc-200 font-semibold">Color Grading:</strong> Shifts noticeably from cool/blue tones in the "problem" state to warm/vibrant greens and yellows in the "solution" state.</li>
                  <li><strong className="text-zinc-200 font-semibold">Framing:</strong> Heavy use of tight close-ups on the product texture and mixing process to emphasize quality and ease of use.</li>
                </ul>
              </SectionCard>

              <SectionCard 
                title="Messaging & Copywriting"
                isExpanded={expandedSections['copy']}
                onToggle={() => toggleSection('copy')}
              >
                {/* Pull Quote */}
                <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-500/[0.04] px-4 py-3 mb-4 mt-1">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
                    Core Claim
                  </span>
                  <span className="text-sm font-semibold text-zinc-100 italic block leading-snug">
                    "75 vitamins in one scoop."
                  </span>
                </div>
                
                <p className="mb-4 text-zinc-400 text-[13px] leading-relaxed">Focuses entirely on simplification. It doesn't sell the ingredients; it sells the time saved.</p>
                
                <p className="mb-1"><strong className="text-zinc-200 font-semibold">Objection Handling:</strong> "Taste? Surprisingly good."</p>
                <p className="text-zinc-400 text-[13px] leading-relaxed">Addresses the #1 unspoken barrier (greens taste bad) directly mid-video while showing someone drinking it naturally.</p>
              </SectionCard>

              <SectionCard 
                title="Offer & Call to Action"
                isExpanded={expandedSections['offer']}
                onToggle={() => toggleSection('offer')}
              >
                <p className="mb-3">
                  <strong className="text-zinc-200 font-semibold">The Offer:</strong> Free 1-year supply of Vitamin D3+K2 + 5 travel packs with first purchase.
                </p>
                <p>
                  <strong className="text-zinc-200 font-semibold">The CTA:</strong> The final 3 seconds freeze on a split screen: product glory shot on the left, clear "Tap to Shop" button with an arrow pointing to the offer text on the right. High contrast, impossible to miss.
                </p>
              </SectionCard>

            </div>

            {/* YOUR BRIEF CARD */}
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.06] overflow-hidden shrink-0 mb-6">
              <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleSection('brief')}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-300">Your Steal-This Brief</span>
                </div>
                <div className="flex items-center gap-4">
                  <ChevronDown className={`w-4 h-4 text-indigo-500/50 transition-transform duration-200 ${expandedSections['brief'] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {expandedSections['brief'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-4 border-t border-indigo-500/10">
                      
                      {/* Brief Header Row */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-500/10">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-400">
                            STEAL-THIS BRIEF
                          </span>
                        </div>
                        <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/[0.08] hover:bg-indigo-500/[0.15] px-2.5 py-1 rounded-md" onClick={(e) => e.stopPropagation()}>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>

                      <div className="font-mono text-[12px] text-indigo-200/80 leading-[1.7] whitespace-pre-wrap">
{`FORMAT: 15-30s UGC or Lo-Fi Studio Video
OBJECTIVE: Direct Response / Conversion
ANGLE: The "Too busy for health" simplification

SCENE 1: THE HOOK (0:00-0:03)
- Visual: Fast POV shot of chaotic morning task (spilling coffee, looking at messy desk).
- Text Overlay: "How I fix my chaos in 30 seconds."
- Audio: Upbeat, slightly fast-paced instrumental track.

SCENE 2: THE REVEAL (0:03-0:08)
- Visual: Smooth transition to clean counter. Scoop product into glass, add water, stir. 
- Focus: The vibrant color and smooth mixing.
- Voiceover: "I swapped my 5-step routine for this one scoop."

SCENE 3: VALIDATION (0:08-0:12)
- Visual: Creator taking a sip, looking pleasantly surprised.
- Text Overlay: "Actually tastes good???"
- Voiceover: "Tastes surprisingly good and gives me sustained energy."

SCENE 4: THE CTA (0:12-0:15)
- Visual: Static split screen. Left side: product. Right side: Offer text.
- Text: "Try it risk-free + Get [Free Gift]"
- Audio: "Tap the link below to get yours."`}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="w-full text-center mt-auto pb-4 pt-8">
              <span className="text-[11px] font-mono text-zinc-700">
                Powered by Gemini + Claude
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </div>
  );
}

// Subcomponents

function LoadingStep({ label, status }: { label: string, status: 'pending' | 'active' | 'done' }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        {status === 'active' && (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        )}
        {status === 'pending' && <Circle className="w-4 h-4 text-zinc-700" />}
      </div>
      <span className={`text-sm transition-colors duration-300 ${
        status === 'done' ? 'text-zinc-500' : 
        status === 'active' ? 'text-zinc-200 font-medium' : 
        'text-zinc-700'
      }`}>
        {label}
      </span>
    </div>
  );
}

function SectionCard({ title, children, isExpanded, onToggle }: { title: string, children: React.ReactNode, isExpanded: boolean, onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={onToggle}
      >
        <span className="text-sm font-semibold text-zinc-100">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3 border-t border-white/[0.04] text-sm text-zinc-400 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}