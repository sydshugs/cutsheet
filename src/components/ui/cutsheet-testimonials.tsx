import { Star } from "lucide-react";

const BRANDS = ["Nomad", "Vessel", "Arclight", "Driftwood", "Paladin"];

const TESTIMONIALS = [
  {
    quote:
      "Cutsheet flagged a weak hook on our top-spend ad. We fixed it, relaunched, and CPM dropped 22% in the first week.",
    name: "Marcus T.",
    role: "Paid Social Lead",
    company: "Nomad",
    initials: "MT",
  },
  {
    quote:
      "I used to spend 30 minutes reviewing a creative with my team. Now I upload it, get the scorecard in 20 seconds, and we're aligned in one look.",
    name: "Priya S.",
    role: "Creative Strategist",
    company: "Vessel",
    initials: "PS",
  },
  {
    quote:
      "The compare feature alone is worth it. We A/B test creatives before they ever hit ad auction. Saves us thousands in wasted spend.",
    name: "Jordan K.",
    role: "Performance Marketing Manager",
    company: "Arclight",
    initials: "JK",
  },
];

function TestimonialCard({
  quote,
  name,
  role,
  company,
  initials,
}: (typeof TESTIMONIALS)[number]) {
  return (
    <div className="group relative flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
      {/* Decorative quote mark */}
      <span className="select-none text-4xl font-bold leading-none text-indigo-500/60">
        &ldquo;
      </span>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-300">{quote}</p>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-zinc-500">
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CutsheetTestimonials() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-24 sm:py-32">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full opacity-15 blur-[140px]"
        style={{
          background: "radial-gradient(circle, #6366F1 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Trusted bar */}
        <div className="mb-16 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Trusted by performance teams at
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {BRANDS.map((b) => (
              <span
                key={b}
                className="text-sm font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-400"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Section header */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-zinc-300">
            <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
            What Marketers Are Saying
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Results speak louder than scores.
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
