# UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip pre-upload clutter, auto-detect format, redesign loading/results with 3-tier progressive disclosure, and unify all analyzer pages.

**Architecture:** Edit existing components in-place. No new routing or state management. Changes are primarily UI simplification (removing elements) and restructuring the results layout. Second Eye and Design Review become always-on (no toggles), format detection becomes auto-switch with toast.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, framer-motion, lucide-react, CVA

---

## Chunk 1: Upload State Cleanup (Pages 1-2)

### Task 1: Remove IntentHeader and auto-enable Second Eye / Design Review

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx:88-234` (delete IntentHeader component)
- Modify: `src/pages/app/PaidAdAnalyzer.tsx:301-308` (change state defaults)
- Modify: `src/pages/app/PaidAdAnalyzer.tsx:949` (remove IntentHeader usage in render)

- [ ] **Step 1: Remove IntentHeader component definition (lines 88-234)**

Delete the entire `IntentHeader` function component. It renders platform pills, format pills, and toggle switches — all being removed.

- [ ] **Step 2: Set Second Eye and Design Review to always-on**

In the main component state (around line 301-308), change:
```tsx
// BEFORE:
const [secondEye, setSecondEye] = useState(false);
const [staticSecondEye, setStaticSecondEye] = useState(false);

// AFTER:
const secondEye = true;  // Always on — no toggle
const staticSecondEye = true;  // Always on — no toggle
```

Remove `setSecondEye` and `setStaticSecondEye` from all references.

- [ ] **Step 3: Remove IntentHeader from render (line 949)**

Delete this line from the render:
```tsx
<IntentHeader platform={platform} setPlatform={setPlatform} format={format} setFormat={setFormat} secondEye={secondEye} setSecondEye={setSecondEye} staticSecondEye={staticSecondEye} setStaticSecondEye={setStaticSecondEye} onPlatformReset={(oldPlatform) => setPlatformResetToast(`Platform reset to All — ${oldPlatform} isn't available for static ads`)} />
```

- [ ] **Step 4: Remove unused imports and state**

Remove `PlatformSwitcher, PAID_AD_PLATFORMS` import (line 26).
Remove `PLATFORM_COMPAT`, `FORMATS` constants (lines 61-76).
Remove `platformResetToast` state and its setter.
Keep `platform` state — it's still used for API calls (default to "all").
Change initial platform: `const [platform, setPlatform] = useState<Platform>("all");`

- [ ] **Step 5: Verify in browser at 1440px and 375px**

Navigate to http://localhost:3000/app/paid — confirm:
- No platform pills visible
- No Second Eye / Design Review toggles
- Clean header with just logo, history, new analysis, avatar

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: remove IntentHeader — platform pills, format pills, and toggles"
```

---

