import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { redirectToProCheckout, redirectToTeamCheckout } from "../lib/stripe";

// ─── DATA ────────────────────────────────────────────────────────────────────

const FREE_INCLUDED = [
  "3 analyses per day",
  "All 6 analyzer modes",
  "Swipe File",
  "Before/After comparison",
  "Pre-Flight A/B test",
];

const FREE_EXCLUDED = [
  "Visualize (AI Art Director)",
  "Script Generator",
  "Unlimited analyses",
  "Team workspace",
];

const PRO_FEATURES = [
  "Unlimited analyses",
  "All 6 analyzer modes",
  "🎨 Visualize — AI Art Director (10/month)",
  "✍️ Script Generator (10/month)",
  "🛠️ Fix It For Me (20/month)",
  "🔍 Ad Deconstructor (20/month)",
  "🛡️ Policy Checker (30/month)",
  "📋 Score → Brief (20/month)",
  "Creative history",
  "Shareable scorecards",
  "Priority support",
];

const TEAM_EXTRAS = [
  "3 team seats",
  "🎨 Visualize — 25/month shared",
  "✍️ Script Generator — 25/month shared",
  "🛠️ Fix It For Me — 50/month shared",
  "Shared analysis history",
  "Team management dashboard",
  "Invite by email",
  "Client sharing (coming soon)",
];

