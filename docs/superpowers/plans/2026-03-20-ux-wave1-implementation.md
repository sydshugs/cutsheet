# UX Wave 1 — Friction Removal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove 5 sources of UX friction from the Paid Ad Analyzer — zero pre-upload decisions, auto format detection, merged hook cards, consolidated improvements.

**Architecture:** All changes are in 2 files: `PaidAdAnalyzer.tsx` (the page) and `ScoreCard.tsx` (the right panel). No new files. No new dependencies. Surgical edits only.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, framer-motion, lucide-react

**Worktree:** `/Users/atlas/cutsheet/.claude/worktrees/ux-wave1/`

---

## File Map

| File | Changes |
|------|---------|
| `src/pages/app/PaidAdAnalyzer.tsx` | Tasks 1, 2, 3 — hide IntentHeader pre-upload, always-on Second Eye, auto format switch |
| `src/components/ScoreCard.tsx` | Tasks 4, 5 — inline hook detail card, remove ImprovementsList |
| `src/components/scorecard/HookDetailCard.tsx` | Task 4 — rewrite to unified "Hook Analysis" layout |

---

### Task 1: Hide IntentHeader Before Analysis + Always-On Second Eye

**Context:** IntentHeader renders platform pills, format pills, and Second Eye/Design Review toggles. It shows before upload, creating decision paralysis. Second Eye and Design Review toggles are off by default but should always run.

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx`

- [ ] **Step 1: Change secondEye and staticSecondEye defaults to `true`**

At line 303-306, change:
```tsx
// BEFORE:
const [secondEye, setSecondEye] = useState(false);
// ...
const [staticSecondEye, setStaticSecondEye] = useState(false);

// AFTER:
const [secondEye] = useState(true);
// ...
const [staticSecondEye] = useState(true);
```

Remove `setSecondEye` and `setStaticSecondEye` — they're no longer needed.

- [ ] **Step 2: Conditionally render IntentHeader only after analysis**

At line 949, wrap IntentHeader in a condition so it only shows when there's a result:

```tsx
// BEFORE:
<IntentHeader platform={platform} setPlatform={setPlatform} format={format} setFormat={setFormat} secondEye={secondEye} setSecondEye={setSecondEye} staticSecondEye={staticSecondEye} setStaticSecondEye={setStaticSecondEye} onPlatformReset={...} />

