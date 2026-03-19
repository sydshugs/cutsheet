// UpgradeModal.tsx — Feature-specific upgrade prompt overlay
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  onClose: () => void;
  featureKey?: string;
  t?: unknown; // backwards compat — unused
}

const UPGRADE_MESSAGES: Record<string, { headline: string; body: string; icon: string }> = {
  visualize: {
    headline: "Your AI Art Director awaits",
    body: "See exactly what your improved ad looks like — before you spend a day redesigning. Upgrade to Pro for 10 Visualize credits/month.",
    icon: "🎨",
  },
  analyze: {
    headline: "You've hit today's analysis limit",
    body: "Upgrade to Pro for unlimited analyses — score as many creatives as you need, any time.",
    icon: "✨",
  },
  script: {
    headline: "Write your next winning ad",
    body: "Generate platform-optimized scripts and score them before you film. Upgrade to Pro for 10 scripts/month.",
    icon: "✍️",
  },
  fixIt: {
    headline: "Fix it before you spend",
    body: "Let AI rewrite your ad to directly address every weakness in the scorecard. Upgrade to Pro for 20 Fix It credits/month.",
    icon: "🛠️",
  },
  deconstruct: {
    headline: "Tear down any winning ad",
    body: "Paste any URL from Meta Ad Library, TikTok Creative Center, or YouTube and get a full teardown. Upgrade to Pro for 20/month.",
    icon: "🔍",
  },
  policyCheck: {
    headline: "Check before you launch",
    body: "Scan your creative against Meta and TikTok policies before you submit. Upgrade to Pro for 30 policy checks/month.",
    icon: "🛡️",
  },
  brief: {
    headline: "Brief your next creative",
    body: "Reverse-engineer a production-ready brief from any high-scoring ad. Upgrade to Pro for 20 briefs/month.",
    icon: "📋",
  },
};

const DEFAULT_MESSAGE = {
  headline: "Unlock the full Cutsheet",
  body: "Upgrade to Pro for unlimited analyses and all premium features.",
  icon: null as string | null,
};

const MINI_COMPARISON = [
  { label: "Unlimited analyses", free: false as boolean | string, pro: true as boolean | string },
  { label: "AI Art Director (Visualize)", free: false, pro: true },
  { label: "Script Generator", free: false, pro: true },
  { label: "Fix It For Me", free: "1/day", pro: "20/month" },
  { label: "Policy Checker", free: "1/day", pro: "30/month" },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === false) return <span style={{ color: "#3f3f46" }}>—</span>;
  if (value === true) return <span style={{ color: "#10b981" }}>✓</span>;
  return <span>{value}</span>;
}

export function UpgradeModal({ onClose, featureKey }: UpgradeModalProps) {
  const navigate = useNavigate();
  const msg = (featureKey && UPGRADE_MESSAGES[featureKey]) ?? DEFAULT_MESSAGE;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
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
          {msg.icon ? (
            <span className="text-3xl">{msg.icon}</span>
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <Sparkles size={22} style={{ color: "#818cf8" }} />
            </div>
          )}
          <h2 className="text-[18px] font-semibold" style={{ color: "#f4f4f5" }}>
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
