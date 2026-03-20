// Settings.tsx — /settings page with Profile, Billing, Usage tabs

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsageInfo } from "../services/usageService";
import { supabase } from "../lib/supabase";
import { Switch } from "../components/ui/Switch";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  background: "rgba(17,17,24,0.6)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 24,
  backdropFilter: "blur(24px)",
};

const DIVIDER: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.06)",
};

const cardAnim = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as number[], delay },
});

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

type Tab = "profile" | "billing" | "usage";
type BillingView = "dashboard" | "manage" | "downgrade-reason" | "downgrade-confirm" | "downgraded";

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [productUpdates, setProductUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Usage + billing state
  const [usage, setUsage] = useState<{ used: number; limit: number; isPro: boolean } | null>(null);

  // Billing flow state
  const [billingView, setBillingView] = useState<BillingView>("dashboard");
  const [downgradeReason, setDowngradeReason] = useState<string | null>(null);

  useEffect(() => {
    getUsageInfo().then(setUsage).catch(() => {});
  }, []);

  const isPro = usage?.isPro ?? false;
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
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setPasswordResetSent(true);
    } catch {
      // silent fail — user can retry
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
    { id: "usage", label: "Usage" },
  ];

  // ─── BILLING VIEWS ──────────────────────────────────────────────────────────

  const BillingDashboard = () => (
    <motion.div className="max-w-lg flex flex-col gap-4" {...cardAnim(0)}>
      {/* Plan card */}
      <div style={CARD_STYLE}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5" }}>
                {isPro ? "Cutsheet Pro" : "Free Plan"}
              </h2>
              {isPro && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#10b981",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 9999,
                    padding: "2px 8px",
                  }}
                >
                  Active
                </span>
              )}
            </div>
            {isPro && (
              <p style={{ fontSize: 12, color: "#71717a" }}>
                Renewal date{" "}
                <span style={{ color: "#a1a1aa" }}>
                  {renewalDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5" }}>
            {isPro ? "$29" : "$0"}
            <span style={{ fontSize: 13, color: "#71717a", fontWeight: 400 }}>/month</span>
          </span>
        </div>

        <div style={DIVIDER} />

        {/* Credits / analyses display */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, color: "#a1a1aa" }}>
                {isPro ? "Analyses" : "Monthly analyses"}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
              {isPro ? "∞" : `${analysesUsed} / ${analysesTotal}`}
            </span>
          </div>

          {isPro && (
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#a1a1aa" }}>CTA rewrites</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5", fontFamily: "var(--mono)" }}>∞</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, color: "#a1a1aa" }}>Creative briefs</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5", fontFamily: "var(--mono)" }}>
              {isPro ? "∞" : "—"}
            </span>
          </div>
        </div>

        <div className="mt-5" style={DIVIDER} />

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          {isPro ? (
            <>
              <button
                type="button"
                onClick={() => setBillingView("manage")}
                className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Manage plan
              </button>
              <button
                type="button"
                onClick={() => window.open("https://billing.stripe.com", "_blank")}
                className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#a1a1aa",
                  background: "transparent",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                  e.currentTarget.style.color = "#818cf8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#a1a1aa";
                }}
              >
                View invoices
              </button>
            </>
          ) : (
            <motion.button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="w-full py-3 rounded-full text-sm font-semibold"
              style={{ background: "#6366f1", color: "white", height: 48, border: "none", cursor: "pointer" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Upgrade to Pro →
            </motion.button>
          )}
        </div>
      </div>

      {/* Features included */}
      <div style={CARD_STYLE}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#71717a", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {isPro ? "Everything included" : "Free plan includes"}
        </p>
        <div className="flex flex-col gap-3">
          {isPro
            ? [
                "Unlimited video + static ad analyses",
                "Claude Sonnet improvements + CTA rewrites",
                "Pre-Flight A/B testing — unlimited",
                "Scene-by-scene breakdown + creative briefs",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle size={13} color="#10b981" />
                  <span style={{ fontSize: 13, color: "#a1a1aa" }}>{f}</span>
                </div>
              ))
            : [
                "3 analyses per month",
                "Video + static ad analysis",
                "Basic scorecard",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle size={13} color="#52525b" />
                  <span style={{ fontSize: 13, color: "#71717a" }}>{f}</span>
                </div>
              ))}
        </div>
      </div>
    </motion.div>
  );

  const ManageSubscription = () => (
    <motion.div
      className="max-w-lg"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => setBillingView("dashboard")}
        className="flex items-center gap-1.5 mb-5 transition-colors"
        style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
          Manage your subscription
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 20 }}>
          Update billing details or cancel your plan.
        </p>

        <div style={DIVIDER} />

        <div className="mt-5 flex flex-col gap-3">
          {/* Update payment */}
          <button
            type="button"
            // TODO: /api/create-portal-session → redirect to Stripe portal
            onClick={() => window.open("https://billing.stripe.com", "_blank")}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            }}
          >
            <span style={{ fontSize: 14, color: "#f4f4f5" }}>Update payment method</span>
            <span style={{ fontSize: 12, color: "#52525b" }}>→</span>
          </button>

          {/* View invoices */}
          <button
            type="button"
            onClick={() => window.open("https://billing.stripe.com", "_blank")}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            }}
          >
            <span style={{ fontSize: 14, color: "#f4f4f5" }}>View invoices</span>
            <span style={{ fontSize: 12, color: "#52525b" }}>→</span>
          </button>
        </div>

        {/* Downgrade to free */}
        <div className="mt-6 pt-4" style={DIVIDER}>
          <button
            type="button"
            onClick={() => setBillingView("downgrade-reason")}
            style={{
              fontSize: 13,
              color: "#71717a",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
          >
            Downgrade to Free
          </button>
        </div>
      </div>
    </motion.div>
  );

  const DowngradeReason = () => (
    <motion.div
      className="max-w-lg"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={() => setBillingView("manage")}
        className="flex items-center gap-1.5 mb-5 transition-colors"
        style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
          Why are you downgrading?
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 20 }}>
          Your feedback helps us improve Cutsheet.
        </p>

        <div className="flex flex-col gap-2">
          {DOWNGRADE_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setDowngradeReason(reason)}
              className="flex items-center gap-3 py-3 px-4 rounded-xl text-left transition-all w-full"
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
                    ? "2px solid #6366f1"
                    : "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {downgradeReason === reason && (
                  <span
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: "#6366f1", display: "block" }}
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
            className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a1a1aa",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Keep current plan
          </button>
          <button
            type="button"
            onClick={() => downgradeReason && setBillingView("downgrade-confirm")}
            className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: downgradeReason ? "#ef4444" : "rgba(239,68,68,0.3)",
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
      className="max-w-lg"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={() => setBillingView("downgrade-reason")}
        className="flex items-center gap-1.5 mb-5 transition-colors"
        style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
          Continue downgrading to Free?
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 20 }}>
          Changes take effect at the end of your current billing cycle.
        </p>

        {/* Consequences list */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 4 }}>
            If you downgrade, the following will change:
          </p>
          {DOWNGRADE_CONSEQUENCES.map((c) => (
            <div key={c} className="flex items-start gap-3">
              <X size={13} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#a1a1aa" }}>{c}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setBillingView("dashboard")}
            className="flex-1 py-2.5 rounded-full text-sm font-medium"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a1a1aa",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Keep current plan
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: POST /api/cancel-subscription { subscriptionId }
              // Then update profiles.subscription_status = 'free'
              setBillingView("downgraded");
            }}
            className="flex-1 py-2.5 rounded-full text-sm font-medium"
            style={{ background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}
          >
            Confirm downgrade
          </button>
        </div>
      </div>
    </motion.div>
  );

  const Downgraded = () => (
    <motion.div
      className="max-w-lg"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        style={{ ...CARD_STYLE, textAlign: "center", padding: 40 }}
        className="flex flex-col items-center gap-4"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <CheckCircle size={24} color="#10b981" />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5", marginBottom: 6 }}>
            Downgrade scheduled
          </p>
          <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>
            Your plan will switch to Free at the end of your billing cycle. You'll keep Pro access until then.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBillingView("dashboard")}
          className="mt-2 px-6 py-2.5 rounded-full text-sm font-medium"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a1a1aa",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Back to billing
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#09090b" }}>
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{ background: "rgba(99,102,241,0.1)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{ background: "rgba(139,92,246,0.08)" }}
      />

      <motion.div
        className="relative max-w-3xl mx-auto px-4 py-8 sm:px-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "#a1a1aa" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f4f4f5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f4f4f5" }}>Settings</h1>
        </div>

        {/* ── TAB NAV ── */}
        <div
          className="flex gap-0 mb-8"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
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
                className="relative px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#f4f4f5" : "#71717a",
                  background: active ? "rgba(99,102,241,0.1)" : "transparent",
                  borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#a1a1aa";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#71717a";
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Account card */}
              <motion.div style={CARD_STYLE} {...cardAnim(0)}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Account</h2>
                <p style={{ fontSize: 12, color: "#71717a", marginTop: 4, marginBottom: 20 }}>
                  Manage your email and password.
                </p>

                <div className="flex items-center justify-between gap-3">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", flexShrink: 0 }}>
                    Email
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span style={{ fontSize: 14, color: "#a1a1aa", wordBreak: "break-all" }}>
                      {user?.email ?? "—"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#10b981",
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: 9999,
                        padding: "2px 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Verified
                    </span>
                  </div>
                </div>

                <div className="my-4" style={DIVIDER} />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Password</p>
                    <p style={{ fontSize: 14, color: "#52525b", marginTop: 2 }}>••••••••</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {passwordResetSent ? (
                      <span style={{ fontSize: 12, color: "#10b981" }}>Reset link sent</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={passwordResetLoading}
                        className="px-3 py-1.5 rounded-full transition-all"
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#a1a1aa",
                          background: "transparent",
                          fontSize: 13,
                          cursor: passwordResetLoading ? "default" : "pointer",
                          whiteSpace: "nowrap",
                          opacity: passwordResetLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!passwordResetLoading) {
                            e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                            e.currentTarget.style.color = "#818cf8";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                          e.currentTarget.style.color = "#a1a1aa";
                        }}
                      >
                        {passwordResetLoading ? "Sending..." : "Change password"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Preferences card */}
              <motion.div style={CARD_STYLE} {...cardAnim(0.08)}>
                <div className="flex items-center justify-between">
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Preferences</h2>
                  <span style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.04)", borderRadius: 9999, padding: "2px 8px" }}>
                    Coming soon
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4, marginBottom: 20 }}>
                  Email preferences are not yet available.
                </p>

                <div className="flex items-center justify-between mb-5 opacity-40 pointer-events-none">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Product updates</p>
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      New features and improvements
                    </p>
                  </div>
                  <Switch checked={productUpdates} onCheckedChange={setProductUpdates} disabled />
                </div>

                <div className="flex items-center justify-between opacity-40 pointer-events-none">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Weekly digest</p>
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      Your usage summary every Monday
                    </p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} disabled />
                </div>

                <div className="mt-6 pt-4" style={DIVIDER}>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        fontSize: 13,
                        color: "#ef4444",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                      }}
                    >
                      Delete account
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p style={{ fontSize: 13, color: "#a1a1aa" }}>
                        This will permanently delete your account and all data.
                      </p>
                      <button
                        type="button"
                        // TODO: Implement account deletion via Supabase
                        className="w-full py-2 rounded-full text-sm font-medium"
                        style={{ background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}
                      >
                        Yes, delete my account
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{
                          fontSize: 13,
                          color: "#71717a",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                          padding: 0,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
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
              className="max-w-lg flex flex-col gap-4"
            >
              {isPro ? (
                <motion.div
                  style={{
                    ...CARD_STYLE,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 16,
                  }}
                  {...cardAnim(0)}
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <CheckCircle size={32} color="#10b981" />
                  </motion.div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5" }}>
                      Unlimited analyses
                    </p>
                    <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                      You're on Pro — no limits.
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#818cf8",
                      background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 9999,
                      padding: "3px 12px",
                    }}
                  >
                    Pro
                  </span>
                  <div className="w-full pt-4" style={{ ...DIVIDER, textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#52525b",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Total analyses run
                    </p>
                    {/* TODO: SELECT count(*) FROM analyses WHERE user_id = current_user */}
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#f4f4f5",
                        fontFamily: "var(--mono)",
                        marginTop: 4,
                      }}
                    >
                      —
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  <motion.div style={CARD_STYLE} {...cardAnim(0)}>
                    <div className="flex items-start justify-between mb-4">
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>
                        Analyses this month
                      </p>
                      <p style={{ fontSize: 12, color: "#71717a" }}>
                        Resets{" "}
                        {resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-1">
                      <span
                        style={{
                          fontSize: 48,
                          fontWeight: 700,
                          color: "#f4f4f5",
                          fontFamily: "var(--mono)",
                          lineHeight: 1,
                        }}
                      >
                        {analysesUsed}
                      </span>
                      <span style={{ fontSize: 20, color: "#71717a" }}>/</span>
                      <span style={{ fontSize: 20, color: "#71717a" }}>{analysesTotal}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>analyses used</p>

                    <div
                      className="w-full rounded-full overflow-hidden"
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
                      className="mt-3"
                      style={{
                        fontSize: 13,
                        color:
                          remaining <= 0 ? "#ef4444" : remaining === 1 ? "#f59e0b" : "#71717a",
                      }}
                    >
                      {remaining <= 0
                        ? "You've used all your free analyses this month"
                        : remaining === 1
                        ? "1 analysis remaining this month"
                        : `${remaining} analyses remaining`}
                    </p>
                  </motion.div>

                  <motion.div
                    className="rounded-2xl p-5"
                    style={{
                      background: "rgba(99,102,241,0.06)",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                    {...cardAnim(0.08)}
                  >
                    <p
                      style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}
                    >
                      Get unlimited analyses
                    </p>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
                      $29/month — cancel anytime
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => navigate("/upgrade")}
                      className="w-full py-3 rounded-full text-sm font-semibold"
                      style={{
                        background: "#6366f1",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Upgrade to Pro →
                    </motion.button>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
