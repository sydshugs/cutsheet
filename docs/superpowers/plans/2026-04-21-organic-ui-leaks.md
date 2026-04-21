# Organic UI Leaks — Pass 1 + Pass 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two remaining UI-surface paid-language leaks in the Organic Analyzer that slipped Track A Pass 7 — (1) Dimension Scores labels in ScoreCard/ScoreHero render as paid terminology regardless of `isOrganic`, and (2) Generate Brief output is pure paid-ad copy because neither its Claude primary path nor its Gemini fallback path branches on `isOrganic`.

**Architecture:** Thread `isOrganic` through the existing prop/wrapper chain — same convention Pass 7 established in `generateFixIt`, `generatePrediction`, and the three Pass 7 wrappers. For Pass 1, the real owner of dimension labels is `ScoreHero.tsx` (not `ScoreCard.tsx`), so the edit lands there with `isOrganic` threaded from ScoreCard. For Pass 2, both the Claude brief endpoint (`/api/improvements` with `action: "brief"`) and the Gemini fallback (`analyzerService.generateBrief`) get `isOrganic` branching on their system prompts; the output schema stays unchanged so no frontend render changes are needed.

**Tech Stack:** TypeScript, Vite SPA, React 19, Claude Sonnet 4 via `/api/improvements`, Gemini 2.5 Flash via `/api/analyze`, Supabase auth.

**Branch:** `claude/organic-ui-leaks` (off `origin/main` at `bb92ae4` — the Pass 7 merge).

**Context — why this pass is necessary:**
Track A Pass 7 (organic analyzer fix) shipped to main and closed 5 Claude enhancer endpoints' paid-voice leakage on the server. Staging smoke test on the beach-and-dog lifestyle video confirmed Second Eye, Platform Score, Predict Performance, Creative Verdict, and Design Review all return organic-native output. Two surfaces still show paid language:

1. **Dimension Scores labels** (`ScoreCard` right rail on organic). Shows `Hook / Sound-Off / Visual / CTA` for organic Meta video, `Hook / Copy / Visual / CTA` for organic "all platforms". The `scores.cta` field holds the "Shareability & Rewatch" value (correct), but the rendered label says "CTA" because ScoreHero overwrites ScoreCard's passed-in `dimensions[].name` via its per-platform `PLATFORM_FORMAT_DIMENSIONS` lookup table.

2. **Generate Brief output** — produces paid-ad copy on organic input. Observed leaks on staging: "conversion-focused e-commerce ad", "Shop Now — Free Shipping", "Link in bio", "drives product sales", "UGC-style product demonstration". Neither the Claude primary path (`/api/improvements` `action: "brief"`) nor the Gemini fallback (`analyzerService.generateBrief`) branches on `isOrganic`.

