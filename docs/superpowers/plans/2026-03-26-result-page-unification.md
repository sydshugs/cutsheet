# Result Page Unification — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Organic and Display result pages look exactly like the Paid Ad result page — same two-column layout, same ScoreCard, same section order. Only content differs.

**Architecture:** ScoreCard gains a `dimensionOverrides` prop for Display's 5 dimensions. OrganicAnalyzer wires missing ScoreCard props. DisplayAnalyzer replaces custom DisplayScoreCard with standard ScoreCard. DisplayScoreCard.tsx is deleted after type migration.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, framer-motion, CSS custom properties from tokens.css

**Spec:** `docs/superpowers/specs/2026-03-26-result-page-unification-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/ScoreCard.tsx` | Modify | Add `dimensionOverrides` prop, update ScoreHero dimensions + handleCopy |
| `src/types/display.ts` | Create | Receive `DisplayResult` type from DisplayScoreCard.tsx |
| `src/pages/app/OrganicAnalyzer.tsx` | Modify | Wire missing ScoreCard props (verdict, analysisSections, brief, platformSwitcher, etc.) |
| `src/pages/app/DisplayAnalyzer.tsx` | Modify | Replace DisplayScoreCard with ScoreCard, remove gradient orbs |
| `src/components/DisplayScoreCard.tsx` | Delete | Replaced by standard ScoreCard with dimensionOverrides |

---

## Chunk 1: ScoreCard + Type Migration

### Task 1: Add `dimensionOverrides` prop to ScoreCard

**Files:**
- Modify: `src/components/ScoreCard.tsx:30-86` (interface), `src/components/ScoreCard.tsx:164-210` (destructure), `src/components/ScoreCard.tsx:318-323` (ScoreHero dimensions), `src/components/ScoreCard.tsx:230-265` (handleCopy)

- [ ] **Step 1: Add `dimensionOverrides` to ScoreCardProps interface**

In `src/components/ScoreCard.tsx`, add to the interface after line 85 (`analysisSections`):

```tsx
// After line 85 (analysisSections)
// Dimension overrides — when provided, ScoreHero uses these instead of scores.hook/clarity/etc.
dimensionOverrides?: { name: string; score: number }[];
```

- [ ] **Step 2: Add `dimensionOverrides` to destructured props**

In the component function destructuring (around line 209), add `dimensionOverrides` after `analysisSections`:

```tsx
  analysisSections,
  dimensionOverrides,
}: ScoreCardProps) {
```

- [ ] **Step 3: Update ScoreHero to use dimensionOverrides when present**

Replace lines 318-323:

```tsx
// Before:
dimensions={[
  { name: "Hook",   score: scores.hook },
  { name: "Copy",   score: scores.clarity },
  { name: "Visual", score: scores.production },
  { name: "CTA",    score: scores.cta },
]}

// After:
dimensions={dimensionOverrides ?? [
  { name: "Hook",   score: scores.hook },
  { name: "Copy",   score: scores.clarity },
  { name: "Visual", score: scores.production },
  { name: "CTA",    score: scores.cta },
]}
```

- [ ] **Step 4: Update handleCopy to use dimensionOverrides when present**

Replace the hardcoded dimension lines in handleCopy (lines 235-238):

```tsx
// Before:
lines.push(`Hook Strength: ${scores.hook}/10`);
lines.push(`Message Clarity: ${scores.clarity}/10`);
lines.push(`CTA Effectiveness: ${scores.cta}/10`);
lines.push(`Production: ${scores.production}/10`);

// After:
if (dimensionOverrides) {
  dimensionOverrides.forEach(d => lines.push(`${d.name}: ${d.score}/10`));
} else {
  lines.push(`Hook Strength: ${scores.hook}/10`);
  lines.push(`Message Clarity: ${scores.clarity}/10`);
  lines.push(`CTA Effectiveness: ${scores.cta}/10`);
  lines.push(`Production: ${scores.production}/10`);
}
```

- [ ] **Step 5: Verify build passes**

Run: `npm run lint`
Expected: 0 errors. No existing ScoreCard consumers break because `dimensionOverrides` is optional.

- [ ] **Step 6: Commit**

```bash
git add src/components/ScoreCard.tsx
git commit -m "feat(ScoreCard): add dimensionOverrides prop for flexible dimension display"
```

---

### Task 2: Create `src/types/display.ts` with DisplayResult type

**Files:**
- Create: `src/types/display.ts`
- Modify: `src/pages/app/DisplayAnalyzer.tsx:11` (import path)