// AFTER:
{(status === "complete" || loadedEntry || loadedFromHistory) && (
  <IntentHeader platform={platform} setPlatform={setPlatform} format={format} setFormat={setFormat} onPlatformReset={(oldPlatform) => setPlatformResetToast(`Platform reset to All — ${oldPlatform} isn't available for static ads`)} />
)}
```

- [ ] **Step 3: Remove toggle props from IntentHeader signature**

Remove `secondEye`, `setSecondEye`, `staticSecondEye`, `setStaticSecondEye` from IntentHeader's props interface and its JSX body (lines 88-233). Remove the Second Eye toggle block (lines 177-203) and Design Review toggle block (lines 205-231).

- [ ] **Step 4: Remove conditions gating Second Eye effects**

At line 499, the Second Eye effect checks `&& secondEye`. Since it's always true now, simplify:
```tsx
// BEFORE:
if (status === "complete" && result && secondEye) {

// AFTER:
if (status === "complete" && result) {
```

Same for staticSecondEye at line 527:
```tsx
// BEFORE:
if (status === "complete" && result && staticSecondEye && format === "static") {

// AFTER:
if (status === "complete" && result && format === "static") {
```

And at line 1105, remove the `secondEye &&` condition:
```tsx
// BEFORE:
{format === "video" && secondEye && (

// AFTER:
{format === "video" && (
```

Do the same for `staticSecondEye &&` at the static panel render.

- [ ] **Step 5: Run tests and verify**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/ux-wave1
npx vitest run
npx vite build
```

Expected: 73+ tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: hide IntentHeader pre-upload, always-on Second Eye + Design Review"
```

---

### Task 2: Auto-Switch Format Detection

**Context:** When a user uploads an image while "Video" is selected (or vice versa), a blocking modal appears. Replace with silent auto-switch + dismissible toast.

**Files:**
- Modify: `src/pages/app/PaidAdAnalyzer.tsx`

- [ ] **Step 1: Rewrite `handleFileWithFormatCheck` to auto-switch**

Replace the current function at line 602 with:

```tsx
const handleFileWithFormatCheck = useCallback((f: File | null) => {
  if (!f) { handleReset(); return; }

  const fileIsVideo = f.type.startsWith("video/") || [".mp4", ".mov", ".webm"].some(e => f.name.toLowerCase().endsWith(e));
  const fileIsImage = f.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].some(e => f.name.toLowerCase().endsWith(e));

  // Auto-switch format if mismatch detected
  if (format === "video" && fileIsImage) {
    setFormat("static");
    setInfoToast("Detected static image — analyzing as Static");
    setTimeout(() => setInfoToast(null), 3000);
  } else if (format === "static" && fileIsVideo) {
    setFormat("video");
    setInfoToast("Detected video — analyzing as Video");
    setTimeout(() => setInfoToast(null), 3000);
  }

  setFile(f);
  reset();
}, [format, handleReset, reset]);
```

- [ ] **Step 2: Remove mismatch state and blocking modal**

Remove these state variables (line 599-600):
```tsx
// DELETE:
const [formatMismatch, setFormatMismatch] = useState<...>(null);
const [pendingFile, setPendingFile] = useState<File | null>(null);
```

Remove `handleFormatSwitch` callback (lines 625-635).

Remove the entire format mismatch modal JSX (lines 953-979):
```tsx
// DELETE the entire {formatMismatch && ( ... )} block
```

Simplify the conditional renders that check `!formatMismatch`:
```tsx
// BEFORE:
{!formatMismatch && status === "idle" && !loadedEntry ? (
// AFTER:
{status === "idle" && !loadedEntry ? (

// BEFORE:
) : !formatMismatch && (status !== "idle" || loadedEntry) ? (
// AFTER:
) : (status !== "idle" || loadedEntry) ? (
```

- [ ] **Step 3: Run tests and verify**

```bash
npx vitest run
npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/PaidAdAnalyzer.tsx
git commit -m "feat: auto-switch format detection — kill blocking modal, show toast"
```

---

### Task 3: Rewrite HookDetailCard as Unified "Hook Analysis"

**Context:** HookDetailCard shows hook info in a scattered layout. Rewrite to a structured single card with pills on top row, structured fields below.

**Files:**
- Modify: `src/components/scorecard/HookDetailCard.tsx`

- [ ] **Step 1: Rewrite HookDetailCard component**

Replace the entire content of `src/components/scorecard/HookDetailCard.tsx`:

```tsx
// HookDetailCard — unified Hook Analysis card
// Shows: Hook Type pill + Hook Verdict pill, First Glance, Hook Strength, Scroll-Stop Factor, Hook Fix

import type { HookDetail } from "../../services/analyzerService";

interface HookDetailCardProps {
  hookDetail: HookDetail;
  format: "video" | "static";
}

const VERDICT_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "Scroll-Stopper": { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.2)" },
  "Needs Work":     { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
};
const DEFAULT_VERDICT = { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.2)" };

export function HookDetailCard({ hookDetail, format }: HookDetailCardProps) {
  const vs = VERDICT_STYLES[hookDetail.verdict] ?? DEFAULT_VERDICT;

  return (
    <div className="px-5 py-3 border-t border-white/5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Hook Analysis
      </p>

      {/* Top row: Hook Type pill + Hook Verdict pill */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span
          className="text-[10px] font-mono rounded-md px-1.5 py-0.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa" }}
        >
          {hookDetail.hookType}
        </span>
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{ background: vs.bg, color: vs.color, border: `1px solid ${vs.border}` }}
        >
          {hookDetail.verdict}
        </span>
      </div>

      {/* First Glance */}
      <div className="mb-2">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">First Glance</span>
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
          {hookDetail.firstImpression}
        </p>
      </div>

      {/* Hook Strength */}
      {hookDetail.hookStrength && (
        <div className="mb-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Hook Strength</span>
          <p className="text-xs text-zinc-300 font-medium mt-0.5">{hookDetail.hookStrength}</p>
        </div>
      )}

      {/* Scroll-Stop Factor */}
      {hookDetail.scrollStopFactor && (
        <div className="mb-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Scroll-Stop Factor</span>
          <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{hookDetail.scrollStopFactor}</p>
        </div>
      )}

      {/* Hook Fix — only if needed */}
      {hookDetail.hookFix && (
        <div
          className="text-[11px] leading-relaxed rounded-lg px-2.5 py-1.5 mt-2"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: "#f59e0b" }}
        >
          💡 {hookDetail.hookFix}
        </div>
      )}
    </div>
  );
}
```

Note: `hookStrength` and `scrollStopFactor` may not exist on the `HookDetail` type yet. If they don't, use optional chaining — the fields render only when present, so this is safe. The existing `firstImpression`, `hookType`, `verdict`, and `hookFix` fields already exist and will render.

- [ ] **Step 2: Run tests and verify**

```bash
npx vitest run
npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/scorecard/HookDetailCard.tsx
git commit -m "feat: rewrite HookDetailCard as unified Hook Analysis card"
```

---

### Task 4: Remove ImprovementsList from Right Panel

**Context:** Right panel (ScoreCard) shows "Improve This Ad" list that duplicates the left panel's "Key Insights". Remove it — right panel should only show the Fix It For Me action button.

**Files:**
- Modify: `src/components/ScoreCard.tsx`

- [ ] **Step 1: Remove ImprovementsList rendering from ScoreCard**

In ScoreCard.tsx, find the ImprovementsList render (around line 460-463):
```tsx
// DELETE this block:
      {/* Improve This Ad — limited to 3, expandable */}
      {improvements && improvements.length > 0 && (
        <ImprovementsList improvements={improvements} loading={improvementsLoading} />
      )}
```

- [ ] **Step 2: Clean up — remove ImprovementsList function definition**

Remove the entire `ImprovementsList` component definition (lines 100-137) and the `MAX_VISIBLE_IMPROVEMENTS` constant (line 101). These are now dead code.

- [ ] **Step 3: Remove unused props if needed**

Check if `improvements` and `improvementsLoading` are still used elsewhere in ScoreCard (e.g., in the copy handler). If `improvements` is used in `handleCopy`, keep the prop. If `improvementsLoading` has no other use, it can be removed from the props interface.

- [ ] **Step 4: Run tests and verify**

```bash
npx vitest run
npx vite build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreCard.tsx
git commit -m "feat: remove duplicate ImprovementsList from right panel"
```

---

### Task 5: Final Verification + Push

- [ ] **Step 1: Full test suite**

```bash
cd /Users/atlas/cutsheet/.claude/worktrees/ux-wave1
npx vitest run
npx vite build
```

Expected: 73+ tests pass, build succeeds, no new TypeScript errors.

- [ ] **Step 2: Push branch and create PR**

```bash
git push -u origin ux/wave1-overhaul
gh pr create --title "UX Wave 1: remove pre-upload friction, auto-format, consolidate" --body "$(cat <<'EOF'
## Summary
- Hide platform pills + format selector until analysis is complete (post-analysis filters only)
- Auto-detect image vs video on upload — silent format switch with toast, no blocking modal
- Second Eye + Design Review always run automatically (no toggles)
- Unified Hook Analysis card (type pill + verdict pill + structured fields)
- Remove duplicate improvements list from right panel

## Test plan
- [ ] Upload an image — should auto-switch to Static, show toast
- [ ] Upload a video — should auto-switch to Video, show toast
- [ ] Pre-upload state shows only the dropzone, no platform pills
- [ ] After analysis, platform pills appear as result filters
- [ ] Hook Analysis card shows type + verdict pills, first glance, fix if needed
- [ ] Right panel has NO "Improve This Ad" section — only Fix It button
- [ ] Second Eye panel always shows after video analysis
- [ ] Design Review always shows after static analysis

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
