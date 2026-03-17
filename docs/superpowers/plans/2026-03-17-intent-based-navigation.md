# Intent-Based Navigation — Complete App Restructure

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Cutsheet with URL-based routing under `/app/*`, a collapsible branded sidebar, and two new analyzer pages (PaidAdAnalyzer, OrganicAnalyzer) using exact brand tokens.

**Architecture:** `AppLayout.tsx` is the React Router layout element for all `/app/*` routes. It owns `useUsage`, `useHistory`, `useSwipeFile`, `mobileOpen`, `showUpgradeModal`. Shared state flows to child routes via React Router `useOutletContext<AppSharedContext>()`. TopBar callbacks (`onNewAnalysis`, `onHistoryOpen`) are stored as refs in AppLayout and overwritten by each page on mount. `Sidebar.tsx` is fully replaced: URL-based active state via `NavLink`/`useLocation`, collapsible (220px ↔ 64px), 3 labeled sections, mobile bottom tab bar.

**Tech Stack:** React 18, React Router 6 (nested layout routes + `useOutletContext`), Tailwind CSS, Lucide React, Framer Motion (existing), TypeScript 5, Vite

**State ownership confirmed:**
- `AppLayout` → `useUsage()`, `useHistory()`, `useSwipeFile()`, `mobileOpen`, `showUpgradeModal`
- `PaidAdAnalyzer` → `file`, `status`, `result`, `platform`, `format`, `brief`, `ctaRewrites`, `share`, `historyOpen`, `loadedEntry`
- `OrganicAnalyzer` → same as Paid + `secondEye`, `secondEyeOutput`
- No duplication of localStorage hooks — all hooks are localStorage-backed and instantiated once in AppLayout

---

## File Map

**Create:**
- `src/components/AppLayout.tsx` — layout shell, shared state, outlet context
- `src/components/UsageIndicator.tsx` — usage bar for sidebar bottom (does not exist yet)
- `src/components/ComingSoon.tsx` — reusable coming-soon placeholder
- `src/pages/app/PaidAdAnalyzer.tsx` — /app/paid, owns all analyzer + platform/format state
- `src/pages/app/OrganicAnalyzer.tsx` — /app/organic, owns analyzer + secondEye state
- `src/pages/app/ABTestPage.tsx` — thin wrapper for existing PreFlightView
- `src/pages/app/BatchPage.tsx` — thin wrapper for existing BatchView
- `src/pages/app/SwipeFilePage.tsx` — thin wrapper for existing SwipeFileView
- `HANDOFF.md` — designer handoff doc

**Modify:**
- `src/services/analyzerService.ts` — add `contextPrefix?: string` param to `analyzeVideo`
- `src/hooks/useVideoAnalyzer.ts` — add `contextPrefix` passthrough to `analyze()`
- `src/services/claudeService.ts` — append `generateSecondEyeReview` export
- `src/components/Sidebar.tsx` — full replacement (URL-based, brand tokens, collapse, mobile bar)
- `src/main.tsx` — nested layout route under `/app`, remove old `<App/>` import
- `src/index.css` — remove `.main-content` margin-left hack (AppLayout uses flexbox)

**Delete:**
- `src/App.tsx` — replaced by AppLayout.tsx; keeping it causes TS errors (imports old SidebarMode)

---

## Chunk 1: Service / Hook Layer

### Task 1: Add `contextPrefix` to `analyzeVideo`

**Files:**
- Modify: `src/services/analyzerService.ts`

- [ ] **Step 1.1: Read the current analyzeVideo signature**

```bash
grep -n "export async function analyzeVideo" /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon/src/services/analyzerService.ts
```

- [ ] **Step 1.2: Add optional param and apply to prompt construction**

Find the function signature (around line 100+). Add `contextPrefix?: string` as the 4th param after `onStatusChange`.

Find where `const prompt = isImage ? staticPrefix + ANALYSIS_PROMPT : ANALYSIS_PROMPT` is constructed. Change it to:

```ts
const basePrompt = isImage ? staticPrefix + ANALYSIS_PROMPT : ANALYSIS_PROMPT;
const prompt = contextPrefix ? `${contextPrefix}\n\n${basePrompt}` : basePrompt;
```

- [ ] **Step 1.3: Verify build**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1 | grep -c "error TS"
```
Expected: `0`

---

### Task 2: Add `contextPrefix` to `useVideoAnalyzer`

**Files:**
- Modify: `src/hooks/useVideoAnalyzer.ts`

- [ ] **Step 2.1: Update interface and callback**

Change the `analyze` signature in `UseVideoAnalyzerReturn`:
```ts
analyze: (file: File, apiKey: string, contextPrefix?: string) => Promise<void>;
```

Change the `useCallback` body:
```ts
const analyze = useCallback(async (file: File, apiKey: string, contextPrefix?: string) => {
  setError(null);
  setResult(null);
  try {
    const analysis = await analyzeVideo(file, apiKey, (s, msg) => {
      setStatus(s);
      setStatusMessage(msg ?? "");
    }, contextPrefix);
    setResult(analysis);
  } catch (err) {
    setStatus("error");
    setError(err instanceof Error ? err.message : "Unknown error");
  }
}, []);
```

- [ ] **Step 2.2: Verify build — 0 TS errors**

---

### Task 3: Add `generateSecondEyeReview` to claudeService

**Files:**
- Modify: `src/services/claudeService.ts` (append)

- [ ] **Step 3.1: Append at end of file**

```ts
// ─── SECOND EYE REVIEW ───────────────────────────────────────────────────────

export async function generateSecondEyeReview(
  analysisMarkdown: string,
  fileName: string
): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are a first-time viewer watching organic social content. You have never seen this video. You scroll fast, your attention span is short, and you are brutally honest about when you would stop watching and why. Provide specific, timestamped feedback — not vague observations.`,
    messages: [
      {
        role: "user",
        content: `Based on this analysis of "${fileName}", act as a first-time viewer. List timestamped moments where a new viewer would stop watching and why.

Format: **[Timestamp]** — [What happens] → [Why a viewer stops here]

Be specific. Be brutal. Focus on the first 30 seconds. 3–6 moments maximum.

Analysis:
${analysisMarkdown}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) throw new Error("Claude returned empty Second Eye review");
  return text;
}
```

- [ ] **Step 3.2: Verify build — 0 TS errors**

- [ ] **Step 3.3: Commit chunk 1**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add src/services/analyzerService.ts src/hooks/useVideoAnalyzer.ts src/services/claudeService.ts
git commit -m "feat: contextPrefix on analyzeVideo/useVideoAnalyzer, add generateSecondEyeReview"
```

---

## Chunk 2: AppLayout + Routing

### Task 4: Create `UsageIndicator.tsx`

**Files:**
- Create: `src/components/UsageIndicator.tsx`

- [ ] **Step 4.1: Write the file**

```tsx
// UsageIndicator.tsx — shows free usage in sidebar bottom

interface UsageIndicatorProps {
  usageCount: number;
  FREE_LIMIT: number;
  isPro: boolean;
  collapsed?: boolean;
}

export function UsageIndicator({
  usageCount,
  FREE_LIMIT,
  isPro,
  collapsed = false,
}: UsageIndicatorProps) {
  if (isPro) return null;

  const pct = Math.min((usageCount / FREE_LIMIT) * 100, 100);
  const remaining = Math.max(FREE_LIMIT - usageCount, 0);
  const barColor = pct >= 100 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#6366f1";

  if (collapsed) {
    return (
      <div className="flex items-center justify-center" style={{ width: 40, height: 40, margin: "0 auto" }}>
        <div
          style={{ width: 8, height: 8, borderRadius: "50%", background: barColor }}
          title={`${remaining} analyses remaining`}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "0 8px 4px",
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#71717a" }}>Free plan</span>
        <span style={{ fontSize: 11, color: "#52525b" }}>{remaining} left</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{ height: 3, borderRadius: 2, width: `${pct}%`, background: barColor, transition: "width 300ms" }}
        />
      </div>
      <p style={{ fontSize: 10, color: "#52525b", marginTop: 5 }}>
        {usageCount}/{FREE_LIMIT} analyses used
      </p>
    </div>
  );
}
```

---

### Task 5: Create `AppLayout.tsx`

**Files:**
- Create: `src/components/AppLayout.tsx`

- [ ] **Step 5.1: Write the file**

