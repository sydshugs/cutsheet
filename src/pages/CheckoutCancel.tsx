import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowRight } from "lucide-react";

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
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
        className="relative z-10 flex flex-col items-center gap-6 max-w-[400px] w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <XCircle size={48} style={{ color: "#71717a" }} />
        </motion.div>

        {/* Text */}
        <h1
          className="text-2xl font-semibold text-center"
          style={{ color: "#f4f4f5" }}
        >
          No worries.
        </h1>
        <p className="text-[15px] text-center" style={{ color: "#71717a" }}>
          You still have access to 3 free analyses per month.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <motion.button
            type="button"
            onClick={() => navigate("/upgrade")}
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
            Try Pro again <ArrowRight size={16} />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate("/app")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full h-[52px] rounded-full text-white font-medium text-[15px] flex items-center justify-center transition-all"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Back to app
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
