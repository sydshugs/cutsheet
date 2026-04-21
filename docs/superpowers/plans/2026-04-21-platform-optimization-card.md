# PlatformOptimizationCard — Implementation Plan (Track B, Pass 1)

> **For agentic workers:** Use `superpowers:executing-plans` to implement. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build `PlatformOptimizationCard` (Figma node 493:2508) and wire it into the Organic-Static analyzer path. Paid path must remain byte-identical.

**Architecture:** Pure presentation component receives typed `PlatformOptimizationEntry[]`. An adapter in `OrganicAnalyzer.tsx` maps the existing `PlatformScore` API shape to the new entry shape. No backend changes in this pass.

**Tech stack:** React 19 + TypeScript + Tailwind CSS v4 + lucide-react + framer-motion. Vite SPA (no `use client`, ever).

**Branch:** `track-b/platform-optimization-card` (created from `main`).

---

## Pass 0 — Audit findings (this document)

### Finding 1 — `/api/platform-score` does NOT return quickChecks data

The organic branch of `api/platform-score.ts` (lines 160–187) instructs Claude to return:

```json
{
  "platform": "...",
  "score": "<1–10 whole number>",
  "platformFit": "<1–10>",
  "strengths": ["...", "...", "..."],   // 3 items
  "weaknesses": ["...", "...", "..."],  // 3 items
  "improvements": ["...", ...],         // 3–5 items
  "tips": ["...", ...],                 // 2–3 items
  "verdict": "<one sentence>"
}
```

The existing client-side type (`src/services/claudeService.ts:42–53`) already declares:

```ts
export interface PlatformScore {
  platform: string;
  score: number;
  platformFit?: number;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  tips?: string[];
  verdict: string;
  /** Organic scoring signals (pass/fail checklist) */
  signals?: { label: string; pass: boolean }[];
}
```

**`signals` is declared but never populated** — the API prompt doesn't ask Claude to return it, and a repo-wide grep for `signals` finds only the type declaration. No component reads it.

**Impact on this pass:** the Figma Quick Checks row expects ~3 short pass/fail pill labels per platform. Free-form `strengths` / `weaknesses` sentences are the closest existing data, but they're full sentences ("Strong native feel with trending audio cues"), not short pill labels ("Trending audio"). A sentence-as-pill-label would wrap awkwardly and visually break the card.

**Recommendation — Pass 1.5 scopes the API change first.** See "Data gap" section below.

### Finding 2 — No live render site for the string "Clear CTA"

Grep across the repo for `"Clear CTA"`:

- `src/services/analyzerService.ts:226–228` — rubric text *inside* the Gemini analyzer prompt, not rendered UI
- `api/platform-score.ts:104` — rubric text inside Claude's niche-context prompt, not rendered UI
- `docs/superpowers/plans/2026-04-20-organic-fix.md` — prior plan doc
- `cutsheet-Design/src/app/components/PlatformOptimizationCard.tsx:100` — static mock data in the design-reference app (separate Next.js project, not wired into the SPA)

There is no JSX label `"Clear CTA"` anywhere in the shipped app. The spec's "rename Clear CTA → Clear Message when `isOrganic`" instruction has no render site to target.

**Impact:** the rename is a no-op for this pass. Once `signals` is populated (Pass 1.5), the prompt that generates the label set should be written so organic never emits "Clear CTA" in the first place — that's the correct place to prevent the paid/organic vocabulary leak, not a rendering-layer string replace.

### Finding 3 — Mount slot

`src/components/organic/OrganicRightPanel.tsx` renders a single `<ScoreCard />` with a long prop list (platformSwitcher, verdict, hookDetail, etc.). Creative Verdict is passed inline via the `verdict` prop and renders near the top of ScoreCard.

ScoreCard is **DO-NOT-TOUCH** per the task spec. Therefore:

- Adding a new slot prop to ScoreCard is off-limits
- The cleanest mount point is `OrganicRightPanel.tsx`, inserting `<PlatformOptimizationCard />` **immediately before `<ScoreCard />`** in the scroll container (lines 114–174)
- Gate: `organicFormat === "static"` AND `platformScores.length > 0`