```tsx
// AppLayout.tsx — layout shell for all /app/* routes
import { useRef, useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { UpgradeModal } from "./UpgradeModal";
import { useUsage } from "../hooks/useUsage";
import { useHistory, type HistoryEntry } from "../hooks/useHistory";
import { useSwipeFile, type SwipeItem } from "../hooks/useSwipeFile";
import { useAuth } from "../context/AuthContext";
import { themes } from "../theme";

// ─── OUTLET CONTEXT TYPE ─────────────────────────────────────────────────────

export interface AppSharedContext {
  historyEntries: HistoryEntry[];
  addHistoryEntry: (entry: Omit<HistoryEntry, "id">) => void;
  deleteHistoryEntry: (id: string) => void;
  clearAllHistory: () => void;
  addSwipeItem: (item: Omit<SwipeItem, "id">) => void;
  canAnalyze: boolean;
  isPro: boolean;
  increment: () => number;
  FREE_LIMIT: number;
  usageCount: number;
  onUpgradeRequired: () => void;
  registerCallbacks: (
    cbs: { onNewAnalysis?: () => void; onHistoryOpen?: () => void } | null
  ) => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { usageCount, isPro, canAnalyze, increment, FREE_LIMIT } = useUsage();
  const { entries: historyEntries, addEntry: addHistoryEntry, deleteEntry: deleteHistoryEntry, clearAll: clearAllHistory } = useHistory();
  const { addItem: addSwipeItem } = useSwipeFile();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // TopBar delegates to whichever page is currently mounted
  const onNewAnalysisRef = useRef<() => void>(() => navigate("/app/paid"));
  const onHistoryOpenRef = useRef<() => void>(() => {});

  const registerCallbacks = useCallback(
    (cbs: { onNewAnalysis?: () => void; onHistoryOpen?: () => void } | null) => {
      if (!cbs) {
        onNewAnalysisRef.current = () => navigate("/app/paid");
        onHistoryOpenRef.current = () => {};
        return;
      }
      if (cbs.onNewAnalysis) onNewAnalysisRef.current = cbs.onNewAnalysis;
      if (cbs.onHistoryOpen) onHistoryOpenRef.current = cbs.onHistoryOpen;
    },
    [navigate]
  );

  const ctx: AppSharedContext = {
    historyEntries,
    addHistoryEntry,
    deleteHistoryEntry,
    clearAllHistory,
    addSwipeItem,
    canAnalyze,
    isPro,
    increment,
    FREE_LIMIT,
    usageCount,
    onUpgradeRequired: () => setShowUpgradeModal(true),
    registerCallbacks,
  };

  const userEmail = user?.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#09090b" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userEmail={userEmail}
        isPro={isPro}
        usageCount={usageCount}
        FREE_LIMIT={FREE_LIMIT}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          onNewAnalysis={() => onNewAnalysisRef.current()}
          onHistoryOpen={() => onHistoryOpenRef.current()}
          onMobileMenuToggle={() => setMobileOpen((p) => !p)}
          showMobileMenu={mobileOpen}
          userName={userEmail}
          userPlan={isPro ? "pro" : "free"}
        />
        <main className="flex-1 overflow-auto">
          <Outlet context={ctx} />
        </main>
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} t={themes.dark} />
      )}
    </div>
  );
}
```

---

### Task 6: Update `main.tsx`

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 6.1: Replace file content entirely**

```tsx
import { StrictMode, lazy, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Monitor, Swords } from "lucide-react";
import AppLayout from "./components/AppLayout";
import LandingPage from "./pages/LandingPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import { SharePage } from "./pages/SharePage.tsx";
import { SuccessPage } from "./pages/SuccessPage.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Welcome from "./pages/Welcome.tsx";
import Upgrade from "./pages/Upgrade.tsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";
import CheckoutCancel from "./pages/CheckoutCancel.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { Settings } from "./pages/Settings.tsx";
import PaidAdAnalyzer from "./pages/app/PaidAdAnalyzer.tsx";
import OrganicAnalyzer from "./pages/app/OrganicAnalyzer.tsx";
import ABTestPage from "./pages/app/ABTestPage.tsx";
import BatchPage from "./pages/app/BatchPage.tsx";
import SwipeFilePage from "./pages/app/SwipeFilePage.tsx";
import ComingSoon from "./components/ComingSoon.tsx";
import "./index.css";

const DemoPage = lazy(() => import("./pages/DemoPage.tsx"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/s/:slug" element={<SharePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/demo" element={<Suspense fallback={null}><DemoPage /></Suspense>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Protected /app/* layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/app" element={<Navigate to="/app/paid" replace />} />
            <Route path="/app/paid" element={<PaidAdAnalyzer />} />
            <Route path="/app/organic" element={<OrganicAnalyzer />} />
            <Route
              path="/app/display"
              element={
                <ComingSoon
                  title="Display & Banner Analysis"
                  description="Score Google Display and affiliate banner ads. See how your creative competes in real website contexts."
                  icon={Monitor}
                />
              }
            />
            <Route path="/app/ab-test" element={<ABTestPage />} />
            <Route
              path="/app/competitor"
              element={
                <ComingSoon
                  title="Competitor Analysis"
                  description="Upload your ad alongside a competitor's. Get a scored gap analysis and action plan to outperform them."
                  icon={Swords}
                />
              }
            />
            <Route path="/app/batch" element={<BatchPage />} />
            <Route path="/app/swipe-file" element={<SwipeFilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
```

---

### Task 7: Update `index.css` + delete `App.tsx`

**Files:**
- Modify: `src/index.css`
- Delete: `src/App.tsx`

- [ ] **Step 7.1: Remove `.main-content` from index.css**

Remove these lines (AppLayout uses flexbox; margin-left hack no longer needed):
```css
.main-content {
  margin-left: 64px;
  flex: 1;
  min-height: 100vh;
}
@media (max-width: 1023px) {
  .main-content {
    margin-left: 0;
  }
}
```

- [ ] **Step 7.2: Delete App.tsx**

```bash
rm /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon/src/App.tsx
```

- [ ] **Step 7.3: Verify build — expect errors only on missing Sidebar/page files (not yet created)**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1 | grep "error TS" | head -20
```

Expected errors: `Cannot find module './pages/app/PaidAdAnalyzer'`, etc. — page files don't exist yet. That is OK. No other errors.

- [ ] **Step 7.4: Commit chunk 2**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add src/components/AppLayout.tsx src/components/UsageIndicator.tsx src/main.tsx src/index.css
git rm src/App.tsx
git commit -m "feat: AppLayout shell, UsageIndicator, nested routing in main.tsx, remove App.tsx"
```

---

## Chunk 3: Page Wrappers + ComingSoon

### Task 8: Thin page wrappers

**Files:**
- Create: `src/pages/app/ABTestPage.tsx`
- Create: `src/pages/app/BatchPage.tsx`
- Create: `src/pages/app/SwipeFilePage.tsx`

- [ ] **Step 8.1: Create the pages/app directory**

```bash
mkdir -p /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon/src/pages/app
```

- [ ] **Step 8.2: Write ABTestPage.tsx**

```tsx
// src/pages/app/ABTestPage.tsx
import { PreFlightView } from "../../components/PreFlightView";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export default function ABTestPage() {
  return <PreFlightView isDark={true} apiKey={API_KEY} />;
}
```

- [ ] **Step 8.3: Write BatchPage.tsx**

```tsx
// src/pages/app/BatchPage.tsx
import { useOutletContext } from "react-router-dom";
import { BatchView } from "../../components/BatchView";
import { themes } from "../../theme";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export default function BatchPage() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, addHistoryEntry } =
    useOutletContext<AppSharedContext>();

  return (
    <BatchView
      isDark={true}
      apiKey={API_KEY}
      addHistoryEntry={addHistoryEntry}
      t={themes.dark}
      canAnalyze={canAnalyze}
      isPro={isPro}
      increment={increment}
      FREE_LIMIT={FREE_LIMIT}
    />
  );
}
```

- [ ] **Step 8.4: Write SwipeFilePage.tsx**

```tsx
// src/pages/app/SwipeFilePage.tsx
import { SwipeFileView } from "../../components/SwipeFileView";

export default function SwipeFilePage() {
  return <SwipeFileView isDark={true} />;
}
```

---

### Task 9: Create `ComingSoon.tsx`

**Files:**
- Create: `src/components/ComingSoon.tsx`

- [ ] **Step 9.1: Write the file**

```tsx
// src/components/ComingSoon.tsx
import { type LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div
      style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 480, animation: "fadeIn 0.4s ease-out forwards" }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={32} color="#6366f1" />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
          {title}
        </h1>

        {/* Description */}
        <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.6, marginTop: 12, maxWidth: 360 }}>
          {description}
        </p>

        {/* Badge */}
        <div
          style={{
            display: "inline-flex", alignItems: "center",
            borderRadius: 9999, padding: "4px 16px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "#818cf8", fontSize: 12, marginTop: 16,
          }}
        >
          Coming soon
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Verify build (only PaidAdAnalyzer/OrganicAnalyzer missing)**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1 | grep "error TS" | grep -v "PaidAdAnalyzer\|OrganicAnalyzer" | head -10
```

