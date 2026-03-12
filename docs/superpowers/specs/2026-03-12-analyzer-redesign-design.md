# Analyzer View Redesign — Design Spec

## Overview

Redesign the Cutsheet Analyzer view to match the landing page's visual identity, using a dashboard-style layout inspired by modern SaaS tools (Linear, Figma, Slack). This is the first phase — once the Analyzer design is landed, it extends to Compare, Batch, A/B Test, and Swipe File modes.

## Approach

**Full Tailwind migration (Landing Page Fusion).** Migrate from CSS-in-JS inline styles to Tailwind classes throughout the Analyzer view. Dark mode only — no light mode toggle.

**`theme.ts` handling:** Cannot be deleted yet because out-of-scope views (Compare, Batch, A/B Test, Swipe File) still depend on it. Instead, leave `theme.ts` intact but stop importing it from Analyzer-related components. It gets deleted when all views are migrated in future phases.

**`tokens.css` handling:** Simplify by removing tokens that are now Tailwind classes in Analyzer components. Keep tokens that out-of-scope views still reference. Score color utilities (`getScoreColorByValue`) stay in `ScoreCard.tsx` where they already live.

**Tailwind v4 configuration:** This project uses Tailwind v4 with `@tailwindcss/vite`. Tailwind v4 uses CSS-based configuration via `@theme` directives, not a JS config file. Custom tokens (glow shadow, spring easing, shimmer animation) go into the main CSS file using `@theme { }` blocks.

## Visual Language

| Token | Value |
|-------|-------|
| Base background | `zinc-950` (`bg-zinc-950`) |
| Surface | `bg-zinc-900/50 backdrop-blur-xl` (glassmorphism) |
| Border | `border-white/5` (subtle), `border-white/10` (stronger) |
| Primary accent | `indigo-600` / `indigo-500` (hover) |
| Accent muted | `indigo-400` (labels), `indigo-500/15` (active bg) |
| Text primary | `text-white` |
| Text secondary | `text-zinc-400` |
| Text muted | `text-zinc-500` |
| Text faint | `text-zinc-600` |
| Radius (cards) | `rounded-3xl` (24px) |
| Radius (inner elements) | `rounded-2xl` (16px) |
| Radius (buttons) | `rounded-xl` (12px) |
| Radius (pills/chips) | `rounded-full` |
| Font sans | Geist Sans |
| Font mono | Geist Mono |
| Logo font | TBJ Interval |
| Shadow glow | `shadow-[0_0_20px_rgba(99,102,241,0.15)]` |
| Ease out | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

**Score color bands (intentional relabeling from existing code):**

| Range | Label | Color |
|-------|-------|-------|
| 9–10 | Excellent | `emerald-500` (`#10B981`) |
| 7–8 | Good | `indigo-500` (`#6366F1`) |
| 5–6 | Average | `amber-500` (`#F59E0B`) |
| 1–4 | Weak | `red-500` (`#EF4444`) |

The existing code uses "Strong" (9+), "Strong" (7-8), "Average" (5-6), "Weak" (3-4), "Poor" (1-2). This redesign intentionally simplifies to four bands with clearer naming. Update `getScoreLabel` in `ScoreCard.tsx` accordingly.

**Ambient effects:** Two absolutely positioned `div` elements behind main content, `pointer-events-none`, `fixed` or `absolute` within the main content container:
- Top-right: `w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]`
- Bottom-left: `w-[500px] h-[500px] rounded-full bg-violet-600/[8%] blur-[100px]`

**Custom animations (define via `@theme` in CSS):**

