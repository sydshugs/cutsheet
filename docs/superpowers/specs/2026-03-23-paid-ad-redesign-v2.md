# Paid Ad Results Page — V2 Redesign Spec

## Goal
Redesign the paid ad results page from a split-panel report viewer into a single-column command center. Score-led, action-oriented, tool sheets on demand. Superhuman x Raycast x Linear.

## Core Insight
Media buyers don't want analysis — they want decisions. The score should be a verdict with a recommended action. The page should feel like a command center, not a report.

## Layout: Single Column + Slide-Out Tool Sheets

**Remove the right panel.** The current split-panel (left: analysis, right: scorecard) creates a "two-website" problem. Instead:

- Single centered column (max-width 680px)
- Score hero at the TOP — the first thing you see
- Action strip immediately below — the first thing you can DO
- Quick Wins (top 3 improvements) always visible
- Media preview below the score (you already uploaded it)
- Deep analysis sections: collapsible, each shows score in header
- Tools (Fix It, Brief, Policy Check) open as slide-out sheets from the right

### Render Order (after analysis completes)

```
1. Platform Switcher (pill tabs, sticky or top)
2. ScoreHero (score, verdict, dims, benchmark)
3. ActionStrip (primary + ghost buttons, verdict-driven)
4. QuickWins (top 3 improvements, always visible)
5. Media Preview (video/image + "drop to compare" zone)
6. Deep Analysis sections (collapsible):
   - Hook Analysis (with score in header)
   - Copy & Messaging
   - Visual Production
   - CTA Effectiveness
   - Emotional Impact
   - Scene Breakdown (video only)
   - Budget Recommendation
   - Predicted Performance
   - Hashtags
7. Second Eye / Static Design Review
8. Sticky footer: Copy Report | Export PDF | Share
```

### Tool Sheet (overlay)

When user clicks "Fix This Ad", "Brief", or "Ad Policies":
- Sheet slides in from right (440px wide, 250ms ease-out-expo)
- Main column dims with overlay (click overlay to dismiss)
- Fixed header: tool name + close button
- Content: the tool result (Fix It, Brief markdown, Policy flags)
- Close: click ×, click overlay, or press Escape

## Verdict System: Kill / Test / Scale

| Score | Verdict | Color | Subtitle | Primary Action |
|-------|---------|-------|----------|----------------|
| 0-4 | Kill | `--error` | "Kill this creative — rework needed" | Fix This Ad |
| 5-7 | Test | `--accent` | "Worth testing — fix [weakest dim] first" | Generate Brief |
| 8-10 | Scale | `--success` | "Ready to scale — increase budget" | Share Score |

## New Components

### `ActionStrip.tsx`
Horizontal row of action buttons below ScoreHero.

```
Kill:  [■ Fix This Ad]  [Brief]  [Ad Policies]
Test:  [■ Brief]  [Fix This Ad]  [Ad Policies]
Scale: [■ Share Score]  [Brief]  [Ad Policies]
```

- Primary button: `.cs-btn-primary`, changes based on verdict
- Ghost buttons: `.cs-btn-ghost`
- Conditional: "See Improved" (static + Pro only), "Compare" (overflow or ghost)
- All buttons have: default → hover → active → loading → disabled states

### `ToolSheet.tsx`
Slide-out overlay panel for tool results.

- Width: 440px, slides from right
- Enter: `x: 100% → 0`, 250ms, ease-out-expo
- Exit: `x: 0 → 100%`, 200ms
- Overlay: `rgba(0,0,0,0.5)`, click to dismiss
- Header: tool name + `×` button
- Content area: scrollable, padded
- Escape key closes

### `QuickWins.tsx`
Top 3 improvements, always visible (not collapsible).

- Each improvement: bullet + one-line text
- "All N improvements" expander link
- When expanded: full list with slide-down animation
- If no improvements: "No critical issues. This ad is ready."

## Modified Components

### `PaidAdAnalyzer.tsx`
- Remove the right panel `div` entirely (the `w-[440px]` shrink-0 container)
- Remove `rightTab` state ("analysis" | "brief" | "policy")
- Add `toolSheet` state: `null | "fixit" | "brief" | "policy"`
- Single column: `max-w-[680px] mx-auto px-4 py-6`
- Render: PlatformSwitcher → ScoreHero → ActionStrip → QuickWins → MediaPreview → DeepAnalysis → SecondEye → Footer
- Tool button clicks: `setToolSheet("fixit")` etc.
- ToolSheet renders outside the column, positioned fixed

### `ScoreCard.tsx` → renamed to `ScoreHero` usage only
ScoreCard currently orchestrates everything. In v2:
- ScoreHero remains as-is (score number, verdict, dims, benchmark)
- Action buttons → extracted to ActionStrip
- Improvements → extracted to QuickWins
- OverflowMenu → removed (actions are all visible)
- Remaining sections (Hook, Budget, Hashtags, Scene, Predictions) render directly in the main column as collapsible sections
- ScoreCard.tsx becomes a thin wrapper or is removed, with sections rendered directly from PaidAdAnalyzer

### `ReportCards.tsx`
- Keep the markdown analysis cards
- Each card: `.cs-card`, collapsible with score in header
- Staggered entrance animation (already done)
- Move BELOW QuickWins + Media Preview

## Microcopy

| Element | Copy |
|---------|------|
| Verdict (8+) | "Scale" |
| Verdict (5-7) | "Test" |
| Verdict (0-4) | "Kill" |
| Subtitle (8+) | "Ready to scale — increase budget" |
| Subtitle (5-7) | "Worth testing — fix [weakest] first" |
| Subtitle (0-4) | "Kill this creative — rework needed" |
| Fix button | "Fix This Ad" / "Polish This Ad" (8+) |
| Visualize button | "See Improved" |
| Policy button | "Ad Policies" |
| Brief button | "Brief" |
| Share button | "Share Score" |
| Empty improvements | "No critical issues. This ad is ready." |
| Empty hashtags | "No hashtags for this format." |
| Analysis error | "Analysis failed — try a different file or re-upload" |
| Fix loading | "Rewriting your ad..." |
| Brief loading | "Writing your creative brief..." |
| Policy loading | "Checking ad policies..." |
| Benchmark label | "Meta avg 7.2" (include the number) |
| Mini dropzone | "Drop new creative to compare" |
| Show more improvements | "All N improvements" |

## Interaction States

Every interactive element has 5 states: default, hover, active, loading, disabled.

- Ghost buttons: border brightens on hover, translateY(-1px), scale(0.98) on active
- Primary buttons: bg lightens on hover, same transforms
- Loading: spinner + "Working..." text, disabled appearance
- Disabled: 35% opacity, no pointer events
- Hashtag chips: click-to-copy, "✓" feedback for 1s
- Collapsible sections: chevron rotates, content slides down (200ms)
- Tool sheet: slide-in/out with overlay dim

## Animation Budget

| Animation | Duration | Easing |
|-----------|----------|--------|
| Score count-up | 600ms | ease-out cubic |
| Dimension stagger | 80ms between | ease-out |
| Card entrance stagger | 60ms between, 300ms each | ease-out-expo |
| Collapsible open/close | 200ms | ease-out-expo |
| Tool sheet enter | 250ms | ease-out-expo |
| Tool sheet exit | 200ms | ease-out |
| Button hover | 120ms | ease-out |
| Hashtag copy feedback | 1000ms hold | — |

## Design Tokens (from previous pass)

All token work from the v1 PR carries forward:
- Surface hierarchy: `--surface-1/2/3`
- Border scale: `--border-subtle/default/hover/focus`
- Verdict tokens: `--verdict-scale/test/kill`
- Utility classes: `.cs-card`, `.cs-btn-ghost`, `.cs-btn-primary`, `.cs-chip`, `.cs-skeleton`
- Shared utilities: `scoreColors.ts`, `severityConfig.ts`

## Constraints

- Do NOT change analysis logic, API calls, or data processing
- Do NOT touch pages other than paid ad results
- No glassmorphism, backdrop-blur (except tool sheet overlay)
- One accent color (indigo)
- No animations over 300ms (score count-up exception: 600ms)
- Dark mode only
