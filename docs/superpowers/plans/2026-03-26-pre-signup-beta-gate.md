# Pre-Signup Beta Gate Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the beta code gate to before account creation — users must enter a valid code at `/access` before they can reach `/signup`, and the code is consumed after they successfully authenticate.

**Architecture:** A new public `/access` page validates the code against a lightweight `api/validate-beta-code.ts` endpoint (no auth required) and stores the code in `localStorage`. The `/signup` page redirects to `/access` if the code is missing. Code redemption (marking used + setting `beta_access = true`) happens in `ProtectedRoute` once the user is authenticated — covering both the email-confirmation flow and the Google OAuth flow, since both converge at `/app`. `BetaGate` is kept as a safety net for edge cases.

**Tech Stack:** React 19, react-router-dom v7, Supabase JS, TypeScript, CSS custom properties (design tokens from `src/styles/tokens.css`), Tailwind v4, lucide-react, Vercel serverless functions (`@vercel/node`)

---

## File Map

| File | Action | What it does |
|------|--------|--------------|
| `api/validate-beta-code.ts` | CREATE | Public POST endpoint — checks code is valid + unused, returns `{ valid: boolean }`. No auth, no writes. |
| `src/pages/AccessPage.tsx` | CREATE | `/access` route. Code entry UI, calls validate endpoint, stores code in `localStorage`, redirects to `/signup`. |
| `src/main.tsx` | MODIFY | Add `<Route path="/access" element={<AccessPage />} />` as a public route. |
| `src/pages/Signup.tsx` | MODIFY | On mount: check `localStorage.getItem('pending_beta_code')` — if missing, redirect to `/access`. |
| `src/components/ProtectedRoute.tsx` | MODIFY | On mount (when user is authed + `betaAccess === false`): check `localStorage` for `pending_beta_code`, auto-call redeem, refresh profile. Clears key on success. |
| `src/components/ui/cutsheet-nav.tsx` | MODIFY | Change "Get Early Access" `href` from `#waitlist` to `/access`. |
| `src/components/ui/cutsheet-cta.tsx` | MODIFY | Replace `<EarlyAccessForm>` with a "Enter Access Code →" button linking to `/access`. |
| `src/components/ui/cutsheet-hero.tsx` | MODIFY | Change hero CTA "how it works" anchor button to link to `/access`. |

---

## Chunk 1: Backend — Public Validate Endpoint

### Task 1: Create `api/validate-beta-code.ts`

**Files:**
- Create: `api/validate-beta-code.ts`

- [ ] **Step 1: Create the file**

```typescript
// api/validate-beta-code.ts
// GET-like POST: checks a beta code is valid and unused.
// No auth required. No DB writes. Used by the public /access page.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handlePreflight } from "./_lib/auth";

export const maxDuration = 10;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code } = req.body ?? {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ valid: false, error: "code is required" });
    }

    const normalized = code.toUpperCase().trim().slice(0, 32);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("beta_codes")
      .select("id, used")
      .eq("code", normalized)
      .eq("used", false)
      .single();

    if (error || !data) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error("[validate-beta-code] error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ valid: false, error: "Validation failed. Please try again." });
  }
}
```

- [ ] **Step 2: TypeScript check on the new file**

Run: `npx tsc --noEmit 2>&1 | grep validate-beta-code`
Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add api/validate-beta-code.ts
git commit -m "feat: add public validate-beta-code endpoint (no auth, no writes)"
```

---

## Chunk 2: AccessPage — the new /access route

### Task 2: Create `src/pages/AccessPage.tsx`

The design mirrors `BetaGate.tsx` but is a full page (not a route overlay), uses `useNavigate` to redirect to `/signup` on success, and stores the validated code in `localStorage` as `pending_beta_code`.

**Files:**
- Create: `src/pages/AccessPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep AccessPage`
Expected: no output

- [ ] **Step 3: Verify icon imports are all present**

Run: `grep -n "Shield\|Loader2\|ArrowRight" src/pages/AccessPage.tsx | head`
Expected: all 3 appear in the import line AND in the JSX body

- [ ] **Step 4: Commit**

```bash
git add src/pages/AccessPage.tsx
git commit -m "feat: add AccessPage — pre-signup beta code entry screen"
```

---

## Chunk 3: Routing + Signup Guard

### Task 3: Register `/access` route in `src/main.tsx`

**Files:**
- Modify: `src/main.tsx` (lines 14–17 and the public routes block ~76–92)

- [ ] **Step 1: Add import at top of eager imports block (after line 17)**

Find this block:
```tsx
// ── Critical path (landing + auth) — eagerly loaded ──────────────────────────
import LandingPage from "./pages/LandingPage.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
```

Add `AccessPage` import:
```tsx
// ── Critical path (landing + auth) — eagerly loaded ──────────────────────────
import LandingPage from "./pages/LandingPage.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import AccessPage from "./pages/AccessPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
```

- [ ] **Step 2: Add the route in the public routes block**

Find:
```tsx
{/* Public — eagerly loaded */}
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
```

Change to:
```tsx
{/* Public — eagerly loaded */}
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/access" element={<AccessPage />} />
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "main.tsx"`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat: register /access as public route"
```