- [ ] **Step 1: Create the type file**

Create `src/types/display.ts`:

```tsx
/** Display ad analysis result — returned by the Gemini analysis API for banner ads */
export interface DisplayResult {
  overallScore: number;
  scores: {
    hierarchy: number;
    ctaVisibility: number;
    brandClarity: number;
    messageClarity: number;
    visualContrast: number;
  };
  textToImageRatio: string;
  textRatioFlag: boolean;
  improvements: { fix: string; category: string; severity: string }[];
  formatNotes: string;
  verdict: string;
  placementRisk: "low" | "medium" | "high";
  placementRiskNote: string;
}
```

- [ ] **Step 2: Update DisplayAnalyzer import**

In `src/pages/app/DisplayAnalyzer.tsx` line 11, change:

```tsx
// Before:
import { DisplayScoreCard, type DisplayResult } from "../../components/DisplayScoreCard";

// After:
import { DisplayScoreCard } from "../../components/DisplayScoreCard";
import type { DisplayResult } from "../../types/display";
```

- [ ] **Step 3: Update DisplayScoreCard to import from types**

In `src/components/DisplayScoreCard.tsx`, remove the `DisplayResult` interface (lines 10-26) and add import:

```tsx
// Add at top after existing imports:
import type { DisplayResult } from "../types/display";

// Remove the export interface DisplayResult { ... } block (lines 10-26)
// Keep the `export` on the component function
```

- [ ] **Step 4: Verify build passes**

Run: `npm run lint`
Expected: 0 errors. Type imports resolve correctly.

- [ ] **Step 5: Commit**

```bash
git add src/types/display.ts src/pages/app/DisplayAnalyzer.tsx src/components/DisplayScoreCard.tsx
git commit -m "refactor: move DisplayResult type to src/types/display.ts"
```

---

## Chunk 2: Wire Organic ScoreCard Props

### Task 3: Wire missing props in OrganicAnalyzer

**Files:**
- Modify: `src/pages/app/OrganicAnalyzer.tsx:1-8` (imports), `src/pages/app/OrganicAnalyzer.tsx:615-641` (ScoreCard usage)

- [ ] **Step 1: Add extractRightPanelSections import**

In `src/pages/app/OrganicAnalyzer.tsx`, add after the existing imports (around line 8):

```tsx
import { extractRightPanelSections } from "../../components/ReportCards";
import { AlertDialog } from "../../components/ui/AlertDialog";
```

Note: `AlertDialog` is needed for the onStartOver confirmation pattern.

- [ ] **Step 2: Add `PlatformSwitcher` import if not already present**

Check existing imports — OrganicAnalyzer already imports `ORGANIC_STATIC_PLATFORMS` and `VIDEO_ONLY_PLATFORMS` from PlatformSwitcher (line 27). Add `PlatformSwitcher` component import:

```tsx
// Update line 27 from:
import { ORGANIC_STATIC_PLATFORMS, VIDEO_ONLY_PLATFORMS } from "../../components/PlatformSwitcher";

// To:
import { PlatformSwitcher, ORGANIC_STATIC_PLATFORMS, VIDEO_ONLY_PLATFORMS } from "../../components/PlatformSwitcher";
```

- [ ] **Step 3: Add confirmStartOver state**

Add near other state declarations (around line 133):

```tsx
const [confirmStartOver, setConfirmStartOver] = useState(false);
```

- [ ] **Step 4: Compute verdict from score**

