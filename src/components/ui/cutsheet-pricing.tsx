import React from "react";
import {
  Check,
  Zap,
  Crown,
  ArrowRight,
  BarChart2,
  GitCompare,
  FolderHeart,
  FileText,
  Upload,
  Infinity,
  Lightbulb,
  FlaskConical,
  Share2,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "./fade-in";

type Plan = {
  id: string;
  name: string;
  badge?: string;
  priceLabel: string;
  description: string;
  cta: string;
  featured: boolean;
  features: { label: string; icon: React.ElementType }[];
  limit: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "Free forever",
    description: "Try Cutsheet risk-free. No card, no commitment.",
    cta: "Get Early Access",
    featured: false,
    limit: "3 analyses / month",
    features: [
      { label: "Single video analysis", icon: BarChart2 },
      { label: "11-metric scorecard", icon: Zap },
      { label: "Improve This Ad suggestions", icon: Lightbulb },
      { label: "3 analyses per month", icon: FileText },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    priceLabel: "Early access pricing",
    description: "For performance marketers and creative teams shipping weekly.",
    cta: "Get Early Access",
    featured: true,
    limit: "Unlimited analyses",
    features: [
      { label: "Everything in Free", icon: Check },
      { label: "Unlimited analyses", icon: Infinity },
      { label: "Side-by-side compare", icon: GitCompare },
      { label: "Batch analysis (10 files)", icon: Upload },
      { label: "Pre-Flight A/B testing", icon: FlaskConical },
      { label: "Generate creative brief", icon: FileText },
      { label: "PDF export & share links", icon: Share2 },
      { label: "Saved Ads library", icon: FolderHeart },
    ],
  },
  {
    id: "team",
    name: "Team",
    priceLabel: "Contact us",
    description: "For agencies and in-house teams reviewing high-volume campaigns.",
    cta: "Get Early Access",
    featured: false,
    limit: "Unlimited + team seats",
    features: [
      { label: "Everything in Pro", icon: Check },
      { label: "Multiple team seats", icon: Crown },
      { label: "Priority support", icon: Zap },
    ],
  },
];

function ShineBorder({
  children,
  borderWidth = 2,
  duration = 4,
}: {
  children: React.ReactNode;
  borderWidth?: number;
  duration?: number;
}) {
  return (
    <div className="relative rounded-3xl" style={{ padding: borderWidth }}>
      <style>{`
        @keyframes spin-shine {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .shine-spin {
          animation: spin-shine ${duration}s linear infinite;
        }
      `}</style>
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div
          className="shine-spin absolute"
          style={{
            inset: "-100%",
            background:
              "conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)",
            opacity: 0.7,
          }}
        />
      </div>
      <div className="relative rounded-3xl bg-zinc-900">{children}</div>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const inner = (
    <div
      className={`relative flex flex-col gap-6 rounded-3xl p-7 h-full transition-all duration-300 ${
        plan.featured
          ? "bg-zinc-900"
          : "border border-white/8 bg-white/[0.03] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
      }`}
    >
      {!plan.featured && (
        <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-white">{plan.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{plan.limit}</p>
        </div>
        {plan.badge && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-indigo-300">
            <Crown className="w-3 h-3 text-yellow-400" />
            {plan.badge}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tighter text-white">
          {plan.priceLabel}
        </span>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed -mt-2">
        {plan.description}
      </p>

      <div className="h-px w-full bg-white/8" />

      <ul className="flex flex-col gap-3 flex-1">
        {plan.features.map(({ label }) => (
          <li key={label} className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                plan.featured
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-white/5 text-zinc-400"
              }`}
            >
              <Check className="w-3 h-3" />
            </div>
            <span className="text-sm text-zinc-300">{label}</span>
          </li>
        ))}
      </ul>

      <a
        href="#waitlist"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
        }}
        className={`group w-full rounded-2xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          plan.featured
            ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98]"
            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
        }`}
      >
        {plan.cta}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );

  if (plan.featured) {
    return (
      <ShineBorder borderWidth={2} duration={4}>
        {inner}
      </ShineBorder>
    );
  }

  return <div className="group relative h-full rounded-3xl">{inner}</div>;
}

export default function CutsheetPricing() {
  return (
    <section id="pricing" className="relative w-full bg-zinc-950 text-white overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <FadeIn className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300">
              Pricing
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tighter text-white mb-4">
            Simple, honest pricing.
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed">
            Start free, upgrade when you need more.<br />No hidden fees, no per-analysis charges.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-6 py-4 text-sm text-indigo-300 text-center mb-8">
            Pricing will be announced at launch. Early access members lock in founder rates.
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch" stagger={0.12}>
          {PLANS.map((plan) => (
            <StaggerItem key={plan.id}>
              <PlanCard plan={plan} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Prices lock in at early access rates. Cancel anytime after launch.
        </p>
      </div>
    </section>
  );
}
