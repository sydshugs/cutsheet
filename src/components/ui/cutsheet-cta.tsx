import EarlyAccessForm from "./cutsheet-early-access-form";
import { FadeIn } from "./fade-in";

const WAITLIST_INITIALS = ["S", "M", "E", "J"];

export default function CutsheetCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-20 sm:py-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop guessing.
            <br />
            Start scaling the right creative.
          </h2>

          <p className="mt-5 text-base text-zinc-400 sm:text-lg">
            Analyze your first ad free — no card required.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-8 flex justify-center">
          <EarlyAccessForm
            placeholder="Enter your email"
            buttonText="Get Early Access"
          />
        </FadeIn>

        <FadeIn delay={0.25} className="mt-8 flex items-center justify-center gap-3">
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
        </FadeIn>
      </div>
    </section>
  );
}
