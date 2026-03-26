import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
            Private beta — enter your access code to get started.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-8 flex justify-center">
          <Link
            to="/access"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(99,102,241,0.35)] active:scale-[0.97]"
          >
            Enter Access Code
            <ArrowRight className="h-4 w-4" />
          </Link>
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
            <span className="text-white font-medium">200+</span> marketers already inside
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
