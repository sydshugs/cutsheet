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
} from "lucide-react";

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
  <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-4 sm:p-5 transition-all hover:-translate-y-1 hover:border-indigo-400/60 hover:bg-zinc-900/80">
    <div className="pointer-events-none absolute inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-transparent" />
    <div className="relative flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/80 ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-indigo-300" />
      </div>
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
          <span className="text-[10px] font-medium tracking-[0.16em] text-zinc-400 uppercase">
            Metric
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <p className="text-[13px] leading-relaxed text-zinc-400">{desc}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/80">
          <div
            className={`h-full w-full rounded-full bg-gradient-to-r ${accent}`}
            style={{ opacity: 0.9 }}
          />
        </div>
      </div>
    </div>
  </div>
);

export default function CutsheetFeatures() {
  const firstEight = METRICS.slice(0, 8);
  const lastThree = METRICS.slice(8);

  return (
    <section className="relative w-full bg-zinc-950 text-white border-t border-white/5">
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
        {/* Top: Metrics grid */}
        <div className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              What Cutsheet Measures
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
              11 creative metrics, scored in one pass.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl">
              Every analysis breaks your ad into the same consistent scorecard, so
              you can compare hooks, scripts, and edits apples-to-apples across campaigns.
            </p>
          </div>

          <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-4">
            {firstEight.map((m) => (
              <MetricCard key={m.name} {...m} />
            ))}
          </div>

          {/* Last 3 centered row */}
          <div className="mt-4 flex flex-col items-stretch justify-center gap-4 md:flex-row md:items-stretch max-w-3xl">
            {lastThree.map((m) => (
              <div key={m.name} className="flex-1 min-w-[220px]">
                <MetricCard {...m} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Platform feature bento grid */}
        <div className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Built For Creative Teams
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
              One workflow, four superpowers.
            </h2>
          </div>

          <div className="grid gap-4 md:gap-5 md:grid-cols-3 auto-rows-[minmax(0,1fr)]">
            {/* Compare (wide) */}
            <div className="relative col-span-1 md:col-span-2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-px rounded-3xl bg-gradient-to-br from-indigo-500/25 via-violet-500/10 to-transparent opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-indigo-300 uppercase">
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                  Compare
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Instant A/B breakdowns for hooks and edits.
                </h3>
                <p className="text-sm text-zinc-400 max-w-xl">
                  Drop multiple variants and see which opener, script, and structure the model
                  would scale with first — before you light up spend.
                </p>
              </div>
            </div>

            {/* Batch (wide) */}
            <div className="relative col-span-1 md:col-span-2 md:col-start-2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-px rounded-3xl bg-gradient-to-bl from-violet-500/20 via-indigo-500/8 to-transparent opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-violet-300 uppercase">
                  <Rows4 className="h-3.5 w-3.5" />
                  Batch Mode
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Drag in a folder, score the whole campaign.
                </h3>
                <p className="text-sm text-zinc-400 max-w-xl">
                  Run up to 10 ads at once and sort by predicted performance, hook strength,
                  or any of the 11 metrics.
                </p>
              </div>
            </div>

            {/* Swipe File */}
            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-px rounded-3xl bg-gradient-to-br from-emerald-500/10 via-indigo-500/5 to-transparent opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-emerald-300 uppercase">
                  <FolderHeart className="h-3.5 w-3.5" />
                  Swipe File
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Save winners into a living library.
                </h3>
                <p className="text-sm text-zinc-400">
                  Keep the best hooks, scripts, and edits one click away for your next brainstorm.
                </p>
              </div>
            </div>

            {/* Briefs */}
            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-px rounded-3xl bg-gradient-to-tr from-indigo-500/15 via-violet-500/8 to-transparent opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-indigo-300 uppercase">
                  <FileText className="h-3.5 w-3.5" />
                  Creative Briefs
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Turn any analysis into a ready-to-ship brief.
                </h3>
                <p className="text-sm text-zinc-400">
                  Export talking points, hooks, and scene notes into a structured doc your team
                  can actually build from.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
