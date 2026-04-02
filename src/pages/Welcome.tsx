// Welcome.tsx — 6-screen onboarding redesigned to match Figma 235:8781–235:9356
// Steps: intent → niche → platform → brand identity → brand voice → completion

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Smartphone, Monitor, BarChart2,
  ShoppingBag, Layers, Video, Users, Package,
  Music2, Camera, Youtube, Search, Globe,
  ImagePlus, ArrowLeft, CheckCircle, type LucideIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { sanitizeForAI, sanitizeText } from "../utils/sanitize";
import { Helmet } from "react-helmet-async";

// ─── TYPES & DATA ─────────────────────────────────────────────────────────────

type Intent = "paid" | "organic" | "display" | "both" | "";

type Option = { label: string; sublabel: string; value: string; icon: LucideIcon };

const INTENT_OPTIONS: Option[] = [
  { label: "Paid Ads",        sublabel: "Meta, TikTok, Google, YouTube", value: "paid",    icon: Megaphone },
  { label: "Organic Content", sublabel: "TikToks, Reels, Shorts",        value: "organic", icon: Smartphone },
  { label: "Display Banners", sublabel: "Google Display, affiliate",     value: "display", icon: Monitor },
  { label: "Both",            sublabel: "I do a mix of everything",      value: "both",    icon: BarChart2 },
];

const NICHE_OPTIONS: Option[] = [
  { label: "Ecommerce / DTC",   sublabel: "Physical products, online stores",  value: "Ecommerce / DTC",  icon: ShoppingBag },
  { label: "SaaS / Software",   sublabel: "Apps, tools, digital products",     value: "SaaS",             icon: Layers },
  { label: "Creator / Content", sublabel: "UGC, influencer, personal brand",   value: "Creator / Content", icon: Video },
  { label: "Agency",            sublabel: "Managing ads for clients",          value: "Agency",           icon: Users },
];

const PAID_PLATFORM_OPTIONS: Option[] = [
  { label: "Meta",               sublabel: "Facebook + Instagram",       value: "Meta",         icon: Camera },
  { label: "TikTok",             sublabel: "TikTok Ads",                 value: "TikTok",       icon: Music2 },
  { label: "Google",             sublabel: "Search + Display + YouTube", value: "Google",       icon: Search },
  { label: "Multiple platforms", sublabel: "I use a mix",                value: "All platforms", icon: Globe },
];

const ORGANIC_PLATFORM_OPTIONS: Option[] = [
  { label: "TikTok",             sublabel: "",            value: "TikTok",          icon: Music2 },
  { label: "Instagram Reels",    sublabel: "",            value: "Instagram Reels", icon: Camera },
  { label: "YouTube Shorts",     sublabel: "",            value: "YouTube Shorts",  icon: Youtube },
  { label: "Multiple platforms", sublabel: "I use a mix", value: "All platforms",  icon: Globe },
];

const BRAND_VOICE_TAGS = [
  "Playful", "Bold", "Authoritative", "Witty", "Warm", "Direct",
  "Edgy", "Luxurious", "Minimal", "Conversational",
];

const TOTAL_STEPS = 5;

// ─── PROGRESS DOTS ────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <motion.div
          key={i}
          className="h-[9px] rounded-full"
          animate={{
            width: i + 1 === step ? 24 : 9,
            backgroundColor: i + 1 <= step ? "#615fff" : "#27272a",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      ))}
    </div>
  );
}

// ─── LEFT-ALIGNED CARD (steps 1 & 2) ─────────────────────────────────────────

