import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type PollState = "polling" | "confirmed" | "timeout";

const PRO_PILLS = [
  "Unlimited analyses",
  "🎨 Visualize — AI Art Director",
  "✍️ Script Generator",
  "🛠️ Fix It For Me",
];

const TEAM_PILLS = [
  "3 shared seats",
  "🎨 Visualize — 25/month shared",
  "✍️ Scripts — 25/month shared",
  "🛠️ Fix Its — 50/month shared",
];

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 30_000;

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const [pollState, setPollState] = useState<PollState>("polling");
  const [tier, setTier] = useState<"pro" | "team" | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();

      const status = data?.subscription_status as string | undefined;

      if (status === "pro" || status === "team") {
        if (cancelled) return;
        clearInterval(intervalRef.current!);
        clearTimeout(timeoutRef.current!);
        setTier(status);
        setPollState("confirmed");
        await refreshUserProfile();
      }
    };

    // Kick off immediately, then every POLL_INTERVAL_MS
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      if (cancelled) return;
      clearInterval(intervalRef.current!);
      setPollState((prev) => (prev === "polling" ? "timeout" : prev));
    }, POLL_MAX_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, []);

  const isTeam = tier === "team";
  const headline = isTeam ? "Your team is ready." : "You're now Pro.";
  const subheadline = isTeam
    ? "Invite your teammates and start creating together."
    : "Unlimited analyses, starting now.";
  const pills = isTeam ? TEAM_PILLS : PRO_PILLS;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#09090b" }}
    >
      {/* Ambient glows */}
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(99,102,241,0.12)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(139,92,246,0.08)" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 max-w-[440px] w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* ── POLLING ─────────────────────────────────────── */}
        {pollState === "polling" && (
          <>
            <Loader2
              size={56}
              className="animate-spin"
              style={{ color: "#6366f1" }}
            />
            <h1
              className="text-[22px] font-semibold text-center"
              style={{ color: "#f4f4f5" }}
            >
              Confirming your subscription…
            </h1>
            <p className="text-sm text-center" style={{ color: "#71717a" }}>
              This only takes a moment.
            </p>
          </>
        )}

        {/* ── CONFIRMED ───────────────────────────────────── */}
        {pollState === "confirmed" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <CheckCircle size={64} style={{ color: "#10b981" }} />
            </motion.div>

            <motion.h1
              className="text-[28px] font-semibold text-center"
              style={{ color: "#f4f4f5" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {headline}
            </motion.h1>

            <motion.p
              className="text-[15px] text-center"
              style={{ color: "#71717a" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {subheadline}
            </motion.p>

            <motion.div
              className="grid grid-cols-2 gap-2 w-full max-w-[320px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              {pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-center"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "#818cf8",
                  }}
                >
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.button
              type="button"
              onClick={() => navigate("/app")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-[360px] h-[52px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all mt-2"
              style={{ background: "#6366f1" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(99,102,241,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
                e.currentTarget.style.boxShadow = "none";
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              Start analyzing <ArrowRight size={16} />
            </motion.button>
          </>
        )}

        {/* ── TIMEOUT ─────────────────────────────────────── */}
        {pollState === "timeout" && (
          <>
            <AlertCircle size={56} style={{ color: "#f59e0b" }} />
            <h1
              className="text-[22px] font-semibold text-center"
              style={{ color: "#f4f4f5" }}
            >
              Still processing…
            </h1>
            <p className="text-sm text-center" style={{ color: "#71717a" }}>
              Your payment was received. It may take another minute for your
              account to update. Try refreshing the app in a moment.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[360px]">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full h-[48px] rounded-full font-semibold text-sm flex items-center justify-center gap-2"
                style={{
                  background: "#6366f1",
                  color: "#fff",
                }}
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate("/app")}
                className="w-full h-[44px] rounded-full text-sm"
                style={{ color: "#71717a" }}
              >
                Go to app anyway
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
