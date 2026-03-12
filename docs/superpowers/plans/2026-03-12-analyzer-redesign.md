# Analyzer View Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Analyzer view with a dashboard layout (sidebar + top bar + main area + right panel) using Tailwind, matching the landing page visual identity.

**Architecture:** Extract the Analyzer flow from the monolithic App.tsx (1,212 lines) into focused components. New layout shell in App.tsx with sidebar, top bar, and flex content area. Each Analyzer state (empty, analyzing, results, error) rendered by dedicated components. ScoreCard restyled as a sliding right panel.

**Tech Stack:** React, Tailwind v4 (CSS-based @theme config), Framer Motion (layoutId transitions), Lucide React icons, Geist Sans/Mono fonts.

**Spec:** `docs/superpowers/specs/2026-03-12-analyzer-redesign-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/TopBar.tsx` | Top bar: wordmark, search pill (UI-only), history icon, New Analysis button, profile avatar dropdown |
| `src/components/AnalyzerView.tsx` | Analyzer state machine: routes to empty/analyzing/results/error states, manages right panel visibility |
| `src/components/ProgressCard.tsx` | Analyzing state: video thumb, shimmer bar, cycling stage hints, cancel |
| `src/components/ErrorCard.tsx` | Error state: error message, retry/start-over actions |
| `src/components/ReportCards.tsx` | Results main area: video preview, markdown-split report cards, sticky action bar |

### Modified Files
| File | Change |
|------|--------|
| `src/styles/tokens.css` | Add @keyframes (shimmer, gentle-pulse, barFill, shake). Keep existing tokens for out-of-scope views. |
| `src/index.css` | Update .main-content for new 64px sidebar. Add @theme extensions if needed. |
| `src/components/Sidebar.tsx` | Complete rewrite: 64px icon-only, 5 modes + settings gear, Tailwind classes, tooltips, 1024px responsive |
| `src/components/VideoDropzone.tsx` | Restyle as glassmorphism upload card. Add paste listener, remove URL input, add shortcut hint, validation errors |
| `src/components/ScoreCard.tsx` | Restyle as right panel scorecard. Update score labels to 4-band system. Add relative timestamp, model tag. |
| `src/App.tsx` | New layout shell (sidebar + top bar + flex main + right panel). Wire AnalyzerView. Keep non-Analyzer modes rendering with existing styles. |

### Untouched Files
| File | Reason |
|------|--------|
| `src/theme.ts` | Out-of-scope views still depend on it |
| `src/components/ReportAnalysis.tsx` | PDF export only — not the in-app report |
| `src/components/HistoryDrawer.tsx` | Preserved as-is, opened from TopBar |
| `src/hooks/useVideoAnalyzer.ts` | Data layer unchanged |
| `src/hooks/useHistory.ts` | Data layer unchanged |
| `src/components/CompareView.tsx` | Out of scope — renders as-is when mode selected |
| `src/components/BatchView.tsx` | Out of scope |
| `src/components/PreFlightView.tsx` | Out of scope |
| `src/components/SwipeFileView.tsx` | Out of scope |

---

## Chunk 1: CSS Foundation

### Task 1: Add custom animations to tokens.css

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add keyframe animations**

Add after the existing CSS custom properties block (after line ~79), before the `body` global styles:

```css
/* ─── ANIMATIONS ──────────────────────────────────────────── */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes barFill {
  from { width: 0%; }
  to { width: var(--bar-width, 0%); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Extend the prefers-reduced-motion block**

Update the existing `@media (prefers-reduced-motion: reduce)` block to also cover new animations:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add shimmer, pulse, barFill, shake animations to tokens.css"
```

### Task 2: Update index.css for new layout

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Update .main-content offset for 64px sidebar**

```css
@import "./styles/tokens.css";
@import "tailwindcss";

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

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

Change: sidebar offset from 220px → 64px (icon-only). Collapsed offset from 56px → 0 (sidebar fully hides below 1024px).

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: update main-content offset for 64px icon sidebar"
```

---

## Chunk 2: Layout Shell Components

### Task 3: Rewrite Sidebar.tsx

**Files:**
- Modify: `src/components/Sidebar.tsx` (342 lines → ~200 lines)

- [ ] **Step 1: Rewrite sidebar as 64px icon-only component**

