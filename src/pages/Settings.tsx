// Settings.tsx — /settings page with Profile, Billing, Usage tabs

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsageInfo } from "../services/usageService";
import { supabase } from "../lib/supabase";

// ─── INLINE SWITCH ────────────────────────────────────────────────────────────
function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      style={{ background: checked ? "#6366f1" : "rgba(255,255,255,0.1)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

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

type Tab = "profile" | "billing" | "usage";

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

  // TODO: Create /api/create-portal-session Vercel function
  // POST { customerId: stripe_customer_id }
  // Returns { url: portalSessionUrl }
  // Then: window.location.href = url
  const redirectToStripePortal = () => {
    window.open("https://billing.stripe.com", "_blank");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
    { id: "usage", label: "Usage" },
  ];

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
                onClick={() => setTab(t.id)}
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

                {/* Email row */}
                <div className="flex items-center justify-between gap-3">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", flexShrink: 0 }}>
                    Email
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span
                      style={{ fontSize: 14, color: "#a1a1aa", wordBreak: "break-all" }}
                    >
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

                {/* Password row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Password</p>
                    <p style={{ fontSize: 14, color: "#52525b", marginTop: 2 }}>••••••••</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {passwordResetSent ? (
                      <span style={{ fontSize: 12, color: "#10b981" }}>
                        Reset link sent to your email
                      </span>
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
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Preferences</h2>
                <p style={{ fontSize: 12, color: "#71717a", marginTop: 4, marginBottom: 20 }}>
                  Control what reaches your inbox.
                </p>

                {/* Product updates */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
                      Product updates
                    </p>
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      New features and improvements
                    </p>
                  </div>
                  <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
                </div>

                {/* Weekly digest */}
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
                      Weekly digest
                    </p>
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      Your usage summary every Monday
                    </p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>

                {/* Delete account */}
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
                        // TODO: Implement actual account deletion via Supabase
                        className="w-full py-2 rounded-full text-sm font-medium"
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                        }}
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
              key="billing"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="max-w-lg"
            >
              <motion.div style={CARD_STYLE} {...cardAnim(0)}>
                {/* Plan header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPro ? (
                      <>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#818cf8",
                            background: "rgba(99,102,241,0.15)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: 9999,
                            padding: "2px 10px",
                          }}
                        >
                          Pro
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#10b981",
                            background: "rgba(16,185,129,0.1)",
                            borderRadius: 9999,
                            padding: "2px 8px",
                          }}
                        >
                          Active
                        </span>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#71717a",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 9999,
                          padding: "2px 10px",
                        }}
                      >
                        Free
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5" }}>
                    {isPro ? "$29/month" : "$0/month"}
                  </span>
                </div>

                {/* Feature list */}
                <div className="mt-5 flex flex-col gap-3">
                  {isPro ? (
                    [
                      "Unlimited video + static ad analyses",
                      "Claude Sonnet improvements + CTA rewrites",
                      "Pre-Flight A/B testing — unlimited",
                      "Scene-by-scene breakdown + creative briefs",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle size={12} color="#10b981" />
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{f}</span>
                      </div>
                    ))
                  ) : (
                    [
                      "3 analyses per month",
                      "Video + static ad analysis",
                      "Claude Sonnet improvements",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <XCircle size={12} color="#52525b" />
                        <span style={{ fontSize: 13, color: "#71717a" }}>{f}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="my-5" style={DIVIDER} />

                {/* Actions */}
                {isPro ? (
                  <>
                    <p
                      style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}
                    >
                      Manage your subscription
                    </p>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
                      Update payment method, download invoices, or cancel.
                    </p>
                    <div className="flex gap-3">
                      {(["Manage plan", "View invoices"] as const).map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={redirectToStripePortal}
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
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}
                    >
                      Unlock unlimited analyses
                    </p>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
                      $29/month · Cancel anytime
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => navigate("/upgrade")}
                      className="w-full rounded-full text-sm font-semibold"
                      style={{
                        background: "#6366f1",
                        color: "white",
                        height: 48,
                        border: "none",
                        cursor: "pointer",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Upgrade to Pro →
                    </motion.button>
                  </>
                )}
              </motion.div>
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
                /* Pro view */
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
                /* Free view */
                <>
                  <motion.div style={CARD_STYLE} {...cardAnim(0)}>
                    <div className="flex items-start justify-between mb-4">
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>
                        Analyses this month
                      </p>
                      <p style={{ fontSize: 12, color: "#71717a" }}>
                        Resets{" "}
                        {resetDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Big count */}
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
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
                      analyses used
                    </p>

                    {/* Progress bar */}
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

                    {/* Remaining text */}
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

                  {/* Upgrade CTA card */}
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
