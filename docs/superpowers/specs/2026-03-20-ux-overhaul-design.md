# Cutsheet UX Overhaul — Design Spec

**Date:** 2026-03-20
**Status:** Approved (user-specified)
**Scope:** 8 pages of changes across upload, analysis, results, navigation

---

## Philosophy

Strip pre-upload state to essentials. Auto-detect everything. Push complexity to post-analysis results. Three-tier progressive disclosure on results panels.

## Audit Baseline

### Screenshots
Saved to `docs/ux-audit-screenshots/` — 12 screenshots across 7 pages at 1440px and 375px.

### A11y Issues (Lighthouse score: 90/100)
- **button-name**: 2 unlabeled buttons (Second Eye toggle, sidebar collapse)
- **color-contrast**: 34 elements — sidebar subtitles `rgb(82,82,91)` on dark bg, format pills `text-zinc-500` on `bg-white/5`
- **label-content-name-mismatch**: Profile button and upload zone aria-label don't match visible text

---

## PAGE 1: Paid Ad Analyzer — Upload State

**File:** `src/pages/app/PaidAdAnalyzer.tsx`

### Remove
- "Analyzing for:" label and all platform pills (General, Meta, TikTok, Google, YouTube)
- Platform selector from pre-upload state entirely — run analysis for ALL platforms automatically
- Platform context pills appear ONLY on results, as post-analysis filters
- Second Eye toggle from header — runs automatically on every analysis
- Design Review toggle — runs automatically on every analysis

### Clean Header (TopBar)
Keep only:
- Cutsheet logo/wordmark (left)
- History icon (top right)
- New Analysis button (top right)
- User avatar (top right)

### Upload Zone
- Keep current structure (already good)
- Add Cutsheet app icon (48px, subtle) above "Drop your creative here"
- Keep file format pills
- Keep keyboard shortcut hint

---

## PAGE 2: Format Detection — Auto-Switch

**File:** `src/pages/app/PaidAdAnalyzer.tsx`

### Remove
- Blocking format mismatch modal entirely

### Add
- Auto-detect file type on drop: `image/*` → Static, `video/*` → Video
- Set `analysisType` silently (no user confirmation)
- Dismissible toast (bottom-right): "Detected static image — analyzing as Static"
- Toast style: `bg rgba(24,24,27,0.9)`, `border rgba(255,255,255,0.08)`, 3s auto-dismiss

---

## PAGE 3: Loading State

**File:** `src/pages/app/PaidAdAnalyzer.tsx` (loading section)

### Changes
1. Replace empty circle with Cutsheet app icon (64px, pulse animation: opacity 0.5→1→0.5, 1.5s ease-in-out loop)
2. Replace flat skeleton bars with shimmer skeletons:
   - Score arc: circular skeleton, 96px, `rgba(255,255,255,0.06)` with shimmer
   - 4 dimension cells: rectangle skeletons matching grid layout
   - Shimmer: `background linear-gradient` moving left→right, 1.5s loop
3. Progressive loading labels:
   - "Scoring hook strength..."
   - "Analyzing message clarity..."
   - "Checking CTA effectiveness..."
   - "Evaluating production quality..."
   - Each label fades in as step starts
4. Layout: 50/50 split — creative on left, loading state on right (remove dead space)

---

## PAGE 4: Results — Right Panel (ScoreCard)

**File:** `src/components/ScoreCard.tsx`

### Tier 1 (Always Visible, Above Fold)
- Score ring (full 360deg, semantic color, animated fill on load)
- Benchmark badge: "↑ 2.8 pts above avg static ads"
- 2x2 dimension grid (Hook, Message Clarity, CTA, Production)
- ONE adaptive CTA button (Fix It For Me OR Share based on score)

### Tier 2 (Collapsed by Default)
- Key Insights (renamed from "Improve This Ad") with count badge
- Predicted Performance (collapsed, shows verdict inline: "Above Average")
- Budget (collapsed, shows range inline: "$28–$84/day")

