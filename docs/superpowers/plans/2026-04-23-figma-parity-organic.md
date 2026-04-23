# Organic Analyzer — Figma Parity Pass 0 (Audit)

> **For agentic workers:** This is the Pass 0 audit only. No code changes yet. Once Syd approves the gap analysis and pass structure below, each pass gets its own TDD-style task breakdown and commit. REQUIRED: wait for approval before starting Pass 1.

**Goal:** Bring the shipped Organic Analyzer page (`src/pages/app/OrganicAnalyzer.tsx` + dependents) to visual parity with Figma node `456:2343` in file `IUp5N6pPMUJuAmbBG9ecDR` ("Organic"), **STATIC variant only** (`493:1439` Organic-Static). The video variant (`493:3016` Organic-Video) is deferred to a future `figma-parity/organic-video` branch per Syd's "keep paid/organic sides separate, ship one variant per branch" rule. This is a visual/layout parity pass — existing data flow, API endpoints, scoring pipeline, and business logic stay untouched.

**Architecture:** Single branch `figma-parity/organic-static` (renamed from `claude/brave-murdock-7c9d03` — no push yet). Multiple sequential passes, each one commit, each ending in `npm run build` + `npm run lint`. Paid Analyzer is the primary byte-identity check target (`src/pages/app/PaidAdAnalyzer.tsx` and `src/components/paid/**` must not change).

**Tech Stack:** React 19, Vite 6, TypeScript, Tailwind CSS v4, CVA + Radix, framer-motion, lucide-react. Design tokens in `src/styles/tokens.css`. Figma MCP for design context. No Next.js / no `use client` anywhere (Vite SPA).

---

## 1. Sources consulted

| Source | Reference | Status |
|---|---|---|
| Figma node `456:2343` "Organic" | `IUp5N6pPMUJuAmbBG9ecDR?node-id=456-2343` | ✅ pulled screenshot + metadata + variable defs |
| Notion Page Build Specs DB | `e4b423527d154616976db3ad2def852b` (collection `01ee6786-5cbb-4ed6-9be6-08cc75b8cb1d`) | ✅ searched — **no row exists for node `456:2343`**. The closest match ("Organic-Native Analysis + Score Consistency Fix", Build Order 5) is a prompt-engineering spec with `Figma Node: "(n/a — prompt engineering, not UI)"`. **Figma is sole source of truth for this pass.** |
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

## 8. Proposed pass structure — STATIC-ONLY (6 passes)

**Scope change from Pass 0 draft:** video-only sections (Hook Analysis timeline, Pacing & Retention, Sound-Off Check) deferred to a future `figma-parity/organic-video` branch per Syd's one-variant-per-branch rule. This plan now covers the 6 passes that produce a shippable Organic-Static variant.

Each pass = one commit, ends with `npm run build` + `npm run lint`, then STOP for Syd's OK.

