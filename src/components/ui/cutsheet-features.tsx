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
  Trophy,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Rocket,
} from "lucide-react";
import { SpotlightCard } from "./spotlight-card";

/* ─── Metrics carousel data ──────────────────────────────────────────── */

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

/* ─── Feature preview animations CSS ─────────────────────────────────── */

const FEATURE_STYLES = `
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

  @keyframes feat-bar {
    from { width: 0%; }
    to { width: var(--w); }
  }
  .feat-bar {
    width: 0%;
    animation: feat-bar 1.4s ease-out forwards;
  }

  @keyframes feat-fade {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .feat-fade {
    opacity: 0;
    animation: feat-fade 0.5s ease-out forwards;
  }

  @keyframes feat-pop {
    0% { opacity: 0; transform: scale(0.85); }
    60% { transform: scale(1.03); }
    100% { opacity: 1; transform: scale(1); }
  }
  .feat-pop {
    opacity: 0;
    animation: feat-pop 0.5s ease-out forwards;
  }
`;

/* ─── Shared card container (matches hero stats card style) ──────────── */

function PreviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─── 1. Compare Preview ─────────────────────────────────────────────── */

const COMPARE_BARS = [
  { label: "Hook", a: 92, b: 54, color: "from-indigo-500 to-indigo-400" },
  { label: "CTA", a: 78, b: 65, color: "from-violet-500 to-violet-400" },
  { label: "Pacing", a: 85, b: 42, color: "from-cyan-500 to-cyan-400" },
];

