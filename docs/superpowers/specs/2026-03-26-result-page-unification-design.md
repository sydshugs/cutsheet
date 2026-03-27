# Result Page Unification — Design Spec

> **Goal:** Make Organic and Display result pages look exactly like the Paid Ad result page. Same two-column layout, same ScoreCard, same section order. Only content differs per page. Multi-ad pages get visual polish only.

**Scope:** Option A — Unify single-ad result pages (Organic + Display). Multi-ad pages (A/B Test, Rank Creative, Ad Breakdown, Competitor) keep specialized layouts with visual consistency pass.

**Reference implementation:** `src/pages/app/PaidAdAnalyzer.tsx` — two-column layout with `ReportCards` (left, scrollable) + `ScoreCard` (right, 440px sticky).

---

## Section 1: Organic Analyzer

**Current state:** Organic already uses `AnalyzerView` → `ReportCards` + `ScoreCard` pipeline with `isOrganic={true}`. The layout is correct. The gap is missing ScoreCard props.

**Problem:** OrganicAnalyzer does not pass several props that PaidAdAnalyzer passes to ScoreCard, so those sections silently don't render.

### Missing props — full gap analysis

Comparing OrganicAnalyzer's ScoreCard usage (lines 615-641) against PaidAdAnalyzer's (lines 1145-1204):

**Props to wire (data available, just not passed):**
- `analysisSections` — extract from `rawResult.markdown` using `extractRightPanelSections()`. Note: Organic's AI prompt generates the same markdown section structure as Paid Ad (Hook, Hierarchy, etc.), so the parser will find matching sections. If a section is absent from the markdown, it gracefully returns empty — no crash.
- `verdict` — Organic's AI response does NOT include the structured `{ state, headline, sub }` verdict object. Compute it from the score: `score >= 8 → 'ready'`, `score >= 5 → 'needs_work'`, `else → 'not_ready'`. Use the existing `result.verdict` string (from markdown) as `headline`, and set `sub` to a brief label like "Organic content". This matches what DisplayScoreCard already does (line 84 of DisplayScoreCard.tsx).
- `briefLoading` / `hasBrief` — OrganicAnalyzer already has `briefLoading` and `brief` state. Pass `briefLoading={briefLoading}` and `hasBrief={!!brief}` to ScoreCard. The Generate Brief button in ScoreCard will then render.
- `onGenerateBrief` — already exists as `handleGenerateBrief`. Pass it.
- `hashtags` — already passed (line 619). ✓ No change needed.
- `platformSwitcher` — Organic already has platform tabs rendering in AnalyzerView. Wire as `platformSwitcher={<PlatformSwitcher ... />}` JSX passed to ScoreCard.
- `engineBudget` — Organic does not currently generate budget recommendations. **Intentional omission** — Organic content doesn't have ad spend, so budget card is irrelevant.
- `onNavigateSettings` — pass from router `useNavigate()` like Paid Ad does.
- `onStartOver` — pass `handleReset` with AlertDialog confirmation (same pattern as Paid Ad).
- `onCompare` — **intentional omission** — compare is Paid Ad-specific.
- `onVisualize` / `canVisualize` — already passes `canVisualize={false}` (line 640). ✓ No change needed.
- `isPro` / `onUpgradeRequired` — pass from `useOutletContext<AppSharedContext>()` (already destructured in OrganicAnalyzer).
- `onCheckPolicies` / `policyLoading` — **intentional omission** for now — policy check is not wired in Organic. Could be added later as a separate feature.
- `improvementsLoading` — pass `false` (improvements come with the initial analysis, not lazy-loaded).
- `platformScore` — already wired via `platformScores` state. When user selects a non-"all" platform, pass the platform-specific overall score.

**Files touched:**
- `src/pages/app/OrganicAnalyzer.tsx` — add missing prop wiring, add verdict computation, add analysisSections extraction
- No new components needed

---

## Section 2: Display Analyzer

**Current state:** Display uses a completely custom layout — single-column left panel with inline mockup/tools/compliance, plus a custom `DisplayScoreCard` in the right panel that only renders ScoreHero. Fundamentally different structure from Paid Ad.

**Target state:** Same two-column skeleton as Paid Ad — left panel with Display-specific content, right panel using the standard `ScoreCard` component.

### ScoreCard interface adaptation for Display's 5 dimensions

**Problem:** ScoreCard's `Scores` interface hardcodes 4 fields: `{ hook, clarity, cta, production, overall }`. Display has 5 different dimensions. The `handleCopy` function also hardcodes "Hook Strength", "Message Clarity", etc.

**Solution: Add optional `dimensionOverrides` prop to ScoreCard.**

```tsx
// New optional prop on ScoreCardProps
dimensionOverrides?: { name: string; score: number }[];
```

When `dimensionOverrides` is provided:
1. **ScoreHero** uses `dimensionOverrides` instead of constructing dimensions from `scores.hook`/`scores.clarity`/etc.
2. **handleCopy** iterates `dimensionOverrides` for the copy text instead of hardcoded dimension names.
3. The `scores` prop is still required for the `overall` score (used by ScoreHero, benchmark, verdict).

For Display, pass:
```tsx
<ScoreCard
  scores={{ hook: 0, clarity: 0, cta: 0, production: 0, overall: result.overallScore }}
  dimensionOverrides={[
    { name: "Hierarchy", score: result.scores.hierarchy },
    { name: "CTA",       score: result.scores.ctaVisibility },
    { name: "Brand",     score: result.scores.brandClarity },
    { name: "Message",   score: result.scores.messageClarity },
    { name: "Contrast",  score: result.scores.visualContrast },
  ]}
  verdict={{ state: result.overallScore >= 8 ? 'ready' : result.overallScore >= 4 ? 'needs_work' : 'not_ready', headline: result.verdict, sub: 'Google Display' }}
  engineBudget={engineBudget}
  briefLoading={briefLoading}
  hasBrief={!!briefMarkdown}
  onGenerateBrief={handleGenerateBrief}
  prediction={prediction}
  onReanalyze={handleReset}
  format="static"
  niche={userContext.match(/Niche:\s*(.+)/)?.[1]?.trim()}
  platform="Google Display"
  // Intentionally omitted: analysisSections, platformSwitcher, hashtags, scenes
/>
```

The `scores` prop passes zeroes for individual dimensions because `dimensionOverrides` takes precedence. The `overall` field is still used.

### ScoreCard changes (surgical)

1. Add `dimensionOverrides?: { name: string; score: number }[]` to `ScoreCardProps`
2. In the ScoreHero render: `dimensions={dimensionOverrides ?? [{ name: "Hook", score: scores.hook }, ...]}`
3. In `handleCopy`: if `dimensionOverrides`, iterate those; else use hardcoded names
4. No other ScoreCard logic changes — all optional sections render/hide based on prop presence as before

### Left panel — Display-specific content in standard container

Remove gradient blur orbs (search for `pointer-events-none absolute` + `blur-[120px]` pattern in single-mode results area). Display will NOT use `AnalyzerView` or `ReportCards` directly — it replicates the same CSS container structure manually. Reason: Display's left panel has completely custom content (mockup, GDN compliance, tools) with no markdown to parse, so `ReportCards` adds no value. Using the same flex/padding/max-width CSS ensures visual alignment.

Left panel content order:
1. Mockup hero (Display-unique)
2. GDN Compliance checks (Display-unique)
3. Verdict + Priority Fix
4. Tools row (AI Rewrite, Visualize, Policy Check)
5. AI Rewrite results (when generated)
6. Policy Check results (when generated)
7. "Analyze another creative" button

### What does NOT change
- Display's AI prompt stays the same (custom JSON response, not markdown)
- Display's 5 scoring dimensions stay as-is
- Suite mode is untouched (multi-ad layout, out of scope)
- All existing Display features preserved: mockup generation, GDN compliance, CTA rewrites, visualize, policy check

### Files touched
- `src/pages/app/DisplayAnalyzer.tsx` — restructure single-mode results to two-column layout, replace DisplayScoreCard usage with ScoreCard, remove gradient orbs
- `src/components/DisplayScoreCard.tsx` — DELETE (replaced by standard ScoreCard)
- `src/components/ScoreCard.tsx` — add `dimensionOverrides` prop, update ScoreHero dimension construction, update `handleCopy` to use overrides when present
- `src/types/display.ts` — NEW FILE, receives `DisplayResult` type from deleted DisplayScoreCard.tsx

### Type migration
`DisplayResult` type currently lives in `DisplayScoreCard.tsx` (lines 10-26). It's imported by:
- `DisplayAnalyzer.tsx` (line 11) — update import path to `src/types/display.ts`
- `SuiteBanner` interface in `DisplayAnalyzer.tsx` (line 36) — same file, import path update only

Move type to `src/types/display.ts` before deleting `DisplayScoreCard.tsx`.

---

## Section 3: Multi-Ad Page Visual Polish

Multi-ad pages (A/B Test, Rank Creative, Ad Breakdown, Competitor) keep their specialized layouts. This is a lightweight visual consistency pass only — no layout restructure, no component hierarchy changes, no data flow changes.

### What this covers

1. **Remove remaining gradient blur orbs** — Search for `pointer-events-none absolute` + `blur-` pattern in suite mode Display and any other pages still using aurora gradients.

2. **Consistent card chrome** — Score cards and result panels use: `border-white/[0.06]`, `bg-white/[0.015]`, `rounded-2xl`. Any card deviating from these tokens gets updated.

3. **Consistent typography** — Score numbers use `font-mono` (Geist Mono). Section headers use `text-[11px] uppercase tracking-[0.05em] text-zinc-600`. Verdicts use score-band colors from `tokens.css`.

4. **Consistent button styling** — All action buttons use indigo ghost style: `bg-indigo-500/[0.08] text-indigo-400 border-indigo-500/20 rounded-xl`. Any button using custom one-off styling gets aligned.

### Acceptance criteria
Each file is "done" when:
- Zero gradient blur orbs remain
- All card containers match the token values above (border, bg, radius)
- All score numbers use `font-mono`
- All action buttons use indigo ghost tokens
- No new hardcoded hex values introduced

### Files touched (audit pass)
- `src/pages/app/DisplayAnalyzer.tsx` — suite mode gradient removal
- `src/components/BatchView.tsx` — verify and fix card/button consistency
- `src/components/PreFlightView.tsx` — verify and fix card/button consistency
- `src/pages/app/Deconstructor.tsx` — verify and fix card/button consistency

---

## Out of Scope

- Multi-ad page layout restructure (A/B Test, Rank Creative, Ad Breakdown, Competitor keep specialized layouts)
- Display AI prompt changes (stays JSON-only, no markdown generation)
- New features or sections not in the Paid Ad reference
- Suite mode for Display (multi-banner analysis)
- Wiring Organic policy check (separate feature, not part of layout unification)
- Organic budget/engineBudget (organic content has no ad spend)
- Organic compare feature (Paid Ad-specific)

## Architecture Notes

- `ScoreCard.tsx` is the single source of truth for the right panel. All single-ad pages use it. The new `dimensionOverrides` prop allows Display's 5 dimensions without breaking Paid Ad's 4-dimension interface.
- `ReportCards.tsx` is the left panel content container for Paid Ad and Organic (markdown-based). Display replicates the same CSS container structure but with custom content (no markdown to parse).
- `AnalyzerView.tsx` orchestrates loading → results transition. Organic uses it directly. Display does NOT use AnalyzerView — it manages its own loading/results transition because of custom left-panel content.
- `DisplayScoreCard.tsx` is deleted after migration. `DisplayResult` type moves to `src/types/display.ts`.

## Design Tokens (reference)

All colors from `src/styles/tokens.css`. Never hardcoded hex in JSX.

| Element | Token |
|---------|-------|
| Card background | `bg-white/[0.015]` or `var(--surface)` |
| Card border | `border-white/[0.06]` or `var(--border)` |
| Score numbers | `font-mono` (Geist Mono) |
| Section headers | `text-[11px] uppercase tracking-[0.05em] text-zinc-600` |
| Action buttons | `bg-indigo-500/[0.08] text-indigo-400 border-indigo-500/20` |
| Score bands | Excellent: `#10B981`, Good: `#6366F1`, Average: `#F59E0B`, Weak: `#EF4444` |