| Pass | Gap refs | Scope | Rough effort | Type |
|---|---|---|---|---|
| 1 — Right panel: dimension relabel + delta + score range | §4 gaps 7, 8, 14 | **Edit 1:** `src/components/ScoreHero.tsx:71` — change `ORGANIC_DIMENSIONS` from `['Hook', 'Message', 'Production', 'Shareability']` to `['Hook', 'Message', 'Visual', 'Brand']`. Add inline `// TODO(tech-debt):` comment documenting the pipeline rename (rename `cta` → `brand` and `production` → `visual` across `Scores` type, analyzerService parsing, Supabase schema). **Edit 2:** `OrganicRightPanel.tsx` — wire `overallDelta` + `overallDeltaLabel` + `scoreRange` props on the ScoreCard call (values computed from `activeResult.scores.overall` and `platformScores` — mirror `PaidRightPanel.tsx:247-253` pattern). | ~40 LOC in 2 files | Edit |
| 2 — Right panel: extract Predicted Performance to sibling card | §4 gap 12 | Render `<PredictedPerformanceCard>` as a sibling of `<ScoreCard>` inside `OrganicRightPanel`, stacked with the `gap-[16px]` pattern used in `PaidRightPanel`. Pass `prediction={undefined}` into the inner ScoreCard so the inline version does not double-render. Visual audit: match Figma's two-column stat strip (`Conversion potential` / `Estimated conversion rate`) + `What's driving this` collapsible. | ~60 LOC in 1–2 files | Structural refactor |
| **3a — Pre-flight: wire Visualize service into OrganicAnalyzer** | §4 gap 2, Q2 | `handleVisualize`/`onVisualize` does NOT exist in `OrganicAnalyzer.tsx` today. Import `useVisualize` hook from `src/hooks/useVisualize.ts`, wire handler + state, test locally with a real upload, confirm end-to-end. If a deeper incompatibility surfaces (missing `platform` context, prompt assumes paid), STOP and escalate before Pass 3b. | ~80 LOC | Service wiring |
| **3b — Main column: 3-button action row** | §4 gap 2, Q2, Q3 | New `src/components/organic/OrganicActionRow.tsx`: **AI Rewrite** (→ `handleFixIt`), **Visualize** (→ handler wired in 3a — flip `canVisualize` on ScoreCard), **Safe Zone** (→ existing `onSafeZone`). Policy Check omitted per Q3. Render above existing `AnalyzerView` content. Pass opens with a `Read` of `src/components/AnalyzerView.tsx` in full (resolves Q4). | ~120 LOC + new component | New component + wiring |
| 4 — Main column: Creative Verdict card (static) | §4 gap 3 | **Pass opens with an audit table** in the commit body: diff each Figma element (header, `Not ready` badge, "The Verdict" / "3 critical fixes" row, `PRIORITY FIX` banner, filter tabs `All 3` · `Hierarchy` · `Typography` · `Layout` · `Contrast`, summary badge, 3 HIGH PRIORITY rows) against shipped internals — **shell** `CreativeVerdictAndSecondEye.tsx`, **internals** `DesignReviewCard.tsx` + `CreativeAnalysis.tsx`. Columns: `aligned / needs change / out-of-scope`. Then adjust. Render in main column. | ~150 LOC | Audit + edit |
| 5 — Main column: Platform Optimization card (static platforms) | §4 gap 5 | **Pass opens with a Track B port re-check** (see §11 Track B coordination). If `PlatformOptimizationCard.tsx` + `platformOptimizationAdapter.ts` have landed in `src/components/`, scope pivots to "wire new via adapter, remove old `PlatformScoreCard` usage from organic render path". Otherwise, default scope stands: audit existing `PlatformScoreCard.tsx` against Figma's 3-row static layout (Meta Feed EXCELLENT 7.8, Instagram Feed GOOD 6.9, Pinterest GOOD 5.2) with `QUICK CHECKS` chips + `RECOMMENDATIONS` bullets. Render below Creative Verdict. | ~150 LOC | Re-check + edit |
| **6a — Ad preview card** (commit) | §4 gap 1 | Ad preview thumbnail row with filename + file size (right-aligned, `image-file-name.png` · `4.6 MB` layout). | ~80 LOC | New component / layout |
| **6 verification artifact** (NOT a commit — PR body) | §4 gap 10, 11 | Hashtags count badge + `Copy all` sanity check, collapsibles default states, `preview_screenshot` side-by-side vs Figma static frame at 100% zoom. Findings pasted into PR description as the verification section. | — | PR artifact |

**Deferred to `figma-parity/organic-video` branch (do NOT execute here):**
- Hook Analysis timeline (main column, video only)
- Pacing & Retention card (main column, video only, new component)
- Sound-Off Check (right panel, video only, requires extracting `SoundOffChecklist` out of `paid/`)

---

## 9. Pass 0 resolutions (from Syd's review)

| ID | Question | Resolution |
|---|---|---|
| **Q1** | Platform switcher pills above ScoreCard? | **Keep shipped pills** — Figma's lone `Meta` button is a template artifact; removing the pill row would be a UX regression without discoverable benefit. Investigated the Figma frame: the only platform control shown is a single `Meta` button inside the ScoreCard header (62×31px). No pill row or dropdown. Shipped `PlatformSwitcher` pills at `OrganicRightPanel.tsx:166-173` are preserved in every pass. |
| **Q2** | Visualize button | **Add and wire** — format-agnostic. Pass 3 flips `canVisualize` from `false` to `true` and wires the Visualize path. |
| **Q3** | Policy Check button | **Omit entirely** — action row collapses to 3 buttons: AI Rewrite · Visualize · Safe Zone. No policy-check plumbing touched. |
| **Q4** | `AnalyzerView.tsx` not read in Pass 0 | **Read before Pass 3** (first pass that touches main column). Pass 1 + 2 touch only right-panel files, so AnalyzerView read is not blocking. |
| **Q5** | `Brand` ↔ `cta` dimension mapping | **Option A — `dimensionOverrides` shim with inline tech-debt TODO.** Render-site audit result: **1 UI render site in parity scope** (`src/components/ScoreHero.tsx:71`, constant `ORGANIC_DIMENSIONS: [string, string, string, string] = ['Hook', 'Message', 'Production', 'Shareability']`). Fully localizable to one adapter — passes the <3 site threshold. Out-of-scope render sites (not touched): `ProgressCard.tsx:30` (loading animation), `ReportCover.tsx:227-230` (PDF export), `remotion/scenes/ScorecardScene.tsx:7-10` (Remotion video export), `analyzerService.ts:909-912` + `comparisonService.ts:25-28` (backend prompt strings). Pass 1 adds an inline `TODO(tech-debt)` comment at the shim site documenting the pipeline rename (`cta` → `brand`, `production` → `visual`) as a future backend pass. |
| **Q6** | Notion Page Build Spec | **No matching row exists.** Page Build Specs DB (`collection://01ee6786-5cbb-4ed6-9be6-08cc75b8cb1d`) searched for "Organic analyzer page". Closest result ("Organic-Native Analysis + Score Consistency Fix", Build Order 5, Spec ready) is a prompt-engineering plan with `Figma Node: "(n/a — prompt engineering, not UI)"`. **Figma is sole source of truth for this pass.** |
| **Q7** | Branch name | **Renamed** from `claude/brave-murdock-7c9d03` to `figma-parity/organic-static` (local only, no push). Confirmed via `git branch --show-current`. |

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