function LeftCard({
  label, sublabel, icon: Icon, selected, onClick, index,
}: {
  label: string; sublabel?: string; icon: LucideIcon;
  selected: boolean; onClick: () => void; index: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: "100%",
        minHeight: 146,
        borderRadius: 17.5,
        padding: "20px 22px 18px",
        background: selected ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
        border: selected ? "1.5px solid #6366f1" : "1.1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        transition: "border-color 150ms, background 150ms",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(99,102,241,0.05)";
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        }
      }}
    >
      {/* Icon box — top-left */}
      <div
        style={{
          width: 39,
          height: 39,
          borderRadius: 26,
          background: selected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "auto",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={selected ? "#818cf8" : "#71717a"} />
      </div>

      {/* Label block — bottom-left */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: selected ? "#f4f4f5" : "#e4e4e7", marginBottom: 3 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: 13, color: "#71717b", lineHeight: 1.5 }}>
            {sublabel}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── CENTERED CARD (step 3 — platform) ────────────────────────────────────────

function CenterCard({
  label, sublabel, icon: Icon, selected, onClick, index,
}: {
  label: string; sublabel?: string; icon: LucideIcon;
  selected: boolean; onClick: () => void; index: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: "100%",
        minHeight: 164,
        borderRadius: 17.5,
        padding: "22px 20px 20px",
        background: selected ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
        border: selected ? "1.5px solid #6366f1" : "1.1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "border-color 150ms, background 150ms",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(99,102,241,0.05)";
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        }
      }}
    >
      {/* Icon box — centered top */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 17.5,
          background: selected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={22} color={selected ? "#818cf8" : "#71717a"} />
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: selected ? "#f4f4f5" : "#e4e4e7", marginBottom: 4 }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 13, color: "#71717b", lineHeight: 1.4 }}>
          {sublabel}
        </div>
      )}
    </motion.button>
  );
}

// ─── CTA BUTTON ───────────────────────────────────────────────────────────────

function CtaButton({ label, onClick, fullWidth = true, small = false }: {
  label: string; onClick: () => void; fullWidth?: boolean; small?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        width: fullWidth ? "100%" : small ? 155 : 227,
        height: small ? 46 : 50,
        borderRadius: 999,
        background: "#6366f1",
        color: "white",
        fontWeight: 600,
        fontSize: small ? 14 : 15,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 0 18px rgba(99,102,241,0.2)",
      }}
    >
      {label}
    </motion.button>
  );
}

// ─── SLIDE VARIANTS ───────────────────────────────────────────────────────────