This places the card at the top of the right rail, above the full ScoreCard block. That matches the spec's explicit instruction (*"above ScoreCard/PredictedPerformanceCard on the right rail"*). It does not sit "between Verdict and the dimension grid" as Figma shows, because Verdict is locked inside ScoreCard — but the spec acknowledges this constraint by saying "above ScoreCard".

Paid routes (`PaidAdAnalyzer.tsx` → `PaidRightPanel.tsx`) never import `OrganicRightPanel`, so paid is trivially unchanged.

### Finding 4 — Data wiring

`src/pages/app/OrganicAnalyzer.tsx` already fetches platform scores in the consolidated post-analysis effect (lines 180–223):

```ts
const postAnalysisFiredRef = useRef<string | null>(null);
useEffect(() => {
  if (status !== "complete" || !result) return;
  const key = `${result.fileName}-${result.timestamp.toISOString()}`;
  if (postAnalysisFiredRef.current === key) return;
  postAnalysisFiredRef.current = key;
  // ...
  const results = await Promise.race([
    Promise.all(plats.map(p => generatePlatformScore(p, ..., true))),
    timeout,
  ]);
  setPlatformScores(results);  // PlatformScore[]
  // ...
}, [...]);
```

Good: the existing guard (`postAnalysisFiredRef`) prevents double-fires. The adapter belongs right here — either as a pure function called where `platformScores` is passed down, or as a `useMemo` over `platformScores`. No new effect, no new state.

---

## Data gap — recommendation

### Option A (preferred): Pass 1.5 extends `/api/platform-score` to return `signals`

Before Pass 1 (component build), add a micro-pass that extends the Claude prompt in `api/platform-score.ts` to also return a 3-item `signals` array on the organic branch:

```ts
// Prompt addition (organic only):
"signals": [
  { "label": "<≤3 words>", "pass": true|false },
  { "label": "<≤3 words>", "pass": true|false },
  { "label": "<≤3 words>", "pass": true|false }
]
```

- Required: exactly 3 items per platform
- Label: ≤20 chars, title-case, platform-native vocabulary (e.g. "Vertical 9:16", "Trending audio", "Save-worthy payoff")
- Organic-only — paid path returns no `signals` (field stays optional on the type)
- Temperature stays 0
- Register the prompt update in the Notion Prompt Registry
- Fallback (parse failure branch at `api/platform-score.ts:238–249`) adds `signals: []` so the client renders an empty Quick Checks row without crashing

This unblocks Pass 1 with correct data and keeps the card's signature visual feature intact.

### Option B (fallback): ship without Quick Checks

If Pass 1.5 is rejected or delayed, build PlatformOptimizationCard with the Quick Checks section hidden when `signals` is absent. The card still shows: header, icon, name, status badge, score bar, summary pill, recommendations. Quick Checks returns in a follow-up once the API is extended.

### Option C (not recommended): map strengths/weaknesses to pills

Forcing sentence-length strengths into tiny pill labels breaks the design. Not proposed.

**I recommend Option A.** Surfacing now per the spec's escalation rule (*"If there's a genuine gap … STOP and report back with the diff before writing any backend changes. We'll scope a Pass 1.5 for API work."*). Pass 1 and Pass 2 below assume Option A has shipped.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/organic/PlatformOptimizationCard.tsx` | Create | Pure presentational card |
| `src/components/organic/PlatformOptimizationCard.test.tsx` | Create | Unit tests (Vitest + Testing Library) |
| `src/components/organic/platformOptimizationAdapter.ts` | Create | Pure function: `PlatformScore[] → PlatformOptimizationEntry[]` + platform-key → displayName + icon map |
| `src/components/organic/OrganicRightPanel.tsx` | Modify | Mount card above ScoreCard when organic-static + data present |
| `src/pages/app/OrganicAnalyzer.tsx` | Modify | Pass adapted entries down; adapter call inside existing post-analysis flow |
| `api/platform-score.ts` | Modify (Pass 1.5 only) | Prompt extension to request `signals` on organic branch |