## 11. Track B coordination + remaining blockers

### Track B coordination (PlatformOptimizationCard + platformOptimizationAdapter.ts)

This branch was cut from `main` at `77123c5` (before Track B's PR #112 merged). Track B's `PlatformOptimizationCard` and `platformOptimizationAdapter.ts` **do not exist in this branch's tree**. Pass 5 will re-check Track B's merge state at its top and adapt scope accordingly. **Recommended merge order:** Track B first, then Figma-parity rebases. If Figma-parity ends up merging first, Track B's PR will need a rebase and may hit conflicts at `ReportCards.tsx` around the card insertion point.

### Remaining blockers before Pass 1

All Q1–Q7 resolved per §9. §8 approved with the 6 baked-in adjustments (Pass 3 → 3a + 3b, Pass 4 audit table, Pass 5 Track B re-check, Pass 6 → 6a + PR artifact, §13 tech-debt log, inline TODO at ScoreHero.tsx:71). Scope locked to static-only. Proceeding to Pass 1.

---

## 12. Summary

- Figma `456:2343` contains 2 variants. **This plan covers the static variant only** (`493:1439`). Video variant deferred to `figma-parity/organic-video`.
- Shipped Organic-Static currently has ~3 of 6 target sections, mostly in the right panel rather than the main column.
- This is a **Type 2 structural refactor** by CLAUDE.md's classification.
- **6 passes**, each one commit, paid byte-identity preserved.
- Notion has no matching spec row; Figma is sole source of truth.
- Q5 dimension-label shim is viable (1 render site, passes <3 threshold).

**§8 approved. Proceeding to Pass 1.**

---

## 13. Tech-debt log (deferred, not executed in this branch)

Items discovered during Pass 0 that should be captured but are out-of-scope for visual-parity work:

1. **Dimension pipeline rename** — `Scores` type and all consumers use `{ hook, clarity, cta, production, overall }` while the product vocabulary has shifted to `{ hook, message, visual, brand }`. Pass 1 adds a `dimensionOverrides` shim at `ScoreHero.tsx:71` as a label-only fix. True rename requires touching `api/analyze.ts` prompt schemas, `src/services/analyzerService.ts` parsing regexes, Supabase `analyses` table, every analyzer page, PDF export, Remotion export, and history records. Scheduled as a standalone backend pass.

2. **Right-panel sibling-card pattern duplication** — Passes 1 + 2 will copy `overallDelta`/`overallDeltaLabel`/`scoreRange` prop wiring and the `PredictedPerformanceCard` sibling-card pattern from `PaidRightPanel` into `OrganicRightPanel`. Extract to a shared `RightPanelResultsStack` component or helper hook when doing the paid/organic shared-component pass.

3. **`scoreDelta` computation duplication** — The `useMemo` block that computes `scoreDelta` in `PaidAdAnalyzer.tsx:664-690` will need to be mirrored in `OrganicAnalyzer.tsx` during Pass 1. Candidate for extraction to `src/hooks/useScoreDelta.ts` during the shared-component pass.

4. **Track B rebase risk** — See §11 Track B coordination above. Single line item to watch: `ReportCards.tsx` insertion point for `PlatformOptimizationCard`.
