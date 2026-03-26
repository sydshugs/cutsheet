// src/components/BetaGate.tsx
// Hard gate shown when user is authenticated but beta_access = false.
// No dismiss, no skip — user must enter a valid code to proceed.

import { useState, useCallback } from "react";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

export function BetaGate() {
  const { refreshUserProfile } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Session expired — please refresh the page.");
        return;
      }

      const res = await fetch("/api/redeem-beta-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Show success flash, then pull fresh profile so ProtectedRoute
      // sees betaAccess = true and renders the app route
      setSuccess(true);
      setTimeout(() => refreshUserProfile(), 800);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [code, refreshUserProfile]);

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
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)" }}>
          Beta Access Required
        </h1>
        <p style={{ margin: "0 0 1.75rem", fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.55 }}>
          Cutsheet is in private beta. Enter your access code to continue.
        </p>

        {/* Success state */}
        {success ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.875rem 1rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--ink)", fontWeight: 500 }}>
              Access granted — loading your workspace…
            </span>
          </div>
        ) : (
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

            {/* Error message */}
            {error && (
              <p style={{ margin: "0 0 0.875rem", fontSize: "0.75rem", color: "var(--error)", lineHeight: 1.4 }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{
                marginTop: error ? 0 : "0.875rem",
                padding: "0.625rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#fff",
                background: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loading && !e.currentTarget.disabled)
                  e.currentTarget.style.background = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                "Unlock Access"
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p style={{ margin: "1.5rem 0 0", fontSize: "0.6875rem", color: "var(--ink-faint)", textAlign: "center", lineHeight: 1.5 }}>
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