No changes to: ScoreCard, PredictedPerformanceCard, FixItPanel, PaidRightPanel, PaidAdAnalyzer, any prompt outside `platform-score.ts`, any other API route.

---

## Pass list

### Pass 1.5 (prerequisite, recommended) — API: request `signals` on organic

**Files:**
- Modify: `api/platform-score.ts` (organic prompt at lines 175–187; fallback at lines 238–249)

- [ ] Step 1 — Extend the organic JSON spec in `promptOrganic` to include `signals: [{label, pass}, {label, pass}, {label, pass}]`; add written guidance ("≤20 chars, title-case, platform-native vocabulary, NEVER use paid-ad vocabulary like 'Clear CTA' or 'Strong offer'").
- [ ] Step 2 — Extend the JSON parse fallback to include `signals: []`.
- [ ] Step 3 — Deploy to staging, hit organic-static path with a real upload, inspect `signals` in devtools Network panel.
- [ ] Step 4 — Register the prompt change in the Notion Prompt Registry (required per CLAUDE.md).
- [ ] Step 5 — `npm run lint && npm run build`.
- [ ] Step 6 — Commit: `feat(api): platform-score returns organic quickChecks signals`. STOP.

### Pass 1 — Component + adapter + unit test

**Files:**
- Create: `src/components/organic/PlatformOptimizationCard.tsx`
- Create: `src/components/organic/PlatformOptimizationCard.test.tsx`
- Create: `src/components/organic/platformOptimizationAdapter.ts`

- [ ] Step 1 — Write the adapter function in `platformOptimizationAdapter.ts`:

```ts
import type { PlatformScore } from "@/src/services/claudeService";

export type PlatformKey =
  | "meta_feed" | "instagram_feed" | "instagram_reels"
  | "tiktok" | "youtube_shorts" | "pinterest";

export type PlatformStatus = "excellent" | "good" | "needs_work";

export interface PlatformQuickCheck { label: string; passed: boolean }

export interface PlatformOptimizationEntry {
  platform: PlatformKey;
  displayName: string;
  score: number;
  summary: string;
  quickChecks: PlatformQuickCheck[];
  recommendations: string[];
}

const DISPLAY_NAME: Record<string, { key: PlatformKey; name: string }> = {
  meta:      { key: "meta_feed",        name: "Meta Feed" },
  instagram: { key: "instagram_feed",   name: "Instagram Feed" },
  reels:     { key: "instagram_reels",  name: "Instagram Reels" },
  tiktok:    { key: "tiktok",           name: "TikTok" },
  shorts:    { key: "youtube_shorts",   name: "YouTube Shorts" },
  pinterest: { key: "pinterest",        name: "Pinterest" },
};

export function deriveStatus(score: number): PlatformStatus {
  if (score >= 7.5) return "excellent";
  if (score >= 5)   return "good";
  return "needs_work";
}

export function adaptPlatformScores(scores: PlatformScore[]): PlatformOptimizationEntry[] {
  return scores.map(s => {
    const info = DISPLAY_NAME[s.platform] ?? { key: "meta_feed" as PlatformKey, name: s.platform };
    return {
      platform: info.key,
      displayName: info.name,
      score: s.score,
      summary: s.verdict,
      quickChecks: (s.signals ?? []).map(sig => ({ label: sig.label, passed: sig.pass })),
      recommendations: (s.improvements ?? []).slice(0, 3),
    };
  });
}
```

- [ ] Step 2 — Write the failing unit test for the adapter + component. Test cases (per spec):

