// Settings.tsx — /settings page with Profile, Billing, Usage tabs

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsageInfo, fetchCreditStatus, FeatureLimitResult } from "../services/usageService";
import { supabase } from "../lib/supabase";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Switch } from "../components/ui/Switch";
import { clearUserContextCache, type AdIntent } from "../services/userContextService";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 24,
};

const DIVIDER: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.06)",
};

const cardAnim = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as number[], delay },
});

// ─── BRAND COLORS ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#6366f1",
  primaryLight: "#818cf8",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  team: "#8b5cf6",
};

// ─── DOWNGRADE REASONS ────────────────────────────────────────────────────────
const DOWNGRADE_REASONS = [
  "It's too expensive",
  "I don't analyze ads very often",
  "I found an alternative",
  "I'm running into too many technical issues",
  "The results weren't as good as I expected",
  "Other reason",
];

const DOWNGRADE_CONSEQUENCES = [
  "Unlimited analyses will be removed — limit resets to 3/month",
  "Claude Sonnet improvements + CTA rewrites will be unavailable",
  "Pre-Flight A/B testing will be removed",
  "Scene-by-scene breakdowns + creative briefs will be unavailable",
];

const FEATURE_ROWS: { key: string; label: string }[] = [
  { key: "analyze",     label: "Analyses" },
  { key: "visualize",   label: "Visualize" },
  { key: "motion",      label: "Motion Preview" },
  { key: "script",      label: "Script Generator" },
  { key: "fixIt",       label: "Fix It For Me" },
  { key: "policyCheck", label: "Policy Checker" },
  { key: "deconstruct", label: "Ad Deconstructor" },
  { key: "brief",       label: "Score to Brief" },
];

// Plan comparison data
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "3 analyses per day",
      "Video + static ad analysis",
      "Basic scorecard",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    features: [
      "Unlimited video + static ad analyses",
      "Visualize — AI Art Director (10/month)",
      "Motion Preview (5/month)",
      "Script Generator (10/month)",
      "Fix It For Me (20/month)",
      "Policy Checker (30/month)",
      "Ad Deconstructor (20/month)",
      "Score to Brief (20/month)",
      "Hook Score, Emotion Map, Fatigue Predictor",
      "Benchmark context",
    ],
  },
  team: {
    name: "Team",
    price: 49,
    features: [
      "Everything in Pro, plus:",
      "Visualize (25/month shared)",
      "Motion Preview (15/month shared)",
      "Script Generator (25/month shared)",
      "Fix It For Me (50/month shared)",
      "Policy Checker (75/month shared)",
      "Ad Deconstructor (50/month shared)",
      "Score to Brief (50/month shared)",
      "3 team seats",
      "Shared analysis history",
      "Team management dashboard",
      "Client sharing (coming soon)",
    ],
  },
};