```css
/* Shimmer bar — indigo gradient sweeps left to right */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Usage: background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent);
   background-size: 200% 100%; animation: shimmer 2s infinite; */

/* Gentle pulse for status text (subtler than animate-pulse) */
@keyframes gentle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## Layout Shell

```
┌──────┬────────────────────────────────────┐
│      │  Top Bar (56px)                    │
│      ├─────────────────────────┬──────────┤
│ Side │                         │          │
│ bar  │   Main Content          │  Right   │
│      │                         │  Panel   │
│ 64px │                         │  340px   │
│ icon │                         │ (results │
│ only │                         │   only)  │
│      │                         │          │
└──────┴─────────────────────────┴──────────┘
```

### Sidebar (64px, icon-only, fixed left)

- **Background:** `bg-zinc-950` with right border `border-white/5`
- **Top section:** Cutsheet diamond logo icon (no text), centered
- **Middle section:** 5 mode icons stacked vertically, centered, `gap-2`
  - Analyzer, Compare, Batch, A/B Test, Swipe File
  - Each icon: 20px, `text-zinc-500` default
  - **Active state:** `bg-indigo-500/15 text-indigo-400 rounded-xl` pill background
  - **Hover state:** `bg-white/5 text-zinc-300` transition
  - Tooltip on hover showing mode name (since no text labels)
  - **Non-Analyzer modes:** Clicking Compare/Batch/A/B Test/Swipe File still works — renders the existing (un-restyled) views in the main content area. They retain their current CSS-in-JS styling until migrated in future phases.
- **Bottom section (pinned):** Settings gear icon, same styling rules as mode icons. Opens settings panel/modal (existing behavior preserved).
- **History access:** The existing Library/History button moves out of the sidebar. History is accessible via: (1) the Recent Analyses row in the empty state, and (2) a clock/history icon button in the top bar next to search. Clicking it opens the existing `HistoryDrawer` as a slide-over.

### Top Bar (56px, fixed top, spans right of sidebar)

- **Background:** `bg-zinc-950/80 backdrop-blur-xl` with bottom border `border-white/5`
- **Left:** "cutsheet" wordmark in TBJ Interval font, `text-base text-white`
- **Center-right, in order:**
  1. Search pill — `bg-white/5 rounded-full` input, placeholder "Search analyses...", `text-sm text-zinc-400`, ~240px wide. **Functional:** filters history entries by filename/date. Results appear in a dropdown: `bg-zinc-900 border border-white/10 rounded-xl shadow-lg mt-2 max-h-[320px] overflow-y-auto`. Each result row: `px-4 py-3 hover:bg-white/5` with filename (`text-sm text-white`), date (`text-xs text-zinc-500`), and score badge. If no history exists, dropdown shows "No analyses yet" in `text-sm text-zinc-500 p-4 text-center`. Dropdown closes on blur or Escape.
  2. History icon button — clock icon, `text-zinc-500 hover:text-zinc-300`, opens `HistoryDrawer`
  3. New Analysis button — `bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2`, with `+` icon. Resets to empty state.
  4. Profile avatar — 32px circle, gradient background (`from-indigo-500 to-violet-500`), user initial. Click opens dropdown: `bg-zinc-900 border border-white/10 rounded-xl shadow-lg mt-2 w-[200px] p-2`. Items: user name/email (`text-sm text-white px-3 py-2`), divider (`border-t border-white/5 my-1`), plan badge ("Free" / "Pro" in `text-xs text-indigo-400 px-3 py-1`), "Log out" row (`text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5`). Dropdown closes on blur or Escape.

### Main Content Area

- **Background:** `bg-zinc-950` with ambient glow effects (see Ambient Effects above)
- **Padding:** `px-8 py-6`
- **Flex layout:** `flex-1` — adjusts width when right panel appears (not overlay)

### Right Panel (340px, results state only)

- **Background:** `bg-zinc-900/50 backdrop-blur-xl` with left border `border-white/5`
- **Entrance:** Slides in from right with `transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`
- **Layout behavior:** Main content compresses (flex adjusts) — no overlay. Coordinated animation.
- **Not visible** during empty, analyzing, or error states

### Responsive (1024px breakpoint — in scope)

Below 1024px viewport width:
- Sidebar collapses entirely, replaced by a hamburger menu icon in the top bar (left side, before wordmark)
- Hamburger opens sidebar as a temporary overlay with backdrop
- Right panel stacks below main content instead of side-by-side

---

## State 1: Empty (Upload Hero)

**When:** No video loaded. Right panel hidden. Main content fills available space.

**Layout:** Upload card centered horizontally and vertically in main content area. Max width ~640px.

### Upload Card

- **Surface:** `bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5`
- **Inner drop zone:** `border-2 border-dashed border-white/10 rounded-2xl` area
  - **Drag-over state:** Border shifts to `border-indigo-500/50`, card scales `scale-[1.01]`, `shadow-glow` (indigo) appears
- **Content stack (centered):**
  1. Upload icon — 56px circle with indigo gradient background, upload arrow icon in white
  2. Heading — "Drop your creative here" — `text-xl font-semibold text-white`
  3. Subtext — "or browse to upload" — `text-sm text-zinc-400`
  4. Format chips — MP4, MOV, WEBM — `bg-white/5 rounded-full text-xs text-zinc-500 px-3 py-1` inline row. These match the accepted MIME types in code: `video/mp4`, `video/webm`, `video/quicktime` (shown as MOV). **Cleanup note:** The current code shows AVI and MKV pills despite not accepting those types. Remove them.
  5. Browse Files button — `bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-6 py-3`
  6. Keyboard shortcut hint — `text-xs text-zinc-600` — "or paste a URL · ⌘V to upload from clipboard". Platform-aware: show `Ctrl+V` on Windows/Linux, `⌘V` on macOS. Detect via `navigator.platform`.

**Validation errors:** Appear inline below the Browse Files button as a `text-xs text-red-400` message with a brief shake animation on the upload card. Messages: "File too large (max 200MB)" or "Unsupported format — try MP4, MOV, or WEBM". Dismissed automatically when user tries again.

### URL Input Behavior

- **No visible URL input by default.** Keeps the card clean.
- **Global paste listener** detects if a pasted value is a URL.
- When a URL is detected, a URL input field fades in (`animate-in`) below the Browse Files button: `bg-white/5 rounded-xl text-sm` with the pasted URL pre-filled and a "Go" button.

### Recent Analyses Row (conditional)

- **Only shows if history exists.** Hidden on first-ever session.
- Positioned below the upload card, full width of the centered area.
- Section label: "Recent" in `text-xs text-zinc-600 uppercase tracking-widest font-mono`
- 3-4 horizontal thumbnail cards: `bg-white/5 rounded-2xl border border-white/5 p-3`
  - Video thumbnail: **fallback-first approach.** History entries don't persist video blob URLs (they're revoked on unmount). Default display is the filename initial letter in a gradient circle (`from-indigo-500 to-violet-500`). If a future enhancement adds thumbnail capture (e.g., canvas frame stored as base64), the `<video>` element approach can replace the fallback.
  - Score badge — small pill, color-coded (emerald/indigo/amber/red) with score number
  - Filename truncated — `text-xs text-zinc-400 truncate`
- **Click behavior:** Re-opens that result instantly (no re-upload, loads from history)
- Horizontal scroll if more than 4 items, or capped at 4 visible

---

## State 2: Analyzing (Loading)

**When:** Video uploaded, Gemini is processing. Right panel still hidden. Main content centered.

**Auto-trigger:** Analysis begins automatically when a file is selected or dropped. There is no intermediate confirmation step — this matches the current behavior.

**Status-to-state mapping:**

| `AnalysisStatus` (hook) | View State |
|--------------------------|------------|
| `idle` | Empty |
| `uploading` | Analyzing (stage hint: "Reading video...") |
| `processing` | Analyzing (stage hints cycle through scoring/evaluating/generating) |
| `complete` | Results |
| `error` | Error |

### Transition from Empty to Analyzing

The upload card transitions to the progress card using Framer Motion `layoutId` on the outer card container:
- The card surface (`rounded-3xl border border-white/5`) is the shared layout element
- Max width animates from ~640px to ~480px
- Inner content crossfades: upload content fades out (`opacity 0, 150ms`), progress content fades in (`opacity 1, 150ms`, 100ms delay)
- Duration: 400ms total, easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Card remains centered throughout

### Progress Card

- **Surface:** `bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5`
- **Max width:** ~480px, centered
- **Content stack (top to bottom):**
  1. **Video thumbnail** — rendered as a `<video>` element (muted, paused on first frame via `preload="metadata"`) at small size, `rounded-2xl border border-white/5`, ~120px tall
  2. **Status text** — "Analyzing your creative..." — `text-lg font-medium text-white` with gentle pulse animation (custom `gentle-pulse`, not default `animate-pulse`)
  3. **Shimmer bar** — 2px tall, full card width, `rounded-full`. Indigo gradient that sweeps left-to-right infinitely (see `@keyframes shimmer` in Visual Language section). Not a real progress bar — purely visual motion.
  4. **Stage hints** — `text-xs text-zinc-500` text that cycles through real processing stages:
     - "Reading video..."
     - "Scoring hook strength..."
     - "Evaluating CTA clarity..."
     - "Generating report..."
     - Cycles every ~3 seconds with a crossfade transition. Honest descriptions of what Gemini is doing. No fake percentages or timestamps.
  5. **File metadata** — filename + duration + size in `text-xs text-zinc-600 font-mono`
  6. **Cancel link** — `text-xs text-zinc-500 hover:text-white cursor-pointer` — "Cancel". Calls `reset()` on the analyzer hook, returns to Empty state. The progress card transitions back to the upload card using the same `layoutId` animation in reverse.

**Ambient effect:** The indigo background glow intensifies slightly — the top-right blur circle opacity increases from `indigo-600/10` to `indigo-600/15` with a slow pulse.

---

## State 3: Results

**When:** Analysis complete. Right panel slides in. Main content compresses.

### Transition

- Right panel translates in from `translate-x-full` to `translate-x-0`
- Main content area width adjusts via flex layout
- Duration: 500ms, easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Single coordinated animation — panel and content move together

### Main Content: Video + Report

**Video Preview (top of main area):**
- Video player in `rounded-2xl border border-white/5 overflow-hidden`
- Native HTML5 controls
- Max height ~320px, width fills available space
- Below player: `text-xs text-zinc-500 font-mono` — filename, duration, file size

**AI Report (below video):**
- Section label: "ANALYSIS" — `text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4`
- **Parsing strategy:** The Gemini response is a single markdown string. Split it into sections by `## ` (h2) headings. Each h2 heading becomes a separate card. Content before the first h2 (if any) goes into an intro card with no title. If the markdown has no h2 headings, render the entire response as a single card.
- Each report section rendered as its own card:
  - `bg-zinc-900/50 rounded-2xl border border-white/5 p-5`
  - Section title (from h2): `text-sm font-semibold text-white mb-2`
  - Body text: `text-sm text-zinc-400 leading-relaxed`
  - Markdown rendering (bold, lists, inline code) supported within cards
