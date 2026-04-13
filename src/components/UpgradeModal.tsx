// UpgradeModal.tsx — Feature-specific upgrade prompt overlay
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Check } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface UpgradeModalProps {
  onClose: () => void;
  featureKey?: string;
  t?: unknown; // backwards compat — unused
}

const UPGRADE_MESSAGES: Record<string, { headline: string; body: string }> = {
  visualize: {
    headline: "Your AI Art Director awaits",
    body: "See exactly what your improved ad looks like before you redesign. Upgrade to Pro for Visualize credits every month.",
  },
  animate: {
    headline: "Bring your display ads to life",
    body: "Convert static banners to production-ready HTML5 animations. Upgrade to Pro for Animate credits every month.",
  },
  motionPreview: {
    headline: "Preview motion concepts",
    body: "See AI-generated motion concepts for your static creatives before committing to video production. Upgrade to Pro for Motion Preview credits every month.",
  },
  analyze: {
    headline: "You've used your free analyses",
    body: "Upgrade to Pro for unlimited analyses — score as many creatives as you need, any time.",
  },
  fixIt: {
    headline: "Fix it before you spend",
    body: "Let AI rewrite your ad to directly address every weakness in the scorecard. Included with Pro.",
  },
  deconstruct: {
    headline: "Tear down any winning ad",
    body: "Paste any URL from Meta Ad Library, TikTok Creative Center, or YouTube and get a full teardown. Included with Pro.",
  },
  policyCheck: {
    headline: "Check before you launch",
    body: "Scan your creative against platform ad policies before you submit. Included with Pro.",
  },
  brief: {
    headline: "Brief your next creative",
    body: "Reverse-engineer a production-ready brief from any high-scoring ad. Included with Pro.",
  },
  script: {
    headline: "Write your next winning ad",
    body: "Generate platform-optimized scripts and score them before you film. Included with Pro.",
  },
  safeZone: {
    headline: "Check your safe zones",
    body: "Verify your creative fits within platform-safe areas for text and UI overlays. Included with Pro.",
  },
};

const DEFAULT_MESSAGE = {
  headline: "Unlock the full Cutsheet",
  body: "Upgrade to Pro for unlimited analyses and all premium features.",
  icon: null as string | null,
};

const MINI_COMPARISON = [
  { label: "Analyses", free: "3/month" as boolean | string, pro: "Unlimited" as boolean | string },
  { label: "AI Rewrite", free: false as boolean | string, pro: true as boolean | string },
  { label: "Visualize", free: false, pro: "Credits" },
  { label: "Animate to HTML5", free: false, pro: "Credits" },
  { label: "Policy Check", free: false, pro: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === false) return <span style={{ color: "#3f3f46" }}>—</span>;
  if (value === true) return <Check size={14} style={{ color: "#10b981" }} />;
  return <span>{value}</span>;
}

export function UpgradeModal({ onClose, featureKey }: UpgradeModalProps) {
  const navigate = useNavigate();
  const msg = (featureKey ? UPGRADE_MESSAGES[featureKey] : undefined) ?? DEFAULT_MESSAGE;
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="relative rounded-3xl p-8 max-w-[460px] w-full flex flex-col gap-5"
        style={{
          background: "#111118",
          border: "1px solid rgba(99,102,241,0.25)",
          boxShadow: "0 0 40px rgba(99,102,241,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors hover:text-zinc-300"
          style={{ color: "#52525b" }}
        >
          <X size={18} />
        </button>

        {/* Icon + headline */}
        <div className="flex flex-col items-center gap-3 text-center pt-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <Sparkles size={22} style={{ color: "#818cf8" }} />
          </div>
          <h2 id="upgrade-modal-title" className="text-[18px] font-semibold" style={{ color: "#f4f4f5" }}>
            {msg.headline}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#71717a" }}>
            {msg.body}
          </p>
        </div>

        {/* Mini Free vs Pro comparison */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="grid grid-cols-3 text-[11px] font-medium px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              color: "#52525b",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center" style={{ color: "#818cf8" }}>Pro</span>
          </div>
          {MINI_COMPARISON.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 text-[12px] px-3 py-2"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.04)",
                color: "#71717a",
              }}
            >
              <span style={{ color: "#a1a1aa" }}>{row.label}</span>
              <span className="text-center text-xs">
                <CellValue value={row.free} />
              </span>
              <span className="text-center text-xs">
                <CellValue value={row.pro} />
              </span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => navigate("/upgrade")}
          className="w-full h-[48px] rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
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
          Upgrade to Pro — $29/month
        </button>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate("/upgrade")}
            className="text-[12px] hover:underline"
            style={{ color: "#6366f1" }}
          >
            See all plans
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] transition-colors hover:text-zinc-400"
            style={{ color: "#52525b" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
