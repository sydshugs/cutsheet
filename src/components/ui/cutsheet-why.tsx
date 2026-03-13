import { Trophy, Check, X, Minus, Building2, Puzzle, DollarSign } from "lucide-react";

const ROWS = [
  "Self-serve, no demo needed",
  "Video-first analysis",
  "Results in under 30 seconds",
  "Free tier available",
  "Built for performance marketers",
  "No enterprise contract",
  "AI creative brief included",
] as const;

// y = yes, n = no, p = partial
type V = "y" | "n" | "p";
const DATA: Record<string, [V, V]> = {
  "Self-serve, no demo needed":      ["n", "y"],
  "Video-first analysis":            ["y", "n"],
  "Results in under 30 seconds":     ["n", "n"],
  "Free tier available":             ["n", "n"],
  "Built for performance marketers": ["n", "p"],
  "No enterprise contract":          ["n", "y"],
  "AI creative brief included":      ["n", "n"],
};

function Cell({ v }: { v: "y" | "n" | "p" }) {
  if (v === "y") return <Check className="h-4 w-4 shrink-0 text-green-400" />;
  if (v === "p") return <Minus className="h-4 w-4 shrink-0 text-yellow-400/70" />;
  return <X className="h-4 w-4 shrink-0 text-red-400/50" />;
}

const CARDS = [
  {
    icon: Building2,
    headline: "Not built for enterprise. Built for you.",
    body: "Enterprise creative analytics tools come with 6-month onboarding, $2,000/mo minimums, and sales calls before you see a single score. Cutsheet gives you results in 30 seconds with no contract.",
  },
  {
    icon: Puzzle,
    headline: "Not a feature. A focused tool.",
    body: "Most platforms bury ad scoring inside generation tools you may not need. Cutsheet does one thing exceptionally well: tell you exactly what's working in your ad creative and what to fix.",
  },
  {
    icon: DollarSign,
    headline: "Start free. Upgrade when it makes sense.",
    body: "No credit card. No sales call. No minimum spend. Analyze your first 5 ads free and see exactly what Cutsheet surfaces before you pay a cent.",
  },
];

export default function CutsheetWhy() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-24 sm:py-32">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-10 blur-[140px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header — left-aligned for rhythm variation */}
        <div className="mb-14 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-zinc-300">
            <Trophy className="h-3 w-3 text-amber-400" />
            Why Cutsheet
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mt-4 text-base text-zinc-400 leading-relaxed">
            No enterprise contract. No agency retainer. No platform lock-in.
            Just upload your ad and know.
          </p>
        </div>

        {/* Comparison grid — horizontal scroll on mobile to preserve side-by-side */}
        <div className="mb-16 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-3 sm:overflow-visible snap-x snap-mandatory">
            {/* Cutsheet column */}
            <div className="min-w-[260px] flex-shrink-0 snap-start rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-6 backdrop-blur-sm sm:min-w-0 sm:flex-shrink">
              <h3 className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Cutsheet
              </h3>
              <div className="space-y-3">
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-2.5">
                    <Check className="h-4 w-4 shrink-0 text-green-400" />
                    <span className="text-sm text-zinc-200 whitespace-nowrap sm:whitespace-normal">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Tools column */}
            <div className="min-w-[260px] flex-shrink-0 snap-start rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:min-w-0 sm:flex-shrink">
              <h3 className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Enterprise Tools
              </h3>
              <div className="space-y-3">
                {ROWS.map((row) => {
                  const v = DATA[row][0];
                  return (
                    <div key={row} className="flex items-center gap-3 px-4 py-2.5">
                      <Cell v={v} />
                      <span className="text-sm text-zinc-500 whitespace-nowrap sm:whitespace-normal">{row}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ad Platforms column */}
            <div className="min-w-[260px] flex-shrink-0 snap-start rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:min-w-0 sm:flex-shrink">
              <h3 className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Ad Platforms
              </h3>
              <div className="space-y-3">
                {ROWS.map((row) => {
                  const v = DATA[row][1];
                  return (
                    <div key={row} className="flex items-center gap-3 px-4 py-2.5">
                      <Cell v={v} />
                      <span className="text-sm text-zinc-500 whitespace-nowrap sm:whitespace-normal">{row}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Callout cards */}
        <div className="space-y-4">
          {CARDS.map((card) => (
            <div
              key={card.headline}
              className="flex items-start gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                <card.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{card.headline}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