- Cards stack vertically with `gap-3`

**Sticky Action Bar (bottom of main area):**
- `bg-zinc-950/80 backdrop-blur-xl border-t border-white/5`
- Fixed to bottom of main content scroll area
- Padding: `px-6 py-3`
- Buttons in order (left to right):
  1. "Copy Report" — `bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-4 py-2` (ghost)
  2. "Export PDF" — same ghost style
  3. "Share" — `bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2` (primary)

### Right Panel: Scorecard

**Panel Header:**
- "Score Overview" — `text-sm font-semibold text-white`
- Below: Relative timestamp — "Analyzed 12s ago" — `text-xs text-zinc-600`. Live-updating every 30s. Format: "Xs ago" → "Xm ago" → "Xh ago" → "Yesterday" → date string. No external library — simple `setInterval` with a formatter.
- Below: Model tag — "Gemini 2.0 Flash" (or whichever model ran the analysis) — `text-xs text-zinc-600 font-mono`
- Padding: `p-5`

**Overall Score (arc gauge):**
- Existing SVG arc gauge, restyled:
  - Track: `stroke-white/5`
  - Fill: score-colored gradient stroke
  - Animated fill on mount
  - Drop shadow glow matching score color
- Score number: `text-4xl font-bold font-mono text-white` centered below arc
- Score denominator: `/10` in `text-zinc-500`
- Score status badge: color-coded pill — `rounded-full px-3 py-1 text-xs font-medium`
  - Excellent (9-10): `bg-emerald-500/15 text-emerald-400`
  - Good (7-8): `bg-indigo-500/15 text-indigo-400`
  - Average (5-6): `bg-amber-500/15 text-amber-400`
  - Weak (1-4): `bg-red-500/15 text-red-400`

