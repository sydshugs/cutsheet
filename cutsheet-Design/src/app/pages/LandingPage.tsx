import React, { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, ChevronRight, Play, Eye, BarChart2, Target, Clock, Upload, CheckCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import exampleImage from "figma:asset/ec42d7e90ef7d0ebc9a3d6fb5b41f69144e16a73.png";
import svgPaths from "../../imports/svg-h1dhpnr5i2";
import Section1 from "../../imports/Section1";

function Logo() {
  return (
    <div className="relative shrink-0 w-[20px] h-[20px]">
      <svg className="absolute block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.939 19.9388">
        <g>
          <g>
            <path d={svgPaths.p1f948200} fill="white" fillOpacity="0.49" />
            <path d={svgPaths.p2aeb0d70} stroke="url(#paint0_linear_31_2702)" strokeOpacity="0.5" strokeWidth="0.0645734" />
          </g>
          <path d={svgPaths.p39182a00} fill="white" fillOpacity="0.7" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_31_2702" x1="9.96942" x2="9.96942" y1="0" y2="19.9388">
            <stop stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="#666666" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Simulate the analysis delay to show the raw ad first, then snap the UI in
    const timer = setTimeout(() => setIsAnalyzed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Stagger variants for the left column
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#09090b] font-['Geist',sans-serif] overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* ─── BACKGROUND AMBIENCE ─── */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 65% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)"
        }}
      />

      {/* ─── FIXED NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] bg-[#09090b]/80 backdrop-blur-md border-b border-white/[0.04] z-50 flex items-center justify-between px-6 md:px-[64px]">
        <div className="flex items-center gap-[4.84px]">
          <Logo />
          <span className="font-semibold text-[#f4f4f5] text-[19.36px] tracking-[0.484px]">cutsheet</span>
        </div>
        <button className="bg-white/[0.03] border border-white/10 rounded-full h-[42px] px-8 text-sm font-medium text-[#d4d4d8] hover:bg-white/[0.06] transition-colors">
          Enter Access Code
        </button>
      </nav>

      {/* ─── HERO LAYOUT ─── */}
      <div className="relative z-20 flex flex-col xl:flex-row items-center justify-between w-full max-w-[1400px] mx-auto px-6 min-h-screen pt-24 xl:pt-0 gap-16 xl:gap-8">
        
        {/* ─── LEFT COLUMN ─── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col items-start w-full max-w-[576px] z-20 pl-16"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 bg-[rgba(97,95,255,0.08)] border border-[rgba(97,95,255,0.3)] rounded-full pl-3 pr-4 py-1.5 w-max">
              <div className="w-2 h-2 rounded-full bg-[#7c86ff] opacity-80 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
              <span className="text-[12px] font-medium text-[#a3b3ff] tracking-[0.3px]">Private beta · Limited spots</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-[44px] font-bold text-white leading-[50px] tracking-[-2px] mb-6 max-w-[480px]">
            Stop guessing why your ads underperform.
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="text-[18px] text-[#9f9fa9] font-light leading-[29.25px] max-w-[420px] mb-10">
            Upload any ad. Get a score, a priority fix, and an AI rewrite in 30 seconds. No ad account needed.
          </motion.p>

          {/* CTA */}
          <motion.div variants={itemVariants} className="w-full sm:w-auto">
            <button className="flex items-center justify-center gap-2 bg-[#615fff] hover:bg-[#4f46e5] transition-colors text-white font-semibold text-[14px] px-8 py-4 rounded-full shadow-[0px_0px_40px_-10px_rgba(99,102,241,0.4)]">
              Enter Access Code
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="relative w-full flex justify-center xl:justify-end items-center mt-8 xl:mt-0 z-10 overflow-visible">
          <HeroImage />
        </div>

      </div>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <div className="w-full relative z-10 pt-24 pb-12 overflow-hidden bg-[#09090b]">
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 60%)" }} />
        <div className="w-full flex justify-center scale-[0.6] md:scale-75 lg:scale-100 origin-top h-[550px] md:h-[650px] lg:h-[850px] relative z-10">
          <Section1 />
        </div>
      </div>

      {/* ─── WHO IT'S FOR SECTION ─── */}
      <div className="w-full border-t border-white/[0.04] bg-[#09090b] relative z-10 py-20">
        <div className="flex flex-col items-center justify-center mb-16 px-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 mb-4">
            WHO IT'S FOR
          </div>
          <h2 className="text-[36px] font-bold text-zinc-100 text-center">
            Built for the people who actually run ads.
          </h2>
        </div>

        {/* ROW 1 — Media Buyers */}
        <div className="flex flex-col md:flex-row items-center gap-16 px-6 md:px-16 py-16 max-w-6xl mx-auto">
          {/* LEFT (copy) */}
          <div className="flex-1 flex flex-col items-start">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/[0.08] border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
              MEDIA BUYERS
            </div>
            <h3 className="text-[28px] font-bold text-zinc-100 leading-tight max-w-sm">
              Running 20 creatives a month? Stop finding out what didn't work after you've already spent.
            </h3>
            <p className="text-base text-zinc-500 leading-relaxed max-w-sm mt-4">
              Cutsheet scores every creative before it goes live. Platform benchmarks, dimension breakdown, and a ranked priority fix list. Know before you spend.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-indigo-500 shrink-0" />
                <span className="text-sm text-zinc-400">Score any platform — Meta, TikTok, YouTube, Display</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-indigo-500 shrink-0" />
                <span className="text-sm text-zinc-400">Benchmark vs. real platform averages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-indigo-500 shrink-0" />
                <span className="text-sm text-zinc-400">Priority fix list ranked by impact</span>
              </div>
            </div>
          </div>

          {/* RIGHT (product UI) */}
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden shadow-2xl p-6">
              <div className="flex flex-col items-center py-6">
                <div className="text-[52px] font-bold text-indigo-400 leading-none mb-2">7.2<span className="text-[24px] text-zinc-600">/10</span></div>
                <div className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded mb-8">
                  Good Potential
                </div>
                
                <div className="w-full flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-400">
                      <span>Visual Hook</span>
                      <span className="text-indigo-400">7.8</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-[78%]"></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-400">
                      <span>Key Message</span>
                      <span className="text-emerald-400">8.5</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[85%]"></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-400">
                      <span>Brand Fit</span>
                      <span className="text-indigo-400">7.2</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-[72%]"></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-400">
                      <span>Call to Action</span>
                      <span className="text-amber-400">5.3</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[53%]"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-[11px] font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                  +0.8 pts vs Meta avg
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto border-t border-white/[0.04]"></div>

        {/* ROW 2 — Creative Strategists */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-16 px-6 md:px-16 py-16 max-w-6xl mx-auto">
          {/* RIGHT (copy) - First visually due to flex-row-reverse on desktop */}
          <div className="flex-1 flex flex-col items-start">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/[0.08] border border-amber-500/20 rounded-full px-3 py-1 mb-4">
              CREATIVE STRATEGISTS
            </div>
            <h3 className="text-[28px] font-bold text-zinc-100 leading-tight max-w-sm">
              Brief better. Know what actually works before the shoot.
            </h3>
            <p className="text-base text-zinc-500 leading-relaxed max-w-sm mt-4">
              Stop briefing on gut feel. Cutsheet tells you which hook structure, CTA format, and visual style scores highest for your platform and niche — before a single frame is shot.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-amber-500 shrink-0" />
                <span className="text-sm text-zinc-400">AI-generated creative brief from your scorecard</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-amber-500 shrink-0" />
                <span className="text-sm text-zinc-400">Hook direction, key message, CTA recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-amber-500 shrink-0" />
                <span className="text-sm text-zinc-400">Platform and niche-specific guidance</span>
              </div>
            </div>
          </div>

          {/* LEFT (product UI) */}
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden shadow-2xl p-6">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-zinc-500 uppercase mb-4">Creative Brief</div>
              
              <div className="flex flex-col gap-3">
                <div className="h-12 rounded-lg border border-white/[0.04] bg-white/[0.02] flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-zinc-300">Hook Direction</span>
                  <ChevronDown className="w-4 h-4 text-zinc-600" />
                </div>
                <div className="h-12 rounded-lg border border-white/[0.04] bg-white/[0.02] flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-zinc-300">Key Message</span>
                  <ChevronDown className="w-4 h-4 text-zinc-600" />
                </div>
                <div className="h-12 rounded-lg border border-white/[0.04] bg-white/[0.02] flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-zinc-300">Call to Action</span>
                  <ChevronDown className="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto border-t border-white/[0.04]"></div>

        {/* ROW 3 — DTC Founders */}
        <div className="flex flex-col md:flex-row items-center gap-16 px-6 md:px-16 py-16 max-w-6xl mx-auto">
          {/* LEFT (copy) */}
          <div className="flex-1 flex flex-col items-start">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
              DTC FOUNDERS
            </div>
            <h3 className="text-[28px] font-bold text-zinc-100 leading-tight max-w-sm">
              Your budget is too small to test 10 variations. Rank them first.
            </h3>
            <p className="text-base text-zinc-500 leading-relaxed max-w-sm mt-4">
              Upload 5–10 creatives. Cutsheet scores them all in parallel and tells you which 2–3 are worth putting spend behind — before you burn budget finding out the hard way.
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0" />
                <span className="text-sm text-zinc-400">Score all variations simultaneously</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0" />
                <span className="text-sm text-zinc-400">Ranked leaderboard — test the top 2–3 only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0" />
                <span className="text-sm text-zinc-400">Know which creative to scale before you spend</span>
              </div>
            </div>
          </div>

          {/* RIGHT (product UI) */}
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden shadow-2xl p-6">
              <div className="flex flex-col gap-4">
                
                {/* #1 Card */}
                <div className="flex items-center gap-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
                  <div className="text-[28px] font-bold text-emerald-400 w-12 text-center">9.2</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-zinc-200">Variation B - Fast Paced</div>
                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mt-1">Would Scale</div>
                  </div>
                  <div className="w-12 h-12 bg-[#18181b] border border-white/[0.06] rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-zinc-500 ml-0.5" />
                  </div>
                </div>

                {/* #2 Card */}
                <div className="flex items-center gap-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
                  <div className="text-[28px] font-bold text-emerald-400 w-12 text-center">8.8</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-zinc-200">Variation A - Direct Testimonial</div>
                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mt-1">Would Scale</div>
                  </div>
                  <div className="w-12 h-12 bg-[#18181b] border border-white/[0.06] rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-zinc-500 ml-0.5" />
                  </div>
                </div>

                {/* #3 Card */}
                <div className="flex items-center gap-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] opacity-75">
                  <div className="text-[28px] font-bold text-amber-400 w-12 text-center">6.5</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-zinc-200">Variation C - Lifestyle</div>
                    <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold mt-1">Needs Rework</div>
                  </div>
                  <div className="w-12 h-12 bg-[#18181b] border border-white/[0.06] rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-zinc-500 ml-0.5" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRICING SECTION ─── */}
      <div className="w-full bg-[#09090b] relative z-10 py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="flex flex-col items-center justify-center mb-16 px-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 mb-4">
            PRICING
          </div>
          <h2 className="text-[36px] font-bold text-zinc-100 text-center mb-2">
            Simple pricing. No surprises.
          </h2>
          <p className="text-base text-zinc-500 text-center">
            Early access pricing — locked in for life when you join now.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 md:px-16 max-w-5xl mx-auto items-stretch">
          
          {/* CARD 1 — FREE */}
          <div className="flex flex-col rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex-1">
            <h3 className="text-[24px] font-semibold text-zinc-100 mb-1">Free</h3>
            <div className="text-sm font-medium text-zinc-400 mb-4">{`3 analyses / month`}</div>
            <div className="text-[32px] font-bold text-zinc-100 mb-2 leading-[1.1]">Free forever</div>
            <p className="text-[14px] text-zinc-500 mb-8 min-h-[44px]">
              Try Cutsheet risk-free. No card, no commitment.
            </p>
            <button className="rounded-full border border-white/[0.10] bg-white/[0.02] text-zinc-300 text-sm font-medium px-6 py-3 w-full mb-8 hover:bg-white/[0.04] transition-colors">
              Get Early Access
            </button>
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">Single video or static analysis</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">11-metric scorecard</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">Improvement suggestions</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">3 analyses per month</span>
              </div>
            </div>
          </div>

          {/* CARD 2 — PRO */}
          <div className="relative flex flex-col rounded-[16px] border border-indigo-500/20 bg-indigo-500/[0.06] p-6 flex-1 overflow-hidden group shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <motion.div 
                className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-indigo-500/20 blur-[60px] rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5] 
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-[24px] font-semibold text-zinc-100">Pro</h3>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/[0.1] border border-indigo-500/20 rounded-full px-2.5 py-1">
                  Most Popular
                </div>
              </div>
              <div className="text-sm font-medium text-indigo-300/80 mb-4">{`Unlimited analyses`}</div>
              <div className="text-[32px] font-bold text-zinc-100 mb-2 leading-[1.1]">Early access pricing</div>
              <p className="text-[14px] text-zinc-400 mb-8 min-h-[44px]">
                For performance marketers and creative teams shipping weekly.
              </p>
              <button className="rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-6 py-3 w-full mb-8 transition-colors shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]">
                Get Early Access
              </button>
              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">Everything in Free</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">Unlimited analyses</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">Competitor analysis</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">Batch ranking (up to 10 files)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">A/B testing</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">Generate creative brief</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">PDF export & share links</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-[16px] h-[16px] text-emerald-500 shrink-0 mt-[2px]" />
                  <span className="text-sm text-zinc-400 leading-snug">Saved Ads library</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3 — TEAM */}
          <div className="flex flex-col rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex-1">
            <h3 className="text-[24px] font-semibold text-zinc-100 mb-1">Team</h3>
            <div className="text-sm font-medium text-zinc-400 mb-4">{`Unlimited + team seats`}</div>
            <div className="text-[32px] font-bold text-zinc-100 mb-2 leading-[1.1]">Contact us</div>
            <p className="text-[14px] text-zinc-500 mb-8 min-h-[44px]">
              For agencies and in-house teams reviewing high-volume campaigns.
            </p>
            <button className="rounded-full border border-white/[0.10] bg-white/[0.02] text-zinc-300 text-sm font-medium px-6 py-3 w-full mb-8 hover:bg-white/[0.04] transition-colors">
              Get Early Access
            </button>
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">Everything in Pro</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">Multiple team seats</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-[16px] h-[16px] text-zinc-500 shrink-0 mt-[2px]" />
                <span className="text-sm text-zinc-400 leading-snug">Priority support</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

