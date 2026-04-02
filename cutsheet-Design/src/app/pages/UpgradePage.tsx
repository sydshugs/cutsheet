import React from 'react';
import { CheckCircle, ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router';

const featuresFree = [
  'Standard analyses (3/day)',
  'Basic scorecard',
  'Fix It For Me (1/day)',
  'Policy Checker (1/day)',
];

const featuresPro = [
  'Everything in Free',
  'Unlimited analyses',
  'Visualize — AI Image (10 credits/mo)',
  'Animate to HTML5 (10 credits/mo)',
  'Motion Preview (5 credits/mo)',
  'AI Rewrite',
  'Policy Check',
  'Competitor Analysis',
  'Rank Creatives',
  'Creative Brief',
  'Saved Ads library',
];

const featuresTeam = [
  'Everything in Pro',
  'Visualize — AI Image (25 credits/mo)',
  'Animate to HTML5 (25 credits/mo)',
  'Motion Preview (15 credits/mo)',
  'Shared team history',
  'Invite teammates (3 seats)',
  'Team management dashboard',
  'Priority support',
];

const comparisonData = [
  { feature: 'Standard analyses', free: '3/day', pro: 'Unlimited', team: 'Unlimited' },
  { feature: 'Visualize — AI Image', free: null, pro: '10 credits/mo', team: '25 credits/mo' },
  { feature: 'Animate to HTML5', free: null, pro: '10 credits/mo', team: '25 credits/mo' },
  { feature: 'Motion Preview', free: null, pro: '5 credits/mo', team: '15 credits/mo' },
  { feature: 'AI Rewrite', free: null, pro: true, team: true },
  { feature: 'Policy Check', free: true, pro: true, team: true },
  { feature: 'Competitor Analysis', free: null, pro: true, team: true },
  { feature: 'Rank Creatives', free: null, pro: true, team: true },
  { feature: 'Creative Brief', free: null, pro: true, team: true },
  { feature: 'Saved Ads library', free: null, pro: true, team: true },
  { feature: 'Shared team history', free: null, pro: null, team: true },
  { feature: 'Invite teammates', free: null, pro: null, team: '✓ (3 seats)' },
];

function renderCellValue(val: string | boolean | null, col: 'free' | 'pro' | 'team' = 'free') {
  if (val === null) {
    return <span className="text-zinc-700 font-medium">—</span>;
  }
  if (val === true) {
    return <CheckCircle className="w-[14px] h-[14px] text-emerald-500" strokeWidth={2.5} />;
  }
  if (typeof val === 'string' && val.includes('credits/mo')) {
    const color = col === 'team' ? 'text-violet-400' : col === 'pro' ? 'text-indigo-400' : 'text-zinc-600';
    return <span className={`text-[13px] font-mono tracking-tight ${color}`}>{val}</span>;
  }
  // Regular strings (Unlimited, 3/day, ✓ (3 seats), etc.)
  const color = col === 'team' ? 'text-violet-200' : 'text-zinc-300';
  return <span className={`text-[13px] font-mono tracking-tight ${color}`}>{val}</span>;
}

export default function UpgradePage() {
  const navigate = useNavigate();

  const handleBack = () => navigate('/app/settings');
  const handleClose = () => navigate('/app/settings');

  return (
    <div
      className="min-h-screen bg-[#09090b] text-zinc-100 pb-24 antialiased selection:bg-indigo-500/30 font-sans relative"
      style={{ fontFamily: 'Geist, Inter, sans-serif' }}
    >
      {/* BACK LINK — top-left */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-8 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      >
        <ChevronLeft size={12} strokeWidth={2} />
        Back to Settings
      </button>

      {/* CLOSE BUTTON — top-right */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-8 flex items-center justify-center rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <X size={16} strokeWidth={2} />
      </button>

      {/* HEADER */}
      <header className="py-12 text-center">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Choose your plan</h1>
        <p className="text-sm text-zinc-500 mt-2">Start free. Upgrade when you're ready.</p>
      </header>

      {/* PLAN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 md:px-12 max-w-5xl mx-auto">

        {/* FREE CARD */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#18181b] p-6 flex flex-col relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="text-base font-semibold text-zinc-300">Free</div>
          <div className="text-xs text-zinc-600 mt-1">3 analyses / day</div>
          <div className="text-2xl font-bold text-zinc-100 mt-3 tracking-tight">Free forever</div>
          <ul className="mt-8 space-y-3.5 flex-1">
            {featuresFree.map((f, i) => (
              <li key={i} className="flex items-start text-[13px] text-zinc-400 leading-relaxed">
                <CheckCircle className="w-3 h-3 text-zinc-600 mr-3 mt-0.5 shrink-0" strokeWidth={2.5} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button
            disabled
            className="mt-8 h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-600 text-sm font-medium w-full cursor-not-allowed transition-colors"
          >
            Current plan
          </button>
        </div>

        {/* PRO CARD (FEATURED) */}
        <div className="rounded-2xl border border-indigo-500/30 bg-[#18181b] p-6 flex flex-col relative shadow-[inset_0_1px_0_0_rgba(99,102,241,0.1),0_0_24px_0_rgba(99,102,241,0.05)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#18181b] border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Most Popular
          </div>
          <div className="text-base font-semibold text-zinc-100">Pro</div>
          <div className="text-xs text-indigo-400 mt-1">Unlimited analyses</div>
          <div className="text-2xl font-bold text-zinc-100 mt-3 tracking-tight">Early access pricing</div>
          <ul className="mt-8 space-y-3.5 flex-1">
            {featuresPro.map((f, i) => (
              <li key={i} className="flex items-start text-[13px] text-zinc-300 leading-relaxed">
                <CheckCircle className="w-3 h-3 text-indigo-500 mr-3 mt-0.5 shrink-0" strokeWidth={2.5} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button className="mt-8 h-10 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] transition-colors text-white text-sm font-semibold w-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
            Switch to Pro
          </button>
        </div>

        {/* TEAM CARD */}
        <div className="rounded-2xl border border-violet-500/30 bg-[#18181b] p-6 flex flex-col relative shadow-[inset_0_1px_0_0_rgba(139,92,246,0.1)]">
          <div className="text-base font-semibold text-zinc-100">Team</div>
          <div className="text-xs text-violet-400 mt-1">Unlimited + team seats</div>
          <div className="text-2xl font-bold text-zinc-100 mt-3 tracking-tight">Contact us</div>
          <ul className="mt-8 space-y-3.5 flex-1">
            {featuresTeam.map((f, i) => (
              <li key={i} className="flex items-start text-[13px] text-zinc-300 leading-relaxed">
                <CheckCircle className="w-3 h-3 text-violet-500 mr-3 mt-0.5 shrink-0" strokeWidth={2.5} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button className="mt-8 h-10 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] transition-all text-white text-sm font-semibold w-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_0_rgba(139,92,246,0.3)] ring-1 ring-violet-500/50">
            Upgrade to Team
          </button>
        </div>

      </div>

      {/* FEATURE COMPARISON TABLE */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 mt-16">
        
      </div>
    </div>
  );
}
