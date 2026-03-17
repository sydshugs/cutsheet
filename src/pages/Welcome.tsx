import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Layers, Store, Video, Users, MoreHorizontal,
  Music2, LayoutGrid, Camera, Youtube, Search, Globe,
  Rocket, TrendingUp, PenTool, BarChart2, Briefcase,
  CheckCircle, ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ─── STEP DATA ───────────────────────────────────────────────────────────────

const NICHE_OPTIONS = [
  { label: "DTC Brand", value: "dtc_brand", icon: ShoppingBag },
  { label: "SaaS", value: "saas", icon: Layers },
  { label: "Ecommerce", value: "ecommerce", icon: Store },
  { label: "Creator / UGC", value: "creator_ugc", icon: Video },
  { label: "Agency", value: "agency", icon: Users },
  { label: "Other", value: "other", icon: MoreHorizontal },
];

const PLATFORM_OPTIONS = [
  { label: "TikTok", value: "tiktok", icon: Music2 },
  { label: "Meta", value: "meta", icon: LayoutGrid },
  { label: "Instagram", value: "instagram", icon: Camera },
  { label: "YouTube", value: "youtube", icon: Youtube },
  { label: "Google", value: "google", icon: Search },
  { label: "All platforms", value: "all", icon: Globe },
];

const ROLE_OPTIONS = [
  { label: "Founder / Operator", value: "founder", icon: Rocket },
  { label: "Performance Marketer", value: "performance_marketer", icon: TrendingUp },
  { label: "Designer", value: "designer", icon: PenTool },
  { label: "Media Buyer", value: "media_buyer", icon: BarChart2 },
  { label: "UGC Creator", value: "ugc_creator", icon: Video },
  { label: "Agency / Freelancer", value: "agency_freelancer", icon: Briefcase },
];

const STEPS = [
  {
    question: "What are you working on?",
    subtext: "We'll tailor your scoring benchmarks to your niche.",
    options: NICHE_OPTIONS,
  },
  {
    question: "Where do you run ads?",
    subtext: "We'll benchmark your scores against your platform.",
    options: PLATFORM_OPTIONS,
  },
  {
    question: "What's your role?",
    subtext: "We'll focus your insights on what matters most.",
    options: ROLE_OPTIONS,
  },
];

// ─── PROGRESS DOTS ───────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i + 1 <= step;
        return (
          <motion.div
            key={i}
            className="h-2 rounded-full"
            animate={{
              width: i + 1 === step ? 24 : 8,
              backgroundColor: isActive ? "#6366f1" : "#27272a",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        );
      })}
    </div>
  );
}

// ─── OPTION CARD ─────────────────────────────────────────────────────────────

function OptionCard({
  label,
  icon: Icon,
  selected,
  onClick,
  index,
}: {
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.06 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center gap-2.5 rounded-[14px] px-5 py-4 w-[160px] cursor-pointer transition-colors"
      style={{
        background: selected ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
        border: selected
          ? "1px solid #6366f1"
          : "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(99,102,241,0.06)";
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        }
      }}
    >
      {selected && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <CheckCircle size={14} style={{ color: "#6366f1" }} />
        </motion.div>
      )}
      <Icon size={20} style={{ color: selected ? "#818cf8" : "#71717a" }} />
      <span
        className="text-sm font-medium"
        style={{ color: selected ? "#f4f4f5" : "#a1a1aa" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ─── STEP CONTENT ────────────────────────────────────────────────────────────

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [completed, setCompleted] = useState(false);

  // Redirect to login if no user
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user]);

  const handleSelect = (stepNum: number, value: string) => {
    if (stepNum === 1) {
      setSelectedNiche(value);
      setTimeout(() => setStep(2), 300);
    } else if (stepNum === 2) {
      setSelectedPlatform(value);
      setTimeout(() => setStep(3), 300);
    } else if (stepNum === 3) {
      setSelectedRole(value);
    }
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        niche: selectedNiche,
        platform: selectedPlatform,
        role: selectedRole,
        onboarding_completed: true,
      });
  };

  const handleFinish = () => {
    // Fire and forget
    saveProfile();
    setCompleted(true);
    setTimeout(() => navigate("/app"), 1500);
  };

  const currentStepData = STEPS[step - 1];
  const currentSelection =
    step === 1 ? selectedNiche : step === 2 ? selectedPlatform : selectedRole;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
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

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src="/cutsheet-logo-full.png" alt="Cutsheet" className="w-8 h-8" />
          <span className="text-[15px] font-semibold" style={{ color: "#f4f4f5" }}>
            Cutsheet
          </span>
        </div>

        {/* Progress dots */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <ProgressDots step={completed ? 4 : step} total={3} />
        </div>

        {/* Spacer for layout balance */}
        <div className="w-[100px]" />
      </div>

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
              className="flex flex-col items-center gap-10 w-full max-w-[500px]"
            >
              {/* Question */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h1
                  className="text-[28px] font-semibold"
                  style={{ color: "#f4f4f5" }}
                >
                  {currentStepData.question}
                </h1>
                <p
                  className="text-sm mt-2"
                  style={{ color: "#71717a" }}
                >
                  {currentStepData.subtext}
                </p>
              </motion.div>

              {/* Option grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
                {currentStepData.options.map((opt, i) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    selected={currentSelection === opt.value}
                    onClick={() => handleSelect(step, opt.value)}
                    index={i}
                  />
                ))}
              </div>

              {/* "Let's go" button — only on step 3 after selection */}
              {step === 3 && selectedRole && (
                <motion.button
                  type="button"
                  onClick={handleFinish}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full max-w-[360px] h-[52px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
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
                  Let's go <ArrowRight size={16} />
                </motion.button>
              )}
            </motion.div>
          ) : (
            /* Completion state */
            <motion.div
              key="complete"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <CheckCircle size={48} style={{ color: "#10b981" }} />
              </motion.div>
              <motion.h2
                className="text-[22px] font-semibold"
                style={{ color: "#f4f4f5" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                You're all set.
              </motion.h2>
              <motion.p
                className="text-sm"
                style={{ color: "#71717a" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                Taking you to Cutsheet...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom — Skip link */}
      {!completed && (
        <div className="relative z-10 flex justify-end px-8 pb-8">
          <button
            type="button"
            onClick={() => {
              // Save partial profile and skip
              saveProfile();
              navigate("/app");
            }}
            className="text-xs transition-colors hover:text-zinc-400"
            style={{ color: "#52525b" }}
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
