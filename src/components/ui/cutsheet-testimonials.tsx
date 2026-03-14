import { Megaphone, PenTool, ShoppingBag, Video, Users, BarChart2, Figma } from "lucide-react";

const PERSONAS = [
  {
    icon: Megaphone,
    title: "Performance Marketers",
    pain: "Stop wasting budget on creatives that underperform. Know what's wrong before you spend.",
  },
  {
    icon: PenTool,
    title: "Creative Strategists",
    pain: "Replace subjective feedback with data-backed scores your team can actually act on.",
  },
  {
    icon: ShoppingBag,
    title: "DTC Founders",
    pain: "You're shipping ads every week but flying blind on what's working. Get clarity in 30 seconds.",
  },
  {
    icon: Video,
    title: "UGC Creators",
    pain: "Pre-screen your content before posting. Catch pacing, hook, and CTA issues early.",
  },
  {
    icon: Users,
    title: "Agency Teams",
    pain: "Score client creatives before review calls. Show up with data, not opinions.",
  },
  {
    icon: BarChart2,
    title: "Media Buyers",
    pain: "Predict which variants will win before you split-test. Cut testing costs in half.",
  },
  {
    icon: Figma,
    title: "Freelance & Agency Designers",
    pain: "Stop letting clients pick the wrong ad on gut feel. Walk into every presentation with a scored breakdown that backs your creative decisions.",
  },
];

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

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-zinc-300">
            <Users className="h-3 w-3" />
            Built For You
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Who Cutsheet is for.
          </h2>
          <p className="mt-4 max-w-lg mx-auto text-base text-zinc-400 leading-relaxed">
            If you make ads, review ads, or spend money on ads — Cutsheet gives you the data to make better creative decisions.
          </p>
        </div>

        {/* Persona grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona) => (
            <div
              key={persona.title}
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/20 hover:bg-indigo-500/[0.04]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 transition-colors group-hover:bg-indigo-500/15">
                <persona.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">{persona.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {persona.pain}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