```ts
// PlatformOptimizationCard.test.tsx — Vitest + @testing-library/react
describe("adaptPlatformScores", () => {
  it("derives EXCELLENT for score ≥ 7.5", () => {
    expect(deriveStatus(8.0)).toBe("excellent");
  });
  it("derives GOOD for 5 ≤ score < 7.5", () => {
    expect(deriveStatus(6.0)).toBe("good");
  });
  it("derives NEEDS WORK for score < 5", () => {
    expect(deriveStatus(3.2)).toBe("needs_work");
  });
  it("maps platform keys to display names", () => { /* meta → Meta Feed, etc. */ });
  it("maps signals → quickChecks rename pass→passed", () => { /* ... */ });
  it("clamps recommendations to first 3", () => { /* ... */ });
});

describe("PlatformOptimizationCard", () => {
  it("renders N entries", () => { /* 3 entries → 3 sections */ });
  it("header pluralizes: 1 → '1 platform analyzed'", () => {});
  it("header pluralizes: 2+ → 'N platforms analyzed'", () => {});
  it("pill label reads EXCELLENT/GOOD/NEEDS WORK based on score", () => {});
  it("quick-check pill renders green when passed, red when failed", () => {});
  it("recommendations render numbered indigo chips", () => {});
  it("summary pill shows a sparkle icon", () => {});
});
```