The sidebar keeps the same props interface (`SidebarMode`, callbacks) but is completely restyled:
- 64px fixed width, `bg-zinc-950`, right border `border-white/5`
- Logo icon at top (cutsheet diamond mark from current SVG, no text)
- 5 mode icon buttons vertically centered with `gap-2`
- Each button: `<button>` with `aria-label`, 40x40px hit area, 20px icon centered
- Active: `bg-indigo-500/15 text-indigo-400 rounded-xl`
- Hover: `bg-white/5 text-zinc-300`
- Tooltip on hover: absolute positioned right of button, `bg-zinc-900 text-white text-xs rounded-lg px-2 py-1`
- Settings gear pinned to bottom with `mt-auto`
- Below 1024px: sidebar hidden entirely, controlled by `mobileOpen` prop from parent

Icons: Use Lucide React — `BarChart3` (Analyzer), `GitCompare` (Compare), `Layers` (Batch), `FlaskConical` (A/B Test), `Bookmark` (Swipe File), `Settings` (Settings).

Keep exporting `SidebarMode` type.

Add new props: `mobileOpen?: boolean`, `onMobileClose?: () => void` for responsive overlay.

- [ ] **Step 2: Verify non-Analyzer modes still switch correctly**

Run dev server, click each sidebar icon. Each should change the mode (even though non-Analyzer views aren't restyled).

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: rewrite Sidebar as 64px icon-only with Tailwind"
```

### Task 4: Create TopBar.tsx

**Files:**
- Create: `src/components/TopBar.tsx`

- [ ] **Step 1: Build the top bar component**

```typescript
interface TopBarProps {
  onNewAnalysis: () => void;
  onHistoryOpen: () => void;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  userName?: string;
  userPlan?: string;
}
```

Layout: `h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 gap-3`

Contents left to right:
1. Mobile hamburger (visible below 1024px only): `Menu` icon from Lucide
2. "cutsheet" wordmark: `font-[TBJ_Interval] text-base text-white`
3. Spacer: `flex-1`
4. Search pill: `bg-white/5 rounded-full` input, UI-only, `w-60`, `Search` icon from Lucide, placeholder "Search analyses..."
5. History button: `Clock` icon from Lucide, `text-zinc-500 hover:text-zinc-300`, calls `onHistoryOpen`
6. New Analysis button: `bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2`, `Plus` icon + "New Analysis" text
7. Profile avatar: 32px circle with gradient bg, user initial. Click toggles dropdown.

Profile dropdown: simple `useState<boolean>` toggle. Positioned absolute below avatar, right-aligned.
- Container: `absolute right-0 top-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-lg w-[200px] p-2 z-50`
- Items: user name/email (`text-sm text-white px-3 py-2`), divider (`border-t border-white/5 my-1`), plan badge ("Free" / "Pro" in `text-xs text-indigo-400 px-3 py-1`), "Log out" row (`text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer`)
- Close on blur (use `onBlur` with `relatedTarget` check) or Escape key.

- [ ] **Step 2: Commit**

```bash
git add src/components/TopBar.tsx
git commit -m "feat: create TopBar with search pill, history, new analysis, profile"
```

### Task 5: Rewrite App.tsx layout shell

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the layout structure**

Keep all existing state, hooks, and logic. Replace only the JSX layout:

```
<div className="flex h-screen bg-zinc-950">
  {/* Sidebar */}
  <Sidebar mode={mode} onModeChange={setMode} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} ... />

  {/* Main area (right of sidebar) */}
  <div className="main-content flex flex-col">
    {/* Top bar */}
    <TopBar onNewAnalysis={handleNewAnalysis} onHistoryOpen={() => setHistoryOpen(true)} ... />

    {/* Content + Right panel wrapper */}
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/[8%] blur-[100px]" />

        {/* Mode content — AnalyzerView does not exist yet at this step.
             Use existing inline Analyzer JSX as a temporary placeholder.
             It will be replaced with <AnalyzerView /> in Task 12. */}
        <div className="relative px-8 py-6">
          {mode === "single" && (
            /* Keep existing Analyzer inline JSX for now — replaced in Chunk 6 */
            <>{/* existing VideoDropzone + ScoreCard + report JSX */}</>
          )}
          {mode === "compare" && <CompareView ... />}
          {mode === "batch" && <BatchView ... />}
          {mode === "preflight" && <PreFlightView ... />}
          {mode === "swipe" && <SwipeFileView ... />}
        </div>
      </div>

      {/* Right panel (results only) — uses width transition so flex layout compresses main content */}
      <div className={`shrink-0 bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showRightPanel ? 'w-[340px] opacity-100' : 'w-0 opacity-0'}`}>
        {showRightPanel && <ScoreCard ... />}
      </div>
    </div>
  </div>

  {/* Modals (HistoryDrawer, UpgradeModal) */}