**Metric Bars (4 metrics):**
- Hook Strength, Clarity, CTA, Production
- Each row in `py-2`:
  - Top: Label `text-xs text-zinc-400` + Value `text-xs font-mono text-white` (flex justify-between)
  - Bottom: Progress bar — `h-1.5 rounded-full bg-white/5` track with score-colored gradient fill
  - Fill width = actual score percentage, set via inline style `style={{ '--bar-width': `${score}%` } as React.CSSProperties}` on the bar element. The CSS animation targets `width` from `0%` to `var(--bar-width)` using a `@keyframes barFill` rule (same pattern as the landing page hero bars).
  - Animated on mount: fill from 0% to score value

**Quick Actions (bottom of panel):**
- `border-t border-white/5 p-5 mt-auto`
- "Generate Brief" — `bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl w-full py-2.5` (ghost, full width)
- "Add to Swipe File" — same ghost style, below with `mt-2`

---

## State 4: Error

**When:** Gemini API returns an error, times out, or API key is missing/invalid. Right panel hidden.

### Error Card

Replaces the progress card in-place (same `layoutId` animation). Centered, max width ~480px.

- **Surface:** `bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-red-500/20` (red-tinted border)
- **Content stack (centered):**
  1. Error icon — 48px circle, `bg-red-500/15` with red exclamation mark icon
  2. Heading — "Analysis failed" — `text-lg font-semibold text-white`
  3. Error message — `text-sm text-zinc-400` — show the actual error from Gemini if available (e.g., "Video too short for analysis"), otherwise generic: "Something went wrong. Please try again."
  4. Action buttons — horizontal row, `gap-3`:
     - "Try Again" — `bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl px-5 py-2.5` (retries with same file)
     - "Start Over" — `bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-5 py-2.5` (resets to empty state)

