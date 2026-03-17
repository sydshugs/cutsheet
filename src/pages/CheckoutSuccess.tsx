import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";

const FEATURE_PILLS = [
  "Unlimited analyses",
  "CTA rewrites",
  "Pre-Flight A/B",
  "Creative briefs",
];

// TODO: Replace with server-side webhook verification
// Stripe webhook → /api/stripe-webhook → update profile
// This client-side update is for MVP only
const updateSubscription = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ subscription_status: "pro" })
    .eq("id", user.id);
};

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    console.log("Stripe session:", sessionId);
    updateSubscription();
  }, []);

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
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <CheckCircle size={64} style={{ color: "#10b981" }} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-[28px] font-semibold text-center"
          style={{ color: "#f4f4f5" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          You're now Pro.
        </motion.h1>

        <motion.p
          className="text-[15px] text-center"
          style={{ color: "#71717a" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          Unlimited analyses, starting now.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="grid grid-cols-2 gap-2 w-full max-w-[300px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          {FEATURE_PILLS.map((pill) => (
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

        {/* CTA */}
        <motion.button
          type="button"
          onClick={() => navigate("/app")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-[360px] h-[52px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all mt-4"
          style={{ background: "#6366f1" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.boxShadow =
              "0 0 24px rgba(99,102,241,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#6366f1";
            e.currentTarget.style.boxShadow = "none";
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
        >
          Start analyzing <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}
