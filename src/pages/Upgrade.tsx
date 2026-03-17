import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { redirectToCheckout } from "../lib/stripe";

const FEATURES = [
  "Unlimited video + static ad analyses",
  "Claude Sonnet improvements + CTA rewrites",
  "Pre-Flight A/B testing — unlimited variants",
  "Full scene-by-scene breakdown + creative briefs",
];

export default function Upgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    redirectToCheckout(user.id, user.email || "");
  };

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
        className="relative w-full max-w-[480px] z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          className="rounded-3xl backdrop-blur-xl p-8 flex flex-col items-center gap-6"
          style={{
            background: "rgba(17,17,24,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Badge */}
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
          >
            3 free analyses used
          </span>

          {/* Headline */}
          <div className="text-center">
            <h1
              className="text-[22px] font-semibold"
              style={{ color: "#f4f4f5" }}
            >
              Unlock unlimited analyses
            </h1>
            <p className="text-sm mt-2" style={{ color: "#71717a" }}>
              Score every ad before you spend. No limits, no billing surprises.
            </p>
          </div>

          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span
                className="text-5xl font-bold font-mono"
                style={{ color: "#f4f4f5" }}
              >
                $29
              </span>
              <span className="text-base" style={{ color: "#71717a" }}>
                /month
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "#52525b" }}>
              Cancel anytime
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3 w-full">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <CheckCircle size={14} style={{ color: "#10b981" }} />
                <span className="text-sm" style={{ color: "#a1a1aa" }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Upgrade button */}
          <motion.button
            type="button"
            onClick={handleUpgrade}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full h-[52px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
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
          >
            Upgrade to Pro <ArrowRight size={16} />
          </motion.button>

          {/* Restore access */}
          <p className="text-sm" style={{ color: "#71717a" }}>
            Already Pro?{" "}
            <button
              type="button"
              onClick={() => navigate("/app")}
              className="font-medium hover:underline"
              style={{ color: "#6366f1" }}
            >
              Restore access
            </button>
          </p>
        </div>

        {/* Back to app */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="text-[13px] transition-colors hover:text-zinc-400"
            style={{ color: "#52525b" }}
          >
            ← Back to app
          </button>
        </div>
      </motion.div>
    </div>
  );
}