---

## Glassmorphism Performance Note

Multiple surfaces use `backdrop-blur-xl`. To avoid stacked blur performance issues:
- Sidebar uses `bg-zinc-950` (opaque, no blur needed — it's the same color as the base)
- Top bar uses `backdrop-blur-xl` (one layer, scrolls behind it)
- Surface cards use `backdrop-blur-xl` (content area)
- Right panel uses `backdrop-blur-xl`

Maximum 2-3 blur layers visible at once. If performance issues arise during implementation, the surface cards can drop blur in favor of a slightly more opaque `bg-zinc-900/80` fallback.

---

## What's Removed (Analyzer scope)

- Light mode imports and toggle logic from Analyzer components
- CSS-in-JS inline styles in Analyzer components (replaced by Tailwind classes)
- Notification bell (nothing to notify in v1)
- Settings from top bar (lives in sidebar bottom only)
- Visible URL input field in upload card (replaced by global paste detection)
- Library/History sidebar button (replaced by top bar history icon + Recent Analyses row)

## What's Preserved

- All existing functionality (upload, analyze, results, export, share)
- Gemini API integration (unchanged)
- `theme.ts` — left intact for out-of-scope views, just not imported by Analyzer components
- `tokens.css` — simplified but kept for out-of-scope views
- SVG arc gauge (restyled, not rebuilt)
- History/swipe file hooks (data layer unchanged)
- PDF export — `ReportAnalysis.tsx` is used only for PDF rendering (fixed 794px layout). It is NOT the same as the in-app report display. Leave `ReportAnalysis.tsx` unchanged for now; the in-app report is a new card-based layout rendered inline in the Analyzer view.
- `HistoryDrawer` — preserved, opened from top bar history icon

## Files Affected (Analyzer scope only)

| File | Change |
|------|--------|
| `src/App.tsx` | Rewrite layout shell (sidebar, top bar, main area, right panel), remove inline styles, add Tailwind classes. Extract Analyzer view into its own flow within the new layout. |
| `src/components/Sidebar.tsx` | Rebuild as 64px icon-only sidebar with Tailwind. All 5 modes present and functional. Settings gear pinned to bottom. |
| `src/components/VideoDropzone.tsx` | Restyle upload card with glassmorphism. Add global paste listener. Remove visible URL input. Add validation error display. Add platform-aware shortcut hint. |
| `src/components/ScoreCard.tsx` | Restyle as right panel scorecard. Update `getScoreLabel` to new 4-band system (Excellent/Good/Average/Weak). Add relative timestamp, model tag. |
| `src/components/ReportAnalysis.tsx` | **No change** — this is PDF-only. In-app report is a new inline card layout in the Analyzer view. |
| `src/theme.ts` | **No change** — preserved for out-of-scope views. Analyzer components stop importing from it. |
| `src/styles/tokens.css` | Add `@theme` blocks for custom animations (shimmer, gentle-pulse) and design tokens (glow shadow, easing curves). Keep existing tokens for out-of-scope views. |

## Accessibility & Motion

- All sidebar mode icons and settings gear are `<button>` elements with `aria-label` set to the mode name. Focus state matches hover state styling (`bg-white/5 text-zinc-300` + focus ring `ring-1 ring-indigo-500/50`).
- All custom animations (shimmer, gentle-pulse, layoutId transitions, bar fills) respect `prefers-reduced-motion: reduce`. When active, animations are instant or disabled. The existing `tokens.css` already has a `@media (prefers-reduced-motion: reduce)` block — extend it to cover new animations.
- Fonts: Geist Sans and Geist Mono are already loaded via `index.html` `<link>` tags. No additional font setup needed.

## Out of Scope

- Compare, Batch, A/B Test, Swipe File mode restyling (future phases — they render in the main area using existing styles when selected)
- Notification system
- Light mode
- PDF export restyling (ReportAnalysis.tsx stays as-is)
- Mobile-specific layouts below 768px (the 1024px sidebar collapse IS in scope)
