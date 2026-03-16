import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

function TravelingBeams() {
  const beamColor = "rgba(99,102,241,0.7)";
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
      {/* Corner glow dots */}
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

      {/* Top beam — left to right */}
      <motion.div
        className="absolute top-0 h-[3px]"
        style={{
          width: "50%",
          background: `linear-gradient(90deg, transparent, ${beamColor}, transparent)`,
        }}
        animate={{ left: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />
      {/* Right beam — top to bottom */}
      <motion.div
        className="absolute right-0 w-[3px]"
        style={{
          height: "50%",
          background: `linear-gradient(180deg, transparent, ${beamColor}, transparent)`,
        }}
        animate={{ top: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.6 }}
      />
      {/* Bottom beam — right to left */}
      <motion.div
        className="absolute bottom-0 h-[3px]"
        style={{
          width: "50%",
          background: `linear-gradient(270deg, transparent, ${beamColor}, transparent)`,
        }}
        animate={{ right: ["-50%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.2 }}
      />
      {/* Left beam — bottom to top */}
      <motion.div
        className="absolute left-0 w-[3px]"
        style={{
          height: "50%",
          background: `linear-gradient(0deg, transparent, ${beamColor}, transparent)`,
        }}
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

const FEATURE_PILLS = [
  "3 free analyses",
  "No credit card",
  "30 seconds",
];

const fieldVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSubmitted(true);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
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
            {/* Heading */}
            <motion.div
              className="text-center"
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5" }}>Create your account</h1>
              <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>Start analyzing ads for free</p>
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

            {/* Password */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
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
            </motion.div>

            {/* Confirm Password */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                  style={{ color: "#71717a" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Error message */}
            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center" }}>
                {error}
              </p>
            )}

            {/* Create Account button */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-[44px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                style={{
                  background: "#6366f1",
                }}
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
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      Create Account <ArrowRight size={16} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Feature pills */}
            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center justify-center gap-2 flex-wrap">
              {FEATURE_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full px-3 py-1 text-[11px] font-medium"
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

            {/* Divider */}
            <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-xs" style={{ color: "#52525b" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </motion.div>

            {/* Google button */}
            <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button
                type="button"
                onClick={handleGoogleSignUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-[44px] rounded-full text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </motion.button>
            </motion.div>

            {/* Bottom link */}
            <motion.p
              custom={8}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="text-center text-sm"
              style={{ color: "#71717a" }}
            >
              Already have an account?{" "}
              <Link to="/login" className="font-medium transition-colors hover:underline" style={{ color: "#6366f1" }}>
                Sign in
              </Link>
            </motion.p>
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
                  We sent a confirmation link to {email}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-[13px] font-medium transition-colors hover:underline"
                  style={{ color: "#6366f1" }}
                >
                  Wrong email?
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
