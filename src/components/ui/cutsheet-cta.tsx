import EarlyAccessForm from "./cutsheet-early-access-form";
import { AnimatedTooltip } from "./animated-tooltip";

const SOCIAL_PROOF_PEOPLE = [
  {
    id: 1,
    name: "Sarah Chen",
    designation: "Performance Marketer",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 2,
    name: "Marcus Rivera",
    designation: "Creative Director",
    image:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
  {
    id: 3,
    name: "Emily Parker",
    designation: "Media Buyer",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 4,
    name: "James Kim",
    designation: "Brand Strategist",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
];

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

        <div className="mt-8 flex items-center justify-center gap-3">
          <AnimatedTooltip items={SOCIAL_PROOF_PEOPLE} />
          <p className="text-sm text-zinc-500 ml-2">
            <span className="text-white font-medium">2,400+</span> on the waitlist
          </p>
        </div>
      </div>
    </section>
  );
}
