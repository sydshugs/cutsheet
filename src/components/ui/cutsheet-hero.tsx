import React from "react";
import EarlyAccessForm from "./cutsheet-early-access-form";
import {
  Play,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Clock,
  BarChart2,
  Target,
  Smile,
  MessageSquare,
  Eye,
  Volume2,
  Layers,
  Award,
} from "lucide-react";
import { AnimatedTooltip } from "./animated-tooltip";

const SOCIAL_PROOF_PEOPLE = [
  {
    id: 1,
    name: "Sarah Chen",
    designation: "Performance Marketer",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 2,
    name: "Marcus Rivera",
    designation: "Creative Director",
    image:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
  {
    id: 3,
    name: "Emily Parker",
    designation: "Media Buyer",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 4,
    name: "James Kim",
    designation: "Brand Strategist",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
];

// Scoring categories for marquee
const SCORE_CATEGORIES = [
  { name: "Hook Strength", icon: Zap },
  { name: "Pacing", icon: Clock },
  { name: "CTA Clarity", icon: Target },
  { name: "Emotional Pull", icon: Smile },
  { name: "Visual Flow", icon: Eye },
  { name: "Brand Recall", icon: Award },
  { name: "Audio Mix", icon: Volume2 },
  { name: "Retention", icon: TrendingUp },
  { name: "Copy Punch", icon: MessageSquare },
  { name: "Scene Balance", icon: Layers },
  { name: "Scroll Stop", icon: BarChart2 },
] as const;

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">
      {label}
    </span>
  </div>
);

export default function CutsheetHero() {
  return (
    <div className="relative w-full bg-zinc-950 text-white overflow-hidden font-sans">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes nudgeRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-nudge {
          animation: nudgeRight 1.5s ease-in-out infinite;
        }
        @keyframes barFill {
          from { width: 0%; }
          to { width: 87%; }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-bar {
          animation: barFill 1.8s ease-out 0.8s forwards;
          width: 0%;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>

      {/* Ambient glow background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 md:pt-32 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Left column */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">
            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-indigo-500/15">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  AI-Powered Creative Intelligence
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1
              className="animate-fade-in delay-200 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tighter leading-[0.9]"
              style={{
                maskImage:
                  "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
              }}
            >
              Analyze Any
              <br />
              <span className="bg-gradient-to-br from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
                Video Ad.
              </span>
              <br />
              In Seconds.
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-xl text-lg text-zinc-400 leading-relaxed">
              Upload your creative and get a full AI breakdown — hook strength,
              pacing, CTA clarity, emotional pull, and a score that tells you
              exactly what to fix before you spend a dollar on media.
            </p>

            {/* CTA Buttons */}
            <div id="waitlist" className="animate-fade-in delay-400 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <EarlyAccessForm />

                <button className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20">
                  <Play className="w-4 h-4 fill-current" />
                  Watch Demo
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                No card required &middot; Limited early access spots
              </p>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in delay-500 flex items-center gap-3">
              <AnimatedTooltip items={SOCIAL_PROOF_PEOPLE} />
              <p className="text-sm text-zinc-500 ml-2">
                <span className="text-white font-medium">2,400+</span> ads analyzed this week
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-5 lg:mt-8">
            {/* Stats Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Top stat */}
                <div className="flex items-center gap-4 mb-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
                    <BarChart2 className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">
                      87<span className="text-indigo-400">/100</span>
                    </div>
                    <div className="text-sm text-zinc-400">Average Ad Score</div>
                  </div>
                </div>

                {/* Score bars */}
                <div className="space-y-3 mb-7">
                  {[
                    { label: "Hook Strength", score: 92, color: "from-indigo-500 to-indigo-400" },
                    { label: "CTA Clarity", score: 78, color: "from-violet-500 to-violet-400" },
                    { label: "Pacing", score: 85, color: "from-cyan-500 to-cyan-400" },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">{label}</span>
                        <span className="text-white font-medium">{score}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/60">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${color} animate-bar`}
                          style={{
                            width: `${score}%`,
                            animation: `barFill 1.6s ease-out ${0.8 + Math.random() * 0.4}s forwards`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px w-full bg-white/8 mb-5" />

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <StatItem value="11" label="Metrics" />
                  <div className="w-px bg-white/10 mx-auto" />
                  <StatItem value="< 30s" label="Analysis" />
                  <div className="w-px bg-white/10 mx-auto" />
                  <StatItem value="AI" label="Powered" />
                </div>

                {/* Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-medium tracking-wide text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    LIVE ANALYSIS
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    BATCH MODE
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-medium tracking-wide text-indigo-300">
                    <Layers className="w-3 h-3" />
                    COMPARE
                  </div>
                </div>
              </div>
            </div>

            {/* Marquee — scoring categories */}
            <div className="animate-fade-in delay-600 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-6 backdrop-blur-xl">
              <h3 className="mb-4 px-6 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                What We Score
              </h3>
              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                }}
              >
                <div className="animate-marquee flex gap-6 whitespace-nowrap px-4">
                  {[...SCORE_CATEGORIES, ...SCORE_CATEGORIES].map((cat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default"
                    >
                      <cat.icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="text-xs font-medium text-zinc-300">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
