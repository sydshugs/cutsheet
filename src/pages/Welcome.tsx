// Welcome.tsx — Onboarding: intent → niche → platform (adaptive) → completion

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Smartphone, Monitor, BarChart2,
  ShoppingBag, Layers, Video, Users, Package,
  Music2, Camera, Youtube, Search, Globe,
  CheckCircle, ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { sanitizeForAI, sanitizeText } from "../utils/sanitize";

// ─── STEP DATA ──────────────────────────────────────────────────────────────

type Intent = "paid" | "organic" | "display" | "both" | "";

const INTENT_OPTIONS = [
  { label: "Paid ads", sublabel: "Meta, TikTok, Google, YouTube ads", value: "paid" as Intent, icon: Megaphone },
  { label: "Organic content", sublabel: "TikToks, Reels, Shorts, organic posts", value: "organic" as Intent, icon: Smartphone },
  { label: "Display banners", sublabel: "Google Display, affiliate banners", value: "display" as Intent, icon: Monitor },
  { label: "Both paid & organic", sublabel: "I do a mix of everything", value: "both" as Intent, icon: BarChart2 },
];

const NICHE_OPTIONS = [
  { label: "Ecommerce / DTC", sublabel: "Physical products, online stores", value: "Ecommerce / DTC", icon: ShoppingBag },
  { label: "SaaS / Software", sublabel: "Apps, tools, digital products", value: "SaaS", icon: Layers },
  { label: "Creator / Content", sublabel: "UGC, influencer, personal brand", value: "Creator / Content", icon: Video },
  { label: "Agency", sublabel: "Managing ads for clients", value: "Agency", icon: Users },
  { label: "Other", sublabel: "Something else entirely", value: "Other", icon: Package, dimmed: true },
];

const PAID_PLATFORM_OPTIONS = [
  { label: "Meta", sublabel: "Facebook + Instagram", value: "Meta", icon: Camera },
  { label: "TikTok", sublabel: "", value: "TikTok", icon: Music2 },
  { label: "Google", sublabel: "Search + Display + YouTube", value: "Google", icon: Search },
  { label: "Multiple platforms", sublabel: "", value: "All platforms", icon: Globe },
];

const ORGANIC_PLATFORM_OPTIONS = [
  { label: "TikTok", sublabel: "", value: "TikTok", icon: Music2 },
  { label: "Instagram Reels", sublabel: "", value: "Instagram Reels", icon: Camera },
  { label: "YouTube Shorts", sublabel: "", value: "YouTube Shorts", icon: Youtube },
  { label: "Multiple platforms", sublabel: "", value: "All platforms", icon: Globe },
];

// ─── PROGRESS DOTS ──────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="h-2 rounded-full"
          animate={{
            width: i + 1 === step ? 24 : 8,
            backgroundColor: i + 1 <= step ? "#6366f1" : "#27272a",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      ))}
    </div>
  );
}

// ─── OPTION CARD ────────────────────────────────────────────────────────────