</div>
```

Remove all inline `style={{}}` objects from the Analyzer flow. Non-Analyzer views (CompareView, BatchView, etc.) keep their current styling — they still import from `theme.ts`.

Remove: `themes` import (Analyzer no longer uses it). Keep the import only if non-Analyzer code in App.tsx still references it — check first.

- [ ] **Step 2: Add `mobileOpen` state and `showRightPanel` computed value**

```typescript
const [mobileOpen, setMobileOpen] = useState(false);
const showRightPanel = mode === "single" && status === "complete";
```

- [ ] **Step 3: Verify the layout renders — sidebar left, top bar top, content fills remaining space**

Run dev server, check that the basic shell appears with sidebar + top bar. Non-Analyzer modes should still be accessible (clicking Compare/Batch should render those views).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/TopBar.tsx
git commit -m "feat: new dashboard layout shell with sidebar, top bar, flex content"
```

---

## Chunk 3: Empty State (Upload)

### Task 6: Restyle VideoDropzone.tsx

**Files:**
- Modify: `src/components/VideoDropzone.tsx` (391 lines)

- [ ] **Step 1: Restyle the empty dropzone state**

Replace inline styles with Tailwind. The component keeps its existing props and internal state.

**Important:** Wrap the outer card div with Framer Motion `motion.div` and add `layoutId="analyzer-card"`. This enables the morph transition to ProgressCard/ErrorCard in later states. Import `motion` from `framer-motion`.

Empty state card:
- Outer: `<motion.div layoutId="analyzer-card" className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 max-w-[640px] mx-auto p-8">`
- Inner drop zone: `border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center gap-4 transition-all`
- Drag-over: add `border-indigo-500/50 scale-[1.01] shadow-[0_0_20px_rgba(99,102,241,0.15)]`
- Upload icon: `w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center` with `Upload` Lucide icon in white
- Heading: `text-xl font-semibold text-white`
- Subtext: `text-sm text-zinc-400`
- Format chips: only MP4, MOV, WEBM (remove AVI, MKV) — `bg-white/5 rounded-full text-xs text-zinc-500 px-3 py-1`
- Browse button: `bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-6 py-3`
- Shortcut hint: `text-xs text-zinc-600` — detect platform: `navigator.platform?.includes('Mac') ? '⌘V' : 'Ctrl+V'`

- [ ] **Step 2: Add validation error display**

Below the Browse button, conditionally render:
```jsx
{error && (
  <p className="text-xs text-red-400 animate-[shake_0.3s_ease-in-out]">{error}</p>
)}
```

- [ ] **Step 3: Add global paste listener for URL detection**

Remove the visible URL input field. Add a `useEffect` with a `paste` event listener on `document`:

```typescript
useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text')?.trim();
    if (text && /^https?:\/\//.test(text)) {
      setPastedUrl(text);
    }
  };
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, []);
```

When `pastedUrl` is set, fade in a URL input pre-filled with the value + "Go" button. On submit, call `onUrlSubmit?.(pastedUrl)`.

- [ ] **Step 4: Restyle the file-loaded preview state**

When `file` is present, show a smaller preview (video player or image) with metadata bar. Same glassmorphism surface. Remove button replaces to `text-xs text-zinc-500 hover:text-white`.

- [ ] **Step 5: Keep `isDark` prop for backward compatibility**

Keep `isDark?: boolean` in the `VideoDropzoneProps` interface with a default value of `true`. Stop using it internally for conditional styling (everything renders dark). This preserves backward compatibility — out-of-scope views (`ComparePanel.tsx`, `PreFlightView.tsx`) still pass `isDark={isDark}` and would break with a TypeScript error if the prop is removed.

