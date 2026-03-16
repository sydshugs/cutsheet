import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

// TODO: Replace with real password reset API call

function TravelingBeams() {
  const beamColor = "rgba(99,102,241,0.7)";
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
      {[
        { top: -3, left: -3 },
        { top: -3, right: -3 },
        { bottom: -3, left: -3 },
        { bottom: -3, right: -3 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-[6px] h-[6px] rounded-full z-10"
          style={{ ...pos, background: "rgba(99,102,241,0.4)", boxShadow: "0 0 8px rgba(99,102,241,0.3)" }}
        />
      ))}

      <motion.div
        className="absolute top-0 h-[3px]"
        style={{ width: "50%", background: `linear-gradient(90deg, transparent, ${beamColor}, transparent)` }}
        animate={{ left: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute right-0 w-[3px]"
        style={{ height: "50%", background: `linear-gradient(180deg, transparent, ${beamColor}, transparent)` }}
        animate={{ top: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.6 }}
      />
      <motion.div
        className="absolute bottom-0 h-[3px]"
        style={{ width: "50%", background: `linear-gradient(270deg, transparent, ${beamColor}, transparent)` }}
        animate={{ right: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.2 }}
      />
      <motion.div
        className="absolute left-0 w-[3px]"
        style={{ height: "50%", background: `linear-gradient(0deg, transparent, ${beamColor}, transparent)` }}
        animate={{ bottom: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.8 }}
      />
    </div>
  );
}

function CutsheetLogo() {
  return (
    <div className="flex justify-center">
      <img src="/cutsheet-logo-full.png" alt="Cutsheet" className="w-14 h-14" />
    </div>
  );
}

const fieldVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Replace with real password reset API call
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#09090b" }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(99,102,241,0.12)" }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(139,92,246,0.08)" }} />

      <motion.div
        className="relative w-full max-w-[400px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          className="relative rounded-3xl backdrop-blur-xl p-8"
          style={{
            background: "rgba(17,17,24,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <TravelingBeams />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Logo */}
            <CutsheetLogo />

            {/* Back arrow */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#f4f4f5] w-fit"
              style={{ color: "#71717a" }}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Title */}
                  <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                    <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5" }}>Forgot password?</h1>
                    <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                      Enter your email and we'll send you a reset link.
                    </p>
                  </motion.div>

                  {/* Email */}
                  <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-[44px] rounded-[10px] pl-10 pr-4 text-sm outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#f4f4f5",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "rgba(99,102,241,0.5)";
                          e.target.style.background = "rgba(99,102,241,0.06)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(255,255,255,0.08)";
                          e.target.style.background = "rgba(255,255,255,0.04)";
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Submit button */}
                  <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full h-[44px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                      style={{ background: "#6366f1" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#4f46e5";
                        e.currentTarget.style.boxShadow = "0 0 24px rgba(99,102,241,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#6366f1";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.span key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 size={18} className="animate-spin" />
                          </motion.span>
                        ) : (
                          <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            Send Reset Link
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  className="flex flex-col items-center gap-4 py-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <CheckCircle size={24} style={{ color: "#10b981" }} />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", textAlign: "center" }}>
                    Check your email
                  </h2>
                  <p style={{ fontSize: 13, color: "#71717a", textAlign: "center" }}>
                    We sent a reset link to {email}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-[13px] font-medium transition-colors hover:underline"
                    style={{ color: "#6366f1" }}
                  >
                    Back to sign in
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
