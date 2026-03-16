import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from "lucide-react";

// TODO: Validate token from URL params with Clerk/Supabase
// If token is invalid or expired, show error state

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

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0;
  let bars = 1;
  if (password.length >= 8) bars = 2;
  if (password.length >= 8 && (/\d/.test(password) || /[^a-zA-Z0-9]/.test(password))) bars = 3;
  if (password.length >= 12 && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) bars = 4;
  return bars;
}

function StrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (strength === 0) return null;

  const color = strength <= 2 ? "#ef4444" : strength === 3 ? "#f59e0b" : "#10b981";
  const label = strength <= 2 ? "Weak" : strength === 3 ? "Medium" : "Strong";

  return (
    <motion.div
      className="flex flex-col gap-1.5 mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className="flex-1 rounded-sm"
            style={{
              height: 3,
              borderRadius: 2,
              background: bar <= strength ? color : "#1e1e2e",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, color }}>{label}</span>
    </motion.div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const _token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const showMismatch = touched && confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) return;
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
                    <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5" }}>Set new password</h1>
                    <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                      Must be at least 8 characters.
                    </p>
                  </motion.div>

                  {/* New password */}
                  <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full h-[44px] rounded-[10px] pl-10 pr-11 text-sm outline-none transition-all"
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
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                        style={{ color: "#71717a" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <StrengthIndicator password={password} />
                  </motion.div>

                  {/* Confirm password */}
                  <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setTouched(true);
                        }}
                        required
                        className="w-full h-[44px] rounded-[10px] pl-10 pr-11 text-sm outline-none transition-all"
                        style={{
                          background: showMismatch ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${showMismatch ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                          color: "#f4f4f5",
                        }}
                        onFocus={(e) => {
                          if (!showMismatch) {
                            e.target.style.borderColor = "rgba(99,102,241,0.5)";
                            e.target.style.background = "rgba(99,102,241,0.06)";
                          }
                        }}
                        onBlur={(e) => {
                          if (!showMismatch) {
                            e.target.style.borderColor = "rgba(255,255,255,0.08)";
                            e.target.style.background = "rgba(255,255,255,0.04)";
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                        style={{ color: "#71717a" }}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {showMismatch && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}
                      >
                        Passwords don't match
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Submit button */}
                  <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                    <motion.button
                      type="submit"
                      disabled={isLoading || showMismatch}
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
                            Reset Password
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
                    Password updated!
                  </h2>
                  <p style={{ fontSize: 13, color: "#71717a", textAlign: "center" }}>
                    Your password has been reset successfully.
                  </p>
                  <motion.button
                    type="button"
                    onClick={() => navigate("/login")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-[44px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
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
                    Sign in with new password <ArrowRight size={16} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