function ComparePreview() {
  return (
    <PreviewCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SplitSquareVertical className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Head to Head
          </span>
        </div>
      </div>

      {/* Variant labels */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">Variant A</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">vs</span>
        <span className="text-sm font-semibold text-zinc-400">Variant B</span>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {COMPARE_BARS.map(({ label, a, b, color }, i) => (
          <div key={label} className="feat-fade" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400">{label}</span>
              <div className="flex gap-3">
                <span className="text-white font-medium">{a}</span>
                <span className="text-zinc-500">{b}</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800/60">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color} feat-bar`}
                  style={{ "--w": `${a}%`, animationDelay: `${0.5 + i * 0.15}s` } as React.CSSProperties}
                />
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800/60">
                <div
                  className="h-full rounded-full bg-zinc-600 feat-bar"
                  style={{ "--w": `${b}%`, animationDelay: `${0.6 + i * 0.15}s` } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Winner badge */}
      <div
        className="mt-4 feat-pop inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1"
        style={{ animationDelay: "1.1s" }}
      >
        <Trophy className="h-3 w-3 text-green-400" />
        <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">
          Variant A wins
        </span>
      </div>
    </PreviewCard>
  );
}

/* ─── 2. Batch Mode Preview ──────────────────────────────────────────── */

const BATCH_ROWS = [
  { rank: 1, file: "hero-spot-final.mp4", score: 9, scale: true },
  { rank: 2, file: "ugc-testimonial-v3.mp4", score: 8, scale: true },
  { rank: 3, file: "product-demo-15s.mp4", score: 7, scale: true },
  { rank: 4, file: "lifestyle-montage.mp4", score: 5, scale: false },
];

const MEDALS: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

function scoreColor(val: number) {
  if (val >= 9) return "text-emerald-400";
  if (val >= 7) return "text-indigo-400";
  if (val >= 5) return "text-amber-400";
  return "text-red-400";
}

function BatchPreview() {
  return (
    <PreviewCard>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Rows4 className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Campaign Results
        </span>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">4 files</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[24px_1fr_36px_48px] gap-2 mb-2 px-1">
        <span className="text-[9px] text-zinc-600 uppercase">#</span>
        <span className="text-[9px] text-zinc-600 uppercase">File</span>
        <span className="text-[9px] text-zinc-600 uppercase text-right">Score</span>
        <span className="text-[9px] text-zinc-600 uppercase text-right">Scale</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {BATCH_ROWS.map(({ rank, file, score, scale }, i) => (
          <div
            key={rank}
            className={`feat-fade grid grid-cols-[24px_1fr_36px_48px] gap-2 items-center rounded-lg px-1 py-1.5 ${
              rank === 1 ? "bg-white/[0.03] border-l-2 border-green-500/50" : ""
            }`}
            style={{ animationDelay: `${0.3 + i * 0.12}s` }}
          >
            <span className="text-xs font-mono text-zinc-400">
              {MEDALS[rank] || `#${rank}`}
            </span>
            <span className={`text-xs truncate ${rank === 1 ? "text-white font-medium" : "text-zinc-400"}`}>
              {file}
            </span>
            <span className={`text-xs font-bold text-right ${scoreColor(score)}`}>
              {score}
            </span>
            <div className="flex justify-end">
              {scale ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-zinc-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 flex items-center gap-2 feat-fade" style={{ animationDelay: "0.9s" }}>
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] text-zinc-500">
          <span className="text-emerald-400 font-semibold">3</span> of 4 would scale
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    </PreviewCard>
  );
}

/* ─── 3. Pre-Flight A/B Preview ──────────────────────────────────────── */

function PreFlightPreview() {
  return (
    <PreviewCard>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Predicted Winner
        </span>
      </div>

      {/* Winner callout */}
      <div
        className="feat-fade rounded-xl border border-green-500/15 bg-green-500/5 p-3.5 mb-3"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold text-white">Variant A</span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
            High
          </span>
        </div>
        <div
          className="feat-pop inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 border border-green-500/20"
          style={{ animationDelay: "0.7s" }}
        >
          <ArrowUpRight className="h-3 w-3 text-green-400" />
          <span className="text-[10px] font-semibold text-green-400">15–25% higher CTR/CVR</span>
        </div>
      </div>

      {/* Variant cards */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="feat-fade rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-center"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">#1</div>
          <div className="text-lg font-bold text-white">
            8<span className="text-xs text-zinc-500 font-normal">/10</span>
          </div>
          <div className="text-[10px] text-indigo-300 font-medium mt-0.5">Variant A</div>
        </div>
        <div
          className="feat-fade rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">#2</div>
          <div className="text-lg font-bold text-zinc-400">
            6<span className="text-xs text-zinc-600 font-normal">/10</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Variant B</div>
        </div>
      </div>
    </PreviewCard>
  );
}

/* ─── 4. Creative Briefs Preview ─────────────────────────────────────── */

const BRIEF_ITEMS = [
  "Add text overlay reinforcing offer at 3-second mark",
  "Consider faster cut at 0:04 to maintain momentum",
  "Direct CTA in final 2 seconds with urgency copy",
];

function BriefsPreview() {
  return (
    <PreviewCard>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Improve This Ad
        </span>
      </div>

      {/* Bullet points */}
      <div className="space-y-2.5 mb-4">
        {BRIEF_ITEMS.map((item, i) => (
          <div
            key={i}
            className="feat-fade flex items-start gap-2"
            style={{ animationDelay: `${0.3 + i * 0.18}s` }}
          >
            <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
            <p className="text-xs text-zinc-300 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>

      <div className="h-px w-full bg-white/5 mb-3" />

      {/* Budget recommendation */}
      <div className="feat-fade" style={{ animationDelay: "0.9s" }}>
        <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">
          Budget Recommendation
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="feat-pop inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1" style={{ animationDelay: "1s" }}>
            <Rocket className="h-3 w-3 text-green-400" />
            <span className="text-[10px] font-semibold text-green-400">Boost It</span>
          </div>
          <span className="text-[10px] text-zinc-500">TikTok + Meta</span>
          <span className="text-[10px] text-zinc-400 font-medium">$100–$200/day</span>
        </div>
      </div>
    </PreviewCard>
  );
}

/* ═══ Main Component ═════════════════════════════════════════════════ */

export default function CutsheetFeatures() {
  return (
    <section id="features" className="relative w-full bg-zinc-950 text-white border-t border-white/5">
      <style>{FEATURE_STYLES}</style>

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

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12 space-y-16">
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
            {/* ── Compare ── */}
            <SpotlightCard
              spotlightColor="rgba(99, 102, 241, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-4">
                <ComparePreview />
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

            {/* ── Batch Mode ── */}
            <SpotlightCard
              spotlightColor="rgba(139, 92, 246, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-4">
                <BatchPreview />
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

            {/* ── Pre-Flight A/B Testing ── */}
            <SpotlightCard
              spotlightColor="rgba(6, 182, 212, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-4">
                <PreFlightPreview />
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

            {/* ── Creative Briefs ── */}
            <SpotlightCard
              spotlightColor="rgba(99, 102, 241, 0.15)"
              className="rounded-3xl border-white/5 bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xl"
            >
              <div className="space-y-4">
                <BriefsPreview />
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