---

### Task 4: Guard `/signup` — redirect to `/access` if no pending code

**Files:**
- Modify: `src/pages/Signup.tsx` (lines 93–100, the start of the `Signup` function)

Add an `useEffect` that runs on mount: if `localStorage.getItem('pending_beta_code')` is missing, redirect to `/access`.

- [ ] **Step 1: Add `useEffect` import (it's not yet imported)**

Find:
```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
```

Change to:
```tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
```

- [ ] **Step 2: Add the guard at the top of the `Signup` function body, after the state declarations**

Find the existing state declarations block (around line 95–100):
```tsx
export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
```

Change to:
```tsx
export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Guard: must have passed through /access first
  useEffect(() => {
    if (!localStorage.getItem("pending_beta_code")) {
      navigate("/access", { replace: true });
    }
  }, [navigate]);
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "Signup.tsx"`
Expected: no errors related to the new code (pre-existing `ease: string` errors in Signup.tsx are unrelated)

- [ ] **Step 4: Commit**

```bash
git add src/pages/Signup.tsx
git commit -m "feat: guard /signup — redirect to /access if no pending beta code"
```

---

## Chunk 4: Auto-Redemption in ProtectedRoute

### Task 5: Auto-redeem pending code after authentication

When a user arrives at `/app/*` authenticated but with `betaAccess === false`, check `localStorage` for `pending_beta_code` and auto-call the redeem endpoint. This covers both email-confirmation flow and Google OAuth.

**Files:**
- Modify: `src/components/ProtectedRoute.tsx`

The `BETA_CODE_KEY` constant is defined in `AccessPage.tsx` — import it, or just use the string literal `"pending_beta_code"` inline (simpler, avoids a circular-feeling import from a page file into a component). Use the literal.

- [ ] **Step 1: Add auto-redeem effect to `ProtectedRoute.tsx`**

After the existing `useEffect` (which checks onboarding), add a new effect that auto-redeems the stored code. Add it before the loading spinner return.

Open `src/components/ProtectedRoute.tsx`. After the existing state declarations and before the first `useEffect`, we don't add anything. Instead, we add a second `useEffect` that runs after the checking is done.

Find the existing `useEffect` closing at line ~54 (`}, [user, loading])`).

After that closing brace, add:

```tsx
  // ── Auto-redeem pending beta code ─────────────────────────────────────────
  // When a newly-created user lands here with betaAccess=false but has a
  // valid code stored from /access, redeem it automatically.
  // This covers both email-confirmation redirect and Google OAuth callback.
  useEffect(() => {
    if (!user || betaAccess !== false || checking) return;

    const pendingCode = localStorage.getItem("pending_beta_code");
    if (!pendingCode) return;

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/redeem-beta-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code: pendingCode }),
        });

        if (res.ok) {
          localStorage.removeItem("pending_beta_code");
          // Refresh AuthContext so betaAccess flips to true
          // refreshUserProfile is available via useAuth()
        }
      } catch (err) {
        console.error("[ProtectedRoute] auto-redeem error:", err);
      }
    })();
  }, [user, betaAccess, checking]);
```

**Important:** `refreshUserProfile` is available from `useAuth()` — update the destructure at line 8 to include it:

Find:
```tsx
  const { user, loading, betaAccess } = useAuth()
```

Change to:
```tsx
  const { user, loading, betaAccess, refreshUserProfile } = useAuth()
```

Then update the auto-redeem effect to call it on success:
```tsx
        if (res.ok) {
          localStorage.removeItem("pending_beta_code");
          await refreshUserProfile();
        }
```

- [ ] **Step 2: Full ProtectedRoute.tsx after edits should look like this**

```tsx
import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { BetaGate } from './BetaGate'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, betaAccess, refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [checking, setChecking] = useState(true)
  const verifiedUserIdRef = useRef<string | null>(null)

  // ── Check onboarding status ──────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    if (!user) {
      verifiedUserIdRef.current = null
      setChecking(false)
      return
    }

    // Skip profile re-check if we already verified this user
    // (prevents flash to loading state on Supabase TOKEN_REFRESHED events)
    if (verifiedUserIdRef.current === user.id) {
      setChecking(false)
      return
    }

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('[ProtectedRoute] profiles fetch error:', error.message)
          verifiedUserIdRef.current = user.id
        } else if (!data || !data.onboarding_completed) {
          navigate('/welcome', { replace: true })
        } else {
          verifiedUserIdRef.current = user.id
        }
      } catch (err) {
        console.error('[ProtectedRoute] unexpected error:', err)
        verifiedUserIdRef.current = user.id
      } finally {
        setChecking(false)
      }
    })()
  }, [user, loading])

  // ── Auto-redeem pending beta code ────────────────────────────────────────
  // Fires when a newly-authed user has betaAccess=false and localStorage
  // holds a code validated at /access. Covers email-confirm + Google OAuth.
  useEffect(() => {
    if (!user || betaAccess !== false || checking) return

    const pendingCode = localStorage.getItem('pending_beta_code')
    if (!pendingCode) return

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const res = await fetch('/api/redeem-beta-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code: pendingCode }),
        })

        if (res.ok) {
          localStorage.removeItem('pending_beta_code')
          await refreshUserProfile()
        }
      } catch (err) {
        console.error('[ProtectedRoute] auto-redeem error:', err)
      }
    })()
  }, [user, betaAccess, checking])

  // ── Loading spinner ──────────────────────────────────────────────────────
  if (loading || checking || (user && betaAccess === null)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 24,
          height: 24,
          border: '2px solid rgba(99,102,241,0.3)',
          borderTop: '2px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!user) return <Navigate to="/login" replace />

  // ── Beta gate — fallback for users who somehow bypassed /access ──────────
  // Primary gate is now /access (pre-signup). This catches edge cases.
  if (betaAccess === false && pathname.startsWith('/app')) return <BetaGate />

  // ── Authenticated + beta access granted ─────────────────────────────────
  return <>{children}</>
}
```

- [ ] **Step 3: TypeScript check on ProtectedRoute**

Run: `npx tsc --noEmit 2>&1 | grep "ProtectedRoute"`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/components/ProtectedRoute.tsx
git commit -m "feat: auto-redeem pending beta code in ProtectedRoute after auth"
```

---

## Chunk 5: Landing Page CTAs

### Task 6: Update nav CTA → `/access`

**Files:**
- Modify: `src/components/ui/cutsheet-nav.tsx` (lines 32–33 and 58–65)

The nav currently has `waitlistHref` pointing to `#waitlist` or `/#waitlist`. Change it to `/access`.

- [ ] **Step 1: Edit cutsheet-nav.tsx**

Find:
```tsx
  const location = useLocation();
  const waitlistHref = location.pathname === "/" ? "#waitlist" : "/#waitlist";
```

The `useLocation` import and the `waitlistHref` variable are no longer needed. Replace the `<a>` element with a react-router `<Link>`:

Remove:
```tsx
  const location = useLocation();
  const waitlistHref = location.pathname === "/" ? "#waitlist" : "/#waitlist";
```

And remove the `useLocation` import from the import line:
```tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
```

Change the nav button:
```tsx
        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            to="/access"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
          >
            <span className="hidden md:inline">Enter Access Code</span>
            <span className="md:hidden">Access Code</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "cutsheet-nav"`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/cutsheet-nav.tsx
git commit -m "feat: change nav CTA from waitlist to /access"
```

---

### Task 7: Update CTA section → `/access` button

**Files:**
- Modify: `src/components/ui/cutsheet-cta.tsx`

Replace the `<EarlyAccessForm>` email-collection form with a simple button linking to `/access`.

- [ ] **Step 1: Edit cutsheet-cta.tsx**

Replace the entire file content:

```tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "./fade-in";

const WAITLIST_INITIALS = ["S", "M", "E", "J"];

export default function CutsheetCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-20 sm:py-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop guessing.
            <br />
            Start scaling the right creative.
          </h2>

          <p className="mt-5 text-base text-zinc-400 sm:text-lg">
            Private beta — enter your access code to get started.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-8 flex justify-center">
          <Link
            to="/access"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(99,102,241,0.35)] active:scale-[0.97]"
          >
            Enter Access Code
            <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>

        <FadeIn delay={0.25} className="mt-8 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {WAITLIST_INITIALS.map((initial) => (
              <div
                key={initial}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-400 ring-2 ring-zinc-950"
              >
                {initial}
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-500 ml-2">
            <span className="text-white font-medium">200+</span> marketers already inside
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "cutsheet-cta"`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/cutsheet-cta.tsx
git commit -m "feat: replace waitlist email form in CTA with /access button"
```

