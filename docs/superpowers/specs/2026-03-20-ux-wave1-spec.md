# UX Overhaul Wave 1 — Paid Ad Analyzer

**Goal:** Eliminate pre-upload decision paralysis and post-analysis information overload by removing 5 sources of friction.

**Source:** Notion audit "UX Overhaul — Paid Ad Analyzer Full Audit"

---

## Change 1: Remove Platform Pills from Pre-Upload State

**Current:** IntentHeader shows 8 platform/format pills + "Analyzing for:" label before user uploads anything. Creates decision paralysis.

**Fix:**
- Remove the entire IntentHeader from rendering when `status === "idle"` (no file selected, no analysis running)
- IntentHeader only appears AFTER analysis completes, as result filters
- Default: analyze for all platforms simultaneously
- When IntentHeader is hidden, platform defaults to `"all"` and format auto-detects from file

**Files:** `src/pages/app/PaidAdAnalyzer.tsx`

---

## Change 2: Remove Second Eye + Design Review Toggles

**Current:** Two toggles in IntentHeader — "Second Eye" (video) and "Design Review" (static) — both off by default.

**Fix:**
- Remove both toggle UI elements from IntentHeader
- Set `secondEye` and `staticSecondEye` to `true` always (hardcode)
- Remove the state variables for these — they're always on
- Second Eye and Design Review run automatically on every analysis

**Files:** `src/pages/app/PaidAdAnalyzer.tsx`

---

## Change 3: Auto-Switch Format Detection

**Current:** When user uploads an image with Video format selected (or vice versa), a blocking modal appears requiring a decision.

**Fix:**
- In `handleFileWithFormatCheck`, detect mismatch silently
- Auto-switch format to match the file type
- Show a dismissible toast: "Detected static image — analyzing as Static" (or "Detected video — analyzing as Video")
- Remove the blocking mismatch UI entirely
- Toast auto-dismisses after 3 seconds

**Files:** `src/pages/app/PaidAdAnalyzer.tsx`

---

## Change 4: Merge Hook Detail + Hook Analysis

**Current:** `HookDetailCard` is a separate sub-component showing hook verdict, type, first impression, and fix suggestion. This duplicates info that should be in one "Hook Analysis" card.

**Fix:**
- Create a unified "Hook Analysis" card layout:
  - Top row: Hook Type pill + Hook Verdict pill
  - First Glance: one sentence description
  - Hook Strength: label
  - Scroll-Stop Factor: one sentence
  - Hook Fix: only if needed, else omit (amber box)
- This replaces the current `HookDetailCard` sub-component in ScoreCard
- The left panel's Hook Analysis section (in AnalyzerView/ReportCards) stays as-is — it's a different view

**Files:** `src/components/scorecard/HookDetailCard.tsx`, `src/components/ScoreCard.tsx`

---

## Change 5: Remove Visual Copy Inventory + Consolidate Improvements

**Current:**
- Left panel shows "Visual Copy Inventory" section (list of every text element) — not useful for performance marketers
- Right panel shows "Improve This Ad" duplicate of left panel's improvements
- Right panel has both FixIt button AND improvements list

**Fix:**
- Remove Visual Copy Inventory from left panel entirely (from AnalyzerView/ReportCards rendering)
- Remove the `ImprovementsList` component rendering from ScoreCard (right panel)
- Right panel shows ONLY the primary action button (Fix It For Me / Polish It) — no duplicate improvements
- Left panel's "Key Insights" section remains as the single source of improvements

**Files:** `src/components/ScoreCard.tsx`, `src/components/AnalyzerView.tsx` (or wherever left panel sections render)

---

## Testing Strategy

- Existing UI component tests must still pass (73 tests)
- Manual verification via Playwright screenshots at 375px (mobile) and 1440px (desktop)
- Verify: user can upload → get analysis → see results with zero pre-upload decisions

## Out of Scope (Wave 2)

- Visualize It relocation
- Inline re-analyze diff view
- Video vs Static conditional layout
- Loading state skeleton improvements
