import EarlyAccessForm from "./cutsheet-early-access-form";

export default function CutsheetCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-28 sm:py-36">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Stop guessing.
          <br />
          Start scaling the right creative.
        </h2>

        <p className="mt-5 text-base text-zinc-400 sm:text-lg">
          Analyze your first ad free — no card required.
        </p>

        <div className="mt-8 flex justify-center">
          <EarlyAccessForm
            placeholder="Your work email"
            buttonText="Join the Waitlist"
          />
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Join <span className="text-zinc-300 font-medium">2,400+</span> marketers already using Cutsheet
        </p>
      </div>
    </section>
  );
}