function OptionCard({
  label, sublabel, icon: Icon, selected, onClick, index, dimmed,
}: {
  label: string; sublabel?: string; icon: React.ElementType;
  selected: boolean; onClick: () => void; index: number; dimmed?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.06 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center gap-2 rounded-[14px] px-5 py-4 w-[160px] cursor-pointer transition-colors"
      style={{
        background: selected ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
        border: selected ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.06)",
        opacity: dimmed && !selected ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; } }}
      onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; } }}
    >
      {selected && (
        <motion.div className="absolute top-2 right-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
          <CheckCircle size={14} color="#6366f1" />
        </motion.div>
      )}
      <Icon size={20} color={selected ? "#818cf8" : "#71717a"} />
      <span className="text-sm font-medium" style={{ color: selected ? "#f4f4f5" : "#a1a1aa" }}>{label}</span>
      {sublabel && <span style={{ fontSize: 11, color: "#52525b", marginTop: -4, textAlign: "center", lineHeight: 1.3 }}>{sublabel}</span>}
    </motion.button>
  );
}

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ─── MAIN ───────────────────────────────────────────────────────────────────

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<Intent>("");
  const [niche, setNiche] = useState("");
  const [nicheCustom, setNicheCustom] = useState("");
  const [platform, setPlatform] = useState("");
  const [completed, setCompleted] = useState(false);

  // Total steps depends on intent (display skips platform step)
  const totalSteps = intent === "display" ? 2 : 3;

  useEffect(() => { if (!user) navigate("/login"); }, [user]);

  const handleIntentSelect = (value: Intent) => {
    setIntent(value);
    setTimeout(() => setStep(2), 300);
  };

  const handleNicheSelect = (value: string) => {
    setNiche(value);
    if (value === "Other") return; // Don't auto-advance — let them type custom
    if (intent === "display") {
      // Skip platform, go straight to finish
      setPlatform("Google Display");
      setTimeout(() => handleFinish(value, "Google Display"), 300);
    } else {
      setTimeout(() => setStep(3), 300);
    }
  };

  const handlePlatformSelect = (value: string) => {
    setPlatform(value);
  };

  const saveProfile = async (nicheVal: string, platformVal: string) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const rawNiche = nicheVal === "Other" && nicheCustom.trim() ? nicheCustom.trim() : nicheVal;
    // Sanitize before writing to DB — prevents prompt injection if data is later read into AI prompts
    const finalNiche    = sanitizeForAI(rawNiche).slice(0, 100) || "Other";
    const finalPlatform = sanitizeText(platformVal).slice(0, 50);
    const { error } = await supabase.from("profiles").upsert({
      id: u.id,
      niche: finalNiche,
      platform: finalPlatform,
      onboarding_completed: true,
    });
    if (error) console.error("[Welcome] saveProfile failed:", JSON.stringify(error));
  };

  const handleFinish = async (nicheVal?: string, platformVal?: string) => {
    await saveProfile(nicheVal || niche, platformVal || platform);
    setCompleted(true);
    const target = intent === "organic" ? "/app/organic" : intent === "display" ? "/app/display" : "/app/paid";
    setTimeout(() => navigate(target), 2000);
  };

  const handleSkip = async () => {
    await saveProfile(niche, platform);
    navigate("/app/paid");
  };

  // Completion summary text
  const getSummary = () => {
    const n = niche === "Other" && nicheCustom.trim() ? nicheCustom.trim() : niche;
    if (n && platform && platform !== "Google Display") return `Scoring as ${n} on ${platform}`;
    if (n) return `Scoring as ${n}`;
    return "Your recommendations are personalized";
  };

  // Platform options based on intent
  const platformOptions = intent === "organic" ? ORGANIC_PLATFORM_OPTIONS : PAID_PLATFORM_OPTIONS;
  const platformHeading = intent === "organic" ? "Where do you post?" : "Where do you advertise?";
  const platformSubtext = intent === "organic" ? "Hook windows and audience behavior vary by platform" : "We'll optimize suggestions for your primary platform";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#09090b" }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(99,102,241,0.12)" }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(139,92,246,0.08)" }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        <div className="flex items-center gap-2.5">
          <img src="/cutsheet-logo-full.png" alt="Cutsheet" className="w-8 h-8" />
          <span className="text-[15px] font-semibold" style={{ color: "#f4f4f5" }}>Cutsheet</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <ProgressDots step={completed ? totalSteps + 1 : step} total={totalSteps} />
        </div>
        <div className="w-[100px]" />
      </div>

      {/* Promise header */}
      {!completed && (
        <div className="relative z-10 text-center mt-6">
          <p style={{ fontSize: 12, color: "#52525b" }}>
            Quick setup — 10 seconds · <CheckCircle size={10} color="#10b981" style={{ display: "inline", verticalAlign: "middle" }} /> No generic advice
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key={`step-${step}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: step === 1 ? 0.3 : 0.25 }}
              className="flex flex-col items-center gap-8 w-full max-w-[500px]"
            >
              {/* Step 1: Intent */}
              {step === 1 && (
                <>
                  <div className="text-center">
                    <h1 className="text-[28px] font-semibold" style={{ color: "#f4f4f5" }}>What do you want to score?</h1>
                    <p className="text-sm mt-2" style={{ color: "#71717a" }}>This determines how we analyze and what benchmarks we use</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 justify-items-center">
                    {INTENT_OPTIONS.map((opt, i) => (
                      <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel} icon={opt.icon} selected={intent === opt.value} onClick={() => handleIntentSelect(opt.value)} index={i} />
                    ))}
                  </div>
                </>
              )}

              {/* Step 2: Niche */}
              {step === 2 && (
                <>
                  <div className="text-center">
                    <h1 className="text-[28px] font-semibold" style={{ color: "#f4f4f5" }}>What's your niche?</h1>
                    <p className="text-sm mt-2" style={{ color: "#71717a" }}>We use different benchmarks and language for each industry</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
                    {NICHE_OPTIONS.map((opt, i) => (
                      <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel} icon={opt.icon} selected={niche === opt.value} onClick={() => handleNicheSelect(opt.value)} index={i} dimmed={opt.dimmed} />
                    ))}
                  </div>
                  {/* Custom niche input for "Other" */}
                  {niche === "Other" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="w-full max-w-[360px] flex flex-col gap-2">
                      <div style={{ position: "relative" }}>
                        <input
                          type="text" value={nicheCustom}
                          onChange={(e) => setNicheCustom(e.target.value.slice(0, 100))}
                          maxLength={100}
                          placeholder="Tell us what you do (optional)"
                          className="w-full h-10 px-4 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f4f5", paddingRight: 48 }}
                          autoFocus
                        />
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: nicheCustom.length >= 90 ? "#f59e0b" : "#52525b", pointerEvents: "none" }}>
                          {nicheCustom.length}/100
                        </span>
                      </div>
                      <button type="button" onClick={() => { if (intent === "display") { setPlatform("Google Display"); handleFinish("Other", "Google Display"); } else { setStep(3); } }}
                        className="w-full h-10 rounded-full text-sm font-medium" style={{ background: "#6366f1", color: "white", border: "none", cursor: "pointer" }}>
                        Continue <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
                      </button>
                    </motion.div>
                  )}
                </>
              )}

              {/* Step 3: Platform (adaptive) */}
              {step === 3 && (
                <>
                  <div className="text-center">
                    <h1 className="text-[28px] font-semibold" style={{ color: "#f4f4f5" }}>{platformHeading}</h1>
                    <p className="text-sm mt-2" style={{ color: "#71717a" }}>{platformSubtext}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 justify-items-center">
                    {platformOptions.map((opt, i) => (
                      <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel} icon={opt.icon} selected={platform === opt.value} onClick={() => handlePlatformSelect(opt.value)} index={i} />
                    ))}
                  </div>
                  {platform && (
                    <motion.button
                      type="button" onClick={() => handleFinish()}
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="w-full max-w-[360px] h-[52px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2"
                      style={{ background: "#6366f1", cursor: "pointer", border: "none" }}
                    >
                      Let's go <ArrowRight size={16} />
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            /* Completion — show sample scorecard preview as aha moment */
            <motion.div key="complete" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center gap-5 w-full max-w-[420px]">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <CheckCircle size={48} color="#10b981" />
              </motion.div>
              <motion.h2 className="text-[22px] font-semibold" style={{ color: "#f4f4f5" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
                You're ready to score
              </motion.h2>
              <motion.p className="text-sm text-center" style={{ color: "#71717a" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }}>
                {getSummary()}
              </motion.p>

              {/* Sample scorecard preview — shows what they'll get */}
              <motion.div
                className="w-full rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                  <span className="text-[12px] font-medium" style={{ color: "#a1a1aa" }}>Sample Score Preview</span>
                </div>
                <div className="px-4 py-3 grid grid-cols-4 gap-3">
                  {[
                    { label: "Hook", score: 8.5, color: "#10b981" },
                    { label: "Clarity", score: 7.2, color: "#6366f1" },
                    { label: "CTA", score: 6.8, color: "#f59e0b" },
                    { label: "Overall", score: 7.5, color: "#6366f1" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className="flex flex-col items-center gap-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <span className="text-[20px] font-bold" style={{ color: item.color }}>{item.score}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "#52525b" }}>{item.label}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="px-4 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[11px] text-center" style={{ color: "#52525b" }}>
                    Upload your first creative to get your real scores
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip link */}
      {!completed && (
        <div className="relative z-10 flex justify-end px-8 pb-8">
          <button type="button" onClick={handleSkip} className="text-xs transition-colors hover:text-zinc-400" style={{ color: "#52525b", background: "none", border: "none", cursor: "pointer" }}>
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