**Source audit — why Pass 1 scope is NOT "ScoreCard only" (approval flag #1):**

Earlier scoping drafts described Pass 1 as a ScoreCard-only edit. Live source audit of `ScoreHero.tsx:125-131` proves this won't work:

```ts
const ytFormatOverride = (platform === 'YouTube' || platform === 'Shorts') && youtubeFormat
  ? YOUTUBE_FORMAT_DIMENSIONS[youtubeFormat] : undefined;
const formatOverride = platform && format ? PLATFORM_FORMAT_DIMENSIONS[platform]?.[format] : undefined;
const platformDimLabels = ytFormatOverride ?? formatOverride ?? (platform ? PLATFORM_DIMENSIONS[platform] : undefined);
const resolvedDimensions = platformDimLabels
  ? dimensions.map((dim, i) => ({ ...dim, name: platformDimLabels[i] ?? dim.name }))
  : dimensions;
```

ScoreHero unconditionally overwrites `dim.name` from its platform-table lookup whenever a platform match exists — which it almost always does, because OrganicAnalyzer always picks a platform (tiktok, reels, shorts, meta, instagram, pinterest, or "all"). ScoreCard's `dimensions={[{name: "Copy", ...}]}` prop is dead code as far as the final rendered label is concerned.

Fix must land in ScoreHero. ScoreCard gets a one-line prop-threading update.

**Pass 2 audit finding — two entry points, not one (approval flag #2):**

Generate Brief has TWO server paths that both need branching:

1. **Claude primary:** `generateBriefWithClaude` at `src/services/claudeService.ts:95` → `/api/improvements` with `action: "brief"`. Server system prompt at `api/improvements.ts:179` reads `"You are a senior creative strategist at a top performance marketing agency..."` — paid-voiced.

2. **Gemini fallback:** `generateBrief` at `src/services/analyzerService.ts:1412`. Server `systemInstruction` at `analyzerService.ts:1474` reads `"You are a senior creative strategist specializing in ${nicheLabel} advertising on ${platformLabel}. You write tight, actionable creative briefs for ${intentLabel} campaigns..."` — paid-voiced.

The fallback fires on Claude 429 / failure at `OrganicAnalyzer.tsx:424`. If we only branch the Claude primary path, organic users who hit rate limits will still see paid briefs. Pass 2 must cover both.

**Non-negotiable constraints:**
- Do NOT touch any Pass 7 files — the 5 `api/*.ts` endpoints are locked (second-eye, design-review, platform-score, predict-performance, fix-it).
- Do NOT modify `parseScores` field-mapping shortcut in `analyzerService.ts` — organic prompt labels continue to map to paid field names (cta = Shareability, clarity = Message). Parser works as designed; only the render layer branches.
- Do NOT modify ScoreCard's `dimensionOverrides` semantics — explicit overrides still win over the organic default.
- Do NOT modify paid call sites or paid branch output. Paid stays byte-identical.
- Do NOT modify auth, billing, Stripe, Supabase schema, API keys.
- Do NOT modify the `ScoreHero` platform lookup tables (`PLATFORM_DIMENSIONS`, `PLATFORM_FORMAT_DIMENSIONS`, `YOUTUBE_FORMAT_DIMENSIONS`). The organic override sits ABOVE them, not instead of them.
- Naming convention: `isOrganic: boolean` end-to-end — matches Pass 7 convention across `generateFixIt`, `generatePrediction`, and the three Pass 7 wrappers. Do NOT introduce `adType` or `contentType`.
- Run `npm run build` after every pass — zero new TypeScript errors allowed.
- Each pass is one discrete commit. DO NOT push to origin or open PR during execution — stop at local commits for operator approval.

**Locate-don't-count rule (approval flag #3):**
Line numbers in this plan reflect file state at plan-writing time and may drift. For every edit, locate the target by grepping for the surrounding function signature, unique string, or section marker. Specifically:
- `ScoreHero.tsx` edits: grep `const ytFormatOverride = ` and `export function ScoreHero(` to locate the label-resolution block and the prop destructure.
- `ScoreCard.tsx` edit: grep `<ScoreHero` JSX opening tag.
- `claudeService.ts` edit: grep `export async function generateBriefWithClaude`.
- `api/improvements.ts` edit: grep `if (action === "brief") {` to locate the brief branch entry.
- `analyzerService.ts` edit: grep `export async function generateBrief(` and the `systemInstruction:` inside that function.

**Pass-by-pass review cadence:** Each pass stops with a diff shown before commit. Operator reviews the diff + any relevant pass-specific artifact (render loop for Pass 1, full organic systemPrompt text for Pass 2), approves, and then the commit lands. No bundling across passes. No auto-proceed.

---

## File Structure

Five files, three commits (plan + 2 passes):

| File | Pass | Responsibility |
|------|------|----------------|
| `docs/superpowers/plans/2026-04-21-organic-ui-leaks.md` | 0 | This plan document (committed before Pass 1 starts) |
| `src/components/ScoreHero.tsx` | 1 | Accept `isOrganic?: boolean` prop; when true, hard-override `platformDimLabels` with `ORGANIC_DIMENSIONS = ['Hook', 'Message', 'Production', 'Shareability']` before the platform-table lookup |
| `src/components/ScoreCard.tsx` | 1 | Thread existing `isOrganic` prop to `<ScoreHero isOrganic={isOrganic} />` — one line |
| `src/services/claudeService.ts` | 2 | Add `isOrganic?: boolean` as final param to `generateBriefWithClaude`; forward in `/api/improvements` payload |
| `api/improvements.ts` | 2 | Inside the `action === "brief"` branch: destructure `isOrganic`; branch `system:` prompt for organic creator strategist vs. paid performance strategist; branch user-message too if it references "ad" / "campaign" |
| `src/services/analyzerService.ts` | 2 | Add `isOrganic?: boolean` to `generateBrief` (Gemini fallback); branch `systemInstruction` on it |
| `src/pages/app/OrganicAnalyzer.tsx` | 2 | Pass `isOrganic: true` to BOTH Generate Brief call sites (primary + fallback) |

Total: 7 files touched (this plan + 6 source files). No new files created. No new components. No new types exported. No new dependencies.

---

## Chunk 0: Plan commit

### Task 0: Commit this plan doc before starting implementation

**Files:**
- Create: `docs/superpowers/plans/2026-04-21-organic-ui-leaks.md` (this file)

- [ ] **Step 1: Verify branch + clean tree**

Run: `git status && git branch --show-current`
Expected: branch is `claude/organic-ui-leaks`; tree clean except for the untracked plan file.

- [ ] **Step 2: Commit the plan doc**

```bash
git add docs/superpowers/plans/2026-04-21-organic-ui-leaks.md
git commit -m "docs: plan for organic UI leaks fix (dimension labels + generate brief)"
```

- [ ] **Step 3: Confirm commit landed**

Run: `git log -1 --oneline`
Expected: single-line commit message matching step 2.

---

## Chunk 1: Pass 1 — ScoreHero organic label override

### Task 1.1: Pre-edit render-loop audit (positional vs. keyed decision)

**Goal:** Confirm positional mapping is safe before hardcoding a 4-element `ORGANIC_DIMENSIONS` array. If the render loop reorders, filters, or indexes dimensions by a field other than position, switch to a keyed lookup by score field name.

**Files:**
- Read-only: `src/components/ScoreHero.tsx` (render loop around line 260-320, based on Pass 7 audit; grep `resolvedDimensions.map(` to locate)

- [ ] **Step 1: Grep the render loop**

Run: `grep -n "resolvedDimensions" src/components/ScoreHero.tsx`

Expected: 2-3 matches — the const assignment (line ~129), the `.map((dim, i) =>` for label replacement (line ~130), and the `.map((dim) => ...)` render loop (line ~261).

- [ ] **Step 2: Read the render loop block**

Read `src/components/ScoreHero.tsx` from the render-loop line through the end of the map callback. Answer these three questions:

1. Does the map callback use the `i` index, or just `dim`? (If index-dependent rendering, positional mapping is harder to reason about.)
2. Does the `key` prop on the returned JSX use `dim.name`, an id, or the index? (Label changes cause remount if keyed on `dim.name`; harmless but worth knowing.)
3. Are there any conditional renders keyed on specific label strings (e.g., `dim.name === 'CTA'` for platform-CTA badge rendering)? (These conditions will naturally not fire on organic since the organic label is `'Shareability'` — confirm this is the correct organic behavior.)

- [ ] **Step 3: Verify `dimensions` prop shape at every call site**

Run: `grep -n "dimensions=\|dimensions: " src/components/ScoreCard.tsx src/components/display/DisplayRightPanel.tsx`

Expected output includes ScoreCard.tsx's 4-element array. Confirm DisplayRightPanel and any other callers also pass 4 elements in order `[hook, clarity/copy/message, production/visual, cta/shareability]`. If any caller passes a different count or order, flag it — keyed lookup required.

- [ ] **Step 4: Make positional-vs-keyed decision**

**Default: positional.** If steps 1-3 confirm every caller always passes exactly 4 dimensions in the canonical hook/clarity/production/cta order, use a 4-element array:

```ts
const ORGANIC_DIMENSIONS: [string, string, string, string] = ['Hook', 'Message', 'Production', 'Shareability'];
```

**Fallback: keyed.** If any caller reorders or passes a different count, switch to a name-keyed lookup using the existing `dim.name` field from ScoreCard's default:

```ts
const ORGANIC_LABEL_BY_DEFAULT_NAME: Record<string, string> = {
  'Hook':   'Hook',
  'Copy':   'Message',
  'Visual': 'Production',
  'CTA':    'Shareability',
};
```

Document the decision in a one-line comment above the constant.

**Stop here and surface the decision (positional vs. keyed) + the 3 audit-question answers to the operator before proceeding to Task 1.2.**

---

### Task 1.2: Add organic label override to ScoreHero

**Files:**
- Modify: `src/components/ScoreHero.tsx` (locate by `export function ScoreHero(` and by `const ytFormatOverride = `)

**Why:** The platform lookup tables (`PLATFORM_DIMENSIONS`, `PLATFORM_FORMAT_DIMENSIONS`, `YOUTUBE_FORMAT_DIMENSIONS`) are paid-voice vocabulary that correctly maps paid ad scoring to per-platform terminology. Organic scoring has a single platform-independent vocabulary (Hook / Message / Production / Shareability) that should override the platform tables entirely when `isOrganic`. A single branch at the top of label resolution expresses that semantic.

**Skill:** `senior-frontend` — already invoked at session start.

**Scope guardrails:**
- Do NOT modify the three platform lookup tables.
- Do NOT modify the benchmark logic, score-color logic, delta logic, or any render behavior.
- Do NOT add `isOrganic` to `PLATFORM_BENCHMARKS` / `PLATFORM_BENCHMARK_LABELS` — organic uses the same platform-specific benchmarks.
- Paid branch must be byte-identical — diff the paid output after the change to confirm.

- [ ] **Step 1: Add `isOrganic?: boolean` to `ScoreHeroProps` interface**

Locate `export interface ScoreHeroProps {` and add the optional boolean alongside the other optional props (`platform?`, `format?`, etc.).

```ts
export interface ScoreHeroProps {
  score: number;
  verdict: string;
  benchmark?: number;
  dimensions: {
    name: string;
    score: number;
    rangeLow?: number;
    rangeHigh?: number;
  }[];
  platform?: string;
  format?: 'video' | 'static';
  youtubeFormat?: string;
  accentColor?: string;
  benchmarkLabelOverride?: string;
  scoreRange?: { low: number; high: number };
  overallDelta?: number;
  overallDeltaLabel?: string;
  dimensionDeltas?: Record<string, number>;
  platformCta?: string | null;
  isOrganic?: boolean;  // ← new
}
```

- [ ] **Step 2: Add the `ORGANIC_DIMENSIONS` constant (or keyed lookup per Task 1.1 decision)**

Place near the other label-table constants (`PLATFORM_DIMENSIONS`, `PLATFORM_FORMAT_DIMENSIONS`, `YOUTUBE_FORMAT_DIMENSIONS`). Positional default:

```ts
// Organic mode: platform-independent vocabulary that overrides PLATFORM_FORMAT_DIMENSIONS when isOrganic=true.
// Positional map — order must match ScoreCard's 4-element dimensions prop: [hook, clarity, production, cta].
const ORGANIC_DIMENSIONS: [string, string, string, string] = ['Hook', 'Message', 'Production', 'Shareability'];
```

Keyed fallback (only if Task 1.1 flagged a caller that reorders):

```ts
const ORGANIC_LABEL_BY_DEFAULT_NAME: Record<string, string> = {
  'Hook':   'Hook',
  'Copy':   'Message',
  'Visual': 'Production',
  'CTA':    'Shareability',
};
```

- [ ] **Step 3: Destructure `isOrganic` in the ScoreHero function signature**

Locate `export function ScoreHero({` and add `isOrganic` to the destructured parameters. Keep alphabetical/logical grouping consistent with the existing code — appending to the end of the existing destructure line is acceptable.

- [ ] **Step 4: Branch the label resolution**

Locate the `const ytFormatOverride = ` line. Modify the `platformDimLabels` assignment to prefer `ORGANIC_DIMENSIONS` when `isOrganic` is true. The existing paid fall-through chain stays intact:

```ts
const ytFormatOverride = (platform === 'YouTube' || platform === 'Shorts') && youtubeFormat
  ? YOUTUBE_FORMAT_DIMENSIONS[youtubeFormat] : undefined;
const formatOverride = platform && format ? PLATFORM_FORMAT_DIMENSIONS[platform]?.[format] : undefined;
const platformDimLabels = isOrganic
  ? ORGANIC_DIMENSIONS
  : (ytFormatOverride ?? formatOverride ?? (platform ? PLATFORM_DIMENSIONS[platform] : undefined));
const resolvedDimensions = platformDimLabels
  ? dimensions.map((dim, i) => ({ ...dim, name: platformDimLabels[i] ?? dim.name }))
  : dimensions;
```

(If keyed lookup per Task 1.1, use a different map expression that looks up by `dim.name`.)

- [ ] **Step 5: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

**Stop here. Do not edit ScoreCard.tsx yet. Confirm ScoreHero alone compiles cleanly before threading the prop.**

---

### Task 1.3: Thread `isOrganic` from ScoreCard to ScoreHero

**Files:**
- Modify: `src/components/ScoreCard.tsx` (locate by `<ScoreHero` JSX tag)

**Why:** `ScoreCard` already accepts `isOrganic` as a prop (defaulted to `false`) and already passes platform / format / dimensions to ScoreHero. The only edit is adding one JSX attribute to the `<ScoreHero>` invocation. OrganicRightPanel already passes `isOrganic={true}` to ScoreCard, so threading is automatic end-to-end.

**Scope guardrails:**
- Do NOT change ScoreCard's `dimensionOverrides ?? [...]` default. The `{name: "Hook", "Copy", "Visual", "CTA"}` default stays paid-shaped — ScoreHero's new organic branch does the label swap anyway, and keeping ScoreCard's default paid-shaped means the behavior is robust if a caller doesn't pass `isOrganic` (defaults to paid, correct).

- [ ] **Step 1: Locate the `<ScoreHero` JSX invocation**

Run: `grep -n "<ScoreHero" src/components/ScoreCard.tsx`
Expected: single match.

- [ ] **Step 2: Add `isOrganic={isOrganic}` to the JSX attributes**

Insert near `platformCta={platformCta}` (logical grouping — both are optional render-behavior props). Example target state:

```tsx
<ScoreHero
  score={displayScore}
  verdict={heroVerdict}
  benchmark={benchmark.averageScore}
  benchmarkLabelOverride={benchmark.sampleLabel}
  platform={platform}
  format={format}
  youtubeFormat={youtubeFormat}
  scoreRange={scoreRange}
  overallDelta={overallDelta}
  overallDeltaLabel={overallDeltaLabel}
  dimensionDeltas={dimensionDeltas}
  platformCta={platformCta}
  isOrganic={isOrganic}  // ← new
  dimensions={dimensionOverrides ?? [
    { name: "Hook",   score: scores.hook },
    { name: "Copy",   score: scores.clarity },
    { name: "Visual", score: scores.production },
    { name: "CTA",    score: scores.cta },
  ]}
/>
```

- [ ] **Step 3: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

- [ ] **Step 4: Show operator the full diff + the render-loop finding from Task 1.1**

Run: `git diff`

Present to operator:
- The full two-file diff
- The render-loop finding from Task 1.1 (positional vs. keyed, plus the three audit answers)
- `npm run build` tail

**Stop here. Wait for operator approval before committing.**

- [ ] **Step 5: Commit Pass 1**

```bash
git add src/components/ScoreHero.tsx src/components/ScoreCard.tsx
git commit -m "fix(score-card): branch dimension labels on isOrganic — organic shows Message/Production/Shareability, paid unchanged

Closes the last UI leak from Pass 7's server-side organic fix. ScoreHero
owns the label-resolution block — its per-platform PLATFORM_FORMAT_DIMENSIONS
lookup overrides ScoreCard's dimensions prop, so editing ScoreCard alone
would have been dead code (verified via live source audit).

The parseScores field-name shortcut (cta field holds Shareability value,
clarity holds Message value) is preserved — only the render layer branches.

Paid path is byte-identical — the organic override sits above the platform
table, leaving PLATFORM_DIMENSIONS / PLATFORM_FORMAT_DIMENSIONS /
YOUTUBE_FORMAT_DIMENSIONS untouched and still used when isOrganic=false."
```

**Stop here. Confirm commit with `git log -1 --oneline`. Do NOT push. Wait for Pass 2 kickoff.**

---

## Chunk 2: Pass 2 — Generate Brief organic branching

### Task 2.0: Runtime audit (expand on pre-audit finding)

**Goal:** Get final line numbers and output-schema shape for both Generate Brief entry points. Pre-audit (done at plan-writing time) confirmed the two-entry-point structure; this runtime audit locks the exact scope before editing.

- [ ] **Step 1: Grep wrapper signatures**

Run:
```bash
grep -n "export async function generateBriefWithClaude\|export async function generateBrief" src/services/claudeService.ts src/services/analyzerService.ts
```

Capture the exact current signatures for both wrappers. Verify `generateBriefWithClaude` already takes `adFormat?: string, platform?: string` (per earlier grep — it does, and Pass 5 added these). `generateBrief` (Gemini) takes `(analysisMarkdown, apiKey, ...)`.

- [ ] **Step 2: Grep server entry points**

Run:
```bash
grep -n 'action === "brief"\|action: "brief"\|systemInstruction' api/improvements.ts src/services/analyzerService.ts
```

Confirm:
- `api/improvements.ts` `if (action === "brief") {` branch location
- Claude `system:` literal inside that branch
- Gemini `systemInstruction:` inside `analyzerService.generateBrief`

- [ ] **Step 3: Grep call sites**

Run:
```bash
grep -n "generateBriefWithClaude\|generateBrief[^a-zA-Z]" src/pages/app/OrganicAnalyzer.tsx src/pages/app/PaidAdAnalyzer.tsx src/pages/app/RankScorecardPage.tsx
```

Verify:
- OrganicAnalyzer calls both (primary + fallback on error)
- PaidAdAnalyzer call sites (if any — confirm paid also uses `generateBriefWithClaude` so our branching preserves paid behavior)
- Any third caller (Rank Scorecard, etc.)

- [ ] **Step 4: Confirm output schema**

Read the current "brief" action in `api/improvements.ts` — what shape does Claude return? Is it a plain string under `brief` key, or structured JSON? Same check for Gemini's `generateBrief`. The output schema must stay unchanged for Pass 2 (per option-a precedent from Pass 7.4 / 7.5 — keep shape, reframe semantics in the prompt).

- [ ] **Step 5: Surface findings to operator**

Report format:
```
Claude primary:
  Wrapper: generateBriefWithClaude at src/services/claudeService.ts:LINE
  Signature: (analysisMarkdown, filename, userContext?, sessionMemory?, adFormat?, platform?)
  Accepts isOrganic today? NO
  Server: api/improvements.ts:LINE (action="brief" branch)
  System prompt opening: "<first 2 lines>"
  Output schema: { brief: string }

Gemini fallback:
  Wrapper: generateBrief at src/services/analyzerService.ts:LINE
  Signature: (analysisMarkdown, apiKey, ...)
  Accepts isOrganic today? NO
  Server: in-wrapper Gemini call; systemInstruction at analyzerService.ts:LINE
  System prompt opening: "<first 2 lines>"
  Output schema: <shape>

Call sites:
  OrganicAnalyzer.tsx:LINE — primary call: generateBriefWithClaude(...)
  OrganicAnalyzer.tsx:LINE — fallback call: generateBrief(...)
  PaidAdAnalyzer.tsx:LINE — [paid behavior to verify]
```

**Stop here. Operator confirms scope before Task 2.1 edits begin.**

---

### Task 2.1: Add `isOrganic?: boolean` to both wrappers

**Files:**
- Modify: `src/services/claudeService.ts` (locate `export async function generateBriefWithClaude`)
- Modify: `src/services/analyzerService.ts` (locate `export async function generateBrief(`)

- [ ] **Step 1: `generateBriefWithClaude` — append `isOrganic?: boolean`**

Add as the final param, forward into the `/api/improvements` payload `payload: { … isOrganic }`.

- [ ] **Step 2: `generateBrief` (Gemini) — append `isOrganic?: boolean`**

Add as a new optional final param. Forward into the `systemInstruction` branching (done in Task 2.3).

- [ ] **Step 3: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

**No commit yet — this step is setup only.**

---

### Task 2.2: Branch Claude `/api/improvements` `action: "brief"` on `isOrganic`

**Files:**
- Modify: `api/improvements.ts` (locate `if (action === "brief") {`)

**Scope guardrails:**
- Do NOT modify the `improvements` or `cta-rewrites` branches (Pass 5 locked those — they use `adType: "paid" | "organic"` convention).
- Do NOT change the output schema (`{ brief: string }`).
- Do NOT add `isOrganic` at the top-level destructure; it belongs inside the `"brief"` branch's payload extraction only (scoped isolation).
- Paid `system:` literal must be byte-identical to pre-Pass-2.

- [ ] **Step 1: Destructure `isOrganic` inside the `"brief"` branch**

Locate the payload extraction inside `if (action === "brief") { ... }`. Add `isOrganic: rawIsOrganic` to that destructure and compute `const isOrganic = rawIsOrganic === true;` immediately after.

- [ ] **Step 2: Split the inline `system:` string into paid + organic + ternary**

Replace the current inline `system: \`You are a senior creative strategist…\`` with named constants + ternary. Paid branch keeps its current literal verbatim.

Organic branch draft (refined during execution, but structurally):

```
You are a senior organic content strategist helping a ${nicheLabel} creator plan their next post on ${platformLabel}. You write tight, actionable creator briefs that match platform-native conventions and creator voice — NOT ad briefs.

This is organic creator content — NOT a paid ad. Your brief must:
- Frame the objective as organic performance: scroll-stop, save rate, share appeal, completion, rewatch, audience growth. NOT conversion.
- Target audience is feed scrollers on ${platformLabel} who save/share/rewatch this type of content. NOT "shoppers scrolling who need to be stopped with product value."
- Hook direction: 3 organic scroll-stop hooks (pattern interrupt, curiosity gap, relatable moment, creator-to-camera opener). NO CTAs, NO product reveals, NO offer callouts.
- Format: platform-native creator format (authentic cut, POV storytelling, lifestyle vignette). NOT "UGC product demonstration" — UGC is paid framing.
- Key message: what this organic post communicates to feed viewers. NOT "solves a problem better than alternatives."
- Proof points: creator credibility (lived experience, community context, trend relevance, expertise). NOT review counts, ratings, guarantees, testimonials-as-social-proof.
- Engagement prompt (NOT "CTA"): soft creator-to-viewer nudge (save for X, comment your Y, share with someone who Z, follow for part 2). NEVER "Shop Now", "Link in bio", "Free Shipping", "discount code".

ANTI-CTA RULES (violations = failure):
- Do NOT suggest adding CTAs, offers, pricing, discounts, urgency, or purchase language anywhere in the brief.
- Do NOT invent a product or brand if none is visible in the analysis.
- Do NOT output "Shop Now", "Link in bio", "Free Shipping", "Use code", "Learn more".
- Do NOT frame this as an ad or write ad-style directives.
- If this is lifestyle, storytelling, educational, or brand content, treat it as organic content on its own terms.
```

Final wording refined during execution via `senior-prompt-engineer` + `prompt-engineer-toolkit`. Four-point reframe template from Pass 7 applied: (1) persona preserved (senior creative → senior organic content strategist), (2) organic-lens paragraph explicit, (3) anti-hallucination guardrails, (4) output-field semantic remap (CTA field → engagement prompt).

- [ ] **Step 3: Branch the user-message `prompt` if it references "ad" / "campaign"**

Grep the user-message content in the `"brief"` branch. If it contains ad-specific framing, split into `promptOrganic` / `promptPaid` ternary, same pattern as Pass 7.

- [ ] **Step 4: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

**No commit yet — continuing to Gemini fallback in Task 2.3.**

---

### Task 2.3: Branch Gemini fallback `systemInstruction` on `isOrganic`

**Files:**
- Modify: `src/services/analyzerService.ts` (locate `export async function generateBrief(` and the `systemInstruction:` literal within it)

**Why:** The Gemini fallback fires at `OrganicAnalyzer.tsx:424` when Claude's `generateBriefWithClaude` errors (429 rate limit, 5xx, timeout). Without branching the fallback, organic users who hit rate limits still get paid-voiced briefs.

**Scope guardrails:**
- Do NOT modify other parts of `analyzerService.ts` (the file is 1400+ lines and owns `parseScores`, `SYSTEM_PROMPT`, etc. — none of those are in scope).
- Do NOT change the function's return shape.
- Paid branch must be byte-identical.

- [ ] **Step 1: Inside `generateBrief`, branch `systemInstruction`**

Locate the current `systemInstruction: \`You are a senior creative strategist specializing in ${nicheLabel} advertising…\`` literal. Split into `systemInstructionPaid` / `systemInstructionOrganic` + ternary keyed on the new `isOrganic` param.

Organic version mirrors Task 2.2's Claude organic systemPrompt in intent but adapted to Gemini's instruction style (no ANTI-CTA RULES heading — Gemini responds better to direct prose). The anti-paid guardrails remain explicit.

- [ ] **Step 2: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

**No commit yet — continuing to call-site updates in Task 2.4.**

---

### Task 2.4: Pass `isOrganic: true` at both OrganicAnalyzer call sites

**Files:**
- Modify: `src/pages/app/OrganicAnalyzer.tsx` (locate both `generateBriefWithClaude(` and `generateBrief(` calls — per pre-audit, ~lines 419 and 424)

- [ ] **Step 1: Primary call — append `true` to `generateBriefWithClaude(...)`**

Current (from pre-audit):
```ts
const r = await generateBriefWithClaude(activeResult.markdown, activeResult.fileName, userContext || undefined, sessionMemoryRef.current, organicFormat, platform);
```

Append `, true` as the `isOrganic` arg. Exact position depends on final wrapper signature from Task 2.1.

- [ ] **Step 2: Fallback call — append `true` to `generateBrief(...)`**

Current (from pre-audit):
```ts
const r = await generateBrief(activeResult.markdown, API_KEY);
```

Append `true` as the final arg.

- [ ] **Step 3: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

- [ ] **Step 4: Grep leak-word counts (before/after comparison)**

Run: for each leak word (`Shop Now`, `Link in bio`, `Free Shipping`, `conversion`, `UGC`, `discount code`, `offer`), compare pre-Pass-2 vs. post-Pass-2 counts in `api/improvements.ts` and `src/services/analyzerService.ts`. Same pattern as Pass 7 verification. Expected: every delta sits in an organic-branch anti-pattern guardrail or in a paid branch (byte-identical).

- [ ] **Step 5: Show operator the full Pass 2 diff + full organic systemPrompt (Claude) + full organic systemInstruction (Gemini)**

Run: `git diff`

Present to operator:
- Full diff across 4 files (2 wrappers + 2 servers) + OrganicAnalyzer
- Full `systemPromptOrganic` text from `api/improvements.ts` brief branch
- Full `systemInstructionOrganic` text from `analyzerService.generateBrief`
- Grep leak-word before/after table
- `npm run build` tail

**Stop here. Wait for operator approval before committing.**

- [ ] **Step 6: Commit Pass 2**

```bash
git add src/services/claudeService.ts src/services/analyzerService.ts api/improvements.ts src/pages/app/OrganicAnalyzer.tsx
git commit -m "feat(generate-brief): branch on isOrganic — organic creator brief not ad brief

Closes second UI leak from Pass 7's server-side organic fix. Generate Brief
has two entry points and both were producing paid-ad copy on organic input:

1. Claude primary — /api/improvements action:\"brief\" via generateBriefWithClaude
2. Gemini fallback — analyzerService.generateBrief, fires on Claude 429/5xx

Both now branch on isOrganic. Paid branches byte-identical. Output schemas
unchanged (option-a precedent from Pass 7 — paid-named fields hold semantic
organic values; anti-CTA guardrails in the organic prompt keep Claude from
emitting 'Shop Now' / 'Link in bio' / 'Free Shipping' on organic input)."
```

**Stop here. Confirm commit with `git log -1 --oneline`. Do NOT push. Wait for verification chunk.**

---

## Chunk 3: Verification + review

### Task 3.1: Full verification

- [ ] **Step 1: Final build + lint**

```bash
npm run build
npm run lint
```

Expected: zero new TS errors. Lint shows only the 4 pre-existing `ab-hypothesis.ts` errors (unchanged from Pass 7).

- [ ] **Step 2: Paid-branch byte-diff audit**

For each modified file (`ScoreHero.tsx`, `api/improvements.ts`, `analyzerService.ts`), confirm the paid branch output is byte-identical to pre-`claude/organic-ui-leaks` state. Manual read: the paid literals inside the new branching expressions must match the originals character-for-character. If any paid branch drifted, revert that pass before proceeding.

- [ ] **Step 3: Leak-word grep (full organic flow)**

Cross-check with Pass 7's grep pattern — every occurrence in an organic branch must be an anti-pattern guardrail or schema-reference, never a direct positive instruction.

- [ ] **Step 4: Run `superpowers:verification-before-completion`**

Standard gate — build passes, no new `use client` directives, no new hardcoded hex in `src/`, icon imports verified, etc.

- [ ] **Step 5: Run `code-reviewer` on the full Pass 1 + Pass 2 diff**

```bash
git diff main...HEAD -- src/components/ScoreHero.tsx src/components/ScoreCard.tsx src/services/claudeService.ts src/services/analyzerService.ts api/improvements.ts src/pages/app/OrganicAnalyzer.tsx
```

Verification criteria mirror Pass 7: paid byte-identical, no business-logic changes, `isOrganic` gate consistent, blast radius matches plan, organic branches clean of paid-speak positive instructions.

- [ ] **Step 6: Hand off to operator — do NOT push**

Report:
- 3 commits on `claude/organic-ui-leaks` (plan + Pass 1 + Pass 2)
- `git log --oneline main..HEAD` output
- Leak-word grep counts
- Build + lint results
- code-reviewer verdict
- Confirmed: no push, no staging merge, no origin contact

Operator reviews, approves, and on explicit go pushes + opens PR + merges on their cadence.

---

## Post-Ship (after operator push + staging smoke + merge)

**Staging smoke test protocol (operator runs, not this plan):**

On staging.cutsheet.xyz (Vercel preview for `claude/organic-ui-leaks`), re-analyze the beach-and-dog lifestyle video and verify:
- **Dimension Scores on ScoreCard right rail:** shows `Hook / Message / Production / Shareability` (NOT `Sound-Off / Visual / CTA`)
- **Generate Brief output:** frames as creator content brief. NO "Shop Now", NO "Link in bio", NO "Free Shipping", NO "discount code", NO "conversion-focused e-commerce". Engagement prompt reads as soft nudge (save/share/comment/follow).

Paid regression smoke:
- Paid ad Dimension Scores still show platform-specific labels (`Meta video` → `Hook / Sound-Off / Visual / CTA`)
- Paid Generate Brief still reads as performance-marketing brief with CTAs and conversion framing

**Prompt Registry update (Notion):**

No new prompts added. Two branched: Claude brief action (in `/api/improvements`) and Gemini fallback (in `analyzerService.generateBrief`). Add note to each registry entry that an organic branch is gated by `isOrganic`.

**Follow-up tickets (not in scope for this session):**

1. **`generateBrief` Gemini fallback schema normalization.** Gemini returns plain markdown; Claude returns `{ brief: string }`. Minor inconsistency — harmless but worth closing.
2. **Schema cleanup carried forward from Pass 7.** `PredictionResult.ctr` holds save-rate numbers on organic, `FixItResult.newCTA` holds engagement-prompt text. Worth a discriminated-union refactor in a dedicated ticket.
3. **Organic Fix It UI-render gap** (flagged in Pass 7.5 commit body). `fixItResult` is generated on organic but never rendered — needs a FixItPanel invocation on the organic path or an organic-specific renderer.

None of the above block this PR — they're quality-of-life follow-ups.