const forwardVariants = {
  enter:  { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit:   { opacity: 0, x: -40 },
};
const backVariants = {
  enter:  { opacity: 0, x: -40 },
  center: { opacity: 1, x: 0 },
  exit:   { opacity: 0, x: 40 },
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Step 1 — intent
  const [intent, setIntent] = useState<Intent>("");
  // Step 2 — niche
  const [niche, setNiche] = useState("");
  // Step 3 — platform
  const [platform, setPlatform] = useState("");
  // Step 4 — brand identity
  const [brandName, setBrandName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  // Step 5 — brand voice
  const [brandVoiceText, setBrandVoiceText] = useState("");
  const [brandVoiceTags, setBrandVoiceTags] = useState<string[]>([]);
  // Completion
  const [completed, setCompleted] = useState(false);

  useEffect(() => { if (!user) navigate("/login"); }, [user]);

  // ── Navigation helpers ──

  const goForward = (nextStep: number) => {
    setDirection("forward");
    setStep(nextStep);
  };

  const goBack = () => {
    setDirection("back");
    // Display skips step 3 — back from step 4 goes to step 2
    setStep(s => (s === 4 && intent === "display") ? 2 : s - 1);
  };

  // ── Logo file handler ──

  const handleLogoFile = (file: File) => {
    if (file.size > 500 * 1024) return; // 500KB max
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  // ── Brand voice tags toggle (max 4) ──

  const toggleTag = (tag: string) => {
    setBrandVoiceTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      if (prev.length >= 4) return prev;
      return [...prev, tag];
    });
  };

  // ── Save to Supabase ──

  const saveProfile = async (nicheVal: string, platformVal: string) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const finalNiche    = sanitizeForAI(nicheVal).slice(0, 100) || "Other";
    const finalPlatform = sanitizeText(platformVal).slice(0, 50);
    const voiceParts: string[] = [];
    if (brandVoiceText.trim()) voiceParts.push(brandVoiceText.trim());
    if (brandVoiceTags.length > 0) voiceParts.push(brandVoiceTags.join(", "));
    const { error } = await supabase.from("profiles").upsert({
      id: u.id,
      niche: finalNiche,
      platform: finalPlatform,
      brand_name: sanitizeText(brandName).slice(0, 100) || null,
      brand_voice: sanitizeForAI(voiceParts.join(" | ")).slice(0, 500) || null,
      onboarding_completed: true,
    });
    if (error) console.error("[Welcome] saveProfile failed:", JSON.stringify(error));
  };

  const handleFinish = async () => {
    await saveProfile(niche || "Other", platform || "All platforms");
    setCompleted(true);
  };

  const handleSkip = async () => {
    await saveProfile(niche || "Other", platform || "All platforms");
    navigate("/app/paid");
  };

  // ── Derived values ──

  const getNavigateTarget = () => {
    if (intent === "organic") return "/app/organic";
    if (intent === "display") return "/app/display";
    return "/app/paid";
  };

  const platformOptions = intent === "organic" ? ORGANIC_PLATFORM_OPTIONS : PAID_PLATFORM_OPTIONS;
  const platformHeading = intent === "organic" ? "Where do you post?" : "Where do you advertise?";
  const platformSubtext = intent === "organic"
    ? "Hook windows and audience behavior vary by platform."
    : "We'll optimize suggestions for your primary platform.";

  const getSummaryPills = (): string[] => {
    const pills: string[] = [];
    if (niche) {
      const short: Record<string, string> = {
        "Ecommerce / DTC": "ecom", "SaaS": "saas",
        "Creator / Content": "creator", "Agency": "agency",
      };
      pills.push(short[niche] ?? niche.toLowerCase().slice(0, 8));
    }
    if (platform && platform !== "All platforms") pills.push(platform.toLowerCase());
    if (intent && intent !== "both") pills.push(intent);
    return pills.slice(0, 3);
  };

  const variants = direction === "forward" ? forwardVariants : backVariants;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "#09090b", fontFamily: "'Geist', sans-serif" }}
    >
      <Helmet>
        <title>Welcome — Cutsheet</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(99,102,241,0.09)" }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(139,92,246,0.06)" }} />

      {/* ── Top bar (hidden on completion) ── */}
      {!completed && (
        <div className="relative z-10 flex items-center justify-between px-8 pt-8 shrink-0">
          {/* Left: cutsheet logo on step 1, back arrow on steps 2–5 */}
          {step === 1 ? (
            <span style={{ fontSize: 22, fontFamily: "'TBJ Interval', sans-serif", color: "white" }}>
              cutsheet
            </span>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70 active:opacity-50"
              style={{ color: "#71717b", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, padding: 0 }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}

          {/* Center: 5 progress dots */}
          <ProgressDots step={step} />

          {/* Right: Skip */}
          <button
            type="button"
            onClick={handleSkip}
            className="transition-colors hover:text-zinc-300"
            style={{ color: "#71717b", background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 500 }}
          >
            Skip
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">

          {!completed ? (
            <motion.div
              key={`step-${step}`}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full flex flex-col gap-6"
              style={{ maxWidth: 490 }}
            >

              {/* ── STEP 1: What do you create? ── */}
              {step === 1 && (
                <>
                  <div>
                    <h1 style={{ fontSize: 31, fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: 0.4, lineHeight: 1.25 }}>
                      What do you create?
                    </h1>
                    <p style={{ fontSize: 15, color: "#71717b", marginTop: 8 }}>
                      We'll tailor everything to your workflow.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {INTENT_OPTIONS.map((opt, i) => (
                      <LeftCard
                        key={opt.value}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        icon={opt.icon}
                        selected={intent === opt.value}
                        onClick={() => setIntent(opt.value)}
                        index={i}
                      />
                    ))}
                  </div>
                  {intent && <CtaButton label="Continue →" onClick={() => goForward(2)} />}
                </>
              )}

              {/* ── STEP 2: What's your niche? ── */}
              {step === 2 && (
                <>
                  <div>
                    <h1 style={{ fontSize: 31, fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: 0.4, lineHeight: 1.25 }}>
                      What's your niche?
                    </h1>
                    <p style={{ fontSize: 15, color: "#71717b", marginTop: 8 }}>
                      Hook windows and benchmarks vary by industry.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      {NICHE_OPTIONS.map((opt, i) => (
                        <LeftCard
                          key={opt.value}
                          label={opt.label}
                          sublabel={opt.sublabel}
                          icon={opt.icon}
                          selected={niche === opt.value}
                          onClick={() => setNiche(opt.value)}
                          index={i}
                        />
                      ))}
                    </div>
                    {/* "Other" — full-width horizontal row */}
                    <motion.button
                      type="button"
                      onClick={() => setNiche("Other")}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: 0.22 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: "100%",
                        borderRadius: 17.5,
                        padding: "18px 22px",
                        background: niche === "Other" ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                        border: niche === "Other" ? "1.5px solid #6366f1" : "1.1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 13,
                        opacity: niche === "Other" ? 1 : 0.8,
                        transition: "border-color 150ms, background 150ms, opacity 150ms",
                      }}
                    >
                      <div style={{ width: 39, height: 39, borderRadius: 26, background: niche === "Other" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Package size={20} color={niche === "Other" ? "#818cf8" : "#71717a"} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: niche === "Other" ? "#f4f4f5" : "#e4e4e7" }}>
                        Other
                      </span>
                    </motion.button>
                  </div>
                  {niche && (
                    <CtaButton
                      label="Continue →"
                      onClick={() => {
                        if (intent === "display") {
                          setPlatform("Google Display");
                          goForward(4);
                        } else {
                          goForward(3);
                        }
                      }}
                    />
                  )}
                </>
              )}

              {/* ── STEP 3: Where do you advertise/post? ── */}
              {step === 3 && (
                <>
                  <div>
                    <h1 style={{ fontSize: 31, fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: 0.4, lineHeight: 1.25 }}>
                      {platformHeading}
                    </h1>
                    <p style={{ fontSize: 15, color: "#71717b", marginTop: 8 }}>
                      {platformSubtext}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {platformOptions.map((opt, i) => (
                      <CenterCard
                        key={opt.value}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        icon={opt.icon}
                        selected={platform === opt.value}
                        onClick={() => setPlatform(opt.value)}
                        index={i}
                      />
                    ))}
                  </div>
                  {platform && <CtaButton label="Continue →" onClick={() => goForward(4)} />}
                </>
              )}

              {/* ── STEP 4: Add your brand identity ── */}
              {step === 4 && (
                <>
                  <div>
                    <h1 style={{ fontSize: 31, fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: 0.4, lineHeight: 1.25 }}>
                      Add your brand identity
                    </h1>
                    <p style={{ fontSize: 15, color: "#71717b", marginTop: 8 }}>
                      Used in your in-situ mockups and AI rewrites. Always optional.
                    </p>
                  </div>

                  {/* Logo upload dropzone */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFile(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "100%",
                      borderRadius: 17.5,
                      padding: "32px 20px",
                      background: "rgba(255,255,255,0.02)",
                      border: "2px dashed rgba(255,255,255,0.10)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      transition: "border-color 150ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 10 }} />
                    ) : (
                      <ImagePlus size={26} color="#71717b" />
                    )}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "#9f9fa9" }}>
                        {logoPreview ? "Tap to change logo" : "Upload your logo"}
                      </div>
                      {!logoPreview && (
                        <div style={{ fontSize: 13, color: "#52525c", marginTop: 3 }}>
                          PNG, SVG, WEBP · Square or circular · 500KB max
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Brand name input */}
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value.slice(0, 100))}
                    placeholder="Brand name (optional)"
                    maxLength={100}
                    style={{
                      width: "100%",
                      height: 50,
                      borderRadius: 999,
                      padding: "0 18px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1.1px solid rgba(255,255,255,0.06)",
                      color: "#f4f4f5",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'Geist', sans-serif",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  />

                  {/* Continue + skip */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <CtaButton label="Continue →" onClick={() => goForward(5)} fullWidth={false} small />
                    <button
                      type="button"
                      onClick={() => goForward(5)}
                      style={{ color: "#52525c", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                    >
                      Skip for now
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 5: What's your brand voice? ── */}
              {step === 5 && (
                <>
                  <div>
                    <h1 style={{ fontSize: 31, fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: 0.4, lineHeight: 1.25 }}>
                      What's your brand voice?
                    </h1>
                    <p style={{ fontSize: 15, color: "#71717b", marginTop: 8 }}>
                      AI rewrites and copy suggestions will match your tone.
                    </p>
                  </div>

                  {/* Textarea */}
                  <div style={{ position: "relative" }}>
                    <textarea
                      value={brandVoiceText}
                      onChange={(e) => setBrandVoiceText(e.target.value.slice(0, 300))}
                      placeholder="Describe your brand voice — e.g. 'Direct and confident, like a knowledgeable friend. Never corporate. Always specific.'"
                      maxLength={300}
                      rows={5}
                      style={{
                        width: "100%",
                        borderRadius: 26,
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1.1px solid rgba(255,255,255,0.06)",
                        color: "#f4f4f5",
                        fontSize: 15,
                        outline: "none",
                        resize: "none",
                        lineHeight: 1.6,
                        boxSizing: "border-box",
                        fontFamily: "'Geist', sans-serif",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                    />
                    <span style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, color: "#52525c", pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}>
                      {300 - brandVoiceText.length}
                    </span>
                  </div>

                  {/* Tag chips */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#52525c", textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 10 }}>
                      Select up to 4
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {BRAND_VOICE_TAGS.map(tag => {
                        const on = brandVoiceTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={{
                              borderRadius: 999,
                              padding: "7px 16px",
                              fontSize: 13,
                              fontWeight: on ? 500 : 400,
                              color: on ? "#f4f4f5" : "#71717b",
                              background: on ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                              border: on ? "1.1px solid rgba(99,102,241,0.4)" : "1.1px solid rgba(255,255,255,0.06)",
                              cursor: "pointer",
                              transition: "all 150ms",
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Finish Setup + skip */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <motion.button
                      type="button"
                      onClick={() => void handleFinish()}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: "100%",
                        height: 50,
                        borderRadius: 999,
                        background: "#6366f1",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 15,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 0 20px rgba(99,102,241,0.25)",
                      }}
                    >
                      Finish Setup →
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => void handleFinish()}
                      style={{ color: "#52525c", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                    >
                      Skip for now
                    </button>
                  </div>
                </>
              )}
            </motion.div>

          ) : (
            /* ── COMPLETION SCREEN ── */
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 490, width: "100%" }}
            >
              {/* Icon circle */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "rgba(97,95,255,0.10)",
                  border: "1px solid rgba(97,95,255,0.20)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                }}
              >
                <CheckCircle size={44} color="#6366f1" />
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.28 }}
                style={{ fontSize: 35, fontWeight: 700, color: "#f4f4f5", margin: "0 0 12px", textAlign: "center", letterSpacing: 0.4 }}
              >
                You're all set.
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.28 }}
                style={{ fontSize: 17, color: "#71717b", textAlign: "center", margin: "0 0 24px", lineHeight: 1.55, maxWidth: 280 }}
              >
                Cutsheet is ready for your first creative.
              </motion.p>

              {/* Summary pills */}
              {getSummaryPills().length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32, duration: 0.28 }}
                  style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap", justifyContent: "center" }}
                >
                  {getSummaryPills().map(pill => (
                    <span
                      key={pill}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1.1px solid rgba(255,255,255,0.06)",
                        borderRadius: 999,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#9f9fa9",
                        textTransform: "capitalize",
                      }}
                    >
                      {pill}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Start Analyzing button */}
              <motion.button
                type="button"
                onClick={() => navigate(getNavigateTarget())}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.28 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: 227,
                  height: 60,
                  borderRadius: 999,
                  background: "#6366f1",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 0 28px rgba(99,102,241,0.35)",
                }}
              >
                Start Analyzing →
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
