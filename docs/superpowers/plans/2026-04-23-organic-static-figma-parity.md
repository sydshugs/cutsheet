# Track B — Organic-Static Figma Parity (Revised Plan)

> **Revision of 2026-04-21-platform-optimization-card.md following Figma eyeball audit on Apr 21.**
> Original scope: "add one card" (PlatformOptimizationCard). Revised scope: "close the 4 real gaps in the center column vs Figma 493:1439." Right rail stays untouched; ScoreCard stays on DO-NOT-TOUCH list. This is NOT a Type 2 refactor.

**Goal:** Bring the shipped Organic-Static page to visual parity with Figma node 493:1439. Paid routes remain byte-identical throughout.

**Tech stack:** React 19 + TS + Tailwind v4 + lucide-react. Vite SPA (no `use client`).

**Branch:** `track-b/platform-optimization-card` (continues from Pass 1.5 commit `22dcef6`).

**PR strategy:** Single PR at the end of all passes. Each pass is one commit.

---

## Gap analysis (from Apr 21 eyeball audit)

| # | Figma shows | Shipped shows | Gap severity |
|---|---|---|---|
| 1 | 4-action button bar below ad preview | Nothing between preview and Review | REAL — build new component |
| 2 | Creative Verdict card with "The Verdict · N critical fixes" header, paragraph, Fresh Viewer pill | Plain prose paragraph floating above Review | REAL — extract prose into proper card |
| 3 | PlatformOptimizationCard below Creative Verdict | Not present | REAL — build new component (Pass 1–2, already planned) |
| 4 | Review tabs: All / Hierarchy / Typography / Layout / Contrast (5) | Review tabs: All / Typography / Layout / Contrast (4) | SMALL — add Hierarchy tab |
| 5 | Priority fix severity: HIGH PRIORITY | Priority fix severity: MEDIUM | SMALL — severity label mapping |
| 6 | Review card footer: "Not Ready · N Critical Fixes" badge | No footer badge | SMALL — add footer |
| 7 | Right rail: ScoreCard + PredictedPerformanceCard, both monolithic | Same — already matches | NONE ✅ |

**Conclusion:** all gaps are center-column-only. Right rail matches Figma. ScoreCard stays DO-NOT-TOUCH.

---

## DO-NOT-TOUCH (reinforced)

- `ScoreCard` component (right rail, monolithic — Figma matches shipped)
- `PredictedPerformanceCard` component
- `PaidAdAnalyzer`, `PaidRightPanel`, any paid route
- `/api/platform-score` server code (Pass 1.5 completed this)
- `/api/improvements`, `/api/cta-rewrites`, `/api/second-eye`, `/api/design-review`, `/api/predict-performance`, `/api/fix-it`, `/api/generate-brief`, `/api/policy-check`, `/api/visualize*`, `/api/safe-zone`, `/api/fix-it`, `/api/ai-rewrite` — all endpoint internals
- Gemini prompts, Claude system prompts, scoring endpoints
- Hashtags component, Hook Analysis accordion inside ScoreCard
- Top-nav bar (nav_left_paid identity labels kept as-is per handoff Q1)

---

## Pass breakdown

### Pass 1 — PlatformOptimizationCard component + adapter + tests

Files created:
- `src/components/organic/PlatformOptimizationCard.tsx`
- `src/components/organic/PlatformOptimizationCard.test.tsx`
- `src/components/organic/platformOptimizationAdapter.ts`

Adapter maps existing `PlatformScore` API shape (with new `signals` from Pass 1.5) to `PlatformOptimizationEntry`. Status derived client-side from score. Chevron is static visual affordance (no expand/collapse).

Quick Checks container uses `flex flex-wrap` (not horizontal scroll) for right-rail / narrow contexts.

Tests:
- Renders N entries matching input length
- Status: 8.0 → EXCELLENT, 6.0 → GOOD, 3.2 → NEEDS WORK
- Quick Check pills: green when passed, red when failed
- Recommendations: indigo `#6366f1` numeric chips (ONE COLOR RULE)
- Summary pill: sparkle icon renders
- Header pluralization: 1 → "1 platform analyzed", 2+ → "N platforms analyzed"

Ends: `npm run build` + `npm run lint` + `npm test`. Commit: `feat(organic): PlatformOptimizationCard component + tests`. STOP.

### Pass 2 — Wire PlatformOptimizationCard into OrganicAnalyzer center column

Mount in center column below the Creative Verdict card (Pass 4 location). Adapter runs inside the existing post-analysis flow as a `useMemo` over `platformScores` — no new effects, no new state, reuses `postAnalysisFiredRef` guard.

Gate: `organicFormat === "static" && platformScores.length > 0`.

Paid route byte-identity check: `git diff main -- <paid-route-files>` zero lines. Build + lint.

Commit: `feat(organic): wire PlatformOptimizationCard into OrganicAnalyzer center column`. STOP.

### Pass 3 — 3-button action bar (AI Rewrite, Visualize, Safe Zone)

Locate paid implementation: grep for the 4-button bar currently rendering on `PaidAdAnalyzer`. Find the handlers for AI Rewrite, Visualize, Policy Check, Safe Zone.

Decision (in-pass): lift-and-share if paid component is decoupled; new `OrganicActionBar.tsx` if not.

Policy Check hidden on organic. Three buttons only.

Commit: `feat(organic): action bar with AI Rewrite, Visualize, Safe Zone wired to existing handlers`. STOP.

### Pass 4 — Creative Verdict card extraction — ALREADY SHIPPED

Code audit (Apr 23) found:
- `src/components/DesignReviewCard.tsx` already wraps verdict prose in a card shell (header + headline + priority fix + footer badge). Mounted in ReportCards line 568+ when `designReviewData.flags.length > 0`.
- `src/components/CreativeAnalysis.tsx` fallback also wraps verdict prose in a card shell (gradient header + status badge + headline + body). Mounted when design review flags are empty.

Shipped verdict is NOT floating prose — it's already inside a Figma-aligned card shell. Gap #2 in the eyeball audit was incorrect. No code change needed.

### Pass 5 — Review card polish — ALREADY SHIPPED

Code audit (Apr 23) found:
- Hierarchy tab (Pass 5a): exists in `DesignReviewCard` (`ALL_FILTER_IDS` line 44) and `CreativeAnalysis` (CATEGORY_STYLES line 48).
- Severity labels (Pass 5b): "HIGH PRIORITY" renders when severity === 'high' | 'critical'. "MEDIUM" renders when severity === 'medium'. User's screenshot showing MEDIUM reflects the input data severity, not a missing label. Data-driven, not code gap.
- Footer badge (Pass 5c): shipped in DesignReviewCard lines 210-227 ("Not Ready · N Critical Fixes"). CreativeAnalysis fallback doesn't have this specific badge shape, but it renders the critical count in the header instead (line 173-177).

No code change needed.

### Verification (mandatory before PR)

1. `npm run build` passes
2. `npm run lint` passes
3. `npm test` passes
4. Grep sanity (`use client`, `#6366f1`, paid-route diff)
5. Manual smoke test on staging
6. Run code-reviewer on the full branch diff

### PR

`gh pr create` targeting `main`. PR body includes Figma link, gap analysis, commit hashes, verification output, paid byte-identity check.

STOP. Do not merge. Syd reviews in GitHub.

---

## Open questions (none — all resolved)

- ~~Track scope~~ → Track B extension (all 4 gaps in one PR)
- ~~Action bar scope~~ → 3 buttons
- ~~Action bar wiring~~ → existing paid handlers
- ~~Verdict badge copy~~ → paid-voiced for now
- ~~ScoreCard DO-NOT-TOUCH~~ → remains
- ~~PR strategy~~ → single PR

## Tech debt to log after PR merges

1. Organic Verdict badges still paid-voiced
2. Policy Check on organic: permanent removal or organic prompt
3. Issue categorizer may not emit "Hierarchy" category
4. Severity label mapping may be wrong (Pass 5b audit outcome)
5. Adapter stop-gap if `PlatformScore` shape drifts
6. Prompt Registry stale since April 13 (pre-existing)
