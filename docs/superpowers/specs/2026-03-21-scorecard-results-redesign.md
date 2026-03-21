# ScoreCard Results Page Redesign

## Context

The ScoreCard right panel (340px) has 12+ sections crammed together with no visual hierarchy. Action buttons are scattered across three locations. Two parallel history systems show inconsistent data. MetricBars show cosmetic fills that do not reflect real scores. Mobile users are not scrolled to results after analysis. Start Over has no confirmation.

This spec defines 6 discrete passes to fix these problems. Each pass is a single commit. No pass changes AI prompts, API routes, auth logic, or billing.

## Files

| File | Passes |
|------|--------|
| `src/components/ScoreCard.tsx` (~795 lines) | 1, 2, 4, 6 |
| `src/components/scorecard/MetricBars.tsx` (~99 lines) | 4 |
| `src/components/scorecard/ScoreAdaptiveCTA.tsx` (~87 lines) | 1 |
| `src/components/scorecard/HookDetailCard.tsx` (~72 lines) | 1 |
| `src/components/scorecard/BudgetCard.tsx` (~124 lines) | 1 |
| `src/pages/app/PaidAdAnalyzer.tsx` (~1050 lines) | 2, 5 |
| `src/components/HistoryDrawer.tsx` (~362 lines) | 3 |
| `src/components/HistoryPanel.tsx` (~117 lines) | 3 |
| `src/hooks/useHistory.ts` | 3 (refactor or remove) |
| `src/services/historyService.ts` | 3 (source of truth, reference) |
| `src/components/scorecard/QuickActions.tsx` | 2 (remove — absorbed by action row) |
| `src/components/ui/CollapsibleSection.tsx` | reused, not modified |
| `src/components/ui/AlertDialog.tsx` | reused, not modified (use existing destructive variant) |
| `src/components/ui/OverflowMenu.tsx` | 1 (items list change) |
| `src/styles/tokens.css` | reference only (`--radius-sm: 6px` per tokens.css) |

## Pass 1 — Consolidate and Reorder ScoreCard

### New section order

```
1. Score hero         — arc gauge (72px) + score number + semantic label
2. Platform pills     — always visible, max 3 + "More+" expand
3. 4 MetricBars       — always visible (bar fill fix in Pass 4)
4. ScoreAdaptiveCTA   — primary action, always visible
5. Action row         — Fix It / Visualize / Policy Check (Pass 2)
6. HookDetailCard     — collapsed, verdict + score in header
7. ImprovementsList   — collapsed, count badge in header
8. PredictedPerformance — collapsed, verdict in header
9. BudgetCard         — collapsed
10. Scene Breakdown   — collapsed (video only)
11. Static Ad Checks  — collapsed (static only)
12. Hashtags          — collapsed
13. Overflow menu     — Start Over, Compare, Share, Download, History
```

### Removed elements

