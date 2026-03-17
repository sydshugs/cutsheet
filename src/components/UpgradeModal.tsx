// UpgradeModal.tsx — Overlay modal when free user hits analysis limit
import { useNavigate } from "react-router-dom";
import { Lock, X } from "lucide-react";

interface UpgradeModalProps {
  onClose: () => void;
  t?: unknown; // kept for backwards compat
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative rounded-3xl p-8 max-w-[440px] w-full flex flex-col items-center gap-5"
        style={{
          background: "#111118",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors hover:text-zinc-300"
          style={{ color: "#52525b" }}
        >
          <X size={18} />
        </button>

        {/* Lock icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Lock size={24} style={{ color: "#71717a" }} />
        </div>

        {/* Text */}
        <h2
          className="text-lg font-semibold text-center"
          style={{ color: "#f4f4f5" }}
        >
          You've used your 3 free analyses
        </h2>
        <p className="text-sm text-center" style={{ color: "#71717a" }}>
          Upgrade to Pro for unlimited analyses — $29/month
        </p>

        {/* Upgrade button */}
        <button
          type="button"
          onClick={() => navigate("/upgrade")}
          className="w-full h-[48px] rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
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
          Upgrade to Pro →
        </button>

        {/* Maybe later */}
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] transition-colors hover:text-zinc-400"
          style={{ color: "#52525b" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
