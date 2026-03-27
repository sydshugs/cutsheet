// Settings.tsx — /settings page with Profile, Billing, Usage tabs

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, X, Layers, Zap, Users, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  primary: "var(--accent)",
  primaryLight: "#818cf8",    // no dedicated token — keep as hex
  success: "var(--success)",
  warning: "var(--warn)",
  error: "var(--error)",
  team: "#8b5cf6",            // no dedicated token — keep as hex
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

// Plan comparison data with monthly/yearly pricing
const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "For individuals exploring",
    priceMonthly: 0,
    priceYearly: 0,
    icon: "layers",
    features: [
      { label: "3 analyses per day", included: true },
      { label: "Video + static ad analysis", included: true },
      { label: "Basic scorecard", included: true },
      { label: "Visualize AI Art Director", included: false },
      { label: "Motion Preview", included: false },
      { label: "Advanced tools", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For marketers & creators",
    priceMonthly: 29,
    priceYearly: 295, // $29 × 12 = $348, with 15% off = $295.80 → $295
    icon: "zap",
    recommended: true,
    features: [
      { label: "Unlimited analyses", included: true },
      { label: "Visualize (10/month)", included: true },
      { label: "Motion Preview (5/month)", included: true },
      { label: "Script Generator (10/month)", included: true },
      { label: "Fix It For Me (20/month)", included: true },
      { label: "All scoring features", included: true },
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "For agencies & teams",
    priceMonthly: 49,
    priceYearly: 499, // $49 × 12 = $588, with 15% off = $499.80 → $499
    icon: "users",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "3 team seats", included: true },
      { label: "Shared analysis history", included: true },
      { label: "Higher usage limits", included: true },
      { label: "Team dashboard", included: true },
      { label: "Client sharing (soon)", included: true },
    ],
  },
];

