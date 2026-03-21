# ScoreCard Results Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the overcrowded ScoreCard right panel into a scannable, hierarchical layout with consistent action placement, honest data display, and proper destructive-action confirmation.

**Architecture:** 6 discrete passes, each a single commit. Pass 1 restructures ScoreCard section order and removes dead code. Pass 2 consolidates action buttons into one row. Pass 3 unifies history to Supabase-only. Pass 4 switches MetricBars colors to design tokens. Pass 5 adds mobile scroll-to-results. Pass 6 adds Start Over confirmation dialog.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, framer-motion, CVA, CSS custom properties from `src/styles/tokens.css`, existing `CollapsibleSection` and `AlertDialog` UI primitives.

**Spec:** `docs/superpowers/specs/2026-03-21-scorecard-results-redesign.md`

---

## Chunk 1: Pass 1 — Consolidate and Reorder ScoreCard

### Task 1: Remove Deep Dive system, tab switcher, Compare link, and reorder sections

**Files:**
- Modify: `src/components/ScoreCard.tsx`
- Delete: (no files deleted — QuickActions removal is Pass 2)

**What changes in ScoreCard.tsx:**

- [ ] **Step 1: Remove imports for SlideSheet and DeepDiveTabGroup**

Lines 19-20: Remove these two imports:
```tsx
// DELETE these lines:
import { SlideSheet } from "./ui/SlideSheet";
import { DeepDiveTabGroup, type Tab } from "./DeepDiveTabGroup";
```

Also remove unused lucide icons that were only for Deep Dive pills (line 6): `Film`, `Hash`, `Heart`, `AlignLeft`. Keep all others.

- [ ] **Step 2: Remove Deep Dive state and useMemo**

Remove from the component body:
- Line 198: `const [slideSheetOpen, setSlideSheetOpen] = useState(false);`
- Line 199: `const [deepDiveTab, setDeepDiveTab] = useState<string>("scenes");`
- Lines 277-291: The entire `deepDiveTabs` useMemo block

- [ ] **Step 3: Remove Analysis/History tab switcher and History panel render**

Remove:
- Line 197: `const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');`
- Lines 334-351: The tab switcher div (`{/* Tab switcher */}` through closing `</div>`)
- Lines 353-364: The History panel conditional render block
- Line 367: Change `{activeTab === 'analysis' && <>` to just `<>` (always show analysis)
- Line 703: Change `</>}` to just `</>`

Also remove the `HistoryPanel` import (line 13): `import HistoryPanel from "./HistoryPanel";`
And the `AnalysisRecord` type import (line 14): `import type { AnalysisRecord } from "../services/historyService";`

Remove from props interface (lines 54-55):
```tsx
onSelectHistory?: (record: AnalysisRecord) => void;
historyRefreshKey?: number;
```

Remove from destructured props (lines 176-177):
```tsx
onSelectHistory,
historyRefreshKey,
```

- [ ] **Step 4: Remove Deep Dive pills strip (lines 586-680)**

Delete the entire block from `{deepDiveTabs.length > 0 && (` through its closing `)}`.

- [ ] **Step 5: Remove SlideSheet render (lines 734-791)**

Delete the entire `<SlideSheet>` block through `</SlideSheet>`.

- [ ] **Step 6: Remove Compare link (lines 705-720)**

Delete the `{/* Compare against competitor link */}` div and its contents.

- [ ] **Step 7: Remove standalone Fix It button (lines 466-500)**

Delete the entire `{/* Fix It For Me */}` block. This button moves to the action row in Pass 2.

Note: Keep the `onFixIt`, `fixItResult`, `fixItLoading` props — they'll be used by the action row.

- [ ] **Step 8: Move ScoreAdaptiveCTA above collapsed sections**

Currently at lines 576-580 (after hashtags, before Deep Dive). Move it to render directly after MetricBars:

New render order inside the glass card `<div style={{ position: "relative", zIndex: 1 }}>`:
1. Arc gauge (lines 393-444) — keep as-is
2. MetricBars (lines 447-453) — keep as-is
3. **ScoreAdaptiveCTA** (moved here, with `style={{ marginTop: 20 }}`)
4. **Placeholder div for action row** — `{/* Action row — Pass 2 */}` with `style={{ marginTop: 12 }}`
5. HookDetailCard (lines 456-458) — wrap in CollapsibleSection, `style={{ marginTop: 24 }}`
6. ImprovementsList (lines 460-463) — wrap in CollapsibleSection, `style={{ marginTop: 8 }}`
7. PredictedPerformance (lines 530-535) — wrap in CollapsibleSection, `style={{ marginTop: 8 }}`
8. BudgetCard (lines 524-528) — wrap in CollapsibleSection, `style={{ marginTop: 8 }}`
9. Scene Breakdown (lines 502-512) — already in CollapsibleSection, `style={{ marginTop: 8 }}`
10. Static Ad Checks (lines 514-521) — already in CollapsibleSection, `style={{ marginTop: 8 }}`
11. Hashtags (lines 537-566) — already in CollapsibleSection, `style={{ marginTop: 8 }}`

- [ ] **Step 9: Wrap HookDetailCard in CollapsibleSection**

Replace:
```tsx
{hookDetail && (
  <HookDetailCard hookDetail={hookDetail} format={format} />
)}
```
With:
```tsx
{hookDetail && (
  <div style={{ marginTop: 24, padding: "0 20px" }}>
    <CollapsibleSection
      title="Hook Analysis"
      icon={<Lightbulb size={14} />}
      trailing={
        <span className="text-[10px] font-mono" style={{ color: scores.hook >= 9 ? "var(--score-excellent)" : scores.hook >= 7 ? "var(--score-good)" : scores.hook >= 5 ? "var(--score-average)" : "var(--score-weak)" }}>
          {scores.hook}/10
        </span>
      }
    >
      <HookDetailCard hookDetail={hookDetail} format={format} />
    </CollapsibleSection>
  </div>
)}
```

- [ ] **Step 10: Wrap ImprovementsList in CollapsibleSection**

Replace:
```tsx
{improvements && improvements.length > 0 && (
  <ImprovementsList improvements={improvements} loading={improvementsLoading} />
)}
```
With:
```tsx
{improvements && improvements.length > 0 && (
  <div style={{ marginTop: 8, padding: "0 20px" }}>
    <CollapsibleSection
      title="Improvements"
      icon={<AlertCircle size={14} />}
      trailing={
        <span className="text-[10px] text-zinc-500">{improvements.length} items</span>
      }
    >
      <ImprovementsList improvements={improvements} loading={improvementsLoading} />
    </CollapsibleSection>
  </div>
)}
```

Remove the `px-5 border-t border-white/5 mt-4 pt-4` wrapper from inside `ImprovementsList` — the CollapsibleSection now handles spacing.

- [ ] **Step 11: Wrap PredictedPerformance in CollapsibleSection**

Replace:
```tsx
{prediction && (
  <div className="px-5 border-t border-white/5 mt-4 pt-4">
    <PredictedPerformanceCard prediction={prediction} platform={platform} niche={niche} />
  </div>
)}
```
With:
```tsx
{prediction && (
  <div style={{ marginTop: 8, padding: "0 20px" }}>
    <CollapsibleSection
      title="Predicted Performance"
      icon={<TrendingUp size={14} />}
    >
      <PredictedPerformanceCard prediction={prediction} platform={platform} niche={niche} />
    </CollapsibleSection>
  </div>
)}
```

- [ ] **Step 12: Wrap BudgetCard in CollapsibleSection**

Replace:
```tsx
<BudgetCard
  engineBudget={engineBudget}
  budget={budget}
  onNavigateSettings={onNavigateSettings}
/>
```
With:
```tsx
<div style={{ marginTop: 8, padding: "0 20px" }}>
  <CollapsibleSection
    title="Budget Recommendation"
    icon={<DollarSign size={14} />}
  >
    <BudgetCard
      engineBudget={engineBudget}
      budget={budget}
      onNavigateSettings={onNavigateSettings}
    />
  </CollapsibleSection>
</div>
```

- [ ] **Step 13: Fix spacing on existing CollapsibleSections (Scene Breakdown, Static Ad Checks, Hashtags)**