- [ ] Step 3 — Run the tests, expect them to fail: `npm test -- PlatformOptimizationCard`. Expected: FAIL (component not yet written).
- [ ] Step 4 — Implement `PlatformOptimizationCard.tsx`:
  - Visual reference: `cutsheet-Design/src/app/components/PlatformOptimizationCard.tsx` (adapt, don't copy — that file uses Tailwind palette tokens which CLAUDE.md forbids).
  - Match the exact Figma spec values from the task brief (card bg `#18181b`, border `rgba(255,255,255,0.08)`, header dividers, 26.667px icon disc, etc.).
  - Use lucide-react icons: `Sparkles` (summary), `Check`/`X` (quick-checks), `ChevronDown` (collapse affordance — interaction deferred, static rotate-0 for Pass 1), plus platform icons (`Music2` TikTok, `Camera` Reels, `Youtube` Shorts, `Facebook` Meta, `Instagram` IG Feed, a Pinterest glyph).
  - ONE COLOR RULE: the only indigo `#6366f1` occurrence must be the recommendation number chip. Status colors (green/yellow/red) and platform brand tints only elsewhere.
  - No `transition-all`; only `transition-transform` / `transition-opacity` per CLAUDE.md.
  - Take props `{ platforms: PlatformOptimizationEntry[]; className?: string }`. No internal state in Pass 1 (collapse/expand deferred to a later pass unless trivial).
  - Every icon + component used in JSX must be in the import list (CLAUDE.md Icon Import Rule).
- [ ] Step 5 — Run the tests, expect pass: `npm test -- PlatformOptimizationCard`. Expected: PASS.
- [ ] Step 6 — `npm run lint` (TypeScript check) + `npm run build`. Expected: 0 errors.
- [ ] Step 7 — Grep sanity:
  - `grep -rn "#6366f1" src/components/organic/PlatformOptimizationCard.tsx` → only inside recommendation number chip
  - `grep -n "use client" src/components/organic/PlatformOptimizationCard.tsx` → zero results
- [ ] Step 8 — Commit: `feat(organic): PlatformOptimizationCard component + tests`. STOP.

### Pass 2 — Wire into Organic-Static + Clear Message label note

**Files:**
- Modify: `src/components/organic/OrganicRightPanel.tsx` (mount)
- Modify: `src/pages/app/OrganicAnalyzer.tsx` (adapter call + prop passthrough)

- [ ] Step 1 — In `OrganicAnalyzer.tsx`, compute adapted entries with `useMemo(() => adaptPlatformScores(platformScores), [platformScores])`. No new state, no new effect.
- [ ] Step 2 — Pass as a new prop on `<OrganicRightPanel ... platformOptimization={adapted} />`.
- [ ] Step 3 — In `OrganicRightPanel.tsx`:
  - Add `platformOptimization: PlatformOptimizationEntry[]` to the props interface.
  - Import `PlatformOptimizationCard`.
  - Inside the `showRightPanel && activeResult?.scores && rightTab === "analysis"` branch, render **before `<ScoreCard>`**:
    ```tsx
    {organicFormat === "static" && platformOptimization.length > 0 && (
      <PlatformOptimizationCard platforms={platformOptimization} />
    )}
    ```
- [ ] Step 4 — Paid byte-identity: `git diff main -- src/pages/app/PaidAdAnalyzer.tsx src/components/paid/PaidRightPanel.tsx src/components/ScoreCard.tsx src/components/PredictedPerformanceCard.tsx` must return **zero bytes**.
- [ ] Step 5 — `npm run lint` + `npm run build`. Expected: 0 errors.
- [ ] Step 6 — Re-confirm there is no render site for `"Clear CTA"`:
  - `grep -rn "Clear CTA" src/` — expected: only rubric text inside `src/services/analyzerService.ts` (AI prompt copy). No JSX matches.
  - If a JSX match appears (e.g. someone hardcoded the design-reference mock data), STOP, escalate — that would indicate a separate bug.
- [ ] Step 7 — Playwright smoke (optional but recommended): load organic-static analyzer with a fixture static image, assert `PlatformOptimizationCard` renders with N entries matching `platformScores` length.
- [ ] Step 8 — Commit: `feat(organic): wire PlatformOptimizationCard into Organic-Static`. STOP.

### Verification gate (`superpowers:verification-before-completion`)

- [ ] `npm run build` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm test` → all tests pass (including new card tests)
- [ ] Paid byte-identity: `git diff main -- <paid paths>` → empty
- [ ] `grep -rn "#6366f1" src/components/organic/PlatformOptimizationCard.tsx` → only recommendation chip
- [ ] `grep -rn "use client" src/components/organic/` → zero results
- [ ] Icon-import audit: every lucide-react / component used in JSX appears in the import statement (CLAUDE.md Icon Import Rule)
- [ ] Visual diff vs Figma node 493:2508 — screenshots in `screenshots/current/` side-by-side with Figma export
- [ ] `code-reviewer` skill run on the final diff

### Pass 3 — Open PR

- [ ] `gh pr create --base main --head track-b/platform-optimization-card --title "feat(organic): PlatformOptimizationCard (Track B, Pass 1)"`
- [ ] PR body includes: Figma node link (`IUp5N6pPMUJuAmbBG9ecDR#493:2508`), verification output, paid byte-identity check result, and the Pass 1(.5)/2 commit hashes
- [ ] Do NOT merge. Wait for Syd's review in GitHub.

---

## Out of scope (deferred)

- Expand/collapse interaction on each platform row (ChevronDown is static in Pass 1)
- Any paid-path changes
- Any modifications to ScoreCard, PredictedPerformanceCard, FixItPanel
- Creative Verdict badge copy (deferred to Pass 3 of the larger Organic redesign)
- Top-bar actions (AI Rewrite / Visualize / Policy Check / Safe Zone)
- Prompt edits to any API other than `platform-score.ts` (Pass 1.5 only)
- The `adType` ↔ `isOrganic` naming split
- The `Clear CTA → Clear Message` rename — moot at the UI layer; the correct place to prevent the vocabulary leak is inside the Pass 1.5 prompt guidance

## Open questions for Syd

1. **Approve Option A (Pass 1.5 extends the API prompt to return `signals`)?** This is the biggest decision — without it, the card ships without its signature Quick Checks row.
2. **If Pass 1.5 is approved, does it need a separate PR or can it ride in one PR with Pass 1 + Pass 2?** Recommend one PR for reviewability; backend + frontend land atomically.
3. **Expand/collapse interaction** — defer or include in Pass 1 as static (ChevronDown never toggles)? Figma shows interaction state but the task brief says "defer to Pass 2 unless trivial". I plan to render it static (no onClick, rotate-0) and defer behavior entirely.
4. **The `"Clear CTA"` instruction** — confirm the no-op finding is acceptable, or do you want me to also sweep the AI prompt rubric text in `analyzerService.ts:226-228` for organic-only vocabulary? (That's prompt-engineering work, not a UI rename, and would need `senior-prompt-engineer` per CLAUDE.md.)

---

**Stop here for review.** Do not proceed to Pass 1.5 or Pass 1 until Syd approves the audit findings and the Option A recommendation.
