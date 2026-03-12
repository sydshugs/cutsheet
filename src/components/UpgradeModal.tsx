// UpgradeModal.tsx — Shown after 3rd free analysis
import type { ThemeTokens } from "../theme";

const CHECKOUT_URL = import.meta.env.VITE_STRIPE_CHECKOUT_URL ?? "";

interface UpgradeModalProps {
  onClose: () => void;
  t: ThemeTokens;
}

export function UpgradeModal({ onClose, t }: UpgradeModalProps) {
  const handleUpgrade = () => {
    if (CHECKOUT_URL) {
      window.location.href = CHECKOUT_URL;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay)",
        padding: "24px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "var(--mono)",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: t.text,
            margin: "0 0 12px 0",
          }}
        >
          You've used your 3 free analyses
        </h2>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: "13px",
            color: t.textSecondary,
            lineHeight: 1.6,
            margin: "0 0 24px 0",
          }}
        >
          Upgrade to Pro for unlimited analyses and all features.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleUpgrade}
            disabled={!CHECKOUT_URL}
            style={{
              padding: "12px 16px",
              background: "var(--grad)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: CHECKOUT_URL ? "pointer" : "not-allowed",
            }}
          >
            Upgrade to Pro — $29/mo
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 16px",
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: "var(--radius-sm)",
              color: t.textSecondary,
              fontSize: "12px",
              fontFamily: "var(--mono)",
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