Add a computed verdict before the ScoreCard JSX. Find the `activeResult` derivation (it's used in the ScoreCard props). Add just before the right panel JSX (around line 610):

```tsx
// Compute verdict from score — Organic AI doesn't return structured verdict
const computedVerdict = activeResult?.scores ? (() => {
  const s = activeResult.scores.overall;
  return {
    state: (s >= 8 ? 'ready' : s >= 5 ? 'needs_work' : 'not_ready') as 'ready' | 'needs_work' | 'not_ready',
    headline: s >= 8 ? 'Ready to post' : s >= 5 ? 'Needs refinement' : 'Not ready',
    sub: 'Organic content',
  };
})() : undefined;
```

- [ ] **Step 5: Wire all missing props to ScoreCard**

Replace the ScoreCard usage (lines 615-641) with:

```tsx
<ScoreCard
  scores={activeResult.scores}
  hookDetail={activeResult.hookDetail}
  improvements={activeResult.improvements}
  hashtags={activeResult.hashtags}
  scenes={activeResult.scenes}
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
  format={organicFormat}
  isOrganic={true}
  niche={rawUserContext?.niche}
  platform={rawUserContext?.platform}
  onFixIt={handleFixIt}
  fixItResult={fixItResult}
  fixItLoading={fixItLoading}
  prediction={prediction}
  onReanalyze={handleReset}
  canVisualize={false}
  // ── Newly wired props ──
  verdict={computedVerdict}
  analysisSections={activeResult.markdown ? extractRightPanelSections(activeResult.markdown) : undefined}
  briefLoading={briefLoading}
  hasBrief={!!brief}
  improvementsLoading={false}
  onStartOver={() => setConfirmStartOver(true)}
  onNavigateSettings={() => navigate('/settings')}
  isPro={isPro}
  onUpgradeRequired={onUpgradeRequired}
  platformScore={platform !== "all" && platformScores.length > 0
    ? platformScores.find(ps => ps.platform === platform)?.score
    : undefined}
  platformSwitcher={
    <PlatformSwitcher
      platforms={organicFormat === "static" ? ORGANIC_STATIC_PLATFORMS : VIDEO_ONLY_PLATFORMS}
      selected={platform}
      onChange={(p) => setPlatform(p as Platform)}
      disabled={false}
    />
  }
/>
```

- [ ] **Step 6: Add AlertDialog for Start Over confirmation**

Add just before the closing of the right panel section (after the ScoreCard closing `</div>` around line 642), inside the same conditional block:

```tsx
<AlertDialog
  open={confirmStartOver}
  onClose={() => setConfirmStartOver(false)}
  onConfirm={() => {
    setConfirmStartOver(false);
    handleReset();
  }}
  title="Start over?"
  description="This will clear your current analysis. You can always re-analyze the same file."
  confirmLabel="Start Over"
  variant="destructive"
/>
```

- [ ] **Step 7: Verify build passes**

Run: `npm run lint`
Expected: 0 errors. All newly referenced variables (`briefLoading`, `brief`, `isPro`, `onUpgradeRequired`, `navigate`, `platformScores`, `platform`, `setPlatform`) are already declared in OrganicAnalyzer.

- [ ] **Step 8: Commit**

```bash
git add src/pages/app/OrganicAnalyzer.tsx
git commit -m "feat(Organic): wire all missing ScoreCard props to match Paid Ad reference"
```

---

## Chunk 3: Display Analyzer Restructure

### Task 4: Replace DisplayScoreCard with standard ScoreCard in DisplayAnalyzer

**Files:**
- Modify: `src/pages/app/DisplayAnalyzer.tsx:1-28` (imports), `src/pages/app/DisplayAnalyzer.tsx:780-782` (gradient orbs), `src/pages/app/DisplayAnalyzer.tsx:1160-1253` (right panel)

- [ ] **Step 1: Update imports**

In `src/pages/app/DisplayAnalyzer.tsx`:

Replace the DisplayScoreCard import (line 11) and add AlertDialog:
```tsx
// Before:
import { DisplayScoreCard, type DisplayResult } from "../../components/DisplayScoreCard";

// After:
import { ScoreCard } from "../../components/ScoreCard";
import type { DisplayResult } from "../../types/display";
import { AlertDialog } from "../../components/ui/AlertDialog";
```

Also add `confirmStartOverDisplay` state near other state declarations:
```tsx
const [confirmStartOverDisplay, setConfirmStartOverDisplay] = useState(false);
```

- [ ] **Step 2: Remove gradient blur orbs from single mode**

Remove lines 781-782 (the two `pointer-events-none absolute ... blur-[120px]` divs):

```tsx
// DELETE these two lines:
<div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
<div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.08] blur-[100px]" />
```

- [ ] **Step 3: Replace right panel content**

Replace the right panel content (lines 1162-1253) — everything inside the conditional `{mode === "single" && status === "complete" && result && ( ... )}`:

```tsx
{mode === "single" && status === "complete" && result && (
  <>
    <ScoreCard
      scores={{ hook: 0, clarity: 0, cta: 0, production: 0, overall: result.overallScore }}
      dimensionOverrides={[
        { name: "Hierarchy", score: result.scores.hierarchy },
        { name: "CTA",       score: result.scores.ctaVisibility },
        { name: "Brand",     score: result.scores.brandClarity },
        { name: "Message",   score: result.scores.messageClarity },
        { name: "Contrast",  score: result.scores.visualContrast },
      ]}
      verdict={{
        state: result.overallScore >= 8 ? 'ready' : result.overallScore >= 4 ? 'needs_work' : 'not_ready',
        headline: result.verdict,
        sub: 'Google Display',
      }}
      improvements={result.improvements.map(i => i.fix)}
      fileName={file?.name}
      engineBudget={engineBudget}
      briefLoading={briefLoading}
      hasBrief={!!briefMarkdown}
      onGenerateBrief={handleGenerateBrief}
      prediction={prediction}
      onReanalyze={handleReset}
      onStartOver={() => setConfirmStartOverDisplay(true)}
      format="static"
      niche={userContext.match(/Niche:\s*(.+)/)?.[1]?.trim()}
      platform="Google Display"
      onCheckPolicies={handleCheckPolicies}
      policyLoading={policyLoading}
      onVisualize={handleVisualize}
      visualizeLoading={visualizeStatus === "loading"}
      canVisualize={true}
      isPro={isPro}
      onUpgradeRequired={onUpgradeRequired}
      improvementsLoading={false}
      isDark={true}
    />

    {/* Brief output — ScoreCard renders the button but not the content */}
    {briefError && (
      <div className="mx-4 mt-2 text-xs text-red-400 bg-red-500/[0.08] rounded-xl px-4 py-3 border border-red-500/20">{briefError}</div>
    )}
    {briefMarkdown && (
      <div className="mx-4 mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{briefMarkdown}</div>
    )}

    {/* Policy results */}
    {policyError && (
      <div className="mx-4 mt-2 text-xs text-red-400 bg-red-500/[0.08] rounded-xl px-4 py-3 border border-red-500/20">{policyError}</div>
    )}
    {policyResult && (
      <div className="px-4 mt-4">
        <PolicyCheckPanel result={policyResult} onClose={() => setPolicyResult(null)} />
      </div>
    )}

    {/* Visualize Panel */}
    {(visualizeOpen || visualizeStatus !== "idle") && (
      <div className="px-4 mt-4 pb-4">
        <VisualizePanel
          status={visualizeStatus}
          result={visualizeResult}
          originalImageUrl={previewUrl}
          error={visualizeError}
          creditData={visualizeCreditData}
          onClose={() => { setVisualizeOpen(false); setVisualizeStatus("idle"); setVisualizeResult(null); setVisualizeError(null); setVisualizeCreditData(null); }}
          onUpgrade={onUpgradeRequired}
        />
      </div>
    )}

    {/* Start Over confirmation */}
    <AlertDialog
      open={confirmStartOverDisplay}
      onClose={() => setConfirmStartOverDisplay(false)}
      onConfirm={() => {
        setConfirmStartOverDisplay(false);
        handleReset();
      }}
      title="Start over?"
      description="This will clear your current analysis. You can always re-analyze the same file."
      confirmLabel="Start Over"
      variant="destructive"
    />
  </>
)}
```

- [ ] **Step 4: Remove unused imports**

After replacing DisplayScoreCard usage, remove these imports:
- `BudgetCard` (line 27) — only used at line 1219 inside the replaced right panel. Safe to remove.
- `PredictedPerformanceCard` (line 26) — only used at line 1208 inside the replaced right panel. Safe to remove.
- `DisplayScoreCard` import line (already replaced in Step 1)

**DO NOT remove** these — they are still used in the preserved right panel content and/or left panel:
- `PolicyCheckPanel` — used in the new right panel content (preserved above)
- `VisualizePanel` — used in the new right panel content (preserved above)
- `FileText`, `RotateCcw` — may still be used elsewhere in the file

- [ ] **Step 5: Verify build passes**

Run: `npm run lint`
Expected: 0 errors. The `isPro`, `onUpgradeRequired`, `briefLoading`, `briefMarkdown`, `engineBudget`, `prediction`, `handleGenerateBrief`, `handleCheckPolicies`, `policyLoading`, `handleVisualize`, `visualizeStatus`, `handleReset`, `userContext` variables are all already declared in DisplayAnalyzer.

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/DisplayAnalyzer.tsx
git commit -m "feat(Display): replace DisplayScoreCard with standard ScoreCard + dimensionOverrides"
```

---

### Task 5: Delete DisplayScoreCard.tsx

**Files:**
- Delete: `src/components/DisplayScoreCard.tsx`

- [ ] **Step 1: Verify no remaining imports of DisplayScoreCard**

Run: `grep -rn "DisplayScoreCard" src/`
Expected: 0 matches (all imports were updated in Tasks 2 and 4).

- [ ] **Step 2: Delete the file**

```bash
rm src/components/DisplayScoreCard.tsx
```

- [ ] **Step 3: Verify build passes**

Run: `npm run lint`
Expected: 0 errors. No references remain.

- [ ] **Step 4: Commit**

```bash
git add -u src/components/DisplayScoreCard.tsx
git commit -m "chore: delete DisplayScoreCard.tsx — replaced by standard ScoreCard"
```

---

## Chunk 4: Visual Polish Pass (Multi-Ad Pages)

### Task 6: Remove gradient orbs from Display suite mode

**Files:**
- Modify: `src/pages/app/DisplayAnalyzer.tsx:574-575`

- [ ] **Step 1: Find and remove suite mode gradient orbs**

Search for `pointer-events-none absolute` + `blur-` in the suite mode section (around lines 574-575). Remove them.

- [ ] **Step 2: Verify build passes**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/DisplayAnalyzer.tsx
git commit -m "fix(Display): remove gradient blur orbs from suite mode"
```

---

### Task 7: Multi-ad page visual consistency audit

**Files:**
- Audit: `src/components/BatchView.tsx`, `src/components/PreFlightView.tsx`, `src/pages/app/Deconstructor.tsx`

- [ ] **Step 1: Audit BatchView.tsx**

Search for:
- Remaining gradient blur orbs (`pointer-events-none absolute` + `blur-`)
- Card containers not using `border-white/[0.06]` + `bg-white/[0.015]` + `rounded-2xl`
- Score numbers not using `font-mono`
- Action buttons not using `bg-indigo-500/[0.08] text-indigo-400 border-indigo-500/20 rounded-xl`
- Hardcoded hex values in JSX

Fix any deviations found.

- [ ] **Step 2: Audit PreFlightView.tsx**

Same checks as Step 1.

- [ ] **Step 3: Audit Deconstructor.tsx**

Same checks as Step 1.

- [ ] **Step 4: Verify build passes**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/BatchView.tsx src/components/PreFlightView.tsx src/pages/app/Deconstructor.tsx
git commit -m "style: visual consistency pass — card chrome, font-mono scores, indigo buttons"
```

---

## Chunk 5: Verification

### Task 8: Full verification pass

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: 0 errors, 0 warnings (or only pre-existing warnings).

- [ ] **Step 2: Run TypeScript check**

```bash
npm run lint
```

Expected: 0 errors.

- [ ] **Step 3: Verify icon/component imports**

For every file modified, run:
```bash
grep -n "<[A-Z][a-zA-Z]*" src/components/ScoreCard.tsx | grep -v "^.*import"
grep -n "^import" src/components/ScoreCard.tsx
```

Repeat for `OrganicAnalyzer.tsx`, `DisplayAnalyzer.tsx`. Every component/icon used in JSX must appear in imports.

- [ ] **Step 4: Verify no DisplayScoreCard references remain**

```bash
grep -rn "DisplayScoreCard" src/
```

Expected: 0 matches.

- [ ] **Step 5: Verify no hardcoded hex values were introduced**

```bash
grep -n "#[0-9a-fA-F]\{6\}" src/components/ScoreCard.tsx src/pages/app/OrganicAnalyzer.tsx src/pages/app/DisplayAnalyzer.tsx
```

Only pre-existing values in score color functions are acceptable. No new hardcoded hex in JSX.

- [ ] **Step 6: Visual verification**

Start dev server (`npm run dev`) and verify:
1. Paid Ad page — unchanged, still works as reference
2. Organic page — right panel now shows verdict, analysis sections, brief button, platform switcher, start over confirmation
3. Display page — right panel uses standard ScoreCard with 5 Display dimensions, no gradient orbs
4. Multi-ad pages — no gradient orbs, consistent card styling

---

## Summary

| Task | Files | What it does |
|------|-------|-------------|
| 1 | ScoreCard.tsx | Add `dimensionOverrides` prop |
| 2 | types/display.ts, DisplayScoreCard.tsx, DisplayAnalyzer.tsx | Migrate DisplayResult type |
| 3 | OrganicAnalyzer.tsx | Wire all missing ScoreCard props |
| 4 | DisplayAnalyzer.tsx | Replace DisplayScoreCard with ScoreCard |
| 5 | DisplayScoreCard.tsx | Delete obsolete component |
| 6 | DisplayAnalyzer.tsx | Remove suite mode gradient orbs |
| 7 | BatchView, PreFlightView, Deconstructor | Visual consistency audit |
| 8 | All modified files | Full verification pass |
