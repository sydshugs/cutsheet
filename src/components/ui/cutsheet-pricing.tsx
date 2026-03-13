import React, { useState } from "react";
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
} from "lucide-react";

type Plan = {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
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
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Try Cutsheet risk-free. No card, no commitment.",
    cta: "Get Early Access",
    featured: false,
    limit: "5 analyses / month",
    features: [
      { label: "5 video analyses per month", icon: BarChart2 },
      { label: "All 11 scoring metrics", icon: Zap },
      { label: "Scene breakdown", icon: FileText },
      { label: "Basic scorecard export", icon: FileText },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    monthlyPrice: 29,
    annualPrice: 19,
    description: "For performance marketers and creative teams shipping weekly.",
    cta: "Get Early Access",
    featured: true,
    limit: "Unlimited analyses",
    features: [
      { label: "Unlimited video analyses", icon: Infinity },
      { label: "All 11 scoring metrics", icon: Zap },
      { label: "Side-by-side compare", icon: GitCompare },
      { label: "AI creative brief generator", icon: FileText },
      { label: "Swipe file (save 100 creatives)", icon: FolderHeart },
      { label: "Batch analysis (10 at once)", icon: Upload },
      { label: "Priority processing", icon: Zap },
    ],
  },
  {
    id: "team",
    name: "Team",
    monthlyPrice: 79,
    annualPrice: 59,
    description: "For agencies and in-house teams reviewing high-volume campaigns.",
    cta: "Get Early Access",
    featured: false,
    limit: "Unlimited + team seats",
    features: [
      { label: "Everything in Pro", icon: Check },
      { label: "5 team seats included", icon: Crown },
      { label: "Unlimited swipe file", icon: FolderHeart },
      { label: "Batch analysis (50 at once)", icon: Upload },
      { label: "Shared team swipe file", icon: FolderHeart },
      { label: "Client-ready PDF exports", icon: FileText },
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

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice;

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
        {price === 0 ? (
          <span className="text-5xl font-bold tracking-tighter text-white">
            Free
          </span>
        ) : (
          <>
            <span className="text-5xl font-bold tracking-tighter text-white">
              ${price}
            </span>
            <span className="text-zinc-500 text-sm">/mo</span>
            {annual && (
              <span className="ml-2 text-[10px] font-semibold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                SAVE {Math.round((1 - plan.annualPrice / plan.monthlyPrice) * 100)}%
              </span>
            )}
          </>
        )}
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
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative w-full bg-zinc-950 text-white overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
            <span>🚀</span>
            Early Access Pricing — Lock in your rate before we launch.
          </div>
          <br />
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

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                !annual
                  ? "bg-white text-zinc-950 shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                annual
                  ? "bg-white text-zinc-950 shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Annual
              <span className="text-[10px] font-bold text-green-500 bg-green-500/15 rounded-full px-1.5 py-0.5">
                SAVE 34%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Prices lock in at early access rates. Cancel anytime after launch.
        </p>
      </div>
    </section>
  );
}