type Tab = "profile" | "billing" | "usage";
type BillingView = "dashboard" | "manage" | "downgrade-reason" | "downgrade-confirm" | "downgraded";

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
export function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, subscriptionStatus } = useAuth();

  const initialTab = (searchParams.get("tab") as Tab) || "profile";
  const [tab, setTab] = useState<Tab>(
    ["profile", "billing", "usage"].includes(initialTab) ? initialTab : "profile"
  );

  // Profile state
  const [productUpdates, setProductUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState(false);
  // prefSaved removed — notification prefs not yet wired to backend

  // Ad intent state
  const [intent, setIntent] = useState<AdIntent>("conversion");
  const [intentSaved, setIntentSaved] = useState(false);

  // Usage + billing state
  const [usage, setUsage] = useState<{ used: number; limit: number; isPro: boolean } | null>(null);
  const [credits, setCredits] = useState<Record<string, FeatureLimitResult> | null>(null);
  const [totalAnalyses, setTotalAnalyses] = useState<number | null>(null);

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Billing flow state
  const [billingView, setBillingView] = useState<BillingView>("dashboard");
  const [downgradeReason, setDowngradeReason] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

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

  const { signOut } = useAuth();

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        setDeleteError("Not authenticated. Please sign in again.");
        setDeleteLoading(false);
        return;
      }
      const resp = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setDeleteError(data.error ?? "Failed to delete account");
        setDeleteLoading(false);
        return;
      }
      // Sign out and redirect to landing
      await signOut();
      navigate("/");
    } catch {
      setDeleteError("Something went wrong. Please try again or contact support.");
      setDeleteLoading(false);
    }
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

  // Notification preferences are disabled (not yet wired to backend).
  // No-op handler — remove setPrefSaved fake feedback to avoid misleading users.
  const handlePrefChange = (setter: (v: boolean) => void, value: boolean) => {
    setter(value);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
    { id: "usage", label: "Usage" },
  ];

  // ─── BILLING VIEWS ──────────────────────────────────────────────────────────

  const BillingDashboard = () => {
    const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
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
                ${currentPlan.priceMonthly}
              </span>
              <span style={{ fontSize: 14, color: "#71717a", fontWeight: 400 }}>/mo</span>
            </div>
          </div>

          {/* Credit Usage Section - Manus style */}
          {isPro && (
            <>
              <div style={DIVIDER} />
              <div className="mt-5">
                {/* Credits summary row like Manus */}
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    style={{ 
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa" }}>Credits</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
                    {Object.values(credits || {}).reduce((acc, cr) => {
                      if (cr?.limit === null) return acc;
                      return acc + (cr?.remaining ?? 0);
                    }, 0).toLocaleString()}
                  </span>
                </div>

                {/* Credit breakdown like Manus */}
                <div 
                  className="rounded-xl p-4 mb-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#71717a" }}>Monthly credits</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", fontFamily: "var(--mono)" }}>
                      {credits?.analyze?.limit === null ? "Unlimited" : `${(credits?.analyze?.limit ?? 0) - (credits?.analyze?.remaining ?? 0)} / ${credits?.analyze?.limit ?? 0}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ fontSize: 12, color: "#71717a" }}>Daily refresh</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", fontFamily: "var(--mono)" }}>
                      Resets {resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Feature credits grid */}
                <div className="grid grid-cols-2 gap-2">
                  {FEATURE_ROWS.filter(f => f.key !== "analyze").map(({ key, label }) => (
                    <div 
                      key={key} 
                      className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.015)" }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: credits?.[key]?.reason === "TIER_BLOCKED" ? "#52525b" : "#71717a",
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

        {/* Recent Activity / Invoices - Like Manus */}
        {isPro && (
          <div style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
                Recent activity
              </span>
              <button
                type="button"
                onClick={() => setBillingView("manage")}
                className="text-xs font-medium transition-colors flex items-center gap-1"
                style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.primaryLight; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
              >
                View all invoices
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            
            {/* Invoice table header */}
            <div 
              className="grid grid-cols-3 gap-4 px-3 py-2 rounded-lg mb-2"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span style={{ fontSize: 11, fontWeight: 500, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Invoice</span>
            </div>
            
            {/* Sample invoice rows */}
            {[
              { date: renewalDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), amount: `$${currentPlan.priceMonthly}.00` },
            ].map((invoice, i) => (
              <div 
                key={i}
                className="grid grid-cols-3 gap-4 px-3 py-3 rounded-lg transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span style={{ fontSize: 13, color: "#a1a1aa" }}>{invoice.date}</span>
                <span style={{ fontSize: 13, color: "#f4f4f5", fontFamily: "var(--mono)" }}>{invoice.amount}</span>
                <button
                  type="button"
                  className="text-xs font-medium transition-colors text-right"
                  style={{ color: COLORS.primaryLight, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

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
            {currentPlan.features.filter(f => f.included).map((f, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2.5 p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <CheckCircle size={14} color={isPro ? COLORS.success : "#52525b"} style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: isPro ? "#d4d4d8" : "#71717a", lineHeight: 1.4 }}>{f.label}</span>
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

  // Helper to get plan icon
  const getPlanIcon = (icon: string) => {
    switch (icon) {
      case "layers": return <Layers size={24} color={COLORS.primaryLight} />;
      case "zap": return <Zap size={24} color={COLORS.primaryLight} />;
      case "users": return <Users size={24} color={COLORS.team} />;
      default: return <Layers size={24} color={COLORS.primaryLight} />;
    }
  };

  // Get current plan ID
  const currentPlanId = subscriptionStatus === "team" ? "team" : subscriptionStatus === "pro" ? "pro" : "free";

  const ManageSubscription = () => (
    <motion.div
      style={{ maxWidth: 880 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header with close */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
            Manage your subscription
          </h2>
          <p style={{ fontSize: 14, color: "#71717a" }}>
            Choose a plan that fits your needs
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBillingView("dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "none", cursor: "pointer", color: "#71717a" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center mb-8">
        <div 
          className="inline-flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: !isAnnual ? "rgba(255,255,255,0.1)" : "transparent",
              color: !isAnnual ? "#f4f4f5" : "#71717a",
              border: "none",
              cursor: "pointer",
            }}
          >
            Monthly
          </button>
          {/* Annually button with Save badge above */}
          <div className="relative">
            <span 
              className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
              style={{ background: "rgba(16,185,129,0.15)", color: COLORS.success, border: "1px solid rgba(16,185,129,0.2)" }}
            >
              Save 15%
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isAnnual ? "rgba(255,255,255,0.1)" : "transparent",
                color: isAnnual ? "#f4f4f5" : "#71717a",
                border: "none",
                cursor: "pointer",
              }}
            >
              Annually
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isRecommended = plan.recommended && !isCurrentPlan;
          const price = isAnnual ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className="relative rounded-2xl p-5 transition-all"
              style={{
                background: isRecommended ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)",
                border: isRecommended 
                  ? `1px solid ${COLORS.primary}` 
                  : isCurrentPlan 
                    ? "1px solid rgba(255,255,255,0.12)" 
                    : "1px solid rgba(255,255,255,0.06)",
                transform: isRecommended ? "scale(1.02)" : "scale(1)",
              }}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: COLORS.primary, color: "white" }}
                >
                  Recommended
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex justify-center mb-4 pt-2">
                <div 
                  style={{ 
                    width: 48, height: 48, borderRadius: 12,
                    background: plan.id === "team" ? "rgba(139,92,246,0.1)" : "rgba(99,102,241,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {getPlanIcon(plan.icon)}
                </div>
              </div>

              <div className="text-center mb-4">
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: 13, color: "#71717a" }}>{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-5">
                <span style={{ fontSize: 36, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
                  ${price}
                </span>
                <span style={{ fontSize: 14, color: "#71717a" }}>
                  {" "}/ {isAnnual ? "year" : "month"}
                </span>
              </div>

              {/* CTA Button */}
              {(() => {
                // Plan hierarchy: team (2) > pro (1) > free (0)
                const planRank: Record<string, number> = { free: 0, pro: 1, team: 2 };
                const currentRank = planRank[currentPlanId] ?? 0;
                const targetRank = planRank[plan.id] ?? 0;
                const isDowngrade = targetRank < currentRank;
                const isUpgrade = targetRank > currentRank;

                if (isCurrentPlan) {
                  return (
                    <div 
                      className="w-full h-10 rounded-xl flex items-center justify-center text-sm font-medium mb-5"
                      style={{ 
                        background: "rgba(255,255,255,0.04)", 
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#71717a",
                      }}
                    >
                      Current plan
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => isDowngrade ? setBillingView("downgrade-reason") : navigate("/upgrade")}
                    className="w-full h-10 rounded-xl text-sm font-medium transition-all mb-5"
                    style={{
                      background: isUpgrade && isRecommended ? COLORS.primary : "rgba(255,255,255,0.06)",
                      color: isUpgrade && isRecommended ? "white" : "#e4e4e7",
                      border: isUpgrade && isRecommended ? "none" : "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { 
                      if (!(isUpgrade && isRecommended)) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; 
                      else e.currentTarget.style.background = "#4f46e5";
                    }}
                    onMouseLeave={(e) => { 
                      if (!(isUpgrade && isRecommended)) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; 
                      else e.currentTarget.style.background = COLORS.primary;
                    }}
                  >
                    {isDowngrade ? "Downgrade" : "Upgrade"}
                  </button>
                );
              })()}

              {/* Features */}
              <div className="flex flex-col gap-2.5">
                <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Highlights
                </p>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {feature.included ? (
                      <Check size={14} color={plan.id === "team" ? COLORS.team : COLORS.primary} />
                    ) : (
                      <X size={14} color="#52525b" />
                    )}
                    <span 
                      style={{ 
                        fontSize: 13, 
                        color: feature.included ? "#a1a1aa" : "#52525b",
                        textDecoration: feature.included ? "none" : "line-through",
                      }}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4">
          <a
            href="mailto:support@cutsheet.app"
            className="text-xs transition-colors"
            style={{ color: "#71717a", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
          >
            Having a problem? Contact support
          </a>
        </div>
        <div className="flex items-center gap-4">
          {isPro && (
            <button
              type="button"
              onClick={() => setBillingView("downgrade-reason")}
              className="text-xs transition-colors"
              style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.error; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
            >
              Downgrade to Free
            </button>
          )}
          <button
            type="button"
            onClick={() => setBillingView("dashboard")}
            className="text-xs transition-colors"
            style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
          >
            Edit billing →
          </button>
        </div>
      </div>
    </motion.div>
  );

  const DowngradeReason = () => (
    <motion.div
      style={{ maxWidth: 520 }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        style={{ 
          ...CARD_STYLE, 
          padding: 32,
          background: "rgba(24,24,27,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        {/* Close button like Manus */}
        <button
          type="button"
          onClick={() => setBillingView("manage")}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "transparent"; }}
        >
          <X size={18} />
        </button>

        {/* Brand icon like Manus */}
        <div 
          className="mb-6"
          style={{ 
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f4f4f5", marginBottom: 8 }}>
          Why are you downgrading?
        </h2>
        <p style={{ fontSize: 14, color: "#71717a", marginBottom: 28 }}>
          Your feedback helps us improve Cutsheet
        </p>

        {/* Reason options in a contained box like Manus */}
        <div 
          className="rounded-xl p-1 mb-6"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {DOWNGRADE_REASONS.map((reason, i) => (
            <button
              key={reason}
              type="button"
              onClick={() => setDowngradeReason(reason)}
              className="flex items-center gap-3 py-3 px-4 text-left transition-all w-full rounded-lg"
              style={{
                background: downgradeReason === reason ? "rgba(255,255,255,0.04)" : "transparent",
                cursor: "pointer",
                borderBottom: i < DOWNGRADE_REASONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                borderRadius: i === 0 ? "8px 8px 0 0" : i === DOWNGRADE_REASONS.length - 1 ? "0 0 8px 8px" : 0,
              }}
            >
              {/* Clean radio circle like Manus */}
              <span
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  border: downgradeReason === reason
                    ? "2px solid #f4f4f5"
                    : "1.5px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {downgradeReason === reason && (
                  <span
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: "#f4f4f5", display: "block" }}
                  />
                )}
              </span>
              <span style={{ fontSize: 14, color: "#e4e4e7" }}>
                {reason}
              </span>
            </button>
          ))}
        </div>

        {/* Action buttons - Manus style with dark/light contrast */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => downgradeReason && setBillingView("downgrade-confirm")}
            className="px-6 h-10 rounded-lg text-sm font-medium transition-all"
            style={{
              background: downgradeReason ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              color: downgradeReason ? "#e4e4e7" : "#71717a",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: downgradeReason ? "pointer" : "default",
            }}
          >
            Confirm downgrade
          </button>
          <button
            type="button"
            onClick={() => setBillingView("manage")}
            className="px-6 h-10 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "#f4f4f5",
              color: "#18181b",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e4e4e7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f4f4f5"; }}
          >
            Keep current plan
          </button>
        </div>
      </div>
    </motion.div>
  );

  const DowngradeConfirm = () => (
    <motion.div
      style={{ maxWidth: 520 }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        style={{ 
          ...CARD_STYLE, 
          padding: 32,
          background: "rgba(24,24,27,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setBillingView("downgrade-reason")}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "transparent"; }}
        >
          <X size={18} />
        </button>

        {/* Brand icon */}
        <div 
          className="mb-6"
          style={{ 
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f4f4f5", marginBottom: 8 }}>
          Continue downgrading to Free?
        </h2>
        <p style={{ fontSize: 14, color: "#71717a", marginBottom: 28 }}>
          If you downgrade, the changes will take effect next billing cycle:
        </p>

        {/* Consequences list - Manus style with X icons */}
        <div 
          className="rounded-xl p-4 mb-6 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {DOWNGRADE_CONSEQUENCES.map((c) => (
            <div key={c} className="flex items-start gap-3">
              <X size={16} color={COLORS.error} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "#e4e4e7", lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </div>

        {/* Action buttons - Manus style */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => setBillingView("dashboard")}
            className="px-6 h-10 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#e4e4e7",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          >
            Keep current plan
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "mailto:support@cutsheet.app?subject=Downgrade%20Request&body=Hi%2C%20I%27d%20like%20to%20downgrade%20my%20subscription%20to%20Free.%20My%20email%20is%20" + encodeURIComponent(user?.email ?? "");
            }}
            className="px-6 h-10 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: COLORS.error, 
              color: "white", 
              border: "none", 
              cursor: "pointer" 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.error; }}
          >
            Confirm downgrade
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
      <Helmet>
        <title>Settings — Cutsheet</title>
        <meta name="robots" content="noindex" />
      </Helmet>
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

                {/* Danger zone — Delete account */}
                <div style={{ ...DIVIDER, marginTop: 20, paddingTop: 20 }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.error }}>Delete Account</p>
                      <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                        Permanently delete your account and all data. This cannot be undone.
                      </p>
                    </div>
                    {!deleteConfirmOpen ? (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="px-4 py-2 rounded-lg text-xs font-medium transition-opacity"
                        style={{
                          border: `1px solid ${COLORS.error}30`,
                          color: COLORS.error,
                          background: `${COLORS.error}08`,
                        }}
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setDeleteConfirmOpen(false); setDeleteError(null); }}
                          className="px-3 py-2 rounded-lg text-xs font-medium"
                          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="px-4 py-2 rounded-lg text-xs font-medium transition-opacity"
                          style={{
                            background: COLORS.error,
                            color: "#fff",
                            opacity: deleteLoading ? 0.6 : 1,
                          }}
                        >
                          {deleteLoading ? "Deleting..." : "Confirm Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                  {deleteError && (
                    <p style={{ fontSize: 12, color: COLORS.error, marginTop: 8 }}>{deleteError}</p>
                  )}
                </div>
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
                    <Switch checked={productUpdates} onCheckedChange={(v) => handlePrefChange(setProductUpdates, v)} disabled aria-label="Product updates" />
                  </div>

                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>Weekly digest</p>
                      <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Your usage summary every Monday</p>
                    </div>
                    <Switch checked={weeklyDigest} onCheckedChange={(v) => handlePrefChange(setWeeklyDigest, v)} disabled aria-label="Weekly digest" />
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