Expected: 0 unexpected errors.

- [ ] **Step 9.3: Commit chunk 3**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add src/pages/app/ src/components/ComingSoon.tsx
git commit -m "feat: thin page wrappers (ABTest/Batch/SwipeFile) and ComingSoon component"
```

---

## Chunk 4: Sidebar Redesign

### Task 10: Full Sidebar.tsx replacement

**Files:**
- Modify (full rewrite): `src/components/Sidebar.tsx`

- [ ] **Step 10.1: Replace entire file**

```tsx
// src/components/Sidebar.tsx — complete redesign, URL-based nav, brand tokens
import { useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Zap, TrendingUp, Monitor, GitBranch, Swords, LayoutGrid,
  Bookmark, Settings, ChevronLeft, ChevronRight, MoreHorizontal, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UsageIndicator } from "./UsageIndicator";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  sublabel: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  comingSoon?: boolean;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  userEmail: string;
  isPro: boolean;
  usageCount: number;
  FREE_LIMIT: number;
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────

const ANALYZE: NavItem[] = [
  { label: "Paid Ad",  sublabel: "Meta, TikTok, Google",  path: "/app/paid",     icon: Zap },
  { label: "Organic",  sublabel: "TikTok, Reels, Shorts", path: "/app/organic",  icon: TrendingUp },
  { label: "Display",  sublabel: "Google, affiliate",     path: "/app/display",  icon: Monitor, comingSoon: true },
];

const COMPARE: NavItem[] = [
  { label: "A/B Test",   sublabel: "Test variants",      path: "/app/ab-test",    icon: GitBranch },
  { label: "Competitor", sublabel: "Your ad vs theirs",  path: "/app/competitor", icon: Swords, comingSoon: true },
  { label: "Batch",      sublabel: "Score up to 10",     path: "/app/batch",      icon: LayoutGrid },
];

const LIBRARY: NavItem[] = [
  { label: "Swipe File", sublabel: "Saved winners", path: "/app/swipe-file", icon: Bookmark },
];

const MORE_ITEMS = [...COMPARE.slice(1), ...LIBRARY]; // Competitor, Batch, Swipe File

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", padding: "0 12px", marginTop: 24, marginBottom: 2 }}>
      {label}
    </div>
  );
}

// ─── NAV ITEM ROW ─────────────────────────────────────────────────────────────

function NavItemRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const [showCSTip, setShowCSTip] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCSClick = () => {
    setShowCSTip(true);
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    tipTimerRef.current = setTimeout(() => setShowCSTip(false), 2000);
  };

  const inner = (isActive: boolean) => (
    <>
      {/* Active left bar */}
      {isActive && !collapsed && (
        <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, background: "#6366f1", borderRadius: "0 2px 2px 0" }} />
      )}

      {/* Icon */}
      <Icon
        size={18}
        className={
          isActive
            ? "text-[#818cf8]"
            : "text-[#71717a] group-hover:text-[#a1a1aa] transition-colors"
        }
      />

      {/* Labels */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            className={isActive ? "text-[#f4f4f5]" : "text-[#a1a1aa] group-hover:text-[#f4f4f5] transition-colors"}
          >
            {item.label}
          </span>
          <span style={{ fontSize: 11, color: "#52525b", lineHeight: 1.3, whiteSpace: "nowrap" }}>
            {item.sublabel}
          </span>
        </div>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <span
          className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
          style={{
            left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)",
            background: "#18181b", border: "1px solid rgba(255,255,255,0.08)",
            color: "#f4f4f5", fontSize: 12, borderRadius: 8, padding: "4px 8px",
            whiteSpace: "nowrap", zIndex: 50,
          }}
        >
          {item.label}
        </span>
      )}

      {/* Coming-soon click tooltip */}
      {showCSTip && (
        <span
          style={{
            position: "absolute", left: collapsed ? "calc(100% + 8px)" : "calc(100% - 12px)",
            top: "50%", transform: "translateY(-50%)",
            background: "#18181b", border: "1px solid rgba(99,102,241,0.3)",
            color: "#818cf8", fontSize: 11, borderRadius: 8, padding: "4px 8px",
            whiteSpace: "nowrap", zIndex: 60, pointerEvents: "none",
          }}
        >
          Coming soon
        </span>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    height: collapsed ? 40 : 52,
    opacity: item.comingSoon ? 0.4 : 1,
    textDecoration: "none",
  };

  if (item.comingSoon) {
    return (
      <div
        className="group"
        style={{ ...baseStyle, margin: collapsed ? "2px auto" : "2px 8px", width: collapsed ? 40 : "auto", borderRadius: 10, padding: collapsed ? 0 : "0 10px", cursor: "default", justifyContent: collapsed ? "center" : "flex-start" }}
        onClick={handleCSClick}
      >
        {inner(false)}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `group relative flex items-center transition-colors ${
          collapsed
            ? "justify-center rounded-[10px]"
            : isActive
            ? "rounded-[0_10px_10px_0]"
            : "rounded-[10px] hover:bg-[rgba(255,255,255,0.04)]"
        }`
      }
      style={({ isActive }) => ({
        ...baseStyle,
        margin: collapsed ? "2px auto" : isActive ? "2px 8px 2px 0" : "2px 8px",
        width: collapsed ? 40 : "auto",
        padding: collapsed ? 0 : "0 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: isActive ? "rgba(99,102,241,0.1)" : undefined,
      })}
    >
      {({ isActive }) => inner(isActive)}
    </NavLink>
  );
}

// ─── DESKTOP SIDEBAR ──────────────────────────────────────────────────────────