```typescript
// Keep in interface, ignore internally:
isDark?: boolean;  // Preserved for out-of-scope views. Always renders dark.
```

- [ ] **Step 6: Commit**

```bash
git add src/components/VideoDropzone.tsx
git commit -m "feat: restyle VideoDropzone as glassmorphism upload card"
```

---

## Chunk 4: Analyzing + Error States

### Task 7: Create ProgressCard.tsx

**Files:**
- Create: `src/components/ProgressCard.tsx`

- [ ] **Step 1: Build the analyzing state component**

```typescript
interface ProgressCardProps {
  file: File;
  status: "uploading" | "processing";
  statusMessage: string;
  onCancel: () => void;
}
```

Card surface: `bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 max-w-[480px] mx-auto p-8`

Use Framer Motion `motion.div` with `layoutId="analyzer-card"` on the outer card for the morph transition from VideoDropzone.

Content:
1. Video thumbnail: `<video src={URL.createObjectURL(file)} muted preload="metadata" className="rounded-2xl border border-white/5 h-[120px] w-full object-cover" />`
2. Status: `text-lg font-medium text-white` with `animation: gentle-pulse 2s ease-in-out infinite`
3. Shimmer bar: `h-0.5 w-full rounded-full` with `background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent); background-size: 200% 100%; animation: shimmer 2s infinite;`
4. Stage hints: cycle through messages array every 3s using `useState` + `useEffect` interval. Crossfade with `transition-opacity duration-300`.
   - Map `status === "uploading"` to first hint ("Reading video...")
   - Map `status === "processing"` to cycling hints 2-4
5. File metadata: `file.name`, duration (if available), `(file.size / 1024 / 1024).toFixed(1) + ' MB'`
6. Cancel: `<button onClick={onCancel} className="text-xs text-zinc-500 hover:text-white transition-colors">Cancel</button>`

- [ ] **Step 2: Clean up object URL on unmount**

```typescript
const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
useEffect(() => () => URL.revokeObjectURL(videoUrl), [videoUrl]);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProgressCard.tsx
git commit -m "feat: create ProgressCard with shimmer bar and stage hints"
```

### Task 8: Create ErrorCard.tsx

**Files:**
- Create: `src/components/ErrorCard.tsx`

- [ ] **Step 1: Build the error state component**

```typescript
interface ErrorCardProps {
  error: string | null;
  onRetry: () => void;
  onReset: () => void;
}
```

Card: `bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-red-500/20 max-w-[480px] mx-auto p-8`

Use `motion.div` with `layoutId="analyzer-card"` for transition from ProgressCard.

Content:
1. Error icon: 48px circle `bg-red-500/15` with `AlertCircle` from Lucide in `text-red-400`
2. Heading: "Analysis failed" — `text-lg font-semibold text-white`
3. Message: `error || "Something went wrong. Please try again."` — `text-sm text-zinc-400 text-center`
4. Buttons row: `flex gap-3 mt-4`
   - "Try Again": `bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl px-5 py-2.5`
   - "Start Over": `bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-5 py-2.5`

- [ ] **Step 2: Commit**

```bash
git add src/components/ErrorCard.tsx
git commit -m "feat: create ErrorCard with retry and reset actions"
```

---

## Chunk 5: Results State

### Task 9: Create ReportCards.tsx

**Files:**
- Create: `src/components/ReportCards.tsx`

- [ ] **Step 1: Build the report cards component**

```typescript
interface ReportCardsProps {
  file: File | null;
  markdown: string;
  onCopy: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  copied?: boolean;
  shareLoading?: boolean;
}
```

Layout (top to bottom):
1. **Video preview**: `<video>` with native controls, `rounded-2xl border border-white/5 overflow-hidden max-h-[320px] w-full object-contain`. Below: file metadata in `text-xs text-zinc-500 font-mono`.

2. **Report section label**: "ANALYSIS" — `text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4 mt-6`

3. **Markdown split into cards**: Parse the `markdown` string by splitting on `\n## ` (h2 headings).