For each of these three, change their wrapper div from:
```tsx
<div className="px-5 border-t border-white/5 mt-4 pt-4">
```
To:
```tsx
<div style={{ marginTop: 8, padding: "0 20px" }}>
```

This removes the border-t separators (CollapsibleSection headers provide visual separation) and uses the 8px gap specified in the spec.

- [ ] **Step 14: Update OverflowMenu items**

Add Compare and History to the overflow menu items array (line 690-698). New items list:

```tsx
items={[
  ...(onGenerateBrief ? [{ label: "Generate Brief", onClick: onGenerateBrief, icon: <FileText size={14} /> }] : []),
  ...(onAddToSwipeFile ? [{
    label: "Add to Swipe File",
    onClick: () => { onAddToSwipeFile(); setToast("Added to Swipe File"); setTimeout(() => setToast(null), 2500); },
    icon: <Bookmark size={14} />,
  }] : []),
  ...(onCheckPolicies ? [{ label: "Check Policies", onClick: onCheckPolicies, loading: policyLoading, loadingLabel: "Checking...", icon: <ShieldCheck size={14} /> }] : []),
  ...(onShare ? [{ label: "Share Score", onClick: onShare, icon: <Share2 size={14} /> }] : []),
  { label: "Compare", onClick: () => navigate("/app/competitor"), icon: <ArrowUpRight size={14} /> },
  ...(onStartOver ? [{ label: "Start Over", onClick: onStartOver, icon: <RotateCcw size={14} />, destructive: true }] : []),
] satisfies OverflowMenuItem[]}
```

Note: Need to add `navigate` — but ScoreCard doesn't have router access. Instead, add an `onCompare` prop:
- Add to `ScoreCardProps`: `onCompare?: () => void;`
- Use `onCompare` in the menu item's onClick
- Pass from PaidAdAnalyzer: `onCompare={() => navigate('/app/competitor')}`

Note: Download and History overflow menu items are deferred — no existing handlers for these. The spec lists them aspirationally; implementing them requires new functionality beyond this pass's scope.

Note: Between Pass 1 and Pass 2, there will be a visible gap where the action row placeholder exists. This is a cosmetic temporary state resolved by Pass 2.

- [ ] **Step 15: Remove fileName display between hashtags and ScoreAdaptiveCTA**

Delete lines 568-573 (the `{/* File name */}` block). This is redundant — filename is in the header.

- [ ] **Step 16: Add spacing div between OverflowMenu and last collapsible**

Change the overflow menu wrapper:
```tsx
<div className="mt-auto px-5 pb-3 flex justify-end" style={{ marginTop: 16 }}>
```

- [ ] **Step 17: Verify build compiles**

Run: `npx vite build 2>&1 | tail -5`
Expected: `built in` with no new errors

- [ ] **Step 18: Commit**

```bash
git add src/components/ScoreCard.tsx
git commit -m "refactor: consolidate ScoreCard — reorder sections, remove Deep Dive/tabs/Compare"
```

---

## Chunk 2: Pass 2 — Consolidate Action Buttons

### Task 2: Create action row and move buttons

**Files:**
- Modify: `src/components/ScoreCard.tsx` (add action row where placeholder was)
- Modify: `src/pages/app/PaidAdAnalyzer.tsx` (remove Visualize trigger from left panel, pass new props to ScoreCard)
- Delete contents of: `src/components/scorecard/QuickActions.tsx` (export empty or remove import)

- [ ] **Step 1: Add new props to ScoreCardProps**

Add to the interface:
```tsx
// Visualize It
onVisualize?: () => void;
visualizeLoading?: boolean;
canVisualize?: boolean; // false for video format
// Compare
onCompare?: () => void;
```

- [ ] **Step 2: Build the ActionRow inside ScoreCard**

Replace the `{/* Action row — Pass 2 */}` placeholder with:

```tsx
{/* Action row */}
<div
  style={{ marginTop: 12, padding: "0 20px", display: "flex", gap: 8 }}
  className="max-md:flex-col"
>
  {/* Fix It For Me */}
  <button
    type="button"
    onClick={onFixIt}
    disabled={fixItLoading}
    aria-label="Fix It For Me"
    style={{
      flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      background: "transparent", border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)", cursor: fixItLoading ? "default" : "pointer",
      fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-muted)",
      transition: "all var(--duration-fast)",
    }}
    onMouseEnter={(e) => { if (!fixItLoading) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
  >
    {fixItLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
    {scores.overall >= 8 ? "Polish It" : "Fix It"}
  </button>

  {/* Visualize It */}
  {canVisualize !== false ? (
    isPro ? (
      <button
        type="button"
        onClick={onVisualize}
        disabled={visualizeLoading}
        aria-label="Visualize It"
        style={{
          flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "transparent", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", cursor: visualizeLoading ? "default" : "pointer",
          fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-muted)",
          transition: "all var(--duration-fast)",
        }}
        onMouseEnter={(e) => { if (!visualizeLoading) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        {visualizeLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Visualize
      </button>
    ) : (
      <button
        type="button"
        onClick={() => onUpgradeRequired?.("visualize")}
        aria-label="Visualize It — Pro feature"
        style={{
          flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "transparent", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", cursor: "pointer",
          fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-faint)",
          transition: "all var(--duration-fast)",
        }}
      >
        <Lock size={12} />
        Visualize
        <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: "var(--accent-subtle)", color: "var(--accent)" }}>PRO</span>
      </button>
    )
  ) : null}

  {/* Policy Check */}
  <button
    type="button"
    onClick={onCheckPolicies}
    disabled={policyLoading}
    aria-label="Check Ad Policies"
    style={{
      flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      background: "transparent", border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)", cursor: policyLoading ? "default" : "pointer",
      fontSize: 12, fontFamily: "var(--sans)", color: "var(--ink-muted)",
      transition: "all var(--duration-fast)",
    }}
    onMouseEnter={(e) => { if (!policyLoading) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
  >
    {policyLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
    Policies
  </button>
</div>
```

Note: Add `Sparkles` and `Lock` to lucide imports. Add `isPro` and `onUpgradeRequired` to ScoreCardProps:
```tsx
isPro?: boolean;
onUpgradeRequired?: (feature: string) => void;
```

- [ ] **Step 3: Remove Visualize trigger from PaidAdAnalyzer left panel**

In `src/pages/app/PaidAdAnalyzer.tsx`, delete lines 796-848 (the entire `{/* Visualize It — below creative in left panel */}` block with both isPro and !isPro button variants).

Keep lines 849-858 (the VisualizePanel output render) — the output stays in the left panel.

- [ ] **Step 4: Pass new props to ScoreCard from PaidAdAnalyzer**

In PaidAdAnalyzer.tsx around line 894, add to the ScoreCard JSX:
```tsx
onVisualize={handleVisualize}
visualizeLoading={visualizeStatus === "loading"}
canVisualize={format === "static"}
isPro={isPro}
onUpgradeRequired={onUpgradeRequired}
onCompare={() => navigate('/app/competitor')}
```

- [ ] **Step 5: Remove QuickActions usage and Policy Check from overflow menu**

Search for any import/render of `QuickActions` in ScoreCard.tsx or PaidAdAnalyzer.tsx. If found, remove the import and render. The file `src/components/scorecard/QuickActions.tsx` can be left on disk (dead code) — it's no longer imported.

Also remove the `onCheckPolicies` item from the OverflowMenu items array in ScoreCard.tsx — Policy Check now lives in the action row only. Remove the line:
```tsx
...(onCheckPolicies ? [{ label: "Check Policies", onClick: onCheckPolicies, loading: policyLoading, loadingLabel: "Checking...", icon: <ShieldCheck size={14} /> }] : []),
```

