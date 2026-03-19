import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { FadeIn } from "./fade-in";

const FAQS = [
  {
    q: "How accurate is the AI scoring?",
    a: "Our model is trained on thousands of high-performing and underperforming video ads across TikTok, Meta, and YouTube. Scores correlate strongly with real-world performance signals like hook rate, hold rate, and CTR. That said, Cutsheet is a creative diagnostic tool — use it to identify weaknesses, not as a replacement for live testing.",
  },
  {
    q: "What video formats and lengths are supported?",
    a: "We support MP4, MOV, and WebM files up to 500MB. Videos up to 10 minutes are analyzed in full, though Cutsheet is optimized for short-form ads between 6 and 90 seconds — the formats that matter most on paid social and CTV.",
  },
  {
    q: "How is this different from just watching the ad myself?",
    a: "You can spot obvious problems — but Cutsheet catches what's invisible to the naked eye: pacing rhythm against platform benchmarks, hook strength scored against 10,000+ ads, predicted retention drop-off points, and audio/visual balance. It's the difference between a gut check and a data-backed diagnosis.",
  },
  {
    q: "Can I use Cutsheet for organic content, not just paid ads?",
    a: "Absolutely. The scoring metrics — hook strength, pacing, emotional pull, retention — apply equally to organic TikTok, Reels, and YouTube content. Many creators use Cutsheet to pre-screen content before posting.",
  },
  {
    q: "What happens to my videos after upload?",
    a: "Videos are processed securely and used only to generate your scorecard. We don't store your creative longer than 24 hours after analysis, and we never use your content to train our models.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan gives you 5 analyses per month with no card required. Upgrade to Pro or Team when you need more.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no contracts or cancellation fees. You can downgrade or cancel your plan at any time from your account settings. If you cancel a paid plan, you'll keep access through the end of your current billing period.",
  },
  {
    q: "What happens when early access pricing ends?",
    a: "Your rate locks in for as long as you stay subscribed. Early access members keep their discounted price even after we raise prices at general launch. If you cancel and re-subscribe later, you'll pay the current rate at that time.",
  },
];

function AccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.08]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors"
      >
        <span
          className={`text-base font-medium transition-colors duration-200 ${
            open ? "text-indigo-300" : "text-white"
          }`}
        >
          {q}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-zinc-400">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function CutsheetFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="border-t border-white/5 bg-zinc-950 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="mb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-zinc-300">
            <MessageCircle className="h-3 w-3" />
            FAQ
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything you need to know.
          </h2>
        </FadeIn>

        {/* Accordion */}
        <FadeIn delay={0.1} className="border-t border-white/[0.08]">
          {FAQS.map((item, i) => (
            <AccordionItem
              key={i}
              q={item.q}
              a={item.a}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </FadeIn>

        {/* Footer */}
        <p className="mt-10 text-center text-sm text-zinc-500">
          Still have questions? Email us at{" "}
          <a
            href="mailto:hello@cutsheet.ai"
            className="text-indigo-400 transition-colors hover:text-indigo-300"
          >
            hello@cutsheet.ai
          </a>
        </p>
      </div>
    </section>
  );
}