---

### Task 8: Update hero CTA → `/access`

**Files:**
- Modify: `src/components/ui/cutsheet-hero.tsx` (around line 164–180)

The hero currently has a "how it works" scroll anchor. The spec says to update the hero CTA. Find the primary CTA button in the hero and update it to link to `/access`.

- [ ] **Step 1: Read the exact CTA block in cutsheet-hero.tsx**

Run: `grep -n "CTA\|href\|button\|Button\|access\|signup\|#how-it" src/components/ui/cutsheet-hero.tsx`

Find the block around line 164–180 with the `#how-it-works` anchor and `WatchDemoButton`.

- [ ] **Step 2: Replace the primary CTA anchor**

Find (approximate, read actual file first):
```tsx
{/* CTA Buttons */}
```
and the `<a href="#how-it-works">` tag.

Replace the `<a href="#how-it-works">` element with a `<Link to="/access">` (import `Link` from react-router-dom at top of file). Keep `WatchDemoButton` as-is.

The button text should become: `"Enter Access Code"` or `"Get Started"` — use `"Enter Access Code"` to be consistent with the nav and CTA section.

**Note:** Read the exact lines before editing. Do not restructure the surrounding layout.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "cutsheet-hero"`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/cutsheet-hero.tsx
git commit -m "feat: update hero CTA to link to /access"
```