type Tab = "profile" | "billing" | "usage";
type BillingView = "dashboard" | "manage" | "downgrade-reason" | "downgrade-confirm" | "downgraded";

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
export function Settings() {
  const navigate = useNavigate();
  const { user, subscriptionStatus } = useAuth();

  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [productUpdates, setProductUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  // Ad intent state
  const [intent, setIntent] = useState<AdIntent>("conversion");
  const [intentSaved, setIntentSaved] = useState(false);

  // Usage + billing state
  const [usage, setUsage] = useState<{ used: number; limit: number; isPro: boolean } | null>(null);
  const [credits, setCredits] = useState<Record<string, FeatureLimitResult> | null>(null);
  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);

  // Billing flow state
  const [billingView, setBillingView] = useState<BillingView>("dashboard");
  const [downgradeReason, setDowngradeReason] = useState<string | null>(null);

  useEffect(() => {
    getUsageInfo().then(setUsage).catch(() => {});
    fetchCreditStatus().then(setCredits).catch(() => {});
    // Fetch total analyses count for this user
    supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        setTotalAnalyses(count ?? 0);
      });
  }, []);

  // Load intent from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("intent")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.intent && ["awareness", "consideration", "conversion"].includes(data.intent)) {
          setIntent(data.intent as AdIntent);
        }
      });
  }, [user]);

  const handleIntentChange = async (value: string) => {
    const newIntent = value.toLowerCase() as AdIntent;
    setIntent(newIntent);
    if (!user) return;
    await supabase.from("profiles").update({ intent: newIntent }).eq("id", user.id);
    clearUserContextCache();
    setIntentSaved(true);
    setTimeout(() => setIntentSaved(false), 2000);
  };

  const isTeam = subscriptionStatus === "team";
  const isPro = subscriptionStatus === "pro" || isTeam;
  const analysesUsed = usage?.used ?? 0;
  const analysesTotal = usage?.limit ?? 3;

  // Compute next month's 1st for reset date display
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);

  // Fake renewal date (1 year from now) — TODO: pull from Stripe subscription
  const renewalDate = new Date();
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);

  const progressPct = Math.min((analysesUsed / analysesTotal) * 100, 100);
  const progressColor =
    analysesUsed >= analysesTotal
      ? "#ef4444"
      : analysesUsed >= analysesTotal - 1
      ? "#f59e0b"
      : "#6366f1";
  const remaining = analysesTotal - analysesUsed;

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    setPasswordResetError(false);
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setPasswordResetSent(true);
    } catch {
      setPasswordResetError(true);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handlePrefChange = (setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
    { id: "usage", label: "Usage" },
  ];

  // ─── BILLING VIEWS ──────────────────────────────────────────────────────────

  const BillingDashboard = () => {
    const currentPlan = isTeam ? PLANS.team : isPro ? PLANS.pro : PLANS.free;
    const planColor = isTeam ? COLORS.team : isPro ? COLORS.primary : "#71717a";

    const renderCreditValue = (cr: FeatureLimitResult | undefined) => {
      if (!cr) {
        return (
          <span
            style={{
              display: "inline-block",
              width: 44,
              height: 12,
              borderRadius: 4,
              background: "rgba(255,255,255,0.06)",
            }}
          />
        );
      }
      if (cr.reason === "TIER_BLOCKED") {
        return (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: COLORS.primary,
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            Pro
          </span>
        );
      }
      if (cr.limit === null) {
        return (
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.success, fontFamily: "var(--mono)" }}>
            Unlimited
          </span>
        );
      }
      const used = (cr.limit ?? 0) - (cr.remaining ?? 0);
      const pct = cr.limit ? used / cr.limit : 0;
      const color = pct >= 0.9 ? COLORS.error : pct >= 0.6 ? COLORS.warning : COLORS.success;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "var(--mono)" }}>
            {used}
          </span>
          <span style={{ fontSize: 11, color: "#52525b" }}>/ {cr.limit}</span>
        </div>
      );
    };

    return (
      <motion.div className="flex flex-col gap-5" style={{ maxWidth: 560 }} {...cardAnim(0)}>
        {/* Current Plan Card */}
        <div 
          style={{ 
            ...CARD_STYLE, 
            background: "rgba(255,255,255,0.025)",
            borderColor: `${planColor}25`,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                style={{ 
                  width: 44, height: 44, borderRadius: 12,
                  background: `${planColor}15`,
                  border: `1px solid ${planColor}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: planColor }}>
                  {currentPlan.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5" }}>
                    Cutsheet {currentPlan.name}
                  </h2>
                  {isPro && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: COLORS.success,
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: 6,
                        padding: "3px 8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                {isPro && (
                  <p style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>
                    Renews {renewalDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: "#f4f4f5" }}>
                ${currentPlan.price}
              </span>
              <span style={{ fontSize: 14, color: "#71717a", fontWeight: 400 }}>/mo</span>
            </div>
          </div>

          {/* Credit Usage Section */}
          {isPro && (
            <>
              <div style={DIVIDER} />
              <div className="mt-5">
                <div className="flex items-center justify-between mb-4">
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Credit Usage
                  </span>
                  <span style={{ fontSize: 11, color: "#52525b" }}>
                    Resets {resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FEATURE_ROWS.map(({ key, label }) => (
                    <div 
                      key={key} 
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: credits?.[key]?.reason === "TIER_BLOCKED" ? "#52525b" : "#a1a1aa",
                        }}
                      >
                        {label}
                      </span>
                      {renderCreditValue(credits?.[key])}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {isPro ? (
              <>
                <button
                  type="button"
                  onClick={() => setBillingView("manage")}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
                  style={{ 
                    background: `${planColor}15`, 
                    color: planColor, 
                    border: `1px solid ${planColor}30`, 
                    cursor: "pointer" 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${planColor}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${planColor}15`; }}
                >
                  Manage Subscription
                </button>
                {!isTeam && (
                  <button
                    type="button"
                    onClick={() => navigate("/upgrade?plan=team")}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all"
                    style={{ 
                      background: COLORS.team, 
                      color: "white", 
                      border: "none", 
                      cursor: "pointer",
                      boxShadow: `0 4px 16px ${COLORS.team}40`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    Upgrade to Team
                  </button>
                )}
              </>
            ) : (
              <motion.button
                type="button"
                onClick={() => navigate("/upgrade")}
                className="w-full h-12 rounded-xl text-sm font-semibold"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.team})`, 
                  color: "white", 
                  border: "none", 
                  cursor: "pointer",
                  boxShadow: `0 4px 20px ${COLORS.primary}40`,
                }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Upgrade to Pro
              </motion.button>
            )}
          </div>
        </div>

        {/* Plan Features */}
        <div style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-4">
            <div 
              style={{ 
                width: 28, height: 28, borderRadius: 8,
                background: `${COLORS.success}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CheckCircle size={14} color={COLORS.success} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {currentPlan.name} Plan Includes
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentPlan.features.map((f, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2.5 p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <CheckCircle size={14} color={isPro ? COLORS.success : "#52525b"} style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: isPro ? "#d4d4d8" : "#71717a", lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compare Plans Section */}
        {!isTeam && (
          <div 
            className="rounded-xl p-5"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.team}08)`,
              border: `1px solid ${COLORS.primary}15`,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
              {isPro ? "Need more seats?" : "Ready to unlock more?"}
            </p>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>
              {isPro 
                ? "Team plan includes 3 seats, shared credits, and team management." 
                : "Compare Free, Pro, and Team plans to find the right fit."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="text-sm font-medium transition-colors"
              style={{ color: COLORS.primaryLight, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#a5b4fc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.primaryLight; }}
            >
              View all plans →
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  const ManageSubscription = () => (
    <motion.div
      style={{ maxWidth: 560 }}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => setBillingView("dashboard")}
        className="flex items-center gap-2 mb-6 transition-colors"
        style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 500 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
      >
        <ArrowLeft size={14} /> Back to billing
      </button>

      <div className="flex flex-col gap-4">
        {/* Main settings card */}
        <div style={CARD_STYLE}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
            Manage Subscription
          </h2>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>
            Update your billing details or view past invoices.
          </p>

          {/* Payment Method */}
          <div 
            className="flex items-center justify-between p-4 rounded-xl mb-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div 
                style={{ 
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>Payment Method</p>
                <p style={{ fontSize: 12, color: "#71717a" }}>•••• •••• •••• 4242</p>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ 
                background: "rgba(255,255,255,0.04)", 
                border: "1px solid rgba(255,255,255,0.08)", 
                color: "#a1a1aa", 
                cursor: "pointer" 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.color = "#818cf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              Update
            </button>
          </div>

          {/* Invoice History */}
          <div 
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div 
                style={{ 
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>Invoice History</p>
                <p style={{ fontSize: 12, color: "#71717a" }}>View and download past invoices</p>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ 
                background: "rgba(255,255,255,0.04)", 
                border: "1px solid rgba(255,255,255,0.08)", 
                color: "#a1a1aa", 
                cursor: "pointer" 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.color = "#818cf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              View
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div 
          className="rounded-2xl p-5"
          style={{ 
            background: "rgba(239,68,68,0.04)", 
            border: "1px solid rgba(239,68,68,0.1)" 
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              style={{ 
                width: 24, height: 24, borderRadius: 6,
                background: "rgba(239,68,68,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={12} color={COLORS.error} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.error, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Danger Zone
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12, lineHeight: 1.5 }}>
            Downgrade to Free plan. Your pro features will remain active until the end of your current billing cycle.
          </p>
          <button
            type="button"
            onClick={() => setBillingView("downgrade-reason")}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)",
              color: COLORS.error,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Downgrade to Free
          </button>
        </div>
      </div>
    </motion.div>
  );

  const DowngradeReason = () => (
    <motion.div
      style={{ maxWidth: 560 }}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={() => setBillingView("manage")}
        className="flex items-center gap-2 mb-6 transition-colors"
        style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 500 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
      >
        <ArrowLeft size={14} /> Back to manage
      </button>

      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
          Why are you downgrading?
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>
          Your feedback helps us improve Cutsheet.
        </p>

        <div className="flex flex-col gap-2.5">
          {DOWNGRADE_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setDowngradeReason(reason)}
              className="flex items-center gap-3 py-3.5 px-4 rounded-xl text-left transition-all w-full"
              style={{
                background: downgradeReason === reason ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                border: downgradeReason === reason
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
              }}
            >
              {/* Radio circle */}
              <span
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  border: downgradeReason === reason
                    ? `2px solid ${COLORS.primary}`
                    : "2px solid rgba(255,255,255,0.15)",
                  transition: "all 0.15s ease",
                }}
              >
                {downgradeReason === reason && (
                  <span
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: COLORS.primary, display: "block" }}
                  />
                )}
              </span>
              <span style={{ fontSize: 14, color: downgradeReason === reason ? "#f4f4f5" : "#a1a1aa" }}>
                {reason}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setBillingView("manage")}
            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a1a1aa",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          >
            Keep current plan
          </button>
          <button
            type="button"
            onClick={() => downgradeReason && setBillingView("downgrade-confirm")}
            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
            style={{
              background: downgradeReason ? COLORS.error : "rgba(239,68,68,0.2)",
              color: "white",
              border: "none",
              cursor: downgradeReason ? "pointer" : "default",
              opacity: downgradeReason ? 1 : 0.5,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );

  const DowngradeConfirm = () => (
    <motion.div
      style={{ maxWidth: 560 }}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={() => setBillingView("downgrade-reason")}
        className="flex items-center gap-2 mb-6 transition-colors"
        style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 500 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
          Continue downgrading to Free?
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>
          Changes take effect at the end of your current billing cycle.
        </p>

        {/* Consequences list */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.error, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            What you'll lose
          </p>
          {DOWNGRADE_CONSEQUENCES.map((c) => (
            <div key={c} className="flex items-start gap-3">
              <X size={14} color={COLORS.error} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.4 }}>{c}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setBillingView("dashboard")}
            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a1a1aa",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          >
            Keep current plan
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "mailto:support@cutsheet.app?subject=Downgrade%20Request&body=Hi%2C%20I%27d%20like%20to%20downgrade%20my%20subscription%20to%20Free.%20My%20email%20is%20" + encodeURIComponent(user?.email ?? "");
            }}
            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
            style={{ background: COLORS.error, color: "white", border: "none", cursor: "pointer" }}
          >
            Contact support
          </button>
        </div>
      </div>
    </motion.div>
  );

  const Downgraded = () => (
    <motion.div
      style={{ maxWidth: 560 }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        style={{ ...CARD_STYLE, textAlign: "center", padding: 48 }}
        className="flex flex-col items-center gap-5"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: `${COLORS.success}15`, border: `1px solid ${COLORS.success}25` }}
        >
          <CheckCircle size={28} color={COLORS.success} />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 8 }}>
            Downgrade scheduled
          </p>
          <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, maxWidth: 320 }}>
            Your plan will switch to Free at the end of your billing cycle. You'll keep Pro access until then.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBillingView("dashboard")}
          className="mt-2 px-6 h-10 rounded-xl text-sm font-medium transition-all"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a1a1aa",
            background: "rgba(255,255,255,0.02)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        >
          Back to billing
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#09090b" }}>
      {/* Subtle ambient glow */}
      <div
        className="pointer-events-none fixed top-0 right-1/4 w-[800px] h-[600px] rounded-full blur-[150px]"
        style={{ background: "rgba(99,102,241,0.06)" }}
      />

      <motion.div
        className="relative max-w-3xl mx-auto px-4 py-10 sm:px-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ 
              background: "rgba(255,255,255,0.03)", 
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#71717a" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f4f4f5";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#71717a";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#f4f4f5" }}>Settings</h1>
            <p style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>Manage your account and preferences</p>
          </div>
        </div>

        {/* ── TAB NAV ── */}
        <div
          className="inline-flex gap-1 p-1 mb-8 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "billing") setBillingView("dashboard");
                }}
                className="relative px-5 py-2 text-sm font-medium transition-all rounded-lg"
                style={{
                  color: active ? "#f4f4f5" : "#71717a",
                  background: active ? "rgba(99,102,241,0.15)" : "transparent",
                  border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#a1a1aa";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#71717a";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">
          {/* ════ PROFILE TAB ════ */}
          {tab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
              style={{ maxWidth: 560 }}
            >
              {/* Account card */}
              <motion.div style={CARD_STYLE} {...cardAnim(0)}>
                <div className="flex items-center gap-3 mb-5">
                  <div 
                    style={{ 
                      width: 40, height: 40, borderRadius: 12,
                      background: `${COLORS.primary}15`,
                      border: `1px solid ${COLORS.primary}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.primary }}>
                      {user?.email?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>Account</h2>
                    <p style={{ fontSize: 12, color: "#71717a" }}>Manage your email and password</p>
                  </div>
                </div>

                {/* Email row */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl mb-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Email
                    </span>
                    <p style={{ fontSize: 14, color: "#f4f4f5", marginTop: 4 }}>
                      {user?.email ?? "—"}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: COLORS.success,
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      borderRadius: 6,
                      padding: "4px 10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Verified
                  </span>
                </div>

                {/* Password row */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Password
                    </span>
                    <p style={{ fontSize: 14, color: "#52525b", marginTop: 4, letterSpacing: "0.1em" }}>••••••••••</p>
                  </div>
                  {passwordResetSent ? (
                    <span 
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                      style={{ fontSize: 12, color: COLORS.success, background: "rgba(16,185,129,0.1)" }}
                    >
                      <CheckCircle size={14} /> Sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={passwordResetLoading}
                      className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#a1a1aa",
                        background: "rgba(255,255,255,0.02)",
                        cursor: passwordResetLoading ? "default" : "pointer",
                        opacity: passwordResetLoading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!passwordResetLoading) {
                          e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                          e.currentTarget.style.color = COLORS.primaryLight;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.color = "#a1a1aa";
                      }}
                    >
                      {passwordResetLoading ? "Sending..." : "Change Password"}
                    </button>
                  )}
                </div>
                {passwordResetError && (
                  <p style={{ fontSize: 12, color: COLORS.error, marginTop: 8 }}>
                    Couldn't send reset link. Check your connection and try again.
                  </p>
                )}
              </motion.div>

              {/* Ad Intent card */}
              <motion.div style={CARD_STYLE} {...cardAnim(0.08)}>
                <div className="flex items-center gap-3 mb-5">
                  <div 
                    style={{ 
                      width: 40, height: 40, borderRadius: 12,
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>Ad Intent</h2>
                    <p style={{ fontSize: 12, color: "#71717a" }}>Tailors AI feedback to your objective</p>
                  </div>
                </div>
                <SegmentedControl
                  options={["Awareness", "Consideration", "Conversion"]}
                  selected={intent.charAt(0).toUpperCase() + intent.slice(1)}
                  onChange={handleIntentChange}
                />
                {intentSaved && (
                  <p className="flex items-center gap-1.5 mt-3" style={{ fontSize: 12, color: COLORS.success }}>
                    <CheckCircle size={14} /> Saved — AI feedback will now prioritize {intent} signals
                  </p>
                )}
              </motion.div>

              {/* Preferences card */}
              <motion.div style={CARD_STYLE} {...cardAnim(0.16)}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ 
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>Email Preferences</h2>
                      <p style={{ fontSize: 12, color: "#71717a" }}>Manage notifications</p>
                    </div>
                  </div>
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 600,
                      color: "#52525b", 
                      background: "rgba(255,255,255,0.04)", 
                      borderRadius: 6, 
                      padding: "4px 10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Coming soon
                  </span>
                </div>

                <div className="flex flex-col gap-3 opacity-50 pointer-events-none">
                  <div 
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>Product updates</p>
                      <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>New features and improvements</p>
                    </div>
                    <Switch checked={productUpdates} onCheckedChange={(v) => handlePrefChange(setProductUpdates, v)} disabled />
                  </div>

                  <div 
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>Weekly digest</p>
                      <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Your usage summary every Monday</p>
                    </div>
                    <Switch checked={weeklyDigest} onCheckedChange={(v) => handlePrefChange(setWeeklyDigest, v)} disabled />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ════ BILLING TAB ════ */}
          {tab === "billing" && (
            <motion.div
              key={`billing-${billingView}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {billingView === "dashboard" && <BillingDashboard key="dash" />}
                {billingView === "manage" && <ManageSubscription key="manage" />}
                {billingView === "downgrade-reason" && <DowngradeReason key="reason" />}
                {billingView === "downgrade-confirm" && <DowngradeConfirm key="confirm" />}
                {billingView === "downgraded" && <Downgraded key="done" />}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ════ USAGE TAB ════ */}
          {tab === "usage" && (
            <motion.div
              key="usage"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
              style={{ maxWidth: 560 }}
            >
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  style={CARD_STYLE}
                  {...cardAnim(0)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      style={{ 
                        width: 36, height: 36, borderRadius: 10,
                        background: `${COLORS.success}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <CheckCircle size={18} color={COLORS.success} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Total Analyses
                    </span>
                  </div>
                  <p style={{ fontSize: 32, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
                    {totalAnalyses !== null ? totalAnalyses.toLocaleString() : "—"}
                  </p>
                </motion.div>

                <motion.div 
                  style={CARD_STYLE}
                  {...cardAnim(0.05)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      style={{ 
                        width: 36, height: 36, borderRadius: 10,
                        background: `${isTeam ? COLORS.team : isPro ? COLORS.primary : "#71717a"}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: isTeam ? COLORS.team : isPro ? COLORS.primary : "#71717a" }}>
                        {isTeam ? "T" : isPro ? "P" : "F"}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Current Plan
                    </span>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5" }}>
                    {isTeam ? "Team" : isPro ? "Pro" : "Free"}
                  </p>
                </motion.div>
              </div>

              {/* Analysis status */}
              <motion.div style={CARD_STYLE} {...cardAnim(0.1)}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ 
                        width: 40, height: 40, borderRadius: 12,
                        background: isPro ? `${COLORS.success}15` : `${progressColor}15`,
                        border: `1px solid ${isPro ? COLORS.success : progressColor}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isPro ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={progressColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>
                        {isPro ? "Unlimited Analyses" : "Analysis Quota"}
                      </h3>
                      <p style={{ fontSize: 12, color: "#71717a" }}>
                        {isPro 
                          ? `${isTeam ? "Team" : "Pro"} plan — no limits`
                          : `Resets ${resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        }
                      </p>
                    </div>
                  </div>
                  {isPro && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: COLORS.success,
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: 6,
                        padding: "4px 10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                {!isPro && (
                  <>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span style={{ fontSize: 40, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
                        {analysesUsed}
                      </span>
                      <span style={{ fontSize: 16, color: "#52525b" }}>/ {analysesTotal} used</span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden mb-3"
                      style={{ height: 8, background: "rgba(255,255,255,0.06)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: progressColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 16 }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: remaining <= 0 ? COLORS.error : remaining === 1 ? COLORS.warning : "#71717a",
                      }}
                    >
                      {remaining <= 0
                        ? "You've used all your free analyses this month"
                        : remaining === 1
                        ? "1 analysis remaining this month"
                        : `${remaining} analyses remaining`}
                    </p>
                  </>
                )}
              </motion.div>

              {/* Upgrade CTA for free users */}
              {!isPro && (
                <motion.div
                  className="rounded-xl p-5"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.team}08)`,
                    border: `1px solid ${COLORS.primary}20`,
                  }}
                  {...cardAnim(0.15)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      style={{ 
                        width: 36, height: 36, borderRadius: 10,
                        background: `${COLORS.primary}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Get unlimited analyses</p>
                      <p style={{ fontSize: 12, color: "#71717a" }}>Starting at $29/month</p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => navigate("/upgrade")}
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.team})`,
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: `0 4px 16px ${COLORS.primary}40`,
                    }}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Plans
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
