import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FadeIn, FadeInSection } from "./fade-in";

export default function CutsheetCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[var(--bg)] py-16 sm:py-20 lg:py-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }}
      />

      <FadeInSection className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
        <FadeIn>
          <h2 className="text-[28px] font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop guessing.
            <br />
            Start scaling the right creative.
          </h2>

          <p className="mt-4 text-sm text-zinc-400 sm:mt-5 sm:text-lg">
            Private beta — limited spots available.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-8 flex justify-center px-4 sm:px-0">
          <Link
            to="/access"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white transition-transform transition-opacity duration-150 hover:bg-[var(--accent-hover)] hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(99,102,241,0.35)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] sm:inline-flex sm:w-auto"
          >
            Get Early Access
            <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </FadeInSection>
    </section>
  );
}