---

## Chunk 6: Final Build + Push

### Task 9: Full build verification and push

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -v "Signup.tsx" | grep "error TS" | head -20`
Expected: no output (the `Signup.tsx ease: string` errors are pre-existing and unrelated)

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -10`
Expected: `✓ built in X.XXs` with no errors

- [ ] **Step 3: Icon/import audit on touched files**

```bash
grep -n "Shield\|Loader2\|ArrowRight\|Link\|useNavigate\|useEffect" src/pages/AccessPage.tsx | head -10
grep -n "import" src/pages/AccessPage.tsx
grep -n "import" src/components/ui/cutsheet-nav.tsx
grep -n "import" src/components/ui/cutsheet-cta.tsx
```
Verify every component and icon used in JSX has a corresponding import.

- [ ] **Step 4: Push to staging**

```bash
git push origin staging
```

---

## Flow Summary (for manual testing after deploy)

```
/ (landing) → nav "Enter Access Code" → /access
                                            ↓ valid code
                                        localStorage.setItem('pending_beta_code', code)
                                            ↓
                                        navigate('/signup')
                                            ↓ (if missing → redirects back to /access)
                                        /signup (guarded)
                                            ↓ email signup OR Google OAuth
                                        Supabase creates account
                                            ↓
                                        /app (email: after confirmation link; Google: immediately)
                                            ↓
                                        ProtectedRoute detects betaAccess=false + pending code
                                            ↓
                                        auto-calls /api/redeem-beta-code
                                            ↓ success
                                        localStorage.removeItem('pending_beta_code')
                                        refreshUserProfile() → betaAccess=true
                                            ↓
                                        /app renders normally ✅
```

**Edge case:** existing users with `beta_access=true` are unaffected — `betaAccess !== false` skips the auto-redeem effect entirely.
