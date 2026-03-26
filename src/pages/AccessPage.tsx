// src/pages/AccessPage.tsx
// Public /access route — users enter their beta code before reaching /signup.
// On valid code: stores in localStorage + redirects to /signup.
// On invalid: shows inline error.

import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Shield, Loader2, ArrowRight } from "lucide-react";

export const BETA_CODE_KEY = "pending_beta_code";

export default function AccessPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/validate-beta-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });

        const data = await res.json() as { valid?: boolean; error?: string };

        if (!res.ok || !data.valid) {
          setError("Invalid or already used code. Try another.");
          return;
        }

        // Code is valid — store it and send user to sign up
        localStorage.setItem(BETA_CODE_KEY, trimmed);
        navigate("/signup");
      } catch {
        setError("Network error — check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [code, navigate]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <Helmet>
        <title>Enter Access Code — Cutsheet</title>
        <link rel="canonical" href="https://cutsheet.xyz/access" />
      </Helmet>

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <img src="/cutsheet-logo-full.png" alt="Cutsheet" style={{ width: 48, height: 48 }} />
        </div>

        {/* Icon tile */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius)",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <Shield size={22} style={{ color: "var(--accent)" }} />
        </div>

        {/* Heading */}
        <h1
          style={{
            margin: "0 0 0.375rem",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1.2,
          }}
        >
          You're on the list.
        </h1>
        <p
          style={{
            margin: "0 0 1.75rem",
            fontSize: "0.8125rem",
            color: "var(--ink-muted)",
            lineHeight: 1.55,
          }}
        >
          Enter your beta access code to create your account.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Label */}
          <label
            htmlFor="beta-code"
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--ink-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Beta Code
          </label>

          {/* Input */}
          <input
            id="beta-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="CUTSHEET-XXXX"
            autoComplete="off"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            disabled={loading}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.625rem 0.875rem",
              fontSize: "0.9375rem",
              fontFamily: "var(--mono)",
              color: "var(--ink)",
              background: "var(--surface-el)",
              border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              outline: "none",
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
            }}
            onFocus={(e) => {
              if (!error) e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              if (!error) e.currentTarget.style.borderColor = "var(--border)";
            }}
          />

          {/* Error */}
          {error && (
            <p
              style={{
                margin: "0 0 0.875rem",
                fontSize: "0.75rem",
                color: "var(--error)",
                lineHeight: 1.4,
              }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              marginTop: error ? 0 : "0.875rem",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
              background: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              opacity: loading || !code.trim() ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading && code.trim())
                e.currentTarget.style.background = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent)";
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Checking…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            margin: "1.5rem 0 0",
            fontSize: "0.6875rem",
            color: "var(--ink-faint)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--ink-muted)", textDecoration: "underline" }}
          >
            Sign in
          </Link>
          {" · "}
          Don't have a code?{" "}
          <a
            href="mailto:hello@cutsheet.xyz"
            style={{ color: "var(--ink-muted)", textDecoration: "underline" }}
          >
            Request access
          </a>
        </p>
      </div>
    </div>
  );
}