function DesktopSidebar({
  userEmail, isPro, usageCount, FREE_LIMIT,
}: { userEmail: string; isPro: boolean; usageCount: number; FREE_LIMIT: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = (user?.email ?? userEmail).charAt(0).toUpperCase() || "U";
  const width = collapsed ? 64 : 220;

  return (
    <nav
      className="sidebar-desktop hidden md:flex flex-col flex-shrink-0 relative z-40"
      style={{
        width, minWidth: width,
        background: "#111113",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: "width 200ms cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
      }}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-4 right-2 flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.04)] transition-colors rounded-md z-10"
        style={{ width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer" }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0 0" : "20px 16px 0",
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
          marginBottom: 4,
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        {!collapsed && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.02em" }}>
            cutsheet
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {!collapsed ? <SectionLabel label="Analyze" /> : <div style={{ height: 20 }} />}
        {ANALYZE.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}

        {!collapsed ? <SectionLabel label="Compare" /> : <div style={{ height: 20 }} />}
        {COMPARE.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}

        {!collapsed ? <SectionLabel label="Library" /> : <div style={{ height: 20 }} />}
        {LIBRARY.map((item) => <NavItemRow key={item.path} item={item} collapsed={collapsed} />)}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <UsageIndicator usageCount={usageCount} FREE_LIMIT={FREE_LIMIT} isPro={isPro} collapsed={collapsed} />

        {/* Settings */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="group flex items-center gap-[10px] transition-colors hover:bg-[rgba(255,255,255,0.04)] rounded-[8px]"
          style={{ height: 40, padding: collapsed ? 0 : "0 16px", margin: "0 8px", background: "transparent", border: "none", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
          aria-label="Settings"
        >
          <Settings size={18} className="text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa" }}>Settings</span>
          )}
        </button>

        {/* User avatar */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="group flex items-center gap-[10px] transition-colors hover:bg-[rgba(255,255,255,0.04)] rounded-[8px]"
          style={{ height: 40, padding: collapsed ? 0 : "0 16px", margin: "0 8px", background: "transparent", border: "none", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
          aria-label="Profile settings"
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600, color: "white" }}>
            {initial}
          </div>
          {!collapsed && (
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>
              {isPro ? "Pro Plan" : "Free Plan"}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ─── MOBILE BOTTOM TAB BAR ────────────────────────────────────────────────────

const MOBILE_TABS = [
  { label: "Paid",     path: "/app/paid",     icon: Zap },
  { label: "Organic",  path: "/app/organic",  icon: TrendingUp },
  { label: "A/B Test", path: "/app/ab-test",  icon: GitBranch },
];

function MobileTabBar({ onMoreClick }: { onMoreClick: () => void }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ height: 60, background: "#111113", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textDecoration: "none" }}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} color={isActive ? "#6366f1" : "#52525b"} />
                <span style={{ fontSize: 10, color: isActive ? "#6366f1" : "#52525b", fontWeight: isActive ? 500 : 400 }}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
      <button
        type="button"
        onClick={onMoreClick}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer" }}
      >
        <MoreHorizontal size={20} color="#52525b" />
        <span style={{ fontSize: 10, color: "#52525b" }}>More</span>
      </button>
    </nav>
  );
}

// ─── MOBILE MORE DRAWER ───────────────────────────────────────────────────────

function MobileMoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>More</span>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }}>
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-8">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => { if (!item.comingSoon) { navigate(item.path); onClose(); } }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: item.comingSoon ? "default" : "pointer", opacity: item.comingSoon ? 0.4 : 1 }}
              >
                <Icon size={18} color="#71717a" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#52525b" }}>{item.sublabel}</div>
                </div>
                {item.comingSoon && (
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#818cf8", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.2)" }}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function Sidebar({ mobileOpen: _mobileOpen, onMobileClose: _onMobileClose, userEmail, isPro, usageCount, FREE_LIMIT }: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <DesktopSidebar userEmail={userEmail} isPro={isPro} usageCount={usageCount} FREE_LIMIT={FREE_LIMIT} />
      <MobileTabBar onMoreClick={() => setMoreOpen(true)} />
      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
```

- [ ] **Step 10.2: Run build — expect only PaidAdAnalyzer/OrganicAnalyzer missing**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1 | grep "error TS" | grep -v "PaidAdAnalyzer\|OrganicAnalyzer" | head -10
```

Expected: 0 unexpected errors.

- [ ] **Step 10.3: Commit chunk 4**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add src/components/Sidebar.tsx
git commit -m "feat: full Sidebar redesign — URL-based nav, collapsible, 3 sections, mobile tab bar"
```

---

## Chunk 5: PaidAdAnalyzer

### Task 11: Create `PaidAdAnalyzer.tsx`

**Files:**
- Create: `src/pages/app/PaidAdAnalyzer.tsx`

This component extracts all single-analyzer logic from the old `App.tsx` and adds platform/format selectors + empty state.

- [ ] **Step 11.1: Write the file**

```tsx
// src/pages/app/PaidAdAnalyzer.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Zap } from "lucide-react";
import { AnalyzerView } from "../../components/AnalyzerView";
import { ScoreCard } from "../../components/ScoreCard";
import { VideoDropzone } from "../../components/VideoDropzone";
import { HistoryDrawer } from "../../components/HistoryDrawer";
import { useVideoAnalyzer } from "../../hooks/useVideoAnalyzer";
import { useHistory, type HistoryEntry } from "../../hooks/useHistory";
import { useThumbnail } from "../../hooks/useThumbnail";
import {
  downloadMarkdown, copyToClipboard, generateBrief,
  parseImprovements, parseBudget, parseHashtags,
} from "../../services/analyzerService";
import { generateBriefWithClaude, generateCTARewrites } from "../../services/claudeService";
import { createShare } from "../../services/shareService";
import { checkShareLimit, incrementShareCount } from "../../utils/rateLimiter";
import { exportToPdf } from "../../utils/pdfExport";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

const PLATFORMS = ["all", "Meta", "TikTok", "Google", "YouTube"] as const;
const FORMATS = ["video", "static"] as const;
type Platform = (typeof PLATFORMS)[number];
type Format = (typeof FORMATS)[number];

const STATUS_COPY = {
  uploading: "Reading video...",
  processing: "Gemini is analyzing your creative...",
  complete: "Analysis complete",
  error: "Something went wrong",
  idle: "",
};

// ─── INTENT HEADER ────────────────────────────────────────────────────────────

function IntentHeader({
  platform, setPlatform, format, setFormat,
}: {
  platform: Platform; setPlatform: (p: Platform) => void;
  format: Format; setFormat: (f: Format) => void;
}) {
  return (
    <div
      style={{
        padding: "12px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 13, color: "#52525b", flexShrink: 0 }}>Analyzing for:</span>

      {/* Platform pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            style={{
              height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
              background: platform === p ? "#6366f1" : "rgba(255,255,255,0.04)",
              border: `1px solid ${platform === p ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
              color: platform === p ? "white" : "#71717a",
              fontWeight: platform === p ? 500 : 400,
              transition: "all 150ms",
            }}
          >
            {p === "all" ? "All" : p}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      {/* Format pills */}
      <div style={{ display: "flex", gap: 6 }}>
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            style={{
              height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
              background: format === f ? "#6366f1" : "rgba(255,255,255,0.04)",
              border: `1px solid ${format === f ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
              color: format === f ? "white" : "#71717a",
              fontWeight: format === f ? 500 : 400,
              transition: "all 150ms",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function PaidEmptyState({
  onFileSelect, onUrlSubmit,
}: {
  onFileSelect: (f: File | null) => void;
  onUrlSubmit?: (url: string) => void;
}) {
  const PILLS = ["Hook strength", "CTA score", "Budget recommendation"];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)" }}>
      {/* Icon */}
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Zap size={28} color="#6366f1" fill="rgba(99,102,241,0.3)" />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
        Score your paid ad
      </h2>
      <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 320, marginTop: 10, lineHeight: 1.6 }}>
        Upload a video or static creative. Get a full AI breakdown in 30 seconds.
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
        {PILLS.map((pill) => (
          <span key={pill} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>
            {pill}
          </span>
        ))}
      </div>

      {/* Dropzone */}
      <div style={{ width: "100%", maxWidth: 520, marginTop: 32 }}>
        <VideoDropzone onFileSelect={onFileSelect} file={null} onUrlSubmit={onUrlSubmit} acceptImages />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PaidAdAnalyzer() {
  const {
    addHistoryEntry, historyEntries, deleteHistoryEntry, clearAllHistory,
    addSwipeItem, canAnalyze, isPro, increment, FREE_LIMIT,
    onUpgradeRequired, registerCallbacks,
  } = useOutletContext<AppSharedContext>();

  // ── Platform / format state ────────────────────────────────────────────────
  const [platform, setPlatform] = useState<Platform>("all");
  const [format, setFormat] = useState<Format>("video");

  // ── Local analyzer state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [rightTab, setRightTab] = useState<"analysis" | "brief">("analysis");
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const [previousResult, setPreviousResult] = useState<HistoryEntry | null>(null);

  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const { status, statusMessage, result, error, analyze, download, copy, reset } = useVideoAnalyzer();
  const thumbnailDataUrl = useThumbnail(file);

  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Register TopBar callbacks ──────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setFile(null);
    setLoadedEntry(null);
    setPreviousResult(null);
    reset();
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
    setCtaRewrites(null);
    setCtaLoading(false);
    setRightTab("analysis");
  }, [reset]);

  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => setHistoryOpen(true),
    });
  }, [registerCallbacks, handleReset]);

  // ── Build context prefix for Gemini prompt ────────────────────────────────
  const contextPrefix =
    platform !== "all"
      ? `Analyzing as ${format} ad for ${platform}.\nScore and optimize specifically for ${platform} performance.\nApply ${platform}-specific improvement suggestions.`
      : undefined;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

  useEffect(() => {
    if (status === "complete" && result) {
      const key = `${result.fileName}-${result.timestamp.toISOString()}`;
      if (lastSavedRef.current !== key) {
        lastSavedRef.current = key;
        addHistoryEntry({
          fileName: result.fileName,
          timestamp: result.timestamp.toISOString(),
          scores: result.scores,
          markdown: result.markdown,
          thumbnailDataUrl: thumbnailDataUrl ?? undefined,
        });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired();
      }
    }
  }, [status, result, addHistoryEntry, increment, isPro, FREE_LIMIT, onUpgradeRequired, thumbnailDataUrl]);

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setBrief(null);
      setBriefError(null);
      setRightTab("analysis");
    }
  }, [status]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  // NOTE: handleAnalyze must be declared BEFORE the auto-analyze useEffect below
  const handleAnalyze = useCallback(async () => {
    if (!file || isAnalyzing || !canAnalyze) return;
    if (!loadedEntry && result) {
      setPreviousResult({ id: crypto.randomUUID(), fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown });
    } else if (!result) {
      setPreviousResult(null);
    }
    await analyze(file, API_KEY, contextPrefix);
  }, [file, isAnalyzing, canAnalyze, loadedEntry, result, analyze, contextPrefix]);

  useEffect(() => {
    if (file && status === "idle" && canAnalyze) {
      handleAnalyze();
    }
  }, [file]); // eslint-disable-line

  // ── Derived ───────────────────────────────────────────────────────────────
  const liveResult = result
    ? { ...result, thumbnailDataUrl: thumbnailDataUrl ?? result.thumbnailDataUrl }
    : result;

  const activeResult = loadedEntry
    ? {
        markdown: loadedEntry.markdown,
        scores: loadedEntry.scores,
        improvements: parseImprovements(loadedEntry.markdown),
        budget: parseBudget(loadedEntry.markdown),
        hashtags: parseHashtags(loadedEntry.markdown),
        thumbnailDataUrl: loadedEntry.thumbnailDataUrl,
        fileName: loadedEntry.fileName,
        timestamp: new Date(loadedEntry.timestamp),
      }
    : liveResult;

  const effectiveStatus = loadedEntry ? "complete" : status;
  const showRightPanel = effectiveStatus === "complete" && activeResult !== null;

  const handleCopy = async () => {
    if (loadedEntry) await copyToClipboard(loadedEntry.markdown);
    else await copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (loadedEntry) {
      downloadMarkdown({ markdown: loadedEntry.markdown, scores: loadedEntry.scores, improvements: parseImprovements(loadedEntry.markdown), budget: parseBudget(loadedEntry.markdown), timestamp: new Date(loadedEntry.timestamp), fileName: loadedEntry.fileName });
    } else { download(); }
  };
  void handleDownload; // used by AnalyzerView via onDownload if needed

  const handleExportPdf = async () => {
    if (!activeResult) return;
    try { await exportToPdf(activeResult); } catch { /* silent */ }
  };

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName);
      setBrief(r);
      setRightTab("brief");
    } catch {
      try {
        const r = await generateBrief(activeResult.markdown, API_KEY);
        setBrief(r);
        setRightTab("brief");
      } catch (err) {
        setBriefError(err instanceof Error ? err.message : "Failed to generate brief.");
      }
    } finally { setBriefLoading(false); }
  };

  const handleCTARewrite = async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      const rewrites = await generateCTARewrites(ctaSection, activeResult.fileName);
      setCtaRewrites(rewrites);
    } catch { /* silent */ }
    finally { setCtaLoading(false); }
  };

  const handleBriefCopy = async () => {
    if (!brief) return;
    await copyToClipboard(brief);
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2000);
  };

  const handleAddToSwipeFile = () => {
    if (!activeResult) return;
    addSwipeItem({ fileName: activeResult.fileName, timestamp: activeResult.timestamp.toISOString(), scores: activeResult.scores, markdown: activeResult.markdown, brand: "", format: "", niche: "", platform: "", tags: [], notes: "" });
  };

  const handleShareLink = async () => {
    if (!activeResult || shareLoading) return;
    const { allowed, resetAt } = checkShareLimit();
    if (!allowed) {
      setRateLimitError(`Share limit reached (10/hour). Resets at ${resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      setTimeout(() => setRateLimitError(null), 5000);
      return;
    }
    setShareLoading(true);
    setRateLimitError(null);
    try {
      const slug = await createShare({ file_name: activeResult.fileName, scores: activeResult.scores, markdown: activeResult.markdown });
      await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
      incrementShareCount();
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch (err) {
      setRateLimitError(err instanceof Error ? err.message : "Failed to create share link");
      setTimeout(() => setRateLimitError(null), 5000);
    } finally { setShareLoading(false); }
  };

  const importFromUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAnalyzing || isImporting) return;
    let parsed: URL;
    try { parsed = new URL(trimmed); } catch { setUrlError("Enter a valid URL."); return; }
    setIsImporting(true);
    setUrlError(null);
    try {
      const res = await fetch(trimmed);
      if (!res.ok) { setUrlError("Could not fetch video from this URL."); return; }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("video/")) { setUrlError("This link does not appear to be a direct video URL."); return; }
      const blob = await res.blob();
      const guessedName = parsed.pathname.split("/").filter(Boolean).pop() || "video-from-url.mp4";
      setFile(new File([blob], guessedName, { type: contentType || "video/mp4" }));
      reset();
    } catch { setUrlError("Could not fetch video from this URL."); }
    finally { setIsImporting(false); }
  };
  void urlInput; void urlError; void isImporting; // used in handlers above

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <IntentHeader platform={platform} setPlatform={setPlatform} format={format} setFormat={setFormat} />

        <div className="flex-1 overflow-auto">
          {status === "idle" && !loadedEntry ? (
            <PaidEmptyState
              onFileSelect={(f) => { if (!f) { handleReset(); return; } setFile(f); reset(); }}
              onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
            />
          ) : (
            <div className="relative px-4 py-6 md:px-8 min-h-full flex flex-col">
              {/* Ambient glow */}
              <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />
              <div className="relative flex flex-col flex-1">
                <AnalyzerView
                  file={file}
                  status={effectiveStatus}
                  statusMessage={statusMessage || STATUS_COPY[status]}
                  result={activeResult}
                  error={error}
                  thumbnailDataUrl={activeResult?.thumbnailDataUrl}
                  onFileSelect={(f) => { if (!f) { handleReset(); return; } setFile(f); reset(); }}
                  onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                  onCopy={handleCopy}
                  onExportPdf={handleExportPdf}
                  onShare={handleShareLink}
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
                  copied={copied}
                  shareLoading={shareLoading}
                  historyEntries={historyEntries}
                  onHistoryEntryClick={(entry) => setLoadedEntry(entry)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — ScoreCard */}
      <div
        className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/5 ${showRightPanel ? "w-[340px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}
      >
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
          <div ref={scorecardRef}>
            <ScoreCard
              scores={activeResult.scores}
              improvements={activeResult.improvements}
              budget={activeResult.budget}
              hashtags={activeResult.hashtags}
              fileName={activeResult.fileName}
              analysisTime={analysisCompletedAt ?? undefined}
              modelName="Gemini + Claude"
              onGenerateBrief={handleGenerateBrief}
              onAddToSwipeFile={handleAddToSwipeFile}
              onCTARewrite={handleCTARewrite}
              ctaRewrites={ctaRewrites}
              ctaLoading={ctaLoading}
              onShare={handleCopy}
              isDark={true}
            />
          </div>
        )}

        {showRightPanel && rightTab === "brief" && (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <button type="button" onClick={() => setRightTab("analysis")} className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer">
                ← Back to Scorecard
              </button>
              <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
            </div>
            {briefLoading && !brief && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs text-zinc-500">Generating creative brief...</span>
              </div>
            )}
            {briefError && <div className="px-5 py-4"><p className="text-xs text-red-400">{briefError}</p></div>}
            {brief && (
              <>
                <div className="px-5 pt-5 pb-2 flex-1 overflow-y-auto">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Creative Brief</p>
                  <div className="flex flex-col gap-0.5">
                    {brief.split("\n").map((line, i) => {
                      const t = line.trim();
                      if (!t) return null;
                      if (t.startsWith("## ")) return <p key={i} className="text-xs font-semibold text-white mt-4 mb-1">{t.replace(/^##\s*/, "")}</p>;
                      const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                      if (boldMatch) return <div key={i} className="mb-3"><p className="text-xs text-zinc-500 font-medium">{boldMatch[1]}</p>{boldMatch[2] && <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">{boldMatch[2]}</p>}</div>;
                      if (t.startsWith("- ") || t.startsWith("* ")) return <div key={i} className="flex gap-2 items-start ml-1 mb-1"><span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-zinc-400 leading-relaxed">{t.replace(/^[-*]\s*/, "")}</span></div>;
                      if (t === "---") return <div key={i} className="border-t border-white/5 my-3" />;
                      return <p key={i} className="text-xs text-zinc-300 leading-relaxed mb-1">{t}</p>;
                    })}
                  </div>
                </div>
                <div className="p-5 border-t border-white/5">
                  <button type="button" onClick={handleBriefCopy} className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer">
                    {briefCopied ? "Copied!" : "Copy Brief"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* History drawer */}
      <HistoryDrawer
        open={historyOpen}
        entries={historyEntries}
        onClose={() => setHistoryOpen(false)}
        onSelect={(entry) => setLoadedEntry(entry)}
        onDelete={deleteHistoryEntry}
        onClearAll={clearAllHistory}
        isDark={true}
      />

      {/* Toasts */}
      {shareToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          Link copied to clipboard
        </div>
      )}
      {rateLimitError && (
        <div role="alert" aria-live="assertive" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-mono text-red-400 shadow-lg z-[100]">
          {rateLimitError}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 11.2: Run build — expect only OrganicAnalyzer missing**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1 | grep "error TS" | grep -v "OrganicAnalyzer" | head -10
```

Expected: 0 unexpected errors.

- [ ] **Step 11.3: Commit chunk 5**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: PaidAdAnalyzer — intent header, platform/format pills, empty state, full analyzer logic"
```

---

## Chunk 6: OrganicAnalyzer

### Task 12: Create `OrganicAnalyzer.tsx`

**Files:**
- Create: `src/pages/app/OrganicAnalyzer.tsx`

Identical structure to PaidAdAnalyzer. Key differences:
- Platform options: All | TikTok | Instagram Reels | YouTube Shorts
- No format selector
- Always prepends organic prompt (including when platform === 'all')
- Second Eye toggle + `secondEyeOutput` state
- Second Eye section rendered below ScoreCard

- [ ] **Step 12.1: Write the file**

```tsx
// src/pages/app/OrganicAnalyzer.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { TrendingUp, Eye } from "lucide-react";
import { AnalyzerView } from "../../components/AnalyzerView";
import { ScoreCard } from "../../components/ScoreCard";
import { VideoDropzone } from "../../components/VideoDropzone";
import { HistoryDrawer } from "../../components/HistoryDrawer";
import { useVideoAnalyzer } from "../../hooks/useVideoAnalyzer";
import { useHistory, type HistoryEntry } from "../../hooks/useHistory";
import { useThumbnail } from "../../hooks/useThumbnail";
import {
  downloadMarkdown, copyToClipboard, generateBrief,
  parseImprovements, parseBudget, parseHashtags,
} from "../../services/analyzerService";
import {
  generateBriefWithClaude, generateCTARewrites, generateSecondEyeReview,
} from "../../services/claudeService";
import { createShare } from "../../services/shareService";
import { checkShareLimit, incrementShareCount } from "../../utils/rateLimiter";
import { exportToPdf } from "../../utils/pdfExport";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

const PLATFORMS = ["all", "TikTok", "Instagram Reels", "YouTube Shorts"] as const;
type Platform = (typeof PLATFORMS)[number];

const STATUS_COPY = {
  uploading: "Reading video...",
  processing: "Gemini is analyzing your organic content...",
  complete: "Analysis complete",
  error: "Something went wrong",
  idle: "",
};

// ─── INTENT HEADER ────────────────────────────────────────────────────────────

function IntentHeader({
  platform, setPlatform, secondEye, setSecondEye,
}: {
  platform: Platform; setPlatform: (p: Platform) => void;
  secondEye: boolean; setSecondEye: (v: boolean) => void;
}) {
  return (
    <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#52525b", flexShrink: 0 }}>Platform:</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              style={{
                height: 30, padding: "0 12px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
                background: platform === p ? "#6366f1" : "rgba(255,255,255,0.04)",
                border: `1px solid ${platform === p ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                color: platform === p ? "white" : "#71717a",
                fontWeight: platform === p ? 500 : 400,
                transition: "all 150ms",
              }}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Second Eye toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Second Eye</span>
          {secondEye && (
            <span style={{ fontSize: 11, color: "#52525b" }}>Fresh first-time viewer perspective</span>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={secondEye}
          onClick={() => setSecondEye(!secondEye)}
          style={{
            width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
            background: secondEye ? "#6366f1" : "#27272a",
            position: "relative", transition: "background 200ms", flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%", background: "white",
              left: secondEye ? 20 : 2, transition: "left 200ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function OrganicEmptyState({
  onFileSelect, onUrlSubmit,
}: {
  onFileSelect: (f: File | null) => void;
  onUrlSubmit?: (url: string) => void;
}) {
  const PILLS = ["Retention score", "Platform fit", "Shareability"];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", minHeight: "calc(100vh - 120px)" }}>
      <div style={{ width: 76, height: 76, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TrendingUp size={28} color="#6366f1" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", marginTop: 20, marginBottom: 0 }}>
        Score your organic content
      </h2>
      <p style={{ fontSize: 14, color: "#71717a", textAlign: "center", maxWidth: 320, marginTop: 10, lineHeight: 1.6 }}>
        Upload your TikTok, Reel, or YouTube Short. Get scored on retention, shareability, and algorithm signals.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
        {PILLS.map((pill) => (
          <span key={pill} style={{ fontSize: 12, color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9999, padding: "4px 12px" }}>
            {pill}
          </span>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 520, marginTop: 32 }}>
        <VideoDropzone onFileSelect={onFileSelect} file={null} onUrlSubmit={onUrlSubmit} acceptImages={false} />
      </div>
    </div>
  );
}

// ─── SECOND EYE SECTION ───────────────────────────────────────────────────────

function SecondEyeSection({ content, loading }: { content: string | null; loading: boolean }) {
  if (!loading && !content) return null;
  return (
    <div
      style={{
        margin: "0 16px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
        <Eye size={14} color="#818cf8" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Second Eye Review</span>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px" }}>
        {loading && !content && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span style={{ fontSize: 12, color: "#71717a" }}>Analyzing from a fresh viewer perspective...</span>
          </div>
        )}
        {content && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {content.split("\n").map((line, i) => {
              const t = line.trim();
              if (!t) return null;
              const boldMatch = t.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.*)/);
              if (boldMatch) {
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#f4f4f5" }}>{boldMatch[1]}</span>
                    <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{boldMatch[2]}</span>
                  </div>
                );
              }
              return <p key={i} style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5, margin: 0 }}>{t}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OrganicAnalyzer() {
  const {
    addHistoryEntry, historyEntries, deleteHistoryEntry, clearAllHistory,
    addSwipeItem, canAnalyze, isPro, increment, FREE_LIMIT,
    onUpgradeRequired, registerCallbacks,
  } = useOutletContext<AppSharedContext>();

  const [platform, setPlatform] = useState<Platform>("all");
  const [secondEye, setSecondEye] = useState(false);
  const [secondEyeOutput, setSecondEyeOutput] = useState<string | null>(null);
  const [secondEyeLoading, setSecondEyeLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState<HistoryEntry | null>(null);
  const [rightTab, setRightTab] = useState<"analysis" | "brief">("analysis");
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [ctaRewrites, setCtaRewrites] = useState<string[] | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);
  const [previousResult, setPreviousResult] = useState<HistoryEntry | null>(null);

  const scorecardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const { status, statusMessage, result, error, analyze, download, copy, reset } = useVideoAnalyzer();
  const thumbnailDataUrl = useThumbnail(file);
  const isAnalyzing = status === "uploading" || status === "processing";

  // ── Organic context prefix (always prepended) ─────────────────────────────
  const platformLabel = platform === "all" ? "all platforms" : platform;
  const contextPrefix = `This is an ORGANIC content video (not a paid ad).\nScore for: entertainment value, native feel, retention curve, shareability, and algorithm signals for ${platformLabel}.\nDo NOT apply paid ad scoring criteria.\nScore as if a viewer found this organically on their feed.`;

  const handleReset = useCallback(() => {
    setFile(null);
    setLoadedEntry(null);
    setPreviousResult(null);
    reset();
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
    setCtaRewrites(null);
    setCtaLoading(false);
    setRightTab("analysis");
    setSecondEyeOutput(null);
    setSecondEyeLoading(false);
  }, [reset]);

  useEffect(() => {
    registerCallbacks({
      onNewAnalysis: handleReset,
      onHistoryOpen: () => setHistoryOpen(true),
    });
  }, [registerCallbacks, handleReset]);

  useEffect(() => {
    if (status === "complete") setAnalysisCompletedAt(new Date());
  }, [status]);

  // Second Eye trigger: fires when analysis completes and secondEye is on
  useEffect(() => {
    if (status === "complete" && result && secondEye) {
      setSecondEyeLoading(true);
      setSecondEyeOutput(null);
      generateSecondEyeReview(result.markdown, result.fileName)
        .then((output) => setSecondEyeOutput(output))
        .catch(() => setSecondEyeOutput("Could not generate Second Eye review."))
        .finally(() => setSecondEyeLoading(false));
    }
  }, [status, result, secondEye]); // eslint-disable-line

  useEffect(() => {
    if (status === "complete" && result) {
      const key = `${result.fileName}-${result.timestamp.toISOString()}`;
      if (lastSavedRef.current !== key) {
        lastSavedRef.current = key;
        addHistoryEntry({ fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown, thumbnailDataUrl: thumbnailDataUrl ?? undefined });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) onUpgradeRequired();
      }
    }
  }, [status, result, addHistoryEntry, increment, isPro, FREE_LIMIT, onUpgradeRequired, thumbnailDataUrl]);

  useEffect(() => {
    if (status === "uploading") {
      setLoadedEntry(null);
      setBrief(null);
      setBriefError(null);
      setRightTab("analysis");
      setSecondEyeOutput(null);
    }
  }, [status]);

  // NOTE: handleAnalyze must be declared BEFORE the auto-analyze useEffect below
  const handleAnalyze = useCallback(async () => {
    if (!file || isAnalyzing || !canAnalyze) return;
    if (!loadedEntry && result) {
      setPreviousResult({ id: crypto.randomUUID(), fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown });
    } else if (!result) { setPreviousResult(null); }
    await analyze(file, API_KEY, contextPrefix);
  }, [file, isAnalyzing, canAnalyze, loadedEntry, result, analyze, contextPrefix]);

  useEffect(() => {
    if (file && status === "idle" && canAnalyze) handleAnalyze();
  }, [file]); // eslint-disable-line

  const liveResult = result ? { ...result, thumbnailDataUrl: thumbnailDataUrl ?? result.thumbnailDataUrl } : result;
  const activeResult = loadedEntry
    ? { markdown: loadedEntry.markdown, scores: loadedEntry.scores, improvements: parseImprovements(loadedEntry.markdown), budget: parseBudget(loadedEntry.markdown), hashtags: parseHashtags(loadedEntry.markdown), thumbnailDataUrl: loadedEntry.thumbnailDataUrl, fileName: loadedEntry.fileName, timestamp: new Date(loadedEntry.timestamp) }
    : liveResult;

  const effectiveStatus = loadedEntry ? "complete" : status;
  const showRightPanel = effectiveStatus === "complete" && activeResult !== null;

  const handleCopy = async () => {
    if (loadedEntry) await copyToClipboard(loadedEntry.markdown); else await copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (loadedEntry) { downloadMarkdown({ markdown: loadedEntry.markdown, scores: loadedEntry.scores, improvements: parseImprovements(loadedEntry.markdown), budget: parseBudget(loadedEntry.markdown), timestamp: new Date(loadedEntry.timestamp), fileName: loadedEntry.fileName }); }
    else { download(); }
  };
  void handleDownload;

  const handleExportPdf = async () => {
    if (!activeResult) return;
    try { await exportToPdf(activeResult); } catch { /* silent */ }
  };

  const handleGenerateBrief = async () => {
    if (!activeResult || briefLoading) return;
    setBriefLoading(true); setBriefError(null);
    try {
      const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName);
      setBrief(r); setRightTab("brief");
    } catch {
      try { const r = await generateBrief(activeResult.markdown, API_KEY); setBrief(r); setRightTab("brief"); }
      catch (err) { setBriefError(err instanceof Error ? err.message : "Failed to generate brief."); }
    } finally { setBriefLoading(false); }
  };

  const handleCTARewrite = async () => {
    if (!activeResult || ctaLoading) return;
    setCtaLoading(true);
    try {
      const ctaSection = activeResult.markdown.match(/CTA[\s\S]*?(?=\n##|\n---)/i)?.[0] ?? "";
      setCtaRewrites(await generateCTARewrites(ctaSection, activeResult.fileName));
    } catch { /* silent */ }
    finally { setCtaLoading(false); }
  };

  const handleBriefCopy = async () => {
    if (!brief) return;
    await copyToClipboard(brief); setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2000);
  };

  const handleAddToSwipeFile = () => {
    if (!activeResult) return;
    addSwipeItem({ fileName: activeResult.fileName, timestamp: activeResult.timestamp.toISOString(), scores: activeResult.scores, markdown: activeResult.markdown, brand: "", format: "", niche: "", platform: "", tags: [], notes: "" });
  };

  const handleShareLink = async () => {
    if (!activeResult || shareLoading) return;
    const { allowed, resetAt } = checkShareLimit();
    if (!allowed) { setRateLimitError(`Share limit reached. Resets at ${resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`); setTimeout(() => setRateLimitError(null), 5000); return; }
    setShareLoading(true); setRateLimitError(null);
    try {
      const slug = await createShare({ file_name: activeResult.fileName, scores: activeResult.scores, markdown: activeResult.markdown });
      await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
      incrementShareCount(); setShareToast(true); setTimeout(() => setShareToast(false), 3000);
    } catch (err) { setRateLimitError(err instanceof Error ? err.message : "Failed to create share link"); setTimeout(() => setRateLimitError(null), 5000); }
    finally { setShareLoading(false); }
  };

  const importFromUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || isAnalyzing || isImporting) return;
    let parsed: URL;
    try { parsed = new URL(trimmed); } catch { setUrlError("Enter a valid URL."); return; }
    setIsImporting(true); setUrlError(null);
    try {
      const res = await fetch(trimmed);
      if (!res.ok) { setUrlError("Could not fetch video from this URL."); return; }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("video/")) { setUrlError("This link does not appear to be a direct video URL."); return; }
      const blob = await res.blob();
      const guessedName = parsed.pathname.split("/").filter(Boolean).pop() || "video-from-url.mp4";
      setFile(new File([blob], guessedName, { type: contentType || "video/mp4" })); reset();
    } catch { setUrlError("Could not fetch video from this URL."); }
    finally { setIsImporting(false); }
  };
  void urlInput; void urlError; void isImporting;

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <IntentHeader platform={platform} setPlatform={setPlatform} secondEye={secondEye} setSecondEye={setSecondEye} />
        <div className="flex-1 overflow-auto">
          {status === "idle" && !loadedEntry ? (
            <OrganicEmptyState
              onFileSelect={(f) => { if (!f) { handleReset(); return; } setFile(f); reset(); }}
              onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
            />
          ) : (
            <div className="relative px-4 py-6 md:px-8 min-h-full flex flex-col">
              <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />
              <div className="relative flex flex-col flex-1">
                <AnalyzerView
                  file={file}
                  status={effectiveStatus}
                  statusMessage={statusMessage || STATUS_COPY[status]}
                  result={activeResult}
                  error={error}
                  thumbnailDataUrl={activeResult?.thumbnailDataUrl}
                  onFileSelect={(f) => { if (!f) { handleReset(); return; } setFile(f); reset(); }}
                  onUrlSubmit={async (u) => { setUrlInput(u); await importFromUrl(u); }}
                  onAnalyze={handleAnalyze}
                  onReset={handleReset}
                  onCopy={handleCopy}
                  onExportPdf={handleExportPdf}
                  onShare={handleShareLink}
                  onGenerateBrief={handleGenerateBrief}
                  onAddToSwipeFile={handleAddToSwipeFile}
                  copied={copied}
                  shareLoading={shareLoading}
                  historyEntries={historyEntries}
                  onHistoryEntryClick={(entry) => setLoadedEntry(entry)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:border-l-0 max-lg:border-t max-lg:border-white/5 ${showRightPanel ? "w-[340px] max-lg:w-full opacity-100" : "w-0 max-lg:w-0 opacity-0"}`}>
        {showRightPanel && activeResult?.scores && rightTab === "analysis" && (
          <>
            <div ref={scorecardRef}>
              <ScoreCard
                scores={activeResult.scores}
                improvements={activeResult.improvements}
                budget={activeResult.budget}
                hashtags={activeResult.hashtags}
                fileName={activeResult.fileName}
                analysisTime={analysisCompletedAt ?? undefined}
                modelName="Gemini + Claude"
                onGenerateBrief={handleGenerateBrief}
                onAddToSwipeFile={handleAddToSwipeFile}
                onCTARewrite={handleCTARewrite}
                ctaRewrites={ctaRewrites}
                ctaLoading={ctaLoading}
                onShare={handleCopy}
                isDark={true}
              />
            </div>
            {/* Second Eye output below scorecard */}
            <SecondEyeSection content={secondEyeOutput} loading={secondEyeLoading} />
          </>
        )}

        {showRightPanel && rightTab === "brief" && (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <button type="button" onClick={() => setRightTab("analysis")} className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer">← Back to Scorecard</button>
              <span className="text-xs text-zinc-600 font-mono">Claude Sonnet</span>
            </div>
            {briefLoading && !brief && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs text-zinc-500">Generating creative brief...</span>
              </div>
            )}
            {briefError && <div className="px-5 py-4"><p className="text-xs text-red-400">{briefError}</p></div>}
            {brief && (
              <>
                <div className="px-5 pt-5 pb-2 flex-1 overflow-y-auto">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Creative Brief</p>
                  <div className="flex flex-col gap-0.5">
                    {brief.split("\n").map((line, i) => {
                      const t = line.trim();
                      if (!t) return null;
                      if (t.startsWith("## ")) return <p key={i} className="text-xs font-semibold text-white mt-4 mb-1">{t.replace(/^##\s*/, "")}</p>;
                      const boldMatch = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                      if (boldMatch) return <div key={i} className="mb-3"><p className="text-xs text-zinc-500 font-medium">{boldMatch[1]}</p>{boldMatch[2] && <p className="text-xs text-zinc-300 leading-relaxed mt-0.5">{boldMatch[2]}</p>}</div>;
                      if (t.startsWith("- ") || t.startsWith("* ")) return <div key={i} className="flex gap-2 items-start ml-1 mb-1"><span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-zinc-400 leading-relaxed">{t.replace(/^[-*]\s*/, "")}</span></div>;
                      if (t === "---") return <div key={i} className="border-t border-white/5 my-3" />;
                      return <p key={i} className="text-xs text-zinc-300 leading-relaxed mb-1">{t}</p>;
                    })}
                  </div>
                </div>
                <div className="p-5 border-t border-white/5">
                  <button type="button" onClick={handleBriefCopy} className="w-full py-2 px-3 bg-transparent border border-white/10 rounded-lg text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-150 cursor-pointer">
                    {briefCopied ? "Copied!" : "Copy Brief"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <HistoryDrawer open={historyOpen} entries={historyEntries} onClose={() => setHistoryOpen(false)} onSelect={(entry) => setLoadedEntry(entry)} onDelete={deleteHistoryEntry} onClearAll={clearAllHistory} isDark={true} />

      {shareToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]">
          Link copied to clipboard
        </div>
      )}
      {rateLimitError && (
        <div role="alert" aria-live="assertive" className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-mono text-red-400 shadow-lg z-[100]">
          {rateLimitError}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 12.2: Run full build — must be 0 errors**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1
```

Expected: `✓ built in` with 0 errors.

- [ ] **Step 12.3: Fix any TypeScript errors before proceeding**

If there are type errors, read the error messages carefully and fix them. Common issues:
- `previousResult` declared but only assigned — add `void previousResult` or use it in a handler
- Missing props on existing components — check the component's interface and pass required props
- Import paths — verify all `../../` relative paths resolve correctly

- [ ] **Step 12.4: Commit chunk 6**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add src/pages/app/OrganicAnalyzer.tsx
git commit -m "feat: OrganicAnalyzer — organic prompt, platform pills, Second Eye toggle + review section"
```

---

## Chunk 7: Finish Line

### Task 13: Create HANDOFF.md

**Files:**
- Create: `HANDOFF.md` (repo root)

- [ ] **Step 13.1: Write the file**

```markdown
# Cutsheet — Design Handoff

All components listed below were designed and built in code by Claude Code.
No Figma handoff required — the design is complete and live.

## Brand Tokens (applied throughout)

| Token | Value |
|-------|-------|
| Background | `#09090b` |
| Sidebar bg | `#111113` |
| Card | `#18181b` |
| Primary | `#6366f1` |
| Primary light | `#818cf8` |
| Text primary | `#f4f4f5` |
| Text secondary | `#a1a1aa` |
| Text muted | `#71717a` |
| Text hint | `#52525b` |
| Border | `rgba(255,255,255,0.06)` |
| Active bg | `rgba(99,102,241,0.1)` |
| Active border | `#6366f1` |
| Font | Geist Sans |
| Mono | Geist Mono |

## Components Built

### `src/components/Sidebar.tsx`
Fully redesigned. URL-based navigation via React Router NavLink.
- Three labeled sections: ANALYZE, COMPARE, LIBRARY
- Collapsible: 220px expanded ↔ 64px collapsed (ChevronLeft/Right toggle)
- Active item: indigo bg + left border indicator + rounded-right border-radius
- Coming soon items: opacity 0.4, cursor default, click tooltip
- Bottom: UsageIndicator + Settings + User avatar → /settings
- Mobile (<768px): hidden. Replaced by bottom tab bar (Paid | Organic | A/B Test | More)
- "More" opens a bottom drawer with remaining nav items

### `src/components/AppLayout.tsx`
New layout shell for all /app/* routes.
- Flexbox layout: Sidebar (left) + TopBar (top) + `<Outlet />` (content)
- Owns: `useUsage()`, `useHistory()`, `useSwipeFile()`, `mobileOpen`, `showUpgradeModal`
- Passes shared state to child routes via `useOutletContext<AppSharedContext>()`
- TopBar callbacks registered by child pages via `registerCallbacks()`

### `src/components/UsageIndicator.tsx`
New component. Shows free plan usage in sidebar bottom.
- Expanded: labeled progress bar with usage count
- Collapsed: color dot indicator
- Colors: indigo (ok) → amber (60%+) → red (100%)
- Hidden for Pro users

### `src/components/ComingSoon.tsx`
Reusable placeholder for unreleased routes.
- 80px icon circle, title, description, "Coming soon" badge
- fadeIn entrance animation (0.4s ease-out)
- Used at: /app/display (Monitor icon), /app/competitor (Swords icon)

### `src/pages/app/PaidAdAnalyzer.tsx`
New page at /app/paid.
- Intent header: platform pills (All | Meta | TikTok | Google | YouTube) + format pills (Video | Static)
- Empty state: Zap icon, "Score your paid ad", feature pills, VideoDropzone
- Platform context prepended to Gemini prompt when platform !== 'all'
- All single-analyzer logic from old App.tsx (history, share, brief, CTA rewrite)
- ScoreCard in collapsible right panel (matches old App.tsx layout exactly)

### `src/pages/app/OrganicAnalyzer.tsx`
New page at /app/organic.
- Intent header: platform pills (All | TikTok | Instagram Reels | YouTube Shorts)
- Second Eye toggle: indigo switch, "Fresh first-time viewer perspective" sublabel
- Organic prompt always prepended (including platform="all")
- Second Eye: Claude call fires on analysis complete, output renders below ScoreCard
- Empty state: TrendingUp icon, organic-specific copy + pills

### Mobile Bottom Tab Bar (in `Sidebar.tsx`)
4 tabs: Paid (Zap) | Organic (TrendingUp) | A/B Test (GitBranch) | More (MoreHorizontal)
- Height 60px, background #111113, border-top rgba(255,255,255,0.06)
- Active tab: indigo icon + label. Inactive: #52525b
- "More" opens bottom drawer with: Display, Competitor, Batch, Swipe File

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| /app | → /app/paid | Redirect |
| /app/paid | PaidAdAnalyzer | New |
| /app/organic | OrganicAnalyzer | New |
| /app/display | ComingSoon | Monitor icon |
| /app/ab-test | ABTestPage → PreFlightView | Existing |
| /app/competitor | ComingSoon | Swords icon |
| /app/batch | BatchPage → BatchView | Existing |
| /app/swipe-file | SwipeFilePage → SwipeFileView | Existing |

All /app/* routes wrapped in ProtectedRoute + onboarding check (via ProtectedRoute.tsx).
```

---

### Task 14: Final build verification

- [ ] **Step 14.1: Clean build**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1
```

Expected output: `✓ built in Xs` with **0 errors, 0 failed**. If there are errors, fix them before proceeding.

- [ ] **Step 14.2: Check for unused imports that TypeScript might warn on**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && npm run build 2>&1 | grep -i "warn\|unused" | head -20
```

Fix any unused variable warnings that would fail a strict build.

---

### Task 15: Final commit + push

- [ ] **Step 15.1: Stage all remaining files**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git add HANDOFF.md docs/superpowers/plans/
git status
```

- [ ] **Step 15.2: Final commit**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon
git commit -m "$(cat <<'EOF'
feat: complete app restructure — intent-based navigation with full UI

- URL-based routing under /app/* (paid, organic, display, ab-test, competitor, batch, swipe-file)
- AppLayout.tsx: shared state shell with React Router Outlet context
- Sidebar.tsx: full redesign — collapsible 220px/64px, 3 sections, brand tokens, mobile tab bar
- PaidAdAnalyzer: platform/format intent header, empty state, full analyzer logic
- OrganicAnalyzer: organic prompt, Second Eye toggle + Claude review section
- ComingSoon: reusable placeholder with fadeIn animation
- UsageIndicator: new component for sidebar bottom usage bar
- HANDOFF.md: design-in-code documentation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 15.3: Push to main**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/heuristic-cannon && git push origin claude/heuristic-cannon
```

---

## Quick Reference — Common Fix Patterns

**If `previousResult` causes "declared but never read" TS error:**
In PaidAdAnalyzer/OrganicAnalyzer, `previousResult` is used only for the re-analyze diff flow (stored but currently not passed to AnalyzerView). Add `void previousResult;` after the declaration or wire it to AnalyzerView if that prop exists.

**If Sidebar `mobileOpen` prop causes "declared but never read":**
The new Sidebar uses a bottom tab bar for mobile instead of the old slide-in. The `mobileOpen` and `onMobileClose` props are accepted but prefixed with `_` in the destructuring to silence the warning.

**If NavLink `style` callback causes type error:**
Ensure `style` receives `({ isActive }: { isActive: boolean }) => React.CSSProperties` — React Router 6 requires the object destructure.

**If `void urlInput` etc. causes lint error:**
These are declared because the import-from-url handler sets them. If strict lint complains, consolidate them into the `importFromUrl` closure scope instead of component state.
