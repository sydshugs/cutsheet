import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  Building2, 
  Settings, 
  CreditCard, 
  BarChart2, 
  Calendar,
  CheckCircle,
  Zap,
  Activity
} from "lucide-react";

const INTENTS = ["Paid Ads", "Organic", "Display", "Both"];
const NICHES = ["Ecommerce", "SaaS", "Creator", "Agency", "Other"];
const PLATFORMS = ["Meta", "TikTok", "Google", "Multiple"];
const VOICE_TAGS = [
  "Playful", "Bold", "Authoritative", "Witty", "Warm", 
  "Direct", "Edgy", "Luxurious", "Minimal", "Conversational"
];

function ProfileTab() {
  const [intent, setIntent] = useState("Paid Ads");
  const [niche, setNiche] = useState("Ecommerce");
  const [platform, setPlatform] = useState("Meta");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandVoice, setBrandVoice] = useState("");

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="w-full max-w-[640px] flex flex-col gap-10 pb-16">
      {/* SECTION 1: ACCOUNT */}
      <section className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3">
          Account
        </span>
        
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex items-center justify-between mb-6">
          <span className="text-[14px] text-zinc-400">Email</span>
          <span className="text-[14px] font-mono text-zinc-300">user@example.com</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[14px] text-zinc-400 mb-3">What do you create?</span>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((item) => (
              <button
                key={item}
                onClick={() => setIntent(item)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  intent === item
                    ? "bg-indigo-500/[0.10] border border-indigo-500/25 text-indigo-300 font-medium"
                    : "border border-white/[0.06] text-zinc-600 hover:border-white/[0.15] hover:text-zinc-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/[0.04] my-2" />

      {/* SECTION 2: BRAND PROFILE */}
      <section className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">
          Brand Profile
        </span>
        <p className="text-[14px] text-zinc-500 mb-6 leading-[1.6]">
          Used in AI rewrites, in-situ mockups, and creative briefs.
        </p>

        {/* Logo Upload */}
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex items-center gap-4">
          <div className="w-[48px] h-[48px] rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-zinc-600" />
          </div>
          <div className="flex flex-col flex-1 gap-0.5">
            <span className="text-[14px] text-zinc-300">Brand Logo</span>
            <span className="text-xs text-zinc-600">PNG, SVG, WEBP · 500KB max</span>
          </div>
          <button className="h-10 px-4 rounded-[10px] border border-white/[0.06] bg-transparent text-zinc-400 text-[13px] font-medium hover:bg-white/[0.02] transition-colors">
            Upload
          </button>
        </div>

        {/* Brand Name Input */}
        <input
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Brand name"
          className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-6 py-4 text-[14px] text-zinc-200 placeholder:text-zinc-600 mt-6 w-full focus:outline-none focus:border-indigo-500/50 transition-colors"
        />

        {/* Niche Selector */}
        <div className="flex flex-col mt-6">
          <span className="text-[14px] text-zinc-500 mb-3">Niche</span>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((item) => (
              <button
                key={item}
                onClick={() => setNiche(item)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  niche === item
                    ? "bg-indigo-500/[0.10] border border-indigo-500/25 text-indigo-300 font-medium"
                    : "border border-white/[0.06] text-zinc-600 hover:border-white/[0.15] hover:text-zinc-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex flex-col mt-6">
          <span className="text-[14px] text-zinc-500 mb-3">Primary Platform</span>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((item) => (
              <button
                key={item}
                onClick={() => setPlatform(item)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  platform === item
                    ? "bg-indigo-500/[0.10] border border-indigo-500/25 text-indigo-300 font-medium"
                    : "border border-white/[0.06] text-zinc-600 hover:border-white/[0.15] hover:text-zinc-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Voice Description */}
        <div className="flex flex-col mt-6">
          <textarea
            value={brandVoice}
            onChange={(e) => {
              if (e.target.value.length <= 300) setBrandVoice(e.target.value);
            }}
            placeholder="Describe your brand voice — e.g. 'Direct and confident, like a knowledgeable friend.'"
            className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 text-[14px] text-zinc-200 w-full min-h-[120px] resize-none focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-zinc-600 leading-[1.6]"
          />
          <span className="text-[10px] font-mono text-zinc-600 text-right mt-2">
            {brandVoice.length} / 300
          </span>
        </div>

        {/* Voice Tags */}
        <div className="flex flex-col mt-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3">
            Select up to 4
          </span>
          <div className="flex flex-wrap gap-2">
            {VOICE_TAGS.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "border border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-300"
                      : "border border-white/[0.06] text-zinc-600 hover:border-white/[0.15] hover:text-zinc-400"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button className="h-10 px-6 rounded-[10px] bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[13px] font-medium transition-colors self-start mt-8">
          Save Brand Profile
        </button>
      </section>

      {/* SECTION 3: DANGER ZONE */}
      <section className="flex flex-col mt-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600/60 mb-3">
          Danger Zone
        </span>
        
        <div className="rounded-[16px] border border-red-500/15 bg-red-500/[0.03] p-6 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] text-zinc-300">Delete Account</span>
            <span className="text-xs text-zinc-600">Permanently delete your account and all data.</span>
          </div>
          <button className="h-10 px-4 rounded-[10px] border border-red-500/20 bg-red-500/[0.06] text-red-400 hover:bg-red-500/[0.1] hover:text-red-300 text-[13px] font-medium transition-colors">
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function BillingTab() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-[640px] flex flex-col gap-10 pb-16">
      <section className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">
          Current Plan
        </span>
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[24px] font-semibold text-zinc-100">Pro</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                  Most Popular
                </span>
              </div>
              <p className="text-zinc-400 text-[14px]">Unlimited analyses</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Active
            </span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-zinc-100 tracking-tight">Early access pricing</span>
          </div>
          
          <p className="text-[14px] text-zinc-500 border-b border-white/[0.04] pb-6">
            Next billing date is Mar 15, 2026.
          </p>

          <div className="flex gap-4">
            <button className="h-10 px-4 rounded-[10px] border border-indigo-500/30 bg-indigo-500/[0.06] text-indigo-300 text-[13px] font-medium hover:bg-indigo-500/[0.10] transition-colors flex-1">
              Manage Subscription
            </button>
            <button
              onClick={() => navigate('/app/upgrade')}
              className="h-10 px-4 rounded-[10px] bg-[#6366f1] text-white text-[13px] font-medium hover:bg-[#4f46e5] transition-colors flex-1"
            >
              Upgrade to Team
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">
          Credits
        </span>
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-6">
            <span className="text-[14px] text-zinc-300">Monthly credits</span>
            <span className="text-[14px] font-mono text-zinc-400">8 / <span className="text-zinc-100">unlimited</span></span>
          </div>
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-zinc-500" />
              <span className="text-[14px] text-zinc-300">Daily refresh</span>
            </div>
            <span className="text-[14px] text-zinc-500">Resets Mar 15</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Visualize", val: "∞" },
              { label: "Competitor", val: "∞" },
              { label: "Rank", val: "∞" },
              { label: "Brief", val: "∞" }
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-zinc-500">{item.label}</span>
                <span className="text-[14px] font-mono text-zinc-300">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Recent Activity
          </span>
          <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            View all invoices &rarr;
          </button>
        </div>
        
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-xs text-zinc-500">
              <tr>
                <th className="font-medium px-6 py-4">Date</th>
                <th className="font-medium px-6 py-4">Amount</th>
                <th className="font-medium px-6 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-[14px]">
              <tr className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5">Mar 1, 2026</td>
                <td className="px-6 py-5">$29.00</td>
                <td className="px-6 py-5 text-right">
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors font-medium">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function UsageTab() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-[640px] flex flex-col gap-10 pb-16">
      
      {/* Stat Tiles */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Total Analyses</span>
          </div>
          <span className="text-5xl font-mono font-bold text-zinc-100 tracking-tight">247</span>
        </div>

        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-indigo-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Current Plan</span>
          </div>
          <span className="text-5xl font-bold text-zinc-100 tracking-tight">Pro</span>
        </div>
      </div>

      {/* Analysis Quota (Pro state) */}
      <section className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">
          Analysis Quota
        </span>
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-[76px] h-[76px] rounded-[14px] bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Activity size={32} className="text-emerald-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[24px] font-semibold text-zinc-100 leading-tight">Unlimited Analyses</h3>
                <p className="text-zinc-500 text-[14px]">Pro plan — no limits</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Active
            </span>
          </div>
          
          <div className="h-1 rounded-full bg-[#27272a] overflow-hidden w-full">
            <div className="h-full bg-emerald-500 w-full rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Usage by feature */}
      <section className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-1">
          Usage by feature
        </span>
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-6">
          {[
            { label: "Paid Ad Analysis", val: 142, max: 142 },
            { label: "Competitor Analysis", val: 38, max: 142 },
            { label: "Rank Creatives", val: 22, max: 142 },
            { label: "AI Rewrite", val: 31, max: 142 },
            { label: "Visualize", val: 14, max: 142 }
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-2.5">
              <div className="flex justify-between items-end">
                <span className="text-[14px] text-zinc-300">{item.label}</span>
                <span className="text-[14px] font-mono text-zinc-300">{item.val} <span className="text-zinc-600 font-sans">uses</span></span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden w-full">
                <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(item.val / item.max) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free Plan State (Reference) */}
      <section className="flex flex-col gap-3 mt-8 pt-8 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Analysis Quota
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-500 text-[10px] uppercase tracking-wider font-semibold border border-white/[0.04]">
            Free Plan Variant
          </span>
        </div>
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-8">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[24px] font-semibold text-zinc-100 leading-tight">Analysis Quota</h3>
              <p className="text-zinc-500 text-[14px]">Resets Apr 1</p>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-mono font-bold text-zinc-100">2</span>
              <span className="text-lg font-mono text-zinc-500">/ 3 used</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="h-1 rounded-full bg-[#27272a] overflow-hidden w-full">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '66%' }}></div>
            </div>
            <span className="text-[14px] font-medium text-amber-500/90">1 analysis remaining this month</span>
          </div>

          <button
            onClick={() => navigate('/app/upgrade')}
            className="h-10 w-full rounded-[10px] bg-[#6366f1] text-white text-[13px] font-medium hover:bg-[#4f46e5] transition-colors mt-2"
          >
            Upgrade to Pro
          </button>
        </div>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Billing");
  const navigate = useNavigate();

  return (
    <div className="flex flex-row w-full h-full bg-[#09090b] font-['Geist',sans-serif] text-white">
      {/* Left Sidebar */}
      <div className="w-48 shrink-0 border-r border-white/[0.04] px-3 py-6 flex flex-col gap-1">
        {[
          { label: "Profile", icon: Settings },
          { label: "Billing", icon: CreditCard },
          { label: "Usage", icon: BarChart2 },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`rounded-lg px-3 py-2 text-sm w-full text-left flex items-center gap-2 transition-colors ${
              activeTab === label
                ? "bg-white/[0.04] text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon size={14} className={activeTab === label ? "text-zinc-400" : "text-zinc-600"} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#09090b]">
        {activeTab === "Profile" && <ProfileTab />}
        {activeTab === "Billing" && <BillingTab />}
        {activeTab === "Usage" && <UsageTab />}
      </div>
    </div>
  );
}