- [ ] **Step 6: Verify build compiles**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/components/ScoreCard.tsx src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: consolidate Fix It, Visualize, Policy Check into ScoreCard action row"
```

---

## Chunk 3: Pass 3 — Fix Dual History Systems

### Task 3: Remove localStorage history, use Supabase only

**Files:**
- Modify: `src/hooks/useHistory.ts` (gut localStorage, make it a Supabase wrapper)
- Modify: `src/components/AppLayout.tsx` (update useHistory usage)
- Modify: `src/components/HistoryDrawer.tsx` (ensure it reads from Supabase)
- Reference: `src/services/historyService.ts` (source of truth)

**Important context:** `useHistory` is called in `AppLayout.tsx` (line 43) and its return values are passed through React Router's Outlet context to all `/app/*` pages. Changing `useHistory` changes the data source for everything.

- [ ] **Step 1: Read historyService.ts to understand the Supabase API**

Read: `src/services/historyService.ts`
Need to understand: what functions exist, what they return, how they query.

- [ ] **Step 2: Refactor useHistory to wrap Supabase**

Rewrite `src/hooks/useHistory.ts` to:
1. Import from `historyService` instead of using localStorage
2. Use `useState` + `useEffect` to fetch entries from Supabase on mount
3. `addEntry` calls historyService to save to Supabase then updates local state
4. `deleteEntry` calls historyService to delete from Supabase
5. `clearAll` calls historyService to clear all
6. Export a `loading` boolean for skeleton states
7. Export the same `HistoryEntry` type interface (or re-export from historyService)

Remove all `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem` calls.

- [ ] **Step 3: Update AppLayout.tsx if needed**

If `useHistory` return type changed (added `loading`), update AppLayout to pass `historyLoading` through the context.

Add to `AppSharedContext`:
```tsx
historyLoading: boolean;
```

- [ ] **Step 4: Update HistoryDrawer to show loading/empty states**

If HistoryDrawer currently reads from the context's `historyEntries`, it already gets Supabase data after this change. Add:
- When `historyLoading`: show `<Skeleton>` placeholders (3 rows)
- When entries is empty and not loading: show existing empty state
- No Supabase session: show "Sign in to see history" text

- [ ] **Step 5: Verify DashboardIdleView still works**

`DashboardIdleView.tsx` reads `historyEntries` from outlet context for its "recent analyses" section. After this refactor, those entries now come from Supabase via the refactored `useHistory`. Verify it renders correctly — the prop name and shape should be unchanged.

- [ ] **Step 6: Trace historyLoading prop-drilling path**

Full path: `useHistory()` (returns `loading`) → `AppLayout.tsx` (adds `historyLoading` to context) → `PaidAdAnalyzer.tsx` (reads from `useOutletContext`) → passes `historyLoading` as prop to `HistoryDrawer`.

Update `HistoryDrawer` props interface to accept `loading?: boolean` and use it for skeleton state.

- [ ] **Step 7: Verify no other localStorage history calls remain**

Grep: `localStorage.*history\|localStorage.*cutsheet-history\|HISTORY_KEY`

- [ ] **Step 8: Verify build compiles**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useHistory.ts src/components/AppLayout.tsx src/components/HistoryDrawer.tsx
git commit -m "fix: unify history to Supabase — remove localStorage dual-write"
```

---

## Chunk 4: Pass 4 — MetricBars Token-Based Colors

### Task 4: Replace hardcoded hex colors with CSS custom properties

**Files:**
- Modify: `src/components/scorecard/MetricBars.tsx`

- [ ] **Step 1: Replace getScoreColorByValue import with a local token-based function**

In MetricBars.tsx, line 3 currently imports:
```tsx
import { getScoreColorByValue } from "../ScoreCard";
```

Replace with a local function that returns CSS custom property values:
```tsx
function getScoreTokenColor(score: number): string {
  if (score >= 7) return "var(--score-excellent)";
  if (score >= 5) return "var(--score-good)";
  if (score >= 3) return "var(--score-average)";
  return "var(--score-weak)";
}
```

**Score threshold decision:** The spec listed 7/5/3 thresholds, but the existing `getScoreColorByValue` (ScoreCard.tsx lines 79-84) uses 9/7/5 thresholds, which match the established score bands throughout the app. Preserving existing behavior (9/7/5) to avoid regressions. The only change is hex → CSS tokens:
```tsx
function getScoreTokenColor(score: number): string {
  if (score >= 9) return "var(--score-excellent)";
  if (score >= 7) return "var(--score-good)";
  if (score >= 5) return "var(--score-average)";
  return "var(--score-weak)";
}
```

- [ ] **Step 2: Update bar color references**

Line 51: Change `const barColor = getScoreColorByValue(value);` to `const barColor = getScoreTokenColor(value);`

Line 64: The `background: linear-gradient(90deg, ${barColor}, ${barColor}cc)` uses string interpolation with the color — this works with hex values but NOT with CSS custom properties (`var(--score-excellent)cc` is invalid CSS).

Fix: Use the token directly without the gradient+opacity trick:
```tsx
background: barColor,
```

Line 66: Similarly `boxShadow: \`0 0 6px ${barColor}40\`` won't work with var(). Remove the glow:
```tsx
// Remove boxShadow line — the glow was decorative
```

Line 56: The score number color `style={{ color: barColor }}` — this works fine with `var()`.

- [ ] **Step 3: Ensure score number uses Geist Mono**

Line 56 already uses `className="font-mono"` — verify this maps to `var(--mono)` via Tailwind config. It does (Tailwind's `font-mono` maps to the configured mono font).

- [ ] **Step 4: Verify build compiles**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/scorecard/MetricBars.tsx
git commit -m "fix: MetricBars colors use design tokens instead of hardcoded hex"
```

---

## Chunk 5: Pass 5 — Mobile Scroll-to-Results

### Task 5: Auto-scroll to ScoreCard on mobile after analysis

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx`

- [ ] **Step 1: Add a ref for the ScoreCard container**

Near the top of the component (around line 130), there's already a `scorecardRef` (line 893: `<div ref={scorecardRef}>`). Check if it's defined — search for `scorecardRef` in the file.

If it exists, use it. If not, add:
```tsx
const scorecardRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Add useEffect for scroll-on-complete**

After the existing status-related effects, add:
```tsx
// Mobile: scroll to ScoreCard when analysis completes
useEffect(() => {
  if (status === "complete" && window.innerWidth < 768) {
    setTimeout(() => {
      scorecardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }
}, [status]);
```

- [ ] **Step 3: Verify the ref is on the right element**

Confirm `scorecardRef` is attached to the div wrapping `<ScoreCard>` in the right panel (line 893). It already is.

- [ ] **Step 4: Verify build compiles**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: auto-scroll to ScoreCard on mobile after analysis completes"
```

---

## Chunk 6: Pass 6 — Start Over Confirmation Dialog

### Task 6: Add AlertDialog before Start Over

**Files:**
- Modify: `src/components/ScoreCard.tsx`

- [ ] **Step 1: Import AlertDialog**

Add import:
```tsx
import { AlertDialog } from "./ui/AlertDialog";
```

- [ ] **Step 2: Add confirmation dialog state**

In the component body, add:
```tsx
const [startOverOpen, setStartOverOpen] = useState(false);
```

- [ ] **Step 3: Change OverflowMenu Start Over item**

Change the Start Over item's `onClick` from:
```tsx
{ label: "Start Over", onClick: onStartOver, icon: <RotateCcw size={14} />, destructive: true }
```
To:
```tsx
{ label: "Start Over", onClick: () => setStartOverOpen(true), icon: <RotateCcw size={14} />, destructive: true }
```

- [ ] **Step 4: Render AlertDialog**

Add just before the closing `</div>` of the ScoreCard root:
```tsx
<AlertDialog
  open={startOverOpen}
  onClose={() => setStartOverOpen(false)}
  onConfirm={() => { if (onStartOver) onStartOver(); }}
  title="Start over?"
  description="This will clear your current analysis. You can find it in History."
  confirmLabel="Start Over"
  cancelLabel="Cancel"
  variant="destructive"
/>
```

- [ ] **Step 5: Verify build compiles**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/components/ScoreCard.tsx
git commit -m "feat: add confirmation dialog before Start Over"
```

---

## Post-Implementation Verification

- [ ] **Run full build:** `npx vite build`
- [ ] **Run TypeScript check:** `npm run lint`
- [ ] **Screenshot results page at 1280px** via chrome-devtools-mcp
- [ ] **Screenshot results page at 375px** via chrome-devtools-mcp
- [ ] **Verify action row shows 3 buttons horizontally on desktop, stacked on mobile**
- [ ] **Verify Start Over shows confirmation dialog**
- [ ] **Verify MetricBars use token-based colors (inspect element)**
- [ ] **Verify no horizontal scroll on mobile**
- [ ] **Verify collapsible sections all start collapsed (except none)**
- [ ] **Verify glass card surface still renders correctly**
