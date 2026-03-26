# PreFlightView Results State Redesign
**Date:** 2026-03-26
**Status:** Approved

---

## Problem

The `phase === "done"` results block in `PreFlightView.tsx` renders as a centered single-column layout (max-width 900px). It does not match the two-column panel architecture used by PaidAdAnalyzer, OrganicAnalyzer, and DisplayAnalyzer. The current UI feels disconnected from the rest of the app.

## Goal

Rebuild only the `phase === "done"` block (lines ~464–577) as a proper two-column layout mirroring PaidAdAnalyzer's structure. No logic changes. No new files. No other phases touched.

---

## Layout

### Outer Shell

```
div.flex.h-full (min-height: calc(100vh - 56px))
  ├── Left panel:  flex-col flex-1 min-w-0 overflow-hidden → inner: flex-1 overflow-auto p-6
  └── Right panel: shrink-0 w-[440px] bg-zinc-900/50 backdrop-blur-xl
                   border-l border-white/5 overflow-y-auto pb-12
```

---

### Left Panel (top → bottom)

#### 1. Thumbnail row
- Two thumbnails side-by-side (`grid grid-cols-2 gap-3`)
- Each thumbnail: `aspect-video` or `aspect-square` depending on file type, `rounded-xl overflow-hidden bg-[#18181b]`
- **Winner thumbnail**: rose ring `ring-2 ring-[#ec4899]` + small "Winner" badge overlay (bottom-left, `bg-[#ec4899] text-white text-[10px] font-bold px-2 py-0.5 rounded-full`)
- Loser: neutral `border border-white/[0.06]`
- Show file name below each thumbnail in zinc-500 mono text

#### 2. Predicted winner banner
- Card: `bg-[#18181b] border border-white/[0.06] rounded-2xl overflow-hidden`
- Rose left-border: `border-l-4 border-l-[#ec4899]` (replace card left-border)
- Content: `px-5 py-4`
  - Label: `text-[10px] font-semibold uppercase tracking-widest text-zinc-500` → "PREDICTED WINNER"
  - Headline: `text-base font-semibold text-zinc-100 mt-1` → `comparison.winner.headline`
  - Reasoning: `text-sm text-zinc-400 mt-1.5 leading-relaxed` → `comparison.winner.reasoning`
  - Predicted lift badge: `inline-flex mt-3 text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-0.5` → `↑ {comparison.winner.predictedLift}`

#### 3. Head-to-head breakdown
- Section label: `text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3` → "HEAD-TO-HEAD"
- Card: `bg-[#18181b] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04]`
- Three rows: Hook · CTA · Retention
- Each row: `flex items-start gap-3 px-5 py-3.5`
  - Dimension: `text-xs font-medium text-zinc-400 w-20 flex-shrink-0`
  - Winner pill: if A wins → `bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20`; if B wins → `bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`; text `text-[11px] font-semibold px-2 py-0.5 rounded-full`
  - Reason: `text-xs text-zinc-500 flex-1`

#### 4. Recommendation
- Section label: same pattern → "RECOMMENDATION"
- Card: `bg-[#18181b] border border-white/[0.06] rounded-2xl px-5 py-4`
- Text: `text-sm text-zinc-300 leading-relaxed` → `comparison.recommendation`

#### 5. Hybrid opportunity (conditional)
- Renders only when `comparison.hybridNote !== null`
- Card: `bg-[#18181b] border border-white/[0.06] rounded-2xl overflow-hidden` with amber left-border `border-l-4 border-l-[#f59e0b]`
- Label: `text-[10px] font-semibold uppercase tracking-widest text-amber-400` → "HYBRID OPPORTUNITY"
- Text: `text-sm text-zinc-300 mt-1 leading-relaxed` → `comparison.hybridNote`

---

### Right Panel (top → bottom)

#### 1. Section label
`text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-5 pt-5 pb-3` → "SCORE COMPARISON"

#### 2. Score comparison cards
- For each `RankedVariant` in `comparison.rankings`:
  - Card: `mx-4 mb-3 rounded-2xl bg-[#18181b] border border-white/[0.06] overflow-hidden`
  - **Winner card**: rose left-border `border-l-4 border-l-[#ec4899]` instead of standard border on left
  - Content `px-4 py-4`:
    - Top row: label (`text-sm font-semibold text-zinc-200`) + rank badge (`text-[10px] font-mono text-zinc-500`)
    - Score: `text-3xl font-mono font-bold` colored by score band (emerald ≥8, amber ≥4, red <4)
    - Key strength: `text-xs text-emerald-400 mt-2` + strength text
    - Key weakness: `text-xs text-zinc-500 mt-0.5` + weakness text
    - `wouldScale` tag: if true → `text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-full px-2 py-0.5 inline-flex mt-2` → "Ready to scale"; else → same pattern with zinc → "Needs work"

#### 3. Confidence badge
- `mx-4 mb-4`
- High → `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs font-semibold` → "HIGH CONFIDENCE"
- Medium → amber
- Low → red

#### 4. Run New Test button
- `mx-4 mb-2 w-[calc(100%-2rem)]`
- `bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-3`
- Calls `handleReset`

#### 5. Export PDF button
- `mx-4 mb-4 w-[calc(100%-2rem)]`
- `bg-transparent border border-white/[0.08] hover:bg-white/[0.04] text-zinc-400 text-sm font-medium rounded-xl px-4 py-3`
- Calls `handleExportPdf`

---

## Color Rules

| Element | Color |
|---------|-------|
| Winner thumbnail ring, winner banner left-border, A-wins pill, winner score card left-border | Rose `#ec4899` |
| B-wins pill, "Run New Test" button, Export PDF button | Indigo `#6366f1` |
| Hybrid card left-border, medium confidence | Amber `#f59e0b` |
| All card surfaces | `#18181b` — never colored fills |
| Score number (strong) | Emerald `#10b981` |
| Score number (average) | Amber `#f59e0b` |
| Score number (weak) | Red `#ef4444` |

---

## Constraints

- **Zero logic changes** — all state, hooks, handlers stay identical
- **Files touched**: `src/components/PreFlightView.tsx` only (lines ~464–577)
- **No new files** — rendering is inline in the two panels
- **Existing sub-components untouched**: `PreFlightWinner`, `PreFlightRankCard`, `PreFlightHeadToHead` stay in repo but are no longer rendered by the results state
- **No `use client`** — Vite SPA
- **No hardcoded hex in Tailwind classes** — use inline styles for custom brand colors, Tailwind utilities for layout/spacing
- **Build must pass 0 errors** before pushing to staging

---

## Out of Scope

- Idle, analyzing, comparing phases — untouched
- Mobile responsive tweaks beyond Tailwind's `max-lg` breakpoint pattern
- Any changes to `comparisonService.ts`, types, or AI prompts