const COMPARISON_ROWS: Array<{
  feature: string;
  free: string | boolean | null;
  pro: string | boolean | null;
  team: string | boolean | null;
}> = [
  { feature: "Standard analyses",          free: "3/day",     pro: "Unlimited",  team: "Unlimited" },
  { feature: "Visualize — AI Art Director", free: null,        pro: "10/month",   team: "25/month" },
  { feature: "Script Generator",            free: null,        pro: "10/month",   team: "25/month" },
  { feature: "Fix It For Me",               free: "1/day",     pro: "20/month",   team: "50/month" },
  { feature: "Policy Checker",              free: "1/day",     pro: "30/month",   team: "75/month" },
  { feature: "Ad Deconstructor",            free: "1/day",     pro: "20/month",   team: "50/month" },
  { feature: "Score → Brief",               free: "2/day",     pro: "20/month",   team: "50/month" },
  { feature: "Shared team history",         free: null,        pro: null,         team: true },
  { feature: "Invite teammates",            free: null,        pro: null,         team: true },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function CellValue({ value }: { value: string | boolean | null }) {
  if (value === null || value === false) {
    return <Minus size={14} style={{ color: "#3f3f46", margin: "0 auto", display: "block" }} />;
  }
  if (value === true) {
    return <Check size={14} style={{ color: "#10b981", margin: "0 auto", display: "block" }} />;
  }
  return <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Upgrade() {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [showTable, setShowTable] = useState(false);

  const tier =
    subscriptionStatus === "team" ? "team"
    : subscriptionStatus === "pro" ? "pro"
    : "free";

  const handleProUpgrade = () => {
    if (!user) { navigate("/login"); return; }
    redirectToProCheckout(user.id, user.email ?? "");
  };

  const handleTeamUpgrade = () => {
    if (!user) { navigate("/login"); return; }
    redirectToTeamCheckout(user.id, user.email ?? "");
  };

  return (
    <div
      className="min-h-screen px-4 py-16 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <Helmet>
        <title>Upgrade Cutsheet — Free · Pro · Team</title>
        <meta
          name="description"
          content="Score smarter. Create faster. Ship better ads."
        />
        <link rel="canonical" href="https://cutsheet.xyz/upgrade" />
      </Helmet>

      {/* Ambient glows */}
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(99,102,241,0.1)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(139,92,246,0.07)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-12">

        {/* Header */}
        <motion.div
          className="text-center flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-semibold" style={{ color: "#f4f4f5" }}>
            Upgrade Cutsheet
          </h1>
          <p style={{ color: "#71717a" }}>
            Score smarter. Create faster. Ship better ads.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full items-start">

          {/* ── FREE ─────────────────────────────────────── */}
          <motion.div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
          >
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#71717a" }}>Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "#f4f4f5" }}>$0</span>
                <span style={{ color: "#52525b" }}>/month</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#52525b" }}>Forever free</p>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {FREE_INCLUDED.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                  <span className="text-sm" style={{ color: "#a1a1aa" }}>{f}</span>
                </div>
              ))}
              <div className="my-1 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />
              {FREE_EXCLUDED.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Minus size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#3f3f46" }} />
                  <span className="text-sm line-through" style={{ color: "#3f3f46" }}>{f}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={tier === "free"}
              className="w-full h-[44px] rounded-xl text-sm font-medium transition-all disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#52525b",
              }}
            >
              {tier === "free" ? "Current Plan" : "Free Plan"}
            </button>
          </motion.div>

          {/* ── PRO (HIGHLIGHTED) ────────────────────────── */}
          <motion.div
            className="rounded-2xl p-6 flex flex-col gap-5 relative"
            style={{
              background: "#18181b",
              border: "2px solid #6366f1",
              boxShadow: "0 0 32px rgba(99,102,241,0.18)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {/* Most Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                style={{ background: "#6366f1", color: "#fff" }}
              >
                ✦ Most Popular
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#818cf8" }}>Pro</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "#f4f4f5" }}>$29</span>
                <span style={{ color: "#52525b" }}>/month</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#52525b" }}>Billed monthly</p>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                  <span className="text-sm" style={{ color: "#a1a1aa" }}>{f}</span>
                </div>
              ))}
            </div>

            {tier === "pro" ? (
              <button
                type="button"
                disabled
                className="w-full h-[44px] rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProUpgrade}
                className="w-full h-[44px] rounded-xl text-white font-semibold text-sm transition-all"
                style={{ background: "#6366f1" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4f46e5";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#6366f1";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {tier === "team" ? "Switch to Pro" : "Upgrade to Pro"}
              </button>
            )}

            <p className="text-center text-xs" style={{ color: "#3f3f46" }}>
              Cancel anytime · No contracts · Instant access
            </p>
          </motion.div>

          {/* ── TEAM ─────────────────────────────────────── */}
          <motion.div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#71717a" }}>Team</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "#f4f4f5" }}>$49</span>
                <span style={{ color: "#52525b" }}>/month</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#52525b" }}>3 seats included</p>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-xs font-medium mb-1" style={{ color: "#52525b" }}>
                Everything in Pro, plus:
              </p>
              {TEAM_EXTRAS.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                  <span className="text-sm" style={{ color: "#a1a1aa" }}>{f}</span>
                </div>
              ))}
            </div>

            {tier === "team" ? (
              <button
                type="button"
                disabled
                className="w-full h-[44px] rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "#52525b",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTeamUpgrade}
                className="w-full h-[44px] rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: "transparent",
                  border: "1.5px solid #6366f1",
                  color: "#818cf8",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Upgrade to Team
              </button>
            )}

            <p className="text-center text-xs" style={{ color: "#3f3f46" }}>
              Need more than 3 seats?{" "}
              <a
                href="mailto:hello@cutsheet.xyz"
                style={{ color: "#6366f1" }}
                className="hover:underline"
              >
                Contact us →
              </a>
            </p>
          </motion.div>
        </div>

        {/* Feature comparison table (collapsible) */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="flex items-center gap-2 mx-auto text-sm transition-colors hover:text-zinc-300"
            style={{ color: "#71717a" }}
          >
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showTable ? "Hide" : "See full"} comparison
          </button>

          {showTable && (
            <motion.div
              className="mt-6 rounded-2xl overflow-hidden w-full"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.25 }}
            >
              {/* Header row */}
              <div
                className="grid grid-cols-4 text-xs font-semibold px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "#52525b",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span>Feature</span>
                <span className="text-center">Free</span>
                <span className="text-center" style={{ color: "#818cf8" }}>Pro</span>
                <span className="text-center">Team</span>
              </div>

              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-4 px-4 py-3 text-sm items-center"
                  style={{
                    background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ color: "#a1a1aa" }}>{row.feature}</span>
                  <div className="text-center"><CellValue value={row.free} /></div>
                  <div className="text-center"><CellValue value={row.pro} /></div>
                  <div className="text-center"><CellValue value={row.team} /></div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="text-[13px] transition-colors hover:text-zinc-400"
          style={{ color: "#52525b" }}
        >
          ← Back to app
        </button>
      </div>
    </div>
  );
}