function AnalyzingBar({ label, delay }: { label: string; delay: number }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <span className="text-[10px] text-zinc-500 font-medium tracking-wide">{label}</span>
      <div className="h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: ["0%", "100%", "100%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay,
            times: [0, 0.6, 1],
            ease: "easeOut"
          }}
          className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
        />
      </div>
    </div>
  );
}

function DimensionRow({ 
  label, score, colorClass, textClass, width, delay 
}: { 
  label: string; score: string; colorClass: string; textClass: string; width: string; delay: number;
}) {
  return (
    <div className="flex flex-col gap-[8px] w-full">
      <div className="flex items-center justify-between px-[2px]">
        <span className="text-[14.6px] text-[#9f9fa9] font-medium tracking-[0.36px]">{label}</span>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className={`text-[16px] font-bold ${textClass}`}
        >
          {score}
        </motion.span>
      </div>
      <div className="h-[4px] w-full rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ delay, duration: 0.8, type: "spring", stiffness: 60, damping: 15 }}
          className={`h-full rounded-full ${colorClass} shadow-[0_0_13.3px_rgba(255,255,255,0.5)]`} 
        />
      </div>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="relative w-full max-w-[670px] h-[600px] flex items-center justify-center">
      <div className="relative w-[667px] h-[585px] transform scale-75 md:scale-100 origin-center xl:origin-right">
        {/* Glow behind image */}
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-500/30 blur-[100px] rounded-full pointer-events-none" />

        {/* Priority Fix Card */}
        <div className="absolute z-20 left-[26px] top-[37px] w-[194px] bg-[rgba(13,13,16,0.9)] border border-[rgba(254,154,0,0.2)] rounded-[16px] p-4 shadow-[0_20px_49px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-[12px] h-[12px] text-[#fe9a00]" />
            <span className="text-[10px] font-bold text-[#fe9a00] uppercase tracking-[0.49px]">Priority Fix</span>
          </div>
          <p className="text-[12px] text-[#d4d4d8] leading-[19px]">Add a clear CTA in<br/>the final 3 seconds.</p>
        </div>

        {/* NOT READY Badge */}
        <div className="absolute z-20 left-[-4px] top-0 bg-[rgba(251,44,54,0.1)] border border-[rgba(251,44,54,0.2)] rounded-full px-3 py-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <span className="text-[10px] font-bold text-[#ff6467] tracking-[0.25px]">NOT READY · 3 critical fixes</span>
        </div>

        {/* Main Image Container */}
        <div className="absolute z-10 left-[160px] top-0 w-[410px] h-[496px] bg-[#111113] rounded-[17px] overflow-hidden shadow-[0_34.5px_86px_rgba(0,0,0,0.6)]">
          <img src={exampleImage} alt="Ad Creative" className="absolute inset-0 w-full h-full object-cover" />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.43)] via-[rgba(0,0,0,0.2)] via-[60%] to-transparent" />
          
          {/* Text overlay on image */}
          <div className="absolute top-[66px] left-[53px]">
            <p className="font-['Gilda_Display',serif] text-[23.5px] text-black leading-[24.8px]">He cooks.<br/>We deliver.</p>
          </div>

          {/* Preview Badge */}
          <div className="absolute top-[17px] right-[17px] flex items-center gap-[6.5px] bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded-full px-3 py-1 shadow-[0_10.8px_16px_rgba(0,0,0,0.1)] backdrop-blur-md">
            <Eye className="w-[10.8px] h-[10.8px] text-[#9F9FA9]" />
            <span className="text-[9.7px] font-medium text-[#e4e4e7] uppercase tracking-[0.24px]">Preview</span>
          </div>
        </div>

        {/* ScoreCard */}
        <div className="absolute z-30 left-[475px] top-[217px] w-[176px] bg-[rgba(13,13,16,0.9)] border-[0.53px] border-[rgba(255,255,255,0.06)] rounded-[8.5px] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {/* GOOD POTENTIAL badge */}
          <div className="absolute -top-[8px] -right-[15px] bg-[rgba(97,95,255,0.15)] border-[0.89px] border-[rgba(97,95,255,0.3)] rounded-full px-2 py-0.5">
            <span className="text-[8px] font-bold text-[#a3b3ff] tracking-[0.4px]">GOOD POTENTIAL</span>
          </div>
          
          <div className="flex flex-col gap-[8.5px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[5.8px] font-semibold text-[#71717b] tracking-[0.7px] uppercase">OVERALL SCORE</span>
              <div className="flex items-baseline mt-1">
                <span className="text-[27.6px] font-bold text-[#10b981] tracking-[-0.69px] leading-[27.6px]">7.2</span>
                <span className="text-[12.75px] font-bold text-[#52525c] ml-[6px]">/10</span>
              </div>
            </div>
            
            <div className="w-full mt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[6.4px] text-[#71717b] flex items-center gap-1">
                  <Target className="w-[7.4px] h-[7.4px]" /> Vs. TikTok Average (6.4)
                </span>
                <span className="text-[6.4px] font-medium text-[#00d492]">+0.8 pts</span>
              </div>
              <div className="h-[3.2px] w-full bg-[#3f3f46] rounded-full overflow-hidden relative">
                <div className="absolute h-full bg-[#10b981] rounded-full w-[72%]" />
                <div className="absolute top-0 w-[1px] h-full bg-[#71717b] left-[64%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Predicted Performance Card */}
        <div className="absolute z-30 left-[417px] top-[339px] w-[235px] bg-[rgba(13,13,16,0.9)] border-[0.7px] border-[rgba(255,255,255,0.06)] rounded-[11.3px] p-[14px] shadow-[0_21.5px_54px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[7px] font-semibold text-[#71717b] tracking-[0.85px] uppercase">PREDICTED PERFORMANCE</span>
            <div className="bg-[rgba(0,188,125,0.1)] border-[0.7px] border-[rgba(0,188,125,0.2)] rounded-[4.2px] px-2 py-0.5">
              <span className="text-[7.8px] font-medium text-[#00d492] tracking-[0.2px]">High confidence</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col">
              <span className="text-[7.8px] font-semibold text-[#71717b] tracking-[0.9px] uppercase mb-1">EST. CTR</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[22.6px] font-bold text-[#f4f4f5] leading-[22.6px] tracking-[-0.56px]">0.8%</span>
                <span className="text-[17px] font-medium text-[#71717b] leading-[17px] mx-1">–</span>
                <span className="text-[22.6px] font-bold text-[#f4f4f5] leading-[22.6px] tracking-[-0.56px]">1.4%</span>
              </div>
            </div>
            <span className="text-[8.5px] font-medium text-[#9f9fa9]">YouTube avg · 0.6%</span>
          </div>

          <div className="w-full flex items-center gap-2 mb-6 mt-6">
            <span className="text-[7px] font-medium text-[#71717b]">0%</span>
            <div className="flex-1 h-[2.8px] bg-[#27272a] rounded-full relative">
              <div className="absolute left-[26%] w-[20%] h-full bg-[#6366f1] rounded-full" />
              <div className="absolute left-[40%] top-[-2.8px] w-[1.4px] h-[8.5px] bg-[#9f9fa9]" />
            </div>
            <span className="text-[7px] font-medium text-[#71717b]">3%+</span>
          </div>

          <div className="grid grid-cols-2 gap-[11.3px] mt-2">
            <div className="bg-[rgba(255,255,255,0.01)] border-[0.7px] border-[rgba(255,255,255,0.04)] rounded-[17px] p-3 flex flex-col gap-[5.6px]">
              <div className="flex items-center gap-[4.2px] text-[#71717b]">
                <BarChart2 className="w-[8px] h-[10px]" />
                <span className="text-[7.8px] font-semibold tracking-[0.93px] uppercase">CVR POTENTIAL</span>
              </div>
              <span className="text-[12.7px] font-semibold text-[#e4e4e7]">1.2% – 2.1%</span>
            </div>
            <div className="bg-[rgba(255,255,255,0.01)] border-[0.7px] border-[rgba(255,255,255,0.04)] rounded-[17px] p-3 flex flex-col gap-[5.6px]">
              <div className="flex items-center gap-[4.2px] text-[#71717b]">
                <Clock className="w-[8px] h-[10px]" />
                <span className="text-[7.8px] font-semibold tracking-[0.93px] uppercase">CREATIVE FATIGUE</span>
              </div>
              <span className="text-[12.7px] font-semibold text-[#e4e4e7]">~14 days</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}