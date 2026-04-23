# Organic Analyzer — Figma Parity Pass 0 (Audit)

> **For agentic workers:** This is the Pass 0 audit only. No code changes yet. Once Syd approves the gap analysis and pass structure below, each pass gets its own TDD-style task breakdown and commit. REQUIRED: wait for approval before starting Pass 1.

**Goal:** Bring the shipped Organic Analyzer page (`src/pages/app/OrganicAnalyzer.tsx` + dependents) to visual parity with Figma node `456:2343` in file `IUp5N6pPMUJuAmbBG9ecDR` ("Organic"), covering both static and video upload states. This is a visual/layout parity pass — existing data flow, API endpoints, scoring pipeline, and business logic stay untouched.

**Architecture:** Single branch `figma-parity/organic` (currently on worktree branch `claude/brave-murdock-7c9d03`). Multiple sequential passes, each one commit, each ending in `npm run build` + `npm run lint`. Paid Analyzer is the primary byte-identity check target (`src/pages/app/PaidAdAnalyzer.tsx` and `src/components/paid/**` must not change).

**Tech Stack:** React 19, Vite 6, TypeScript, Tailwind CSS v4, CVA + Radix, framer-motion, lucide-react. Design tokens in `src/styles/tokens.css`. Figma MCP for design context. No Next.js / no `use client` anywhere (Vite SPA).

---

## 1. Sources consulted

| Source | Reference | Status |
|---|---|---|
| Figma node `456:2343` "Organic" | `IUp5N6pPMUJuAmbBG9ecDR?node-id=456-2343` | ✅ pulled screenshot + metadata + variable defs |
| Notion Page Build Spec | Not provided | ❌ **MISSING** — flagged below |
| Shipped page — entry | [`src/pages/app/OrganicAnalyzer.tsx`](src/pages/app/OrganicAnalyzer.tsx) (633 lines) | ✅ read in full |
| Shipped page — empty state | [`src/components/organic/OrganicEmptyState.tsx`](src/components/organic/OrganicEmptyState.tsx) (77 lines) | ✅ read in full |
| Shipped page — right panel | [`src/components/organic/OrganicRightPanel.tsx`](src/components/organic/OrganicRightPanel.tsx) (266 lines) | ✅ read in full |
| Shipped page — ScoreCard orchestrator | [`src/components/ScoreCard.tsx`](src/components/ScoreCard.tsx) (396 lines) | ✅ props + score shape read |
| Paid reference (byte-identity target) | [`src/components/paid/PaidRightPanel.tsx`](src/components/paid/PaidRightPanel.tsx) (553 lines) | ✅ read in full |
| Prior Organic plans (shipped) | `2026-04-20-organic-fix.md`, `2026-04-21-organic-ui-leaks.md`, `2026-04-21-organic-fix-pass-7.md` | ⚠️ not re-read — shipped code is authoritative |

### Caveats about Figma payload

- The Figma `get_design_context` + `get_metadata` responses exceeded the tool's size limit (204KB each). A subagent parsed them.
- The payloads contain **only geometry + layer/text names** — no fill colors, no typography values, no fonts, no variable bindings, no annotations. To get precise fill/typography values, targeted `get_design_context` calls on individual sub-frames would be required.
- `get_variable_defs` on `456:2343` returned: `Primary #6366f1`, `Accent Green #10b981`, `Card Surface #18181b`, `Base Background #09090b`, `CTA #615fff`, plus fill/stroke variants. All map cleanly to existing tokens in [`src/styles/tokens.css`](src/styles/tokens.css) — no new tokens needed.

### Figma template-reuse artifacts (IGNORE — not design intent)

- The route frame inside both variants is named `/app/paid`.
- The sidebar nav frame is `Nav_Left_Paid` and "Paid Ad" is highlighted as the selected nav item — not "Organic".
- The Sound-Off Check frame uses `495:*` node IDs (everything else is `493:*`) — suggests it was merged in from a paid working file.

**Decision:** Treat these as Figma working artifacts copied from the Paid template. The shipped Organic sidebar and route already show "Organic" as the active item correctly. **Do not touch sidebar/route logic in any pass.**

---

## 2. Figma summary — what the design shows

The Figma node `456:2343` contains exactly two sibling frames side-by-side:

- `493:1439` **Organic-Static** (1440×2414)
- `493:3016` **Organic-Video** (1440×3044)

Both show a fully populated results state. **No idle/empty/loading states are in this Figma node** — the current `OrganicEmptyState` is out-of-scope for this parity pass.

### 2a. Main column layout (720px wide)

Top to bottom, in both variants:

1. **Ad preview card** — file thumbnail + filename row (`imagre-file-name.png` · `4.6 MB` right-aligned)
2. **Action row** — 4 buttons: `AI Rewrite` · `Visualize` · `Policy Check` · `Safe Zone`
3. **Creative Verdict card** — header "Creative Verdict" / "Fresh viewer perspective" / "Not ready" badge, then "The Verdict" / "3 critical fixes", body paragraph, "Review" subsection with "PRIORITY FIX" banner, filter tabs (`All 3` · `Hierarchy 1` · `Typography 1` · `Layout 1` · `Contrast`), summary badge ("Not Ready · 3 Critical Fixes"), three stacked "HIGH PRIORITY" issue rows (Typography / Hierarchy / Layout)
4. **Hook Analysis timeline** (VIDEO ONLY) — rows tagged by time range:
    - `Clarity` · `0:00–0:24` · Fix: "Replace McDonald's storyline with dog discovering…"
    - `Scroll risk` · `0:00–0:24` · Fix: "Add end-screen CTA with product showcase, price…"
    - `Pacing` · `0:22–0:24` · Fix: "Transform trauma reveal into product demonstration"
    - `Sound-off` · `0:00–0:24` · Fix: "Add brand logo and product benefit text during dog…"
    - Scroll-marker labels: "Would scroll", "0:22", "0:00"
5. **Platform Optimization card** — header "Platform Optimization · 3 platforms analyzed", then three platform rows per variant:
    - Static: **Meta Feed** `EXCELLENT 7.8`, **Instagram Feed** `GOOD 6.9`, **Pinterest** `GOOD 5.2`
    - Video: **TikTok** `EXCELLENT 8.5`, **Instagram Reels** `8.1`, **YouTube Shorts` (score visible but not cleanly extracted)
    - Each row: name + verdict badge + score + body paragraph + `QUICK CHECKS` chips + `RECOMMENDATIONS` bullets
6. **Pacing & Retention card** (VIDEO ONLY) — `Moderate` badge, `AVG SCENE 4.8s` + `PACING Moderate` two-col stat, `RETENTION CURVE` with axis ticks `0s / 25% / 50% / 75% / 100%`, paragraph, `DROP-OFF RISK` subsection with `Overall` label and body text about the abrupt cut at 0:22s

### 2b. Right panel layout (430px wide)

Top to bottom:

**Static variant:**
1. **ScoreCard_Static** — `SCORE OVERVIEW` label + `Meta` button (platform filter), `OVERALL SCORE 7.2 /10`, delta line "↑ 0.8 pts above avg · Meta", horizontal progress bar, `Dimension Scores` block with 4 rows: `Hook 6.2`, `Message 8.0`, `Visual 7.5`, `Brand 4.2` (each with its own progress bar), buttons `Re-analyze` + `Generate Brief`, collapsible `Hook Analysis`, collapsible `Hashtags (6)` with `Copy all` action
2. **Predicted Performance** — `EST. CTR 0.8% – 1.4%`, `YouTube avg · 0.6%` (note: shown on static — likely template artifact), 0%–3%+ scale with slider marker, two stat columns `Conversion potential` / `Estimated conversion rate`, paragraph "Strong hook and clear message drive above-average…", collapsible `What's driving this`

**Video variant:** Same two cards, plus:

3. **Sound-Off Check** (VIDEO ONLY) — score `72 · Watchable Muted`, 7 checklist rows: `Captions Present`, `Value Prop Visible`, `Offer Visible`, `Visual Hook (First 3s)`, `Brand Visible`, `Text Readable` (→ "Increase subtitle font size — hard to read below…"), `Motion Tells Story` (→ "Add animated product reveal — static cuts don't…")

---

## 3. Shipped page summary — what's there today

### 3a. Main column (when `status === "complete"`)

Rendered by `AnalyzerView` (not read in Pass 0 — see open question Q4). Currently shows a file preview + markdown analysis block with the Gemini output. The Figma-style cards (Creative Verdict, Platform Optimization, Hook Analysis timeline, Pacing & Retention) **do not exist in the main column today**. Some equivalent data is rendered inside ScoreCard via `analysisSections` (extracted from markdown) and via the `hookDetail` / `scenes` / `improvements` props, but visually as inline collapsibles, not as the main-column cards the Figma shows.

Existing related components (may be reusable):
- [`src/components/CreativeVerdictAndSecondEye.tsx`](src/components/CreativeVerdictAndSecondEye.tsx) — likely covers Creative Verdict
- [`src/components/HookAnalysisExpanded.tsx`](src/components/HookAnalysisExpanded.tsx) — candidate for Hook Analysis timeline
- [`src/components/PlatformScoreCard.tsx`](src/components/PlatformScoreCard.tsx) — candidate for Platform Optimization rows
- [`src/components/paid/SoundOffChecklist.tsx`](src/components/paid/SoundOffChecklist.tsx) — exists but under `paid/` (must not be mutated; may need extraction to shared)
- [`src/components/PredictedPerformanceCard.tsx`](src/components/PredictedPerformanceCard.tsx) — exists, currently rendered inside ScoreCard
- No existing `PacingRetentionCard` found

### 3b. Right panel (`OrganicRightPanel.tsx`)

Renders a single `<ScoreCard>` in a 420px panel with a huge prop surface. ScoreCard internally renders (as inline sections): Score hero, dimension bars, action row (Fix It / Visualize / Policy Check from props), hook detail, improvements, predicted performance, budget, hashtags, and more. No separation between "Overall Score" card and "Predicted Performance" card — both are inline within the single ScoreCard.

### 3c. Score dimension shape mismatch — CRITICAL

The `Scores` type throughout the codebase is `{ hook, clarity, cta, production, overall }` (confirmed in [`src/components/ScoreCard.tsx:21-27`](src/components/ScoreCard.tsx:21) and 14 other files including `services/analyzerService.ts` and `api/analyze.ts`).

The Figma shows labels **`Hook · Message · Visual · Brand`** — not `Hook · Message Clarity · CTA · Production`.

Plausible mappings:
- `hook` → **Hook** ✅ (same)
- `clarity` → **Message** (rename/relabel only — same concept)
- `production` → **Visual** (plausible — production quality ≈ visual polish)
- `cta` → **Brand** (questionable — CTA and brand are different concepts)

**This is a scoring pipeline question, not a UI question.** Changing the score shape would touch `api/analyze.ts` prompts, `analyzerService.ts` parsing, Supabase `analyses` table, history, and every analyzer page. **Out of scope for this parity pass.**

**Proposal:** Ship Pass 1+ using `dimensionOverrides` (which ScoreCard already supports at line 87) to map the existing `{hook, clarity, cta, production}` scores to Figma labels `{Hook, Message, Visual, Brand}`. This is a pure label change, zero backend impact. Confirm or veto in review.

---

## 4. Gap analysis table

"Severity" key: **REAL** = visible divergence needing a pass, **SMALL** = minor visual delta (spacing/size/color shade), **NONE** = already matches, **OUT-OF-SCOPE** = structural/business-logic change beyond visual parity.

| # | Figma shows | Shipped shows | Notion spec says | Gap severity |
|---|---|---|---|---|
| 1 | Main column **Ad preview card** with filename + size row | `AnalyzerView` renders file preview in a different layout — details TBD in open question Q4 | n/a | **REAL** (pending Q4) |
| 2 | Main column **4-button action row**: AI Rewrite · Visualize · Policy Check · Safe Zone | ScoreCard action row (right panel, not main column) currently: Fix It / Visualize / Policy Check. No main-column action row. | n/a | **REAL** |
| 3 | Main column **Creative Verdict card** with filter tabs (All/Hierarchy/Typography/Layout/Contrast) and 3 HIGH PRIORITY rows | `CreativeVerdictAndSecondEye.tsx` exists — needs visual audit against Figma | n/a | **REAL** (needs inspection) |
| 4 | Main column **Hook Analysis timeline** (video only) with time-range rows | `HookAnalysisExpanded.tsx` exists but currently renders inside ScoreCard's collapsible; Figma shows it as main-column block | n/a | **REAL** |
| 5 | Main column **Platform Optimization card** with 3 rows, each with Quick Checks + Recommendations | `PlatformScoreCard.tsx` exists — needs visual audit. Currently not rendered in main column for Organic. | n/a | **REAL** |
| 6 | Main column **Pacing & Retention card** (video only) with retention curve + drop-off risk | **No equivalent component exists.** | n/a | **REAL** (new component) |
| 7 | Right panel **ScoreCard with 4 dimension bars: Hook/Message/Visual/Brand** | Right panel ScoreCard with 4 dimension bars: Hook/Clarity/CTA/Production | n/a | **REAL (label-only via `dimensionOverrides`, see §3c)** |
| 8 | Right panel **Delta line** "↑ 0.8 pts above avg · Meta" | ScoreCard already supports `overallDelta` + `overallDeltaLabel` props, wired in Paid but **not wired in Organic** | n/a | **REAL (wiring)** |
| 9 | Right panel **Re-analyze + Generate Brief** buttons in ScoreCard | Organic already wires `onReanalyze` via `onReset`, `onGenerateBrief` ✅ | n/a | **NONE** |
| 10 | Right panel **Hashtags collapsible with (6) count + Copy all** | ScoreCard already renders `HashtagsC2` component | n/a | **SMALL (visual check only)** |
| 11 | Right panel **Hook Analysis collapsible** | ScoreCard renders hook analysis inline — needs verification that it's collapsible and matches visual | n/a | **SMALL (visual check only)** |
| 12 | Right panel **Predicted Performance card** as its own card below ScoreCard | Currently rendered INSIDE ScoreCard (not as a sibling card) | n/a | **REAL (structural — move to sibling)** |
| 13 | Right panel **Sound-Off Check card** (video only) — 7 checklist rows | `SoundOffChecklist.tsx` exists only under `paid/`. Organic right panel does not render it. | n/a | **REAL (extract to shared + wire for organic)** |
| 14 | **Score range** and dimension bar styling | `scoreRange` prop exists on ScoreCard; wired in Paid via `PaidRightPanel.tsx:247-250`, **not wired in Organic** | n/a | **SMALL (wiring)** |
| 15 | Figma nav highlights "Paid Ad" + route shows `/app/paid` | Correctly shows "Organic" active + route `/app/organic` | n/a | **NONE (Figma template artifact, see §1)** |
| 16 | Platform switcher at top of right panel | Organic right panel passes `platformSwitcher` prop to ScoreCard → renders at top. Figma shows only a `Meta` button inside ScoreCard header, no switcher pills above. | n/a | **OPEN QUESTION (Q1)** |
| 17 | Figma right panel background `#111113` | OrganicRightPanel uses `bg-[#111113]` (`OrganicRightPanel.tsx:110`) ✅ | n/a | **NONE** |
| 18 | Figma shows sample score `7.2/10` with `Meta` platform | Organic has platforms `TikTok / Instagram Reels / YouTube Shorts` (video) and `Meta / Instagram / Pinterest` (static) | n/a | **NONE (Figma is showing static + Meta-platform demo data; not a spec change)** |

---

## 5. Variant differences to preserve (static vs video)

| Element | Static | Video |
|---|---|---|
| Platforms shown | Meta / Instagram / Pinterest | TikTok / Instagram Reels / YouTube Shorts |
| Hook Analysis timeline (main col) | ❌ absent in Figma | ✅ present |
| Pacing & Retention card (main col) | ❌ absent in Figma | ✅ present |
| Sound-Off Check (right panel) | ❌ absent | ✅ present |
| Creative Verdict card | ✅ (uses "CreativeVerdict_Design" naming in Figma) | ✅ (uses "CreativeVerdict_Motion" naming) |
| Safe Zone button | ✅ (4th in action row) | ✅ (4th in action row, but shipped code only shows `onSafeZone` for portrait aspect) |

The shipped code already carries an `organicFormat: "video" | "static"` state on `OrganicAnalyzer.tsx:65`. Gating new components on this is already the pattern.

---

## 6. Figma ↔ shipped terminology conflicts

| Figma label | Shipped equivalent | Resolution for this pass |
|---|---|---|
| `Message` (dimension) | `clarity` in `Scores` type | Use `dimensionOverrides` to relabel |
| `Visual` (dimension) | `production` in `Scores` type | Use `dimensionOverrides` to relabel |
| `Brand` (dimension) | `cta` in `Scores` type | **FLAG for Syd** — this mapping is questionable; may need scoring-pipeline redesign (out of scope) |
| `AI Rewrite` (button) | `Fix It` in paid; not present in organic main column | Use "AI Rewrite" label for new organic action row button, backed by existing `handleFixIt` handler |
| `Creative Verdict` | `CreativeVerdictAndSecondEye` component | Reuse existing component |
| `Sound-Off Check` | `SoundOffChecklist` (paid only) | Extract to shared or add organic wiring |

---

## 7. DO-NOT-TOUCH list (Pass 0 proposal)

Confirmed no-touch unless Syd explicitly approves:

- **`api/**`** — all server routes, prompts, Gemini/Claude calls
- **`src/services/analyzerService.ts`** — parsing, scoring types, `AnalysisResult` shape
- **`src/services/claudeService.ts`** — platform score / second eye / brief generators
- **`src/services/predictionService.ts`** — prediction API
- **`src/services/fixItService.ts`** — Fix It API
- **`src/services/soundOffService.ts`** — Sound-off API
- **`src/services/userContextService.ts`** — user context formatting
- **`src/services/historyService.ts`** — history saves
- **`src/hooks/useVideoAnalyzer.ts`** — analysis pipeline
- **`src/lib/userMemoryService.ts`** — session memory
- **Supabase schema** — no migrations
- **`src/styles/tokens.css`** — already supports all needed colors; no new tokens
- **PAID ANALYZER** — byte-identity target:
  - `src/pages/app/PaidAdAnalyzer.tsx` (1015 lines)
  - `src/components/paid/PaidRightPanel.tsx` (553 lines)
  - `src/components/paid/SoundOffChecklist.tsx` ← but may need to **copy into shared location** for organic reuse without mutating the paid one
  - `src/components/paid/ABHypothesisCard.tsx`, `ThumbnailScoreCard.tsx`
- **Sidebar nav** (`src/components/Sidebar.tsx`) — Figma's Paid-highlight is a template artifact (§1)
- **All other analyzer pages** — Display, A/B Test, Rank, Competitor, Ad Breakdown, Saved

**Verification:** end of every pass run `git diff main -- src/pages/app/PaidAdAnalyzer.tsx src/components/paid/ api/` and assert zero lines changed.

---

## 8. Proposed pass structure

Each pass = one commit, ends with `npm run build` + `npm run lint`, then STOP for Syd's OK.

