import React from "react";
import EarlyAccessForm from "./cutsheet-early-access-form";
import {
  Zap,
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
  ChevronDown,
} from "lucide-react";
const WAITLIST_INITIALS = ["S", "M", "E", "J"];

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
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
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
                Ad Creative.
              </span>
              <br />
              In Seconds.
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-xl text-lg text-zinc-400 leading-relaxed">
              Upload your video or static creative and get a full AI breakdown — hook strength,
              pacing, CTA clarity, emotional pull, and a score that tells you
              exactly what to fix before you spend a dollar on media.
            </p>

            {/* CTA Buttons */}
            <div id="waitlist" className="animate-fade-in delay-400 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <EarlyAccessForm />
              </div>
              <p className="text-xs text-zinc-600">
                No card required &middot; Limited early access spots
              </p>
              <a
                href="#how-it-works"
                className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                See how it works <ChevronDown size={14} />
              </a>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in delay-500 flex items-center gap-3">
              <div className="flex -space-x-2">
                {WAITLIST_INITIALS.map((initial) => (
                  <div
                    key={initial}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-400 ring-2 ring-zinc-950"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-500 ml-2">
                <span className="text-white font-medium">200+</span> marketers on the waitlist
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-5 lg:mt-8">
            {/* Hero demo GIF */}
            <div className="animate-fade-in delay-500">
              <img
                src="/demos/upload-to-analysis.webp"
                className="w-full rounded-2xl"
                alt="Cutsheet analyzing an ad creative"
              />
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