```typescript
function splitMarkdown(md: string): { title: string | null; content: string }[] {
  const sections = md.split(/\n(?=## )/);
  return sections.map(section => {
    const match = section.match(/^## (.+)\n([\s\S]*)$/);
    if (match) return { title: match[1], content: match[2].trim() };
    return { title: null, content: section.trim() };
  }).filter(s => s.content);
}
```

Each card: `bg-zinc-900/50 rounded-2xl border border-white/5 p-5`
- Title: `text-sm font-semibold text-white mb-2`
- Body: `<ReactMarkdown>` with prose styles — `text-sm text-zinc-400 leading-relaxed [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1 [&_code]:bg-white/5 [&_code]:rounded [&_code]:px-1`
- Cards in `flex flex-col gap-3`

4. **Sticky action bar**: `sticky bottom-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex items-center gap-3 mt-6`
- "Copy Report" ghost button
- "Export PDF" ghost button
- "Share" indigo primary button (rightmost)

- [ ] **Step 2: Commit**

```bash
git add src/components/ReportCards.tsx
git commit -m "feat: create ReportCards with markdown splitting and sticky action bar"
```

### Task 10: Restyle ScoreCard.tsx as right panel

**Files:**
- Modify: `src/components/ScoreCard.tsx` (307 lines)

- [ ] **Step 1: Update score label bands**

Replace the `getScoreLabel` function:
```typescript
function getScoreLabel(score: number, isCTA?: boolean): { label: string; color: string } {
  if (isCTA && score === 0) return { label: "No CTA Detected", color: "#EF4444" };
  if (score >= 9) return { label: "Excellent", color: "#10B981" };
  if (score >= 7) return { label: "Good", color: "#6366F1" };
  if (score >= 5) return { label: "Average", color: "#F59E0B" };
  return { label: "Weak", color: "#EF4444" };
}
```

- [ ] **Step 2: Restyle as right panel scorecard**

Replace all inline styles with Tailwind. The component fills the right panel (340px parent).

Layout:
- **Header** (`p-5 border-b border-white/5`):
  - "Score Overview" — `text-sm font-semibold text-white`
  - Relative timestamp — `text-xs text-zinc-600` (add `analysisTime` prop, use `useEffect` + `setInterval` every 30s)
  - Model tag — `text-xs text-zinc-600 font-mono` (add `modelName` prop, default "Gemini 2.0 Flash")

- **Arc gauge** (`px-5 pt-5 flex flex-col items-center`):
  - Keep existing SVG arc, restyle: track `stroke: rgba(255,255,255,0.05)`, fill stroke uses `getScoreColorByValue`
  - Score number: `text-4xl font-bold font-mono text-white` + `/10` in `text-zinc-500`
  - Status badge: score-colored pill with Tailwind — map color to class:
    ```
    Excellent → bg-emerald-500/15 text-emerald-400
    Good → bg-indigo-500/15 text-indigo-400
    Average → bg-amber-500/15 text-amber-400
    Weak → bg-red-500/15 text-red-400
    ```

- **Metric bars** (`px-5 py-4 flex flex-col gap-2`):
  - Label + value row: `flex justify-between text-xs` — label `text-zinc-400`, value `font-mono text-white`
  - Bar: `h-1.5 rounded-full bg-white/5` track. Fill: `rounded-full` with score color, width via `--bar-width` CSS custom property + `barFill` animation.

- **Quick actions** (`mt-auto p-5 border-t border-white/5 flex flex-col gap-2`):
  - "Generate Brief" — `bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5 text-center`
  - "Add to Swipe File" — same style

- [ ] **Step 3: Add new props**

```typescript
interface ScoreCardProps {
  scores: Scores;
  fileName?: string;
  onShare?: () => void;
  winner?: boolean;
  // New props:
  analysisTime?: Date;
  modelName?: string;
  onGenerateBrief?: () => void;
  onAddToSwipeFile?: () => void;
}
```

- [ ] **Step 4: Keep `isDark` prop for backward compatibility, remove theme.ts usage**