| Pass | Gap refs | Scope | Rough effort | Type |
|---|---|---|---|---|
| 1 — Right panel: dimension labels + delta wiring + score range | §4 gaps 7, 8, 14 | Map `{hook, clarity, cta, production}` → `{Hook, Message, Visual, Brand}` via `dimensionOverrides` in `OrganicRightPanel`. Wire `overallDelta` + `scoreRange` props (values plumbed from `activeResult.scores`). Pure prop-wiring pass, no new components. | ~30 LOC in 1 file | Edit |
| 2 — Right panel: extract Predicted Performance to sibling card | §4 gap 12 | Render `<PredictedPerformanceCard>` as a sibling of `<ScoreCard>` in `OrganicRightPanel` instead of inline inside ScoreCard. Remove `prediction` prop from the inner ScoreCard call if it ends up duplicated. Visual audit: match Figma's two-column stat strip + `What's driving this` collapsible. | ~50 LOC in 1–2 files | Edit + structural refactor |
| 3 — Right panel: Sound-Off Check for video | §4 gap 13 | **Sub-step a:** move `src/components/paid/SoundOffChecklist.tsx` to `src/components/SoundOffChecklist.tsx` (shared location), update the two import sites in `PaidRightPanel.tsx`, byte-identity check that paid rendering is unchanged. **Sub-step b:** wire `soundOffResult` + `soundOffLoading` through `OrganicAnalyzer` → `OrganicRightPanel`, render when `organicFormat === "video"`. Requires calling `generateSoundOffCheck` service (already exists per paid wiring). | ~150 LOC + 1 file move | Move + wire |
| 4 — Main column: 4-button action row | §4 gap 2 | Add action row component above existing `AnalyzerView` content: AI Rewrite (→ `handleFixIt`), Visualize (→ existing visualize path — **blocked if organic has no visualize** — confirm Q2), Policy Check (→ requires wiring new service — see Q3), Safe Zone (→ existing `onSafeZone`). | ~100 LOC + new component | New component + wiring |
| 5 — Main column: Creative Verdict card | §4 gap 3 | Visual audit of existing `CreativeVerdictAndSecondEye.tsx` against Figma; adjust layout, tabs (All/Hierarchy/Typography/Layout/Contrast), badges, priority-fix banner. Render inside `AnalyzerView` or new `OrganicResultsMain` wrapper — TBD. | ~100–200 LOC | Edit (possible new wrapper) |
| 6 — Main column: Platform Optimization card | §4 gap 5 | Audit existing `PlatformScoreCard` against Figma's 3-row layout with Quick Checks + Recommendations. Data already flows through `platformScores` state. Render below Creative Verdict in main column. | ~100–200 LOC | Edit + layout |
| 7 — Main column: Hook Analysis timeline (VIDEO ONLY) | §4 gap 4 | Promote `HookAnalysisExpanded` from right-panel collapsible to main-column card; adjust layout to match Figma's time-range row structure. | ~100 LOC | Layout change |
| 8 — Main column: Pacing & Retention card (VIDEO ONLY) | §4 gap 6 | **New component** `PacingRetentionCard.tsx`. Needs data: `scenes` with timestamps (already on `AnalysisResult`). Render retention curve (SVG with ticks 0/25/50/75/100%), avg scene duration stat, pacing verdict, drop-off risk copy. Likely reuses data from existing Gemini output. | ~250 LOC + new component | New component |
| 9 — Final visual polish + Ad preview card | §4 gap 1 + 10 + 11 | Confirm Ad preview matches Figma, verify Hashtags count badge + Copy all, verify all collapsibles match Figma default states. Side-by-side screenshot compare. | ~50 LOC | Polish |

---

## 9. Risks / items needing Syd's call before starting

| ID | Risk | Why it matters | Options |
|---|---|---|---|
| **Q1** | Figma shows **no top-of-panel platform switcher pills** — only a `Meta` button inside ScoreCard header | Current organic right panel renders `platformSwitcher` pills via `OrganicRightPanel.tsx:165-173`. Removing or relocating this is a UX change, not pure visual parity. | **A:** Keep shipped pills (ignore Figma absence — treat as template artifact). **B:** Move platform selection into ScoreCard header as a dropdown (matches Figma literally). **C:** Ship both and toggle. |
| **Q2** | Figma action row has a **Visualize button** | Organic currently sets `canVisualize={false}` (`OrganicRightPanel.tsx:141`). Visualize is disabled for organic. Matching Figma literally would require enabling Visualize for organic (or showing it disabled). | **A:** Add Visualize button, disabled with tooltip. **B:** Omit Visualize button (drop it from the 4-row). **C:** Enable Visualize for organic (scope creep, pipeline change). |
| **Q3** | Figma action row has a **Policy Check button** | Organic does not currently wire Policy Check. Paid does. | **A:** Wire policy check through `OrganicAnalyzer` (requires same Claude service path as paid). **B:** Omit Policy Check button. |
| **Q4** | I did not read `AnalyzerView.tsx` in Pass 0 | It's the current main-column renderer. Some gaps may already exist inside it that I haven't seen. | **A:** Read before Pass 1 starts. **B:** Proceed and read only when a pass needs it. — I recommend **A** (adds maybe 10 min to Pass 1). |
| **Q5** | Figma dimension `Brand` does not cleanly map to existing `cta` score | Using `dimensionOverrides` to show "Brand" using the `cta` number will mislead users if `cta` measures something different. | **A:** Use `dimensionOverrides` and accept the semantic drift for now (fastest). **B:** Block on scoring-pipeline redesign (out of scope). **C:** Keep existing dimension labels Hook/Clarity/CTA/Production and treat this as a Figma mismatch the dev team accepts. |
| **Q6** | No Notion Page Build Spec was provided | Template explicitly requires reading the spec before code. May contain exceptions or decisions that override the Figma (e.g. "we decided to keep the old Predicted Performance inline"). | **A:** Ship without Notion, Figma becomes sole source of truth. **B:** Pause until Syd provides spec or confirms there is none. — I recommend **B** for at least Q5 above, **A** otherwise. |
| **Q7** | Worktree is on branch `claude/brave-murdock-7c9d03`, not `figma-parity/organic` as the template specifies | User's template expects a named branch per PR. | **A:** Rename branch before first implementation commit. **B:** Keep worktree branch, PR title/branch on merge become `figma-parity/organic`. — I recommend **B** since the worktree is already scoped. |

---

## 10. Verification plan (applies to every pass)

Before committing each pass:

1. `npm run build` → 0 errors
2. `npm run lint` (`tsc --noEmit`) → 0 errors
3. `git diff main -- src/pages/app/PaidAdAnalyzer.tsx src/components/paid/ api/ src/services/ src/styles/tokens.css` → **zero lines changed** (paid byte-identity + backend lockdown)
4. `grep -r "use client" src/` → **zero matches** (Vite SPA rule)
5. `grep -rn "#[0-9a-fA-F]\{6\}" <files-touched-this-pass>` → every hex must be a token in `tokens.css` OR already-existing inline hex that isn't being introduced new
6. Icon/component import audit: every lucide icon + component used in JSX appears in the import statements at top (per CLAUDE.md icon rule)
7. Screenshot compare: capture the analyzer in both static + video states via `playwright` or `chrome-devtools-mcp`, side-by-side against Figma screenshot in `screenshots/current/`
8. Run `code-reviewer` on the diff before PR

Before final PR (all passes complete):

9. `npm test` → passing (existing tests, no new tests required for pure visual parity)
10. Manual side-by-side: both variants loaded with a real analysis, compared to Figma at 100% zoom
11. Paid Analyzer smoke test: upload to `/app/paid` (both static + video), confirm no regressions
12. Paid byte-identity re-check via `git diff main`

---

## 11. Open / blocking for review

**Before I start Pass 1, I need from Syd:**

1. Answer to **Q5** (Brand ↔ CTA dimension label) — it's the only blocker that could require a full-pipeline rethink. Everything else is resolvable at dev time.
2. Answer to **Q1–Q4, Q6, Q7** (below blocker level but each affects scope)
3. Notion Page Build Spec URL if one exists; otherwise explicit confirmation that Figma is sole source of truth
4. Confirmation of pass structure in §8 (or rewrite it)
5. Confirmation of DO-NOT-TOUCH list in §7 (or add/remove items)

---

## 12. Summary

- Figma `456:2343` shows 2 variants × 6–7 sections each; the shipped page has ~3 of those sections, mostly in the right panel rather than the main column.
- This is a **Type 2 structural refactor** by CLAUDE.md's classification (moving content between components/panels, adding new main-column cards), not a Type 1 polish pass.
- Proposed: **9 passes**, each one commit, paid byte-identity preserved, plan doc committed as Chunk 0.
- **Blocker:** the Figma dimension labels `Hook / Message / Visual / Brand` do not map cleanly to shipped `Hook / Clarity / CTA / Production`. Q5 must be resolved before Pass 1.

**STOP here. Awaiting Syd's review.**
