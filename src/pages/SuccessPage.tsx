// SuccessPage.tsx — Post–Stripe Checkout success; sets Pro and removes limit
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setPro } from "../utils/usage";

export function SuccessPage() {
  useEffect(() => {
    setPro(true);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#fff",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 24px",
            background: "rgba(0,212,170,0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#fff",
            margin: "0 0 12px 0",
          }}
        >
          You're now on Pro
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
            margin: "0 0 24px 0",
          }}
        >
          Unlimited analyses are now available. Thanks for upgrading.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#FF4444",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          Back to Cutsheet
        </Link>
      </div>
    </div>
  );
}