### Tier 3 (Deep Dive Strip at Bottom)
- Pills: Ad Checks | Copy Breakdown | Emotional Tone | Scenes (video only)

### Remove from Right Panel
- Duplicate improvements list
- "Start Over" button (move to overflow menu)
- Platform filter tabs at top of right panel

### Right Panel Header
- "Score Overview" + timestamp
- "Gemini + Claude" model badge (keep)
- Copy results button
- Analysis / History tab switcher

---

## PAGE 5: Results — Left Panel (Analysis)

**File:** `src/pages/app/PaidAdAnalyzer.tsx` (analysis sections)

### Remove
- "ANALYSIS" section header label
- Visual Copy Inventory section (remove entirely)
- Quick Scores section (duplicates right panel)

### Merge
- Hook Detail + Hook Analysis → ONE card "Hook Analysis":
  - Row 1: Hook Type pill + Hook Verdict pill
  - Row 2: "First Glance:" + description
  - Row 3: "Hook Strength:" + value
  - Row 4: "Scroll-Stop Factor:" + description
  - Row 5: "Hook Fix:" + value (only if fix needed)

### Section Order
- **EXPANDED**: Hook Analysis (merged)
- **COLLAPSED**: Visual Hierarchy, Messaging Structure
- **MOVED to SlideSheet**: Emotional Impact → "Emotional Tone" tab

### Section Headers
Replace emoji + ALL CAPS with Lucide icon + sentence case:
- `[Zap]` Hook Analysis
- `[Layers]` Visual Hierarchy
- `[MessageSquare]` Message Structure
- `[Star]` Creative Verdict

### Visualize It Button
- Move to LEFT PANEL, directly below creative thumbnail
- Style: gradient border button (green→indigo→blue), NOT solid fill
- Sub-label: "AI Art Director" in 11px muted text

### Re-analyze Improved Version
- On click: show drop zone BELOW current creative (inline)
- On upload: update analysis IN PLACE
- Show diff panel below ScoreCard: "Hook: 7 → 9 (+2)" in emerald
- History records both versions with timestamps

---

## PAGE 6: Video vs Static Conditional Layout

Pass `analysisType: 'video' | 'static'` to all section components.

### Video ONLY
- Scene Breakdown
- Hook timing analysis (first 3 seconds)
- Retention curve prediction
- Audio / voiceover analysis
- Pacing notes

### Static ONLY
- Visual hierarchy flow
- Copy density analysis
- Typography & layout (Design Review output)
- Above-fold analysis

### Shared (Both)
- Hook Analysis, Key Insights, Message Structure, Creative Verdict
- Budget, Performance Forecast, Fix It For Me, Visualize It, Ad Quality Checks

---

## PAGE 7: Other Analyzer Pages Consistency

**Files:** `src/pages/app/OrganicAnalyzer.tsx`, `src/pages/app/DisplayAnalyzer.tsx`

Apply same changes:
1. Remove platform pills from pre-upload state
2. Remove toggles
3. Same section naming (sentence case, Lucide icons)
4. Same collapse behavior (Hook open, rest collapsed)
5. Same ScoreCard 3-tier architecture
6. Same Visualize It placement (below creative)

---

## PAGE 8: Navigation + Global

**Files:** `src/components/Sidebar.tsx`, `src/components/ui/BottomTabBar.tsx`

### Sidebar Renames
- "Deconstructor" → "Ad Breakdown"
- "Policy Checker" → "Ad Policy Check"
- Keep all icons

### Mobile Nav
- 4 tabs: Analyze | History | Swipe File | Settings
- Tab labels always visible (never icon-only)
- A/B Test accessible from Analyze section or as 5th tab

---

## A11y Fixes (Bundled)

- Add `aria-label` to Second Eye toggle and sidebar collapse button
- Fix sidebar subtitle contrast: `rgb(82,82,91)` → `rgb(161,161,170)` (zinc-400)
- Fix format pill contrast: `text-zinc-500` → `text-zinc-400`
- Fix label-content mismatch on profile button and upload zone