Keep `isDark?: boolean` in `ScoreCardProps` (default `true`) — `ComparePanel.tsx` passes it. Stop using it internally. Remove any `theme.ts` imports from ScoreCard.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreCard.tsx
git commit -m "feat: restyle ScoreCard as right panel with 4-band labels and Tailwind"
```

---

## Chunk 6: AnalyzerView + Wiring

### Task 11: Create AnalyzerView.tsx

**Files:**
- Create: `src/components/AnalyzerView.tsx`

- [ ] **Step 1: Build the Analyzer state machine component**

This component extracts the single-mode analyzer flow from App.tsx. It receives all the state and callbacks as props (lifted from App.tsx).

```typescript
interface AnalyzerViewProps {
  file: File | null;
  status: AnalysisStatus;
  statusMessage: string;
  result: AnalysisResult | null;
  error: string | null;
  onFileSelect: (file: File | null) => void;
  onUrlSubmit?: (url: string) => void;
  onAnalyze: () => void;
  onReset: () => void;
  onCopy: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  onGenerateBrief: () => void;
  onAddToSwipeFile: () => void;
  copied?: boolean;
  shareLoading?: boolean;
  historyEntries?: HistoryEntry[];
  onHistoryEntryClick?: (entry: HistoryEntry) => void;
}
```

**Auto-trigger note:** Analysis starts automatically when a file is selected — the parent's `onFileSelect` handler calls `analyze()`. AnalyzerView does not need an "Analyze" button.

**History-loaded results:** When `onHistoryEntryClick` fires, the parent sets `loadedEntry` state which populates `result` and `status="complete"` without re-analyzing. AnalyzerView doesn't need to know the difference — it just renders based on `status`.

Render logic based on `status`:
- `idle` (no file): `<VideoDropzone />` wrapped in `<div className="flex-1 flex items-center justify-center">` + Recent Analyses row (if `historyEntries?.length`)
- `idle` (file loaded): also shows VideoDropzone with file preview
- `uploading` | `processing`: `<ProgressCard />` centered
- `complete`: `<ReportCards />` (takes full main area width — right panel handled by parent)
- `error`: `<ErrorCard />` centered

**Brief generation:** The existing brief tab/view in the current App.tsx is accessed via `onGenerateBrief` callback. The brief content displays in the right panel's ScoreCard area (the parent handles this state). AnalyzerView just passes the callback through to ReportCards or ScoreCard — no brief rendering logic here.

Use Framer Motion `<AnimatePresence mode="wait">` to wrap the state transitions. Apply `layoutId="analyzer-card"` to both VideoDropzone's outer card and ProgressCard/ErrorCard outer cards for the morph animation.

**Recent Analyses Row** (below upload card when idle):
```jsx
{status === "idle" && historyEntries && historyEntries.length > 0 && (
  <div className="max-w-[640px] mx-auto mt-6">
    <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono mb-3">Recent</p>
    <div className="flex gap-3 overflow-x-auto">
      {historyEntries.slice(0, 4).map(entry => (
        <button key={entry.id} onClick={() => onHistoryEntryClick?.(entry)}
          className="bg-white/5 rounded-2xl border border-white/5 p-3 flex items-center gap-3 min-w-[180px] hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {entry.fileName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 truncate">{entry.fileName}</p>
            {entry.scores && (
              <span className={`text-xs font-mono ${/* score color class */}`}>
                {entry.scores.overall}/10
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AnalyzerView.tsx
git commit -m "feat: create AnalyzerView state machine with all 4 states"
```

### Task 12: Wire everything in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import new components**

```typescript
import { TopBar } from './components/TopBar';
import { AnalyzerView } from './components/AnalyzerView';
// Keep existing imports for CompareView, BatchView, etc.
```

- [ ] **Step 2: Add missing state variables and handlers**

```typescript
// Track when analysis completed for relative timestamp
const [analysisCompletedAt, setAnalysisCompletedAt] = useState<Date | null>(null);

// Set it when status transitions to complete
useEffect(() => {
  if (status === "complete") setAnalysisCompletedAt(new Date());
}, [status]);

// Extract swipe file handler (currently inline in App.tsx)
const handleAddToSwipeFile = () => {
  if (result && file) {
    addSwipeItem({
      fileName: file.name,
      scores: result.scores,
      markdown: result.markdown,
    });
  }
};

const showRightPanel = mode === "single" && status === "complete" && result !== null;
```

Right panel in the flex layout:
```jsx
<div className={`shrink-0 border-l border-white/5 bg-zinc-900/50 backdrop-blur-xl overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showRightPanel ? 'w-[340px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
  {showRightPanel && (
    <ScoreCard
      scores={result.scores}
      fileName={file?.name}
      analysisTime={analysisCompletedAt}
      modelName="Gemini 2.0 Flash"
      onGenerateBrief={handleGenerateBrief}
      onAddToSwipeFile={handleAddToSwipeFile}
    />
  )}
</div>
```

- [ ] **Step 3: Route AnalyzerView for single mode**

Replace the inline analyzer JSX with:
```jsx
{mode === "single" && (
  <AnalyzerView
    file={file}
    status={status}
    statusMessage={statusMessage}
    result={result}
    error={error}
    onFileSelect={handleFileSelect}
    onUrlSubmit={handleUrlSubmit}
    onAnalyze={handleAnalyze}
    onReset={handleReset}
    onCopy={handleCopy}
    onExportPdf={handleExportPdf}
    onShare={handleShare}
    onGenerateBrief={handleGenerateBrief}
    onAddToSwipeFile={handleAddToSwipeFile}
    copied={copied}
    shareLoading={shareLoading}
    historyEntries={entries}
    onHistoryEntryClick={handleHistoryEntryClick}
  />
)}
```

- [ ] **Step 4: Keep non-Analyzer modes rendering with existing styles**

```jsx
{mode === "compare" && <CompareView ... />}
{mode === "batch" && <BatchView ... />}
{mode === "preflight" && <PreFlightView ... />}
{mode === "swipe" && <SwipeFileView ... />}
```

These pass `t={themes.dark}` (the theme tokens object) as they currently do. The `themes` import stays for these views.

- [ ] **Step 5: Remove dead Analyzer inline JSX and unused theme references from Analyzer flow**

Delete the old inline Analyzer rendering (the `<ScoreCard>` inline in the main area, the `<ReactMarkdown>` report block, the `AnalyzingState` component, etc.). Keep any handler functions that are still referenced.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire AnalyzerView with new dashboard layout shell"
```

---

## Chunk 7: Responsive + Polish

### Task 13: Responsive 1024px breakpoint

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Add mobile sidebar overlay**

In Sidebar.tsx, when `mobileOpen` is true:
- Render a backdrop: `fixed inset-0 bg-black/50 z-40` with click to close
- Sidebar positioned: `fixed left-0 top-0 bottom-0 z-50 w-64 bg-zinc-950` (wider for overlay, includes mode labels)
- Slide in with `transition-transform`

- [ ] **Step 2: Show hamburger in TopBar below 1024px**

Use Tailwind responsive: `<button className="lg:hidden" onClick={onMobileMenuToggle}>` with `Menu` icon.

- [ ] **Step 3: Stack right panel below main content on smaller screens**

In App.tsx, the flex wrapper changes direction:
```jsx
<div className="flex flex-1 overflow-hidden max-lg:flex-col">
```

Right panel: `max-lg:w-full max-lg:border-l-0 max-lg:border-t max-lg:border-white/5`

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Sidebar.tsx src/components/TopBar.tsx
git commit -m "feat: responsive 1024px breakpoint — sidebar overlay, stacked right panel"
```

### Task 14: Visual verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run dev server and verify all 4 Analyzer states**

1. Empty state: upload card centered, glassmorphism, format chips (MP4/MOV/WEBM only), shortcut hint
2. Analyzing: progress card with shimmer, stage hints cycling, cancel works
3. Results: video + report cards on left, scorecard panel slides in from right
4. Error: error card with red border, retry + start over buttons work

- [ ] **Step 2: Verify non-Analyzer modes**

Click Compare, Batch, A/B Test, Swipe File in sidebar. Each should render their existing view. Right panel should not appear for these modes.

- [ ] **Step 3: Verify responsive behavior**

Resize to below 1024px: sidebar hidden, hamburger visible, right panel stacks below.

- [ ] **Step 4: Clean up any remaining inline styles in Analyzer components**

Search for `style={{` in modified files. Remove any that should be Tailwind classes.

- [ ] **Step 5: Remove unused imports**

Check for unused `themes`, `ThemeTokens`, `THEME_KEY` imports in Analyzer components. Leave them in App.tsx if non-Analyzer views need them.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: cleanup — remove dead styles, unused imports, verify all states"
```