- **Deep Dive pills strip + SlideSheet + DeepDiveTabGroup** — all 5 tabs removed:
  - "Scenes" tab content → already covered by Scene Breakdown collapsible section (#10)
  - "Hashtags" tab content → already covered by Hashtags collapsible section (#12)
  - "Ad Checks" tab content → already covered by Static Ad Checks collapsible section (#11)
  - "Copy Breakdown" tab → placeholder only ("will appear here..."), remove entirely
  - "Emotional Tone" tab → placeholder only ("will appear here..."), remove entirely
  - Remove `SlideSheet` and `DeepDiveTabGroup` imports from ScoreCard.tsx
- **QuickActions.tsx** — remove entirely; its Policy Check, Generate Brief, and Save Ad buttons are absorbed by the new action row and overflow menu
- **Standalone Compare link** — moved to overflow menu
- **Analysis/History tab switcher** — history accessible via overflow menu or sidebar

### Spacing rules (4px grid, non-negotiable)

| Between | Gap |
|---------|-----|
| Score hero → Platform pills | 16px |
| Platform pills → MetricBars | 16px |
| MetricBars → ScoreAdaptiveCTA | 20px |
| ScoreAdaptiveCTA → Action row | 12px |
| Action row → first collapsible | 24px |
| Between collapsible sections | 8px |
| Collapsible header internal padding | 12px vertical |
| Last collapsible → Overflow menu | 16px |

### Constraints

- All spacing values on 4px grid
- Colors use design tokens from `tokens.css` — no raw hex in JSX
- No score logic, AI prompt, or API changes
- Collapsible sections use existing `CollapsibleSection` component
- Glass card surface (`--glass-card-bg`, `--glass-card-blur`, `--glass-card-border`) preserved
- `framer-motion` animations on arc gauge and bar fills preserved

## Pass 2 — Consolidate Action Buttons

### Current state

- Fix It For Me: inside ScoreCard glass card, full-width indigo button
- Visualize It: in left panel (PaidAdAnalyzer.tsx), only for static ads
- Policy Check: buried in overflow menu

### New state

Single horizontal action row inside ScoreCard, below ScoreAdaptiveCTA:

```
[ Fix It For Me ] [ Visualize It ] [ Policy Check ]
```

- 3 buttons, `display: flex`, `gap: 8px`, each `flex: 1`
- Outlined style: `border: 1px solid var(--border)`, `background: transparent`
- Height: 36px, `border-radius: var(--radius-sm)` (6px)
- Icon (16px) + label (12px, Geist Sans, `var(--ink-muted)`)
- Hover: `background: var(--surface)`, `border-color: var(--border-strong)`

### Pro gate behavior

If feature is locked:
- Button shows Lock icon (12px) + "PRO" pill (10px, `var(--accent)` bg, white text)
- Click triggers `onUpgradeRequired(featureKey)` — existing behavior, no changes
- No loading state on locked buttons

### Loading state

- Individual button shows spinner (14px) replacing icon when its action is running
- Other buttons remain clickable
- Label text unchanged during loading

### Mobile (<768px)

- Stack to `flex-direction: column`, each button `width: 100%`

### Removals

- Remove Visualize It trigger button from left panel in `PaidAdAnalyzer.tsx`
- Remove standalone Fix It For Me button from its current position in ScoreCard
- Left panel retains: creative preview + VisualizePanel output (when run)

### Constraints

- Do not change what any button does — only where it lives
- Do not change UpgradeModal behavior or credit deduction logic
- Do not change VisualizePanel output component

## Pass 3 — Fix Dual History Systems

### Problem

Two parallel history systems:
1. **localStorage** via `useHistory` hook — client-side, no auth required
2. **Supabase** via `historyService` — server-side, requires session

HistoryDrawer reads localStorage. HistoryPanel reads Supabase. They show different data.

### Fix

- **Supabase is the single source of truth**
- Remove all `localStorage.getItem` / `localStorage.setItem` calls related to analysis history
- HistoryDrawer and HistoryPanel both query Supabase only
- Loading state: show skeleton shimmer (existing `Skeleton` component)
- No session (logged out): show "Sign in to see history" empty state
- Do NOT remove localStorage usage for non-history features (theme, preferences, sidebar state)

### Audit targets

- `src/hooks/useHistory.ts` — primary localStorage history hook (lines 23, 33, 59 have localStorage calls)
- `src/services/historyService.ts` — Supabase source of truth (queries `analyses` table)
- Any `localStorage` calls in `PaidAdAnalyzer.tsx` related to history entries
- `HistoryDrawer.tsx` data source
- `HistoryPanel.tsx` data source
- `DashboardIdleView.tsx` recent analyses section

### Constraints

- Do not change the Supabase schema
- Do not change HistoryPanel or HistoryDrawer visual UI — only the data source
- Do not change non-history localStorage usage

## Pass 4 — Fix MetricBars to Use Real Data

### Current state

MetricBars fill percentages are already computed from real data (`value / 10 * 100` in MetricBars.tsx line 50). The animation entrance is driven by a `mounted` boolean prop that flips once via `useEffect` in ScoreCard.tsx — this is a mount-triggered entrance animation, not fake data.

**The actual problem:** Bar fill colors may use hardcoded hex values via `getScoreColorByValue()` instead of CSS custom property tokens.

### Fix

1. Replace `getScoreColorByValue(value)` calls with token-based colors:
   - score >= 7: `var(--score-excellent)`
   - score >= 5: `var(--score-good)`
   - score >= 3: `var(--score-average)`
   - score < 3: `var(--score-weak)`
2. Ensure score number is displayed right-aligned in Geist Mono (`var(--mono)`), 13px
3. Keep the `mounted` prop entrance animation (`barFill` keyframe) — this is legitimate
4. Verify bar fill reflects real `scores.hook/clarity/cta/production` values (already does)

### File

`src/components/scorecard/MetricBars.tsx` + `src/components/ScoreCard.tsx` (for any `getScoreColorByValue` imports)

## Pass 5 — Mobile Scroll-to-Results

### Problem

On mobile (<768px), when analysis completes the ScoreCard appears below the fold. Users must manually scroll down.

### Fix

In `PaidAdAnalyzer.tsx`:
1. Add a `ref` to the ScoreCard container element
2. When analysis status transitions from `"analyzing"` to `"complete"`:
   - Check `window.innerWidth < 768`
   - If true: `setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)`
3. Desktop (>= 768px): no scroll behavior — both panels visible simultaneously

### Constraints

- Behavior change only — no visual changes
- Use `scrollIntoView`, not `window.scrollTo`
- 150ms delay allows DOM to settle before scrolling

## Pass 6 — Start Over Confirmation Dialog

### Current state

Start Over in overflow menu immediately calls `handleReset` — no confirmation, no undo.

### Fix

Use existing `AlertDialog` component:

```
Title: "Start over?"
Body: "This will clear your current analysis. You can find it in History."
Cancel button: secondary style, dismisses dialog
Start Over button: use AlertDialog's existing destructive variant (renders as bg-red-500/15 text-red-400)
```

- Dismiss on backdrop click: yes
- Dismiss on Escape: yes
- Only execute `handleReset` on "Start Over" confirm
- AlertDialog already handles focus trapping

### File

`src/components/ScoreCard.tsx` — wrap the Start Over overflow menu item's `onClick` to open AlertDialog instead of calling `onStartOver` directly.

## Post-Implementation Verification

### Accessibility

- Focus order logical in new ScoreCard layout
- AlertDialog traps focus correctly
- Action row buttons have `aria-label` attributes
- Collapsible sections have `aria-expanded`

### Screenshots (chrome-devtools-mcp)

1. Results page at 1280px — before vs after
2. Results page at 375px — action row stacks correctly
3. Action row states: default, loading, pro-locked
4. Start Over confirmation dialog open
5. HistoryPanel showing Supabase data only
6. MetricBars with real score fills

### Final checks

- No TypeScript errors (`npm run lint`)
- Build succeeds (`npm run build`)
- No regressions on untouched surfaces
