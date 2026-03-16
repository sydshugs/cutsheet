import { Upload, Cpu, BarChart2, FileText, Bookmark } from "lucide-react";
import { SpotlightCard } from "./spotlight-card";
import { FadeIn, StaggerContainer, StaggerItem } from "./fade-in";

const STEPS = [
  {
    number: "01",
    title: "Upload your ad",
    description:
      "Drag in static images and video files — TikTok, Meta, YouTube, whatever. We accept MP4, MOV, WebM, JPG, and PNG up to 500 MB.",
    icon: Upload,
    spotlightColor: "rgba(99, 102, 241, 0.15)",
  },
  {
    number: "02",
    title: "AI scores every frame",
    description:
      "Our model watches the full spot and evaluates 11 creative metrics — hook strength, pacing, CTA clarity, and more.",
    icon: Cpu,
    spotlightColor: "rgba(139, 92, 246, 0.15)",
  },
  {
    number: "03",
    title: "Get your scorecard",
    description:
      "See exactly what's working and what to fix — with a per-scene breakdown, emotion arc, and an overall performance score.",
    icon: BarChart2,
    spotlightColor: "rgba(6, 182, 212, 0.15)",
  },
  {
    number: "04",
    title: "Export & iterate",
    description:
      "Generate a creative brief, save winners to your swipe file, or compare variants side-by-side before spending on media.",
    icon: FileText,
    spotlightColor: "rgba(16, 185, 129, 0.15)",
  },
] as const;

export default function CutsheetHowItWorks() {
  return (
    <section id="how-it-works" className="relative w-full bg-zinc-950 text-white border-t border-white/5 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {/* Header */}
        <FadeIn className="text-center mb-16 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tighter text-white">
            From upload to insight in 30 seconds.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Four steps. Zero guesswork.<br />Just data-driven creative decisions.
          </p>
        </FadeIn>

        {/* Steps grid */}
        <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {STEPS.map((step) => (
            <StaggerItem key={step.number}>
              <SpotlightCard
                spotlightColor={step.spotlightColor}
                className="rounded-3xl border-white/5 bg-zinc-900/40 p-6 sm:p-7 backdrop-blur-xl"
              >
                <div className="space-y-4">
                  {/* Step number */}
                  <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
                    Step {step.number}
                  </span>

                  {/* Icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/80 ring-1 ring-white/10">
                    <step.icon className="h-4.5 w-4.5 text-indigo-300" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-white">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[13px] leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Coming soon — action row */}
        <FadeIn className="mt-14 text-center space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Coming soon
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-zinc-300">
              <Bookmark size={16} className="text-zinc-400" />
              Swipe File
              <span className="bg-white/10 text-zinc-500 text-xs rounded-full px-2 py-0.5 ml-1.5 whitespace-nowrap">
                Coming soon
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
