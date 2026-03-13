import React from "react";
import {
  Zap,
  Clock,
  Target,
  Smile,
  Eye,
  Award,
  Volume2,
  TrendingUp,
  MessageSquare,
  Layers,
  BarChart2,
  SplitSquareVertical,
  Rows4,
  FolderHeart,
  FileText,
  FlaskConical,
} from "lucide-react";
import { SpotlightCard } from "./spotlight-card";

const METRICS = [
  {
    name: "Hook Strength",
    desc: "Detects scroll-stopping frames and opener strength in the first 3 seconds.",
    icon: Zap,
    accent: "from-indigo-500/70 to-indigo-400/70",
  },
  {
    name: "Pacing",
    desc: "Analyzes cut cadence and beat alignment so scenes never drag or feel rushed.",
    icon: Clock,
    accent: "from-sky-500/70 to-cyan-400/70",
  },
  {
    name: "CTA Clarity",
    desc: "Scores how obvious the offer and next step are across all scenes.",
    icon: Target,
    accent: "from-violet-500/70 to-indigo-400/70",
  },
  {
    name: "Emotional Pull",
    desc: "Maps curiosity, tension, relief, and urgency across the entire spot.",
    icon: Smile,
    accent: "from-pink-500/70 to-rose-400/70",
  },
  {
    name: "Visual Flow",
    desc: "Checks framing, motion, and transitions for smooth, thumb-stopping storytelling.",
    icon: Eye,
    accent: "from-emerald-500/70 to-teal-400/70",
  },
  {
    name: "Brand Recall",
    desc: "Measures how early and how often the brand shows up without feeling shouty.",
    icon: Award,
    accent: "from-amber-500/70 to-yellow-400/70",
  },
  {
    name: "Audio Mix",
    desc: "Looks at dialogue vs. music balance and captions for sound-off viewers.",
    icon: Volume2,
    accent: "from-cyan-500/70 to-sky-400/70",
  },
  {
    name: "Retention",
    desc: "Predicts drop-off moments and recommends cut points to keep viewers locked in.",
    icon: TrendingUp,
    accent: "from-lime-500/70 to-emerald-400/70",
  },
  {
    name: "Copy Punch",
    desc: "Scores on-screen copy for clarity, brevity, and thumb-pausing punch.",
    icon: MessageSquare,
    accent: "from-fuchsia-500/70 to-pink-400/70",
  },
  {
    name: "Scene Balance",
    desc: "Flags scenes that overstay, under-explain, or repeat what we already know.",
    icon: Layers,
    accent: "from-slate-500/70 to-indigo-400/70",
  },
  {
    name: "Scroll Stop",
    desc: "Predicts scroll-stop probability by combining hook, motion, and contrast.",
    icon: BarChart2,
    accent: "from-indigo-500/70 to-violet-400/70",
  },
] as const;

const MetricCard = ({
  name,
  desc,
  icon: Icon,
  accent,
}: {
  name: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
}) => (
  <div className="flex-shrink-0 w-[240px] whitespace-normal rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-xl">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900/80 ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-indigo-300" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <p className="text-[12px] leading-relaxed text-zinc-400">{desc}</p>
      </div>
    </div>
  </div>
);

export default function CutsheetFeatures() {
  return (
    <section id="features" className="relative w-full bg-zinc-950 text-white border-t border-white/5">
      <style>{`
        @keyframes metricsScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-metrics {
          animation: metricsScroll 45s linear infinite;
        }
        .animate-metrics:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Ambient background to match hero */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-600/10 blur-[110px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 space-y-16">
        {/* Top: Metrics carousel */}
        <div className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              What Cutsheet Measures
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
              What Cutsheet scores
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl">
              Every analysis covers 11 creative dimensions — instantly, on any ad format.
            </p>
          </div>

          {/* Carousel */}
          <div
            className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto sm:overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            }}
          >
            <div className="animate-metrics flex gap-5 whitespace-nowrap px-4">
              {[...METRICS, ...METRICS].map((m, i) => (
                <MetricCard key={`${m.name}-${i}`} {...m} />
              ))}
            </div>
          </div>
        </div>

        {/* Live features */}
        <div className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Built & Live
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              More than a scorecard
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl">
              Compare variants, batch-analyze campaigns, A/B test creatives, and generate briefs — all live today.
            </p>
          </div>

          <div className="grid gap-4 md:gap-5 md:grid-cols-2">
            <SpotlightCard
              spotlightColor="rgba(99, 102, 241, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-3">
                <img src="/demos/scorecard-deep-dive.webp" alt="Compare mode demo" className="w-full rounded-2xl" />
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-indigo-300 uppercase">
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                  Compare
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Side-by-side A/B breakdowns for hooks and edits.
                </h3>
                <p className="text-sm text-zinc-400">
                  Drop two variants and see which opener, script, and structure the model
                  would scale first — with a head-to-head comparison report.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(139, 92, 246, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-3">
                <img src="/demos/batch-mode.webp" alt="Batch mode demo" className="w-full rounded-2xl" />
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-violet-300 uppercase">
                  <Rows4 className="h-3.5 w-3.5" />
                  Batch Mode
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Drag in a folder, score the whole campaign.
                </h3>
                <p className="text-sm text-zinc-400">
                  Run up to 10 ads at once and sort by predicted performance, hook strength,
                  or any of the 11 metrics.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(6, 182, 212, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-3">
                <img src="/demos/ab-pre-flight.webp" alt="A/B pre-flight testing demo" className="w-full rounded-2xl" />
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-cyan-300 uppercase">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Pre-Flight A/B Testing
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Rank 2–4 variants before you spend a dollar.
                </h3>
                <p className="text-sm text-zinc-400">
                  Upload multiple creatives and get a ranked leaderboard with scores,
                  strengths, weaknesses, and a winner call — all before media goes live.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(99, 102, 241, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-3">
                <img src="/demos/scorecard-deep-dive.webp" alt="Creative briefs demo" className="w-full rounded-2xl" />
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-indigo-300 uppercase">
                  <FileText className="h-3.5 w-3.5" />
                  Creative Briefs
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Turn any analysis into a ready-to-ship brief.
                </h3>
                <p className="text-sm text-zinc-400">
                  One click generates a structured creative brief with hooks, scene notes,
                  and talking points your team can actually build from.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Roadmap */}
        <div className="space-y-6 opacity-75">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
              On the roadmap
            </p>
            <p className="text-sm text-zinc-400">
              Early access members get these features first.
            </p>
          </div>

          <div className="grid gap-4 md:gap-5 md:grid-cols-2">
            <SpotlightCard
              spotlightColor="rgba(16, 185, 129, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-emerald-300 uppercase">
                  <FolderHeart className="h-3.5 w-3.5" />
                  Swipe File
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Save winners into a living library.
                  <span className="bg-white/10 text-zinc-500 text-xs rounded-full px-2 py-0.5 ml-1.5 whitespace-nowrap">Coming soon</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Keep the best hooks, scripts, and edits one click away for your next brainstorm.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