### Task 2: Replace format mismatch modal with auto-detect + toast

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx` (handleFileWithFormatCheck function ~line 602)
- Modify: `src/pages/app/PaidAdAnalyzer.tsx` (remove modal JSX ~line 953-978)

- [ ] **Step 1: Rewrite handleFileWithFormatCheck to auto-switch silently**

Replace the function (around line 602-622):
```tsx
const handleFileWithFormatCheck = useCallback((f: File | null) => {
  if (!f) { handleReset(); return; }

  const fileIsVideo = f.type.startsWith("video/") || [".mp4", ".mov", ".webm"].some(e => f.name.toLowerCase().endsWith(e));
  const fileIsImage = f.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].some(e => f.name.toLowerCase().endsWith(e));

  // Auto-detect format — no modal, no confirmation
  if (fileIsImage && format !== "static") {
    setFormat("static" as Format);
    if (platform === "YouTube" || platform === "TikTok") setPlatform("all");
    setInfoToast("Detected static image — analyzing as Static");
    setTimeout(() => setInfoToast(null), 3000);
  } else if (fileIsVideo && format !== "video") {
    setFormat("video" as Format);
    setInfoToast("Detected video — analyzing as Video");
    setTimeout(() => setInfoToast(null), 3000);
  }

  setFile(f);
  reset();
}, [format, handleReset, reset, platform]);
```

- [ ] **Step 2: Remove formatMismatch state and modal JSX**

Delete state declarations:
```tsx
const [formatMismatch, setFormatMismatch] = useState<...>(null);
const [pendingFile, setPendingFile] = useState<File | null>(null);
```

Delete `handleFormatSwitch` callback.

Delete modal JSX block (lines ~953-978) — the `{formatMismatch && (` block.

- [ ] **Step 3: Verify auto-detect works**

Upload a .png file while in video mode — should auto-switch to static with toast.

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: auto-detect format on file drop — replace blocking modal with toast"
```

---

### Task 3: Add Cutsheet app icon to upload zone empty state

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx` (PaidEmptyState component ~line 238)

- [ ] **Step 1: Add app icon above the heading**

In `PaidEmptyState`, replace the Zap icon container with the Cutsheet app icon:
```tsx
{/* Cutsheet app icon */}
<img
  src="/cutsheet-icon.png"
  alt=""
  width={48}
  height={48}
  style={{ borderRadius: 12, opacity: 0.85 }}
/>
```

If the icon file doesn't exist at `/public/cutsheet-icon.png`, use the existing Zap icon in a smaller form.

- [ ] **Step 2: Verify at 1440px and 375px**

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: add Cutsheet icon to upload empty state"
```

---

## Chunk 2: Loading State Redesign (Page 3)

### Task 4: Redesign loading state with shimmer skeletons and progressive labels

**Files:**
- Modify: `src/components/AnalyzerView.tsx` (loading state section)
- Create: `src/components/ui/ShimmerSkeleton.tsx` (reusable shimmer component)

- [ ] **Step 1: Create ShimmerSkeleton component**

```tsx
// src/components/ui/ShimmerSkeleton.tsx
import { cn } from "../../lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle";
  width?: number | string;
  height?: number | string;
}

export function ShimmerSkeleton({ className, variant = "rectangle", width, height }: ShimmerSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white/[0.06]",
        variant === "circle" ? "rounded-full" : "rounded-lg",
        className
      )}
      style={{ width, height }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}
```

- [ ] **Step 2: Read AnalyzerView.tsx to find loading state**

Read `src/components/AnalyzerView.tsx` and identify where the loading/processing state is rendered.

- [ ] **Step 3: Replace loading state with new design**

The loading state should show:
- Left side (50%): Creative preview (video/image)
- Right side (50%): Loading skeleton:
  - Cutsheet icon (64px, pulse animation)
  - Circular shimmer skeleton (96px) for score arc
  - 4 rectangular shimmer skeletons for dimension cells
  - Progressive label that cycles through stages

```tsx
// Progressive labels component
function ProgressiveLoadingLabels({ status }: { status: string }) {
  const [labelIndex, setLabelIndex] = useState(0);
  const labels = [
    "Scoring hook strength...",
    "Analyzing message clarity...",
    "Checking CTA effectiveness...",
    "Evaluating production quality...",
  ];

  useEffect(() => {
    if (status !== "processing") return;
    const interval = setInterval(() => {
      setLabelIndex(prev => (prev + 1) % labels.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <motion.p
      key={labelIndex}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center" }}
    >
      {labels[labelIndex]}
    </motion.p>
  );
}
```

- [ ] **Step 4: Add Cutsheet icon with pulse**

```tsx
<img
  src="/cutsheet-icon.png"
  alt=""
  width={64}
  height={64}
  style={{
    borderRadius: 16,
    animation: "pulse-icon 1.5s ease-in-out infinite",
  }}
/>
<style>{`@keyframes pulse-icon { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
```

- [ ] **Step 5: Verify in browser — upload a file and watch loading state**

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ShimmerSkeleton.tsx src/components/AnalyzerView.tsx
git commit -m "feat: shimmer skeletons + progressive labels in loading state"
```

---

## Chunk 3: Results — Right Panel / ScoreCard (Page 4)

### Task 5: Restructure ScoreCard into clean 3-tier layout

**Files:**
- Modify: `src/components/ScoreCard.tsx`

- [ ] **Step 1: Read ScoreCard.tsx fully**

Read the full file to understand current tier structure. The component already has partial 3-tier disclosure — need to refine.

- [ ] **Step 2: Tier 1 — Always visible section**

Ensure these are ALWAYS visible (not in any CollapsibleSection):
- Arc gauge with overall score
- Benchmark badge
- 2x2 dimension grid (hook, clarity, CTA, production)
- ONE adaptive CTA: if score < 7 → "Fix It For Me", else → "Share"

- [ ] **Step 3: Rename "Improve This Ad" to "Key Insights" with count badge**

Find the improvements section header and rename:
```tsx
<CollapsibleSection
  title="Key Insights"
  icon={<Lightbulb size={16} />}
  trailing={<span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-zinc-400">{improvements?.length || 0}</span>}
  defaultOpen={false}
>
```

- [ ] **Step 4: Collapse Predicted Performance and Budget by default**

Both should use `CollapsibleSection` with `defaultOpen={false}`. Show inline preview text:
- Performance: verdict text inline in header ("Above Average")
- Budget: range inline in header ("$28–$84/day")

- [ ] **Step 5: Add Deep Dive strip at bottom**

After all collapsible sections, add a pill strip:
```tsx
<div className="flex gap-2 flex-wrap px-4 py-3 border-t border-white/5">
  {["Ad Checks", "Copy Breakdown", "Emotional Tone", ...(format === "video" ? ["Scenes"] : [])].map(tab => (
    <button
      key={tab}
      onClick={() => { setSlideSheetOpen(true); setDeepDiveTab(tab.toLowerCase().replace(/ /g, "-")); }}
      className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors"
    >
      {tab}
    </button>
  ))}
</div>
```

- [ ] **Step 6: Remove "Start Over" button from right panel**

Move to overflow menu (OverflowMenu component already exists).

- [ ] **Step 7: Remove PlatformSwitcher from right panel top**

In `PaidAdAnalyzer.tsx`, remove the `<PlatformSwitcher>` block (lines ~1049-1057) and the platform score verdict badge (lines ~1059-1069). Platform filtering will be added post-analysis in a future iteration.

- [ ] **Step 8: Verify ScoreCard at 1440px and 375px**

- [ ] **Step 9: Commit**

```bash
git add src/components/ScoreCard.tsx src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: 3-tier ScoreCard — key insights, collapsed performance/budget, deep dive strip"
```

---

## Chunk 4: Results — Left Panel / Analysis (Page 5)

### Task 6: Merge Hook sections and update section headers

**Files:**
- Modify: `src/components/AnalyzerView.tsx` (analysis sections)

- [ ] **Step 1: Read AnalyzerView.tsx fully**

Identify where analysis sections are rendered and how they map to the markdown output.

- [ ] **Step 2: Replace emoji + ALL CAPS headers with Lucide icon + sentence case**

For each section, replace the header pattern:
```tsx
// BEFORE: "🎣 HOOK ANALYSIS"
// AFTER:
import { Zap, Layers, MessageSquare, Star } from "lucide-react";

// In CollapsibleSection:
<CollapsibleSection title="Hook Analysis" icon={<Zap size={16} />} defaultOpen={true}>
<CollapsibleSection title="Visual Hierarchy" icon={<Layers size={16} />} defaultOpen={false}>
<CollapsibleSection title="Message Structure" icon={<MessageSquare size={16} />} defaultOpen={false}>
<CollapsibleSection title="Creative Verdict" icon={<Star size={16} />} defaultOpen={false}>
```

- [ ] **Step 3: Merge Hook Detail + Hook Analysis into one card**

Create a unified hook card:
```tsx
function MergedHookCard({ hookDetail }: { hookDetail: HookDetail }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {hookDetail.hookType && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {hookDetail.hookType}
          </span>
        )}
        {hookDetail.verdict && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {hookDetail.verdict}
          </span>
        )}
      </div>
      {hookDetail.firstGlance && (
        <div><span className="text-xs text-zinc-500">First Glance:</span> <span className="text-sm text-zinc-300">{hookDetail.firstGlance}</span></div>
      )}
      {hookDetail.hookStrength && (
        <div><span className="text-xs text-zinc-500">Hook Strength:</span> <span className="text-sm text-zinc-300">{hookDetail.hookStrength}</span></div>
      )}
      {hookDetail.scrollStopFactor && (
        <div><span className="text-xs text-zinc-500">Scroll-Stop Factor:</span> <span className="text-sm text-zinc-300">{hookDetail.scrollStopFactor}</span></div>
      )}
      {hookDetail.hookFix && (
        <div><span className="text-xs text-zinc-500">Hook Fix:</span> <span className="text-sm text-emerald-400">{hookDetail.hookFix}</span></div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Remove Visual Copy Inventory section**

Find and delete the section that renders "VISUAL COPY INVENTORY" or similar.

- [ ] **Step 5: Remove Quick Scores section from left panel**

Already shown in ScoreCard (right panel) — remove duplicate.

- [ ] **Step 6: Move Visualize It button to left panel, below creative**

In `PaidAdAnalyzer.tsx`, move the Visualize It button from the right panel (lines ~1112-1164) to the left panel, directly below the creative thumbnail in AnalyzerView. Style as gradient border:
```tsx
<button
  onClick={handleVisualize}
  className="w-full mt-4"
  style={{
    height: 44,
    background: "transparent",
    border: "1px solid transparent",
    borderImage: "linear-gradient(135deg, #10b981, #6366f1, #3b82f6) 1",
    borderRadius: 10,
    color: "#818cf8",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  }}
>
  <div className="flex items-center gap-1.5">
    <Sparkles size={14} />
    <span className="text-sm font-semibold">Visualize It</span>
  </div>
  <span className="text-[11px] text-zinc-500">AI Art Director</span>
</button>
```

- [ ] **Step 7: Verify left panel changes**

- [ ] **Step 8: Commit**

```bash
git add src/components/AnalyzerView.tsx src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: merge hook sections, sentence-case headers, move Visualize It to left panel"
```

---

## Chunk 5: Conditional Layout + Other Analyzers (Pages 6-7)

### Task 7: Video vs Static conditional sections

**Files:**
- Modify: `src/components/AnalyzerView.tsx`
- Modify: `src/components/ScoreCard.tsx`

- [ ] **Step 1: Add `analysisType` prop to all section components**

Ensure AnalyzerView accepts and passes `format: "video" | "static"` to child sections.

- [ ] **Step 2: Conditionally render video-only / static-only sections**

```tsx
{format === "video" && <SceneBreakdown scenes={scenes} />}
{format === "static" && <VisualHierarchySection ... />}
{format === "static" && <CopyDensitySection ... />}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AnalyzerView.tsx src/components/ScoreCard.tsx
git commit -m "feat: conditional video/static section rendering"
```

### Task 8: Apply consistency to OrganicAnalyzer and DisplayAnalyzer

**Files:**
- Modify: `src/pages/app/OrganicAnalyzer.tsx`
- Modify: `src/pages/app/DisplayAnalyzer.tsx`

- [ ] **Step 1: Read OrganicAnalyzer.tsx**

Check for platform pills, toggles, section naming patterns.

- [ ] **Step 2: Remove platform pills from OrganicAnalyzer pre-upload state**

Same pattern as PaidAdAnalyzer — remove the platform selector from the header/upload area.

- [ ] **Step 3: Remove toggles from OrganicAnalyzer**

- [ ] **Step 4: Apply same changes to DisplayAnalyzer**

- [ ] **Step 5: Verify both at 1440px and 375px**

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/OrganicAnalyzer.tsx src/pages/app/DisplayAnalyzer.tsx
git commit -m "feat: apply upload state cleanup to Organic and Display analyzers"
```

---

## Chunk 6: Navigation + Global + A11y (Page 8)

### Task 9: Rename sidebar items

**Files:**
- Modify: `src/components/Sidebar.tsx:35-41` (ANALYZE nav config)

- [ ] **Step 1: Rename nav items**

```tsx
// BEFORE:
{ label: "Deconstructor", sublabel: "Teardown any ad URL", ...
{ label: "Policy Checker", sublabel: "Pre-launch policy scan", ...

// AFTER:
{ label: "Ad Breakdown", sublabel: "Teardown any ad URL", ...
{ label: "Ad Policy Check", sublabel: "Pre-launch policy scan", ...
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: rename Deconstructor → Ad Breakdown, Policy Checker → Ad Policy Check"
```

### Task 10: Fix a11y issues from audit

**Files:**
- Modify: `src/components/Sidebar.tsx` (contrast fixes)
- Modify: `src/components/VideoDropzone.tsx` (label-content mismatch)

- [ ] **Step 1: Fix sidebar subtitle contrast**

Find all instances of `color: rgb(82, 82, 91)` (zinc-600) in sidebar subtitles and change to `color: rgb(161, 161, 170)` (zinc-400) for sufficient contrast.

Also fix section headers (ANALYZE, COMPARE, LIBRARY heading styles).

- [ ] **Step 2: Fix format pill contrast in VideoDropzone**

Change `text-zinc-500` on format pills to `text-zinc-400`.

- [ ] **Step 3: Fix label-content mismatches**

- Upload zone: change `aria-label="Upload video file"` to match visible text "Drop your creative here"
- Profile button: ensure `aria-label` matches visible text or remove it

- [ ] **Step 4: Run Lighthouse a11y audit to verify fixes**

Target: 95+ score (up from 90).

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/components/VideoDropzone.tsx
git commit -m "fix: a11y — contrast ratios, button labels, label-content mismatches"
```

---

### Task 11: Revert ProtectedRoute auth bypass

**Files:**
- Modify: `src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Restore original ProtectedRoute**

Revert the temporary bypass back to the full auth check.

- [ ] **Step 2: Commit**

```bash
git add src/components/ProtectedRoute.tsx
git commit -m "chore: revert temporary auth bypass used during UX audit"
```

---

## Execution Notes

- **Total tasks:** 11
- **Estimated files touched:** ~10
- **Key risk:** ScoreCard.tsx is 795 lines — edits there need extra care to not break existing functionality
- **Testing approach:** Browser verification after each task (chrome-devtools screenshots at 1440px + 375px)
- **No new routes or state management patterns** — all changes are UI simplification
