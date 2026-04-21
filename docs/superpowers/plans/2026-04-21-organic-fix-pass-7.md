# Organic Analyzer Fix — Pass 7 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining five paid-biased Claude enhancer endpoints in the Organic Analyzer flow (Second Eye, Design Review, Platform Score, Predict Performance, Fix It) so that organic content is scored and rewritten on organic signals — scroll-stop, save, share, rewatch, algorithm fit — not paid signals (CTR, CPM, ROAS, CTAs, offers).

**Architecture:** Thread an `isOrganic: boolean` flag end-to-end for each endpoint, defaulting to `false` (paid). Server-side, destructure the flag and branch only the system prompt + user message — response shape stays identical for every endpoint so existing components render unchanged. No component, type, or call-site behavior changes for the paid path.

**Tech Stack:** TypeScript, Vite SPA, Claude Sonnet 4 via `/api/*` serverless handlers, Supabase auth.

**Branch:** `claude/organic-fix` (continuation — Passes 1–6 already shipped here).

**Context — why this pass is necessary:**
Passes 1–6 fixed Gemini's core analyzer + the `/api/improvements` Claude enhancer, and Pass 5 established the `isOrganic` (or equivalent) branching convention. Staging smoke testing revealed five OTHER Claude enhancer endpoints the organic flow calls — Second Eye, Platform Score, Design Review, Predict Performance, Fix It — all of which still produce paid-ads framing ("advertising specialist", "e-commerce", "End with clear CTA and discount code", "lacks commercial intent") because their server-side prompts never branch on `isOrganic`. Two wrappers (`generateFixIt`, `generatePrediction`) already accept `isOrganic` but the server ignores it. Three wrappers (`generateSecondEyeReview`, `generateStaticSecondEye`, `generatePlatformScore`) don't accept `isOrganic` at all.

**Pre-flight audit (confirmed, locked):**
- No `api/*.ts` file references `isOrganic` anywhere — `grep isOrganic api/` returned zero matches at plan time.
- `OrganicAnalyzer.tsx` already passes `isOrganic: true` to `generateFixIt` (line 465) and `generatePrediction` (line 240) — the arg is silently dropped server-side.
- `PredictedPerformanceCard.tsx:98` already branches on `isOrganic || prediction.isOrganic`; labels swap to "Est. Save Rate" / "Share / DM Potential" when organic. `ScoreCard.tsx:363` passes `isOrganic` as a prop from the organic component tree.
- `/api/sound-off-check` has no callers in `src/` (dead) → out of scope.
- `/api/ab-hypothesis` is only wired to the paid flow → out of scope.

**Non-negotiable constraints (from session instructions):**
- Do NOT touch any file already modified in Passes 1–6 (auth, billing, Stripe, Supabase schema, API keys, `scoreGuardrails.ts`, `analyzerService.ts`, `useVideoAnalyzer.ts`, `api/analyze.ts`, `api/improvements.ts`, `organicContextPrefix.ts`).
- Do NOT modify any paid call site — paid flows already default to `isOrganic: false` when the flag isn't passed.
- Do NOT modify `api/sound-off-check.ts` or `api/ab-hypothesis.ts` — not called from organic per the audit.
- Do NOT change the response shape of any endpoint in this pass. The frontend is not being updated; organic-flavored numbers must fit the existing paid-shaped response.
- Do NOT introduce `adType` / `contentType` as a new name for organic — keep the existing `isOrganic: boolean` convention so cross-file naming stays consistent with what Pass 5 established in `/api/improvements`.
- Run `npm run build` after every pass — zero new TypeScript errors allowed.
- Each pass is one discrete commit on `claude/organic-fix`. Five commits total (not counting this plan doc commit).
- DO NOT push to `origin` or merge to `staging` during this session. Stop at local commits. The operator will push + staging-merge on explicit go after reviewing the 5-commit diff.

**Locate-don't-count rule (approval flag #1):**
Line numbers in this plan reflect the file state when the plan was written and may have drifted. For every edit, locate the target by content (Grep for the surrounding block, literal string, or a unique signature) rather than jumping to a literal line number. Passes affected specifically:
- Every pass: grep for `const systemPrompt = ` / `system: \`You are ` to locate the system-prompt block.
- Every pass: grep for the body destructuring line `const { … } = req.body ?? {};` to locate the destructure site.
- `claudeService.ts` edits: grep for the exported function name (`generateSecondEyeReview`, `generateStaticSecondEye`, `generatePlatformScore`) instead of line numbers.
- `OrganicAnalyzer.tsx` edits: grep for the wrapper call (`generateSecondEyeReview(`, `generateStaticSecondEye(`, `generatePlatformScore(`) instead of line numbers.

**Pass 7.3 + 7.4 risk addendum (approval flag #2):**
Passes 7.3 (Platform Score) and 7.4 (Predict Performance) carry the most prompt-engineering judgment risk — the same scoring rubric that produced the "2/10 Needs Work — will generate zero conversions on TikTok" hallucination runs through Platform Score, and Predict Performance is the source of the "CTR 0.3% / CPM $12" numbers that leak onto the organic UI. The operator is reviewing pass-by-pass with one commit per pass — if the reframing miscalibrates (e.g., organic scores come back artificially inflated, or organic predictions still read as ad metrics), that pass is reverted as a single commit and re-drafted before the next one runs.

**Pass 7.4 response-shape decision (locked, option a):**
Keep the existing `PredictionResult` schema. Reframe the prompt so the same fields hold organic-equivalent values:
- `ctr` → repurposed as "save rate" for organic (same numeric %, different semantic meaning).
- `cvr` → repurposed as "share rate" for organic.
- `hookRetention` → keeps meaning (applies to both organic and paid video).
- `completionRate` → keeps meaning.
- `fatigueDays` → repurposed for organic as "creator posting rhythm" (days until this creator needs their next post to keep the momentum).
- `thumbStop` → keeps meaning.

The prompt instructs Claude which organic metric maps to which field. The card component's `isOrganic` branch already relabels the UI ("Est. Save Rate", "Share / DM Potential"). The numbers render correctly; only the semantic meaning shifts. Rejected alternatives documented in the commit body of Pass 7.4 so future engineers don't assume `ctr` always means click-through rate. A proper schema cleanup (`primaryEngagement` / `secondaryEngagement` / organic union branch) is a separate follow-up ticket for after the Prompt Registry update.

---

## File Structure

Seven files, five implementation commits + one plan commit:

| File | Pass | Responsibility |
|------|------|----------------|
| `docs/superpowers/plans/2026-04-21-organic-fix-pass-7.md` | 0 | This plan document (committed before 7.1 starts) |
| `src/services/claudeService.ts` | 7.1, 7.2, 7.3 | Add `isOrganic?: boolean` to 3 wrapper signatures + forward to payload |
| `api/second-eye.ts` | 7.1 | Destructure + branch system prompt for organic video |
| `api/design-review.ts` | 7.2 | Destructure + branch system prompt for organic static |
| `api/platform-score.ts` | 7.3 | Destructure + branch system prompt + platform guidance for organic |
| `api/predict-performance.ts` | 7.4 | Destructure + branch system prompt + user message for organic signals (same response shape) |
| `api/fix-it.ts` | 7.5 | Destructure + branch system prompt + anti-generic rules for organic rewrites |
| `src/pages/app/OrganicAnalyzer.tsx` | 7.1, 7.2, 7.3 | Pass `isOrganic: true` at 4 organic call sites (7.4 + 7.5 already pass it) |

**No new files. No new components. No new type exports. No new dependencies.**

---

## Chunk 0: Plan commit

### Task 0: Commit this plan doc before starting implementation

**Files:**
- Create: `docs/superpowers/plans/2026-04-21-organic-fix-pass-7.md` (this file)

- [ ] **Step 1: Verify branch + clean tree**

Run: `git status && git branch --show-current`
Expected: branch is `claude/frosty-snyder-d25ccd` (worktree alias of `claude/organic-fix`) or `claude/organic-fix`; tree is clean except for the new plan file.

- [ ] **Step 2: Commit the plan doc**

```bash
git add docs/superpowers/plans/2026-04-21-organic-fix-pass-7.md
git commit -m "docs: plan for organic analyzer Pass 7 — 5 Claude enhancer endpoints"
```

- [ ] **Step 3: Confirm commit landed**

Run: `git log -1 --oneline`
Expected: single-line commit message matching step 2.

---

## Chunk 1: Pass 7.1 — Second Eye (video organic)

### Task 1: Branch `/api/second-eye` on `isOrganic` for the video fresh-viewer pass

**Files:**
- Modify: `src/services/claudeService.ts` (`generateSecondEyeReview` — locate by function name)
- Modify: `api/second-eye.ts` (destructure block + `system:` prompt literal)
- Modify: `src/pages/app/OrganicAnalyzer.tsx` (locate `generateSecondEyeReview(` call)

**Why:** The current prompt frames the reviewer as "a slightly bored person scrolling through your feed on your phone" deciding whether to "give this video about 2 seconds before deciding to scroll past." Paid framing is subtle here — but then it demands scroll triggers, sound-off failures, pacing, and clarity gaps against an ad's performance, and the existing flags list implicitly assumes a commercial ad (the SOUND-OFF section explicitly says "Offer mentioned verbally but never shown as text"). For organic, the fresh-viewer framing is exactly right — we just need to reframe the judgment criteria toward organic signals (scroll-stop → save/share intent → rewatch likelihood) and explicitly forbid CTA / product / offer suggestions.

**Skill:** `senior-prompt-engineer` paired with `prompt-engineer-toolkit` for the organic rewrite.

**Scope guardrails:**
- Do NOT change the response shape (`scrollMoment`, `flags[]`, `whatItCommunicates`, `whatItFails`).
- Do NOT change the flag categories (`scroll_trigger | sound_off | pacing | clarity`) — they apply to organic video equally.
- Do NOT change rate limits, model, max_tokens, temperature.
- Paid branch (`isOrganic: false`) must be byte-identical to current behavior — diff the paid branch after the change to confirm.

- [ ] **Step 1: Add `isOrganic?: boolean` to `generateSecondEyeReview` wrapper**

Locate in `src/services/claudeService.ts` by function name. Current signature (expected):

```ts
export async function generateSecondEyeReview(
  analysisMarkdown: string,
  fileName: string,
  scores?: { hook: number; overall: number },
  improvements?: string[],
  userContext?: string,
  sessionMemory?: string
): Promise<SecondEyeResult> {
  return callApi<SecondEyeResult>("/api/second-eye", {
    analysisMarkdown,
    fileName,
    scores,
    improvements,
    userContext,
    sessionMemory,
  });
}
```

Change to:

```ts
export async function generateSecondEyeReview(
  analysisMarkdown: string,
  fileName: string,
  scores?: { hook: number; overall: number },
  improvements?: string[],
  userContext?: string,
  sessionMemory?: string,
  isOrganic?: boolean,
): Promise<SecondEyeResult> {
  return callApi<SecondEyeResult>("/api/second-eye", {
    analysisMarkdown,
    fileName,
    scores,
    improvements,
    userContext,
    sessionMemory,
    isOrganic,
  });
}
```

- [ ] **Step 2: Destructure `isOrganic` in `api/second-eye.ts`**

Locate the body destructure line in `api/second-eye.ts` (grep `const { analysisMarkdown: rawAnalysis`). Current:

```ts
const { analysisMarkdown: rawAnalysis, fileName: rawFileName, scores, improvements: rawImprovements, userContext: rawContext, sessionMemory: rawMemory } = req.body ?? {};
```

Change to:

```ts
const { analysisMarkdown: rawAnalysis, fileName: rawFileName, scores, improvements: rawImprovements, userContext: rawContext, sessionMemory: rawMemory, isOrganic: rawIsOrganic } = req.body ?? {};
const isOrganic = rawIsOrganic === true;
```

(Strict-equality gate avoids treating `"false"` strings or `1` as truthy; defaults to paid if missing/malformed — same pattern Pass 5 used in `/api/improvements`.)

- [ ] **Step 3: Branch the `system:` prompt for organic**

Locate in `api/second-eye.ts` by the string `system: \`You are watching this video ad`. Split the existing single `system:` template into a paid default + organic branch. Replace the `system:` argument with a computed `systemPrompt` expression:

```ts
const systemPromptPaid = `You are watching this video ad for the very first time.
You are a slightly bored person scrolling through your feed on your phone.
You have never seen this brand before. You have no loyalty to it.
You will give this video about 2 seconds before deciding to scroll past.
The creator has been staring at this video for days and is blind to its problems.
Your job is to catch everything they can't see anymore.${contextBlock}${memoryBlock}

Do NOT give general advice. Be specific. Be honest. Be ruthless.
Every flag must have a timestamp.

Look for these specific problems:

SCROLL TRIGGERS — moments you would have scrolled past:
- Hook too slow (key phrase or visual hook after 2 seconds)
- Energy drop (cut, pause, or transition with no new information)
- Confusing opening (first-time viewer has no context)
- Overlong section (same visual/point held too long)

SOUND-OFF FAILURES — what a viewer watching without sound misses:
- Offer mentioned verbally but never shown as text
- Brand/product name spoken but not on screen
- Key benefit only communicated through audio
- Dead air — no text overlay for 3+ seconds

PACING ISSUES — timing problems:
- Hook phrase delivered too fast (viewer can't process it)
- CTA on screen too briefly (under 2 seconds = unreadable)
- Transition too fast or too slow
- Energy builds then drops before the CTA

CLARITY GAPS — things a new viewer won't understand:
- What is being sold? Not clear in first 5 seconds.
- Why should I care? Problem never stated before the solution.
- Who is this for? No indication of target audience.`;

const systemPromptOrganic = `You are watching this video for the very first time.
You are a regular feed user scrolling your For You page on your phone.
You have never seen this creator before. You have no loyalty to them.
You will give this video about 2 seconds before deciding to scroll past.
The creator has been staring at this video for days and is blind to its problems.
Your job is to catch everything they can't see anymore.${contextBlock}${memoryBlock}

This is organic creator content — NOT a paid ad. Judge it on organic signals only:
- Would a real viewer STOP scrolling on this?
- Would they WATCH it through to the end?
- Would they SAVE it, SHARE it with a friend, or RE-WATCH it?
- Does it trigger the algorithm (high completion, high save rate, high share rate)?

Do NOT suggest adding a CTA, product shot, offer, urgency, or conversion language.
Do NOT invent a product or brand if none is visible — if this is lifestyle, storytelling, or brand content, judge it on its own terms.
Do NOT give general advice. Be specific. Be honest. Be ruthless.
Every flag must have a timestamp.

Look for these specific problems:

SCROLL TRIGGERS — moments you would have scrolled past:
- Hook too slow (visual hook or first-line punch after 2 seconds)
- Energy drop (cut, pause, or transition with no new information)
- Confusing opening (first-time viewer has no context)
- Overlong section (same visual/beat held too long)

SOUND-OFF FAILURES — what a viewer watching without sound misses:
- Key moment only communicated through audio
- On-screen text missing at a crucial beat
- Dead air — no text overlay for 3+ seconds
- Punchline, reveal, or payoff delivered in audio only

PACING ISSUES — timing problems:
- Hook delivered too fast (viewer can't process it)
- Key visual held too briefly to register
- Transition too fast or too slow
- Energy builds then drops before the payoff

CLARITY GAPS — things a new viewer won't understand:
- What is happening? Not clear in first 3 seconds.
- Why should I keep watching? Curiosity gap absent or unearned.
- Who is this for? No signal about the creator's niche or audience.`;

const systemPrompt = isOrganic ? systemPromptOrganic : systemPromptPaid;
```

Then at the `messages.create(...)` call, change `system: \`...\`,` to `system: systemPrompt,`.

- [ ] **Step 4: Branch the user-message `ad` wording in `api/second-eye.ts`**

Locate the `content:` template literal inside `messages: [{ role: "user", content: \`Analysis context:…` (grep for `Analysis context:`). The current content is niche-neutral already EXCEPT it includes `improvements` that may contain ad-flavored suggestions. No edit needed to the user-message content — the system prompt branching is sufficient to steer Claude toward organic framing.

Confirm by reading the user-message block and checking it has no hardcoded "ad" / "CTA" / "offer" references. If it does, swap them for "content" / "post" — otherwise skip.

- [ ] **Step 5: Pass `isOrganic: true` at the OrganicAnalyzer call site**

Locate in `src/pages/app/OrganicAnalyzer.tsx` by grep `generateSecondEyeReview(`. Current call:

```ts
generateSecondEyeReview(
  result.markdown, result.fileName,
  result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
  result.improvements, userContext || undefined, sessionMemoryRef.current
).then(setSecondEyeOutput).catch(() => setSecondEyeOutput(null)).finally(() => setSecondEyeLoading(false));
```

Change to:

```ts
generateSecondEyeReview(
  result.markdown, result.fileName,
  result.scores ? { hook: result.scores.hook, overall: result.scores.overall } : undefined,
  result.improvements, userContext || undefined, sessionMemoryRef.current, true,
).then(setSecondEyeOutput).catch(() => setSecondEyeOutput(null)).finally(() => setSecondEyeLoading(false));
```

- [ ] **Step 6: Build + typecheck**

Run: `npm run build`
Expected: zero new TypeScript errors.

- [ ] **Step 7: Commit Pass 7.1**

```bash
git add src/services/claudeService.ts api/second-eye.ts src/pages/app/OrganicAnalyzer.tsx
git commit -m "feat(second-eye): branch on isOrganic — reframe fresh-viewer pass for organic creator content"
```

**Stop here. Show the diff to the operator for pass-by-pass review before starting Pass 7.2.**

---

## Chunk 2: Pass 7.2 — Design Review (static organic)

### Task 2: Branch `/api/design-review` on `isOrganic` for static organic content

**Files:**
- Modify: `src/services/claudeService.ts` (`generateStaticSecondEye` — locate by function name)
- Modify: `api/design-review.ts` (destructure block + `system:` prompt literal)
- Modify: `src/pages/app/OrganicAnalyzer.tsx` (locate `generateStaticSecondEye(` call)

**Why:** The current prompt frames the reviewer as a "professional graphic designer and art director reviewing this static ad." The design focus (typography, layout, hierarchy, contrast) transfers cleanly to organic static creator content (post art, static Reel covers, thumbnails, carousel panels). The paid-specific contamination is the word "ad" in the opening and a paid-specific block at line 81 that warns against suggesting CTA buttons because "the platform places CTA buttons OUTSIDE the creative in the ad unit" — an explanation that's nonsensical for an organic static post.

**Skill:** `senior-prompt-engineer`.

**Scope guardrails:**
- Do NOT change the response shape (`topIssue`, `flags[]` with `area: typography|layout|hierarchy|contrast`, `overallDesignVerdict`).
- Do NOT change the four design areas — they apply to organic equally well.
- Do NOT alter the paid path at all; it's correct as-is.

- [ ] **Step 1: Add `isOrganic?: boolean` to `generateStaticSecondEye` wrapper**

Locate in `src/services/claudeService.ts` by function name. Apply the same shape change as Pass 7.1: add `isOrganic?: boolean` as the final param, forward to the `/api/design-review` payload.

- [ ] **Step 2: Destructure `isOrganic` in `api/design-review.ts`**

Locate the body destructure (grep `const { analysisMarkdown: rawAnalysis`). Add `isOrganic: rawIsOrganic` to the destructure and compute `const isOrganic = rawIsOrganic === true;`.

- [ ] **Step 3: Branch the `system:` prompt for organic**

Locate in `api/design-review.ts` by grep `You are a professional graphic designer and art director`. Split into a paid default + organic branch. Replace the `system:` argument with a `systemPrompt` expression.

Paid (unchanged, just rename): keep the existing literal as `systemPromptPaid`.

Organic version:

```ts
const systemPromptOrganic = `You are a professional designer reviewing this static post for the first time with fresh eyes.
The creator has been staring at it for hours and is blind to the small things that make it look unpolished.
Your job: find every design and typography issue that would hurt organic performance — save rate, share appeal, first-glance clarity, platform-native feel.
Be specific. Be technical. Be ruthless.
Think like someone who notices bad kerning immediately.${contextBlock}${memoryBlock}

This is organic creator content — NOT a paid ad. Focus on design quality and platform-native feel.
Do NOT comment on "commercial intent", "product placement", "CTA visibility", or "conversion mechanics" — this is organic content.
Do NOT suggest adding urgency copy, promo badges, discount overlays, or offer callouts.
Do NOT invent a product or brand if none is visible.

Review these areas:

TYPOGRAPHY:
- Kerning: Are letter pairs too tight or too loose? Flag specific words or headlines.
- Leading: Is line spacing too tight (cramped) or too loose (disconnected)?
- Hierarchy: Is there a clear type scale? Does the most important text read first?
- Font weight: Is there enough contrast between bold and regular weights?
- Legibility: Is any text too small to read comfortably? Minimum readable size for feed content is 14px/10pt.
- Widows/orphans: Any single words alone on a line?
- Alignment: Is text consistently aligned, or is mixed alignment without intention?

LAYOUT & ALIGNMENT:
- Grid alignment: Do elements snap to an invisible grid, or do they feel randomly placed?
- Optical centering: Is the hero element truly centered or just mathematically centered?
- Margins: Are margins consistent? Too tight on any edge?
- Element spacing: Is spacing between elements consistent or arbitrary?
- Breathing room: Is there enough whitespace or is it overcrowded?

VISUAL HIERARCHY:
- Where does the eye land first? Is that where it should?
- Is there a clear primary, secondary, tertiary information order?
- Does the focal element stand out from the background?
- Platform-native feel: does this look like native feed content, or does it look stock / over-designed?

COLOR & CONTRAST:
- Does text meet contrast requirements against its background? (WCAG AA: 4.5:1 for body, 3:1 for large text)
- Is the color palette cohesive or are there clashing hues?
- Does the palette feel platform-native (e.g., Instagram/Pinterest warm + editorial) or does it feel stock/bland?`;

const systemPrompt = isOrganic ? systemPromptOrganic : systemPromptPaid;
```

Replace `system: \`…\`,` in `messages.create(...)` with `system: systemPrompt,`.

- [ ] **Step 4: Branch the user-message `ad` wording if present**

Grep the user-message `content:` template for `ad` / `CTA` references. If any remain, swap for `post` / `content` in the organic path (typically handled by a separate `userMessagePaid` / `userMessageOrganic` split, or a single-line ternary on the word). If the user message is already niche-neutral, skip.

- [ ] **Step 5: Pass `isOrganic: true` at the OrganicAnalyzer call site**

Locate in `src/pages/app/OrganicAnalyzer.tsx` by grep `generateStaticSecondEye(`. Add `, true` as the final arg to the existing call.

- [ ] **Step 6: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 7: Commit Pass 7.2**

```bash
git add src/services/claudeService.ts api/design-review.ts src/pages/app/OrganicAnalyzer.tsx
git commit -m "feat(design-review): branch on isOrganic for organic static content"
```

**Stop here. Show the diff to the operator for pass-by-pass review before starting Pass 7.3.**

---

## Chunk 3: Pass 7.3 — Platform Score (organic re-scoring) [HIGHEST SEVERITY]

### Task 3: Branch `/api/platform-score` on `isOrganic` for organic re-scoring per platform

**Files:**
- Modify: `src/services/claudeService.ts` (`generatePlatformScore` — locate by function name)
- Modify: `api/platform-score.ts` (destructure, `PLATFORM_GUIDANCE` extension, `systemPrompt`, user-message `prompt`)
- Modify: `src/pages/app/OrganicAnalyzer.tsx` (TWO call sites — locate both `generatePlatformScore(` calls)

**Why:** This is the endpoint that produced the "2/10 Needs Work — will generate zero conversions on TikTok" screenshot. The current system prompt literally reads "You are a ${platform} advertising specialist for ${nicheLabel} brands. You score creative specifically for how ${nicheLabel} ads perform on ${platform}." Every phrase frames scoring as paid ad scoring. The per-platform `PLATFORM_GUIDANCE` map (lines ~20–31) is also paid-voiced ("CTA button contrast", "strong CTA above fold"). Organic version must reframe as a platform-native content strategist scoring for organic performance.

**Skill:** `senior-prompt-engineer` — this is the highest-judgment pass. Paired with `prompt-engineer-toolkit`.

**Scope guardrails:**
- Do NOT change the response shape (`platform`, `score`, `platformFit?`, `strengths?[]`, `weaknesses?[]`, `improvements?[]`, `tips?[]`, `verdict`).
- The `signals?[]` field exists on the `PlatformScore` type but is NOT populated by any current prompt (paid OR organic). Leave it unpopulated — populating it is a follow-up nice-to-have, not in scope for this pass.
- Do NOT modify `nichePlatformContext` for organic — the 10-niche × 3-platform paid context map is too much prompt engineering to rewrite in this pass. For organic, skip that block entirely (set `nicheContext = ""` when `isOrganic`). A follow-up ticket can build a parallel `organicNichePlatformContext` later.
- Do NOT alter paid behavior. Diff the paid branch after the change to confirm.

- [ ] **Step 1: Add `isOrganic?: boolean` to `generatePlatformScore` wrapper**

Locate in `src/services/claudeService.ts` by function name. Current signature:

```ts
export async function generatePlatformScore(
  platform: string,
  result: { markdown: string; scores: { overall: number; hook?: number; clarity?: number; cta?: number; production?: number } },
  _fileName: string,
  adType?: 'video' | 'static',
  userContext?: string,
  niche?: string,
): Promise<PlatformScore> { ... }
```

Add `isOrganic?: boolean` as the final param, forward to the `/api/platform-score` payload.

- [ ] **Step 2: Destructure `isOrganic` in `api/platform-score.ts`**

Locate the body destructure (grep `const { analysisMarkdown: rawAnalysis, platform: rawPlatform`). Add `isOrganic: rawIsOrganic` to the destructure and compute `const isOrganic = rawIsOrganic === true;`.

- [ ] **Step 3: Add an `ORGANIC_PLATFORM_GUIDANCE` map for the 6 organic platforms**

The organic flow uses `tiktok`, `reels`, `shorts` (video) and `meta`, `instagram`, `pinterest` (static). Add a sibling map next to the existing `PLATFORM_GUIDANCE`:

```ts
const ORGANIC_PLATFORM_GUIDANCE: Record<string, string> = {
  tiktok: `Prioritize: scroll-stop in first 0.5s, native feel (phone-shot energy beats polished production), trending audio, text overlay that matches the audio beat, rewatch-triggering payoff, completion through 100%. Penalize: polished/corporate feel, horizontal framing, stock music, slow or exposition-heavy intros.`,
  reels: `Prioritize: vertical 9:16 framing, strong visual opener, trending or native-feel audio, text overlays at key beats, save-worthy payoff (information, transformation, aesthetic), share triggers (DM-worthy moments). Penalize: horizontal format, overly produced content, slow pacing, no clear reason to save or share.`,
  shorts: `Prioritize: strong hook in first 3s (skip threshold), vertical format, fast pacing, clear on-screen text, rewatch-triggering reveals or payoffs. Penalize: weak audio, no clear narrative, slow opener, horizontal framing.`,
  meta: `Prioritize: thumb-stop opener, save-worthy content (educational, inspirational, relatable), sound-off readability, strong first-frame or first-line clarity, platform-native post energy. Penalize: ad-like framing, stock imagery, long exposition, no clear value for the scroller.`,
  instagram: `Prioritize: editorial or platform-native aesthetic, cohesive feel, strong first-frame hook, save-worthy content (aesthetic, educational, quotable), shareable moments for Stories/DMs, caption discoverability. Penalize: low-quality imagery, generic stock look, hard-sell framing, no clear save/share trigger.`,
  pinterest: `Prioritize: vertical 2:3 aspect ratio, text overlay with clear value prop, lifestyle or how-to imagery, rich pin compatibility, keyword-rich on-image text, save-worthy design (Pinterest rewards save rate above everything). Penalize: horizontal format, no text overlay, hard-sell copy, low-resolution imagery.`,
};
```

Place this immediately below the existing `PLATFORM_GUIDANCE` map.

- [ ] **Step 4: Switch the guidance lookup based on `isOrganic`**

Locate the existing `const guidance = PLATFORM_GUIDANCE[platformKey] ?? PLATFORM_GUIDANCE.meta;` line. Replace with:

```ts
const guidance = isOrganic
  ? (ORGANIC_PLATFORM_GUIDANCE[platformKey] ?? ORGANIC_PLATFORM_GUIDANCE.meta)
  : (PLATFORM_GUIDANCE[platformKey] ?? PLATFORM_GUIDANCE.meta);
```

- [ ] **Step 5: Skip `nichePlatformContext` for organic**

Locate the `const nicheContext = nicheKey ? ...` line. Wrap the whole lookup so organic short-circuits:

```ts
const nicheContext = isOrganic
  ? ""
  : (nicheKey ? (nichePlatformContext[nicheKey]?.[platformKey] ?? "") : "");
```

(This keeps paid niche-calibration untouched; organic gets generic platform guidance only. A future pass can add `organicNichePlatformContext`.)

- [ ] **Step 6: Branch the `systemPrompt` for organic**

Locate the `const systemPrompt = \`You are a ${platform} advertising specialist` line. Replace with a branching expression:

```ts
const systemPrompt = isOrganic
  ? `You are a ${platform} organic content strategist who advises ${nicheLabel} creators on how their content performs natively on ${platform}. You score creator content on organic signals — scroll-stop, save rate, share appeal, rewatch value, algorithm fit — NOT on advertising metrics. A 7 means "performs well as organic ${nicheLabel} content on ${platform}", not "good ad". Be platform-honest and organic-calibrated.

Do NOT suggest adding CTAs, products, offers, urgency, discount codes, or conversion tactics.
Do NOT invent a product or brand if none is visible in the content.
If this is lifestyle, storytelling, educational, or brand content, judge it on its own terms as organic content.`
  : `You are a ${platform} advertising specialist for ${nicheLabel} brands. You score creative specifically for how ${nicheLabel} ads perform on ${platform} — not generic ad quality. A 7 means "good for ${nicheLabel} on ${platform}", not "good in general". A ${nicheLabel} ad optimized for Meta might score 4 on TikTok. Be platform-honest and niche-calibrated.`;
```

- [ ] **Step 7: Branch the user-message `prompt` for organic**

Locate the existing `const prompt = \`A ${nicheLabel} creative has already been analyzed…` literal. The paid version says "Score this ad specifically for ${platform} performance" and returns ad-shaped strengths/weaknesses/improvements/tips/verdict.

Split into a paid default + organic version. Organic version reframes the wording:

```ts
const promptOrganic = `A ${nicheLabel} creator's organic post has already been analyzed. Based on the following analysis, generate a platform-specific organic scorecard for ${platform}.

ORIGINAL ANALYSIS:
${analysisMarkdown}
${scoresContext}

CONTENT TYPE: ${adType ?? "video"}
TARGET PLATFORM: ${platform}
NICHE: ${nicheLabel}

${userContext ? `<user_context>\n${userContext}\n</user_context>\n` : ""}

Platform-specific organic scoring guidance for ${platform}:
${guidance}

Score this post specifically for organic ${platform} performance — scroll-stop, completion, save rate, share appeal, rewatch value, algorithm fit. Do NOT score for advertising or conversion performance. Return a JSON object with these exact keys:
{
  "platform": "${platform}",
  "score": <number 1-10, whole number>,
  "platformFit": <number 1-10, how well this post suits ${platform} natively>,
  "strengths": [<3 specific organic strengths for ${platform}>],
  "weaknesses": [<3 specific organic weaknesses for ${platform} — NOT ad weaknesses>],
  "improvements": [<3-5 actionable organic improvements — NOT ad copy rewrites, NOT CTA additions, NOT offer additions>],
  "tips": [<2-3 organic best practice tips for ${platform}>],
  "verdict": "<one sentence summary of how this post performs as organic content on ${platform}>"
}

Return ONLY valid JSON, no markdown fencing.`;

const promptPaid = `A ${nicheLabel} creative has already been analyzed. Based on the following analysis, generate a platform-specific scorecard for ${platform}.

ORIGINAL ANALYSIS:
${analysisMarkdown}
${scoresContext}

AD TYPE: ${adType ?? "video"}
TARGET PLATFORM: ${platform}
NICHE: ${nicheLabel}

${userContext ? `<user_context>\n${userContext}\n</user_context>\n` : ""}

Platform-specific scoring guidance for ${platform}:
${guidance}

${nicheContext ? `\n${nicheLabel.toUpperCase()} ON ${platform.toUpperCase()} SPECIFICS:\n${nicheContext}` : ""}

Score this ad specifically for ${platform} performance. Return a JSON object with these exact keys:
{
  "platform": "${platform}",
  "score": <number 1-10, whole number>,
  "platformFit": <number 1-10, how well this ad suits ${platform} specifically>,
  "strengths": [<3 specific strengths for ${platform}>],
  "weaknesses": [<3 specific weaknesses for ${platform}>],
  "improvements": [<3-5 actionable platform-specific improvements>],
  "tips": [<2-3 platform best practice tips>],
  "verdict": "<one sentence summary of how this ad performs on ${platform}>"
}

Return ONLY valid JSON, no markdown fencing.`;

const prompt = isOrganic ? promptOrganic : promptPaid;
```

(Note: `nicheContext` is already empty for organic per step 5, so it naturally drops out of the organic template.)

- [ ] **Step 8: Pass `isOrganic: true` at BOTH OrganicAnalyzer call sites**

Locate in `src/pages/app/OrganicAnalyzer.tsx` by grep `generatePlatformScore(`. Two call sites — the `Promise.all` branch for `platform === 'all'` and the single-platform branch. Add `, true` as the final arg to both calls.

Sample edit for the `Promise.all` branch:

```ts
Promise.all(plats.map(p => generatePlatformScore(p, { markdown: result.markdown, scores: result.scores ?? { overall: 0 } }, result.fileName, organicFormat, userContext || undefined, rawUserContext?.niche, true))),
```

Sample edit for the single-platform branch:

```ts
generatePlatformScore(k, { markdown: result.markdown, scores: result.scores ?? { overall: 0 } }, result.fileName, organicFormat, userContext || undefined, rawUserContext?.niche, true),
```

- [ ] **Step 9: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 10: Commit Pass 7.3**

```bash
git add src/services/claudeService.ts api/platform-score.ts src/pages/app/OrganicAnalyzer.tsx
git commit -m "feat(platform-score): branch on isOrganic — organic content strategist framing per platform"
```

**Stop here. Show the diff to the operator for pass-by-pass review before starting Pass 7.4. This is the highest-severity pass — the operator will read the organic systemPrompt + organic user-prompt line-by-line to catch any residual paid framing.**

---

## Chunk 4: Pass 7.4 — Predict Performance (organic prediction, same shape)

### Task 4: Branch `/api/predict-performance` on `isOrganic` — reframe prompt only, preserve response shape

**Files:**
- Modify: `api/predict-performance.ts` (destructure, `benchmarkBlock` branch, `systemPrompt`, user-message `prompt`)
- NO wrapper change — `predictionService.ts` already accepts `isOrganic` per audit
- NO call-site change — `OrganicAnalyzer.tsx:240` already passes `true` per audit

**Why:** `isOrganic` already flows from OrganicAnalyzer through the `generatePrediction` wrapper into the `/api/predict-performance` body — but the server never reads it. Current system prompt reads "You are a performance marketing analyst specializing in ${nicheLabel} ${adTypeLabel} advertising on ${platformLabel}. You have studied over 100,000 ${platformLabel} ad campaigns in the ${nicheLabel} category." It predicts CTR/CVR/ROAS/creative fatigue.

Per the locked response-shape decision (see header), we keep the existing `PredictionResult` schema and repurpose fields semantically for organic:
- `ctr.{low,high,benchmark,vsAvg}` → Claude populates with "save rate" values for organic.
- `cvr.{low,high}` → "share rate" values for organic.
- `hookRetention.{low,high}` → still "% who watch past 3s" — applies to both.
- `fatigueDays.{low,high}` → "days until this creator should post again to keep momentum" for organic.
- `confidence`, `confidenceReason`, `positiveSignals`, `negativeSignals` → same semantics.

The `PredictedPerformanceCard` already branches UI labels on `isOrganic` (verified: `primaryLabel = organic ? 'Est. Save Rate' : 'Est. CTR'`, etc.). Numbers render correctly; only the semantic meaning shifts.

**Skill:** `senior-prompt-engineer`.

**Scope guardrails:**
- Do NOT change the response shape.
- Do NOT add new fields to `PredictionResult` in `src/services/predictionService.ts` or `src/components/PredictedPerformanceCard.tsx`.
- The commit body MUST document the semantic remapping so future engineers don't assume `ctr` always means click-through rate.

- [ ] **Step 1: Destructure `isOrganic` in `api/predict-performance.ts`**

Locate the body destructure (grep `const { analysisMarkdown, scores, platform, adType, niche, intent } = req.body`). Add `isOrganic: rawIsOrganic` and compute `const isOrganic = rawIsOrganic === true;`.

- [ ] **Step 2: Branch `benchmarkBlock` to skip paid benchmarks for organic**

Locate the `let benchmarkBlock: string;` block (grep). Current paid benchmarkBlock pulls CTR/CPM numbers from `getNicheBenchmark`. For organic, we want the model to predict save/share rate against organic norms — without feeding it paid CTR benchmarks that could contaminate the output.

Wrap the existing logic so organic gets a different block:

```ts
let benchmarkBlock: string;
if (isOrganic) {
  // Organic benchmarks are platform-specific rules of thumb — no niche-level CTR data applies.
  benchmarkBlock = `\nORGANIC BENCHMARKS (${platformLabel}):
- Top-quartile save rate on ${platformLabel} for ${nicheLabel}: 1.5-4%. Below 0.3% is weak, above 4% is viral.
- Top-quartile share rate on ${platformLabel}: 0.5-2%. Below 0.1% is weak, above 2% is viral.
- Completion-past-3s: 40-60% is typical, <25% is weak, >75% is strong.
- Creator posting rhythm (days between posts to maintain momentum): 2-4 days on TikTok/Reels/Shorts, 3-7 days on Instagram/Pinterest, 5-10 days on Meta.`;
} else if (nicheBench) {
  // existing paid block
  const ctrLine = `${platformLabel} ${nicheLabel} avg CTR: ${nicheBench.ctr.low}–${nicheBench.ctr.high}% (avg ${nicheBench.ctr.avg}%).`;
  const hookLine = nicheBench.hookRate ? ` Avg hook retention: ${nicheBench.hookRate.avg}%.` : "";
  const cpmLine = ` Avg CPM: $${nicheBench.cpm.avg}.`;
  benchmarkBlock = `\nINDUSTRY BENCHMARKS:\n${ctrLine}${hookLine}${cpmLine}`;
} else if (platformKey === "google_display" || platformKey === "google display") {
  benchmarkBlock = `\nINDUSTRY BENCHMARKS: Google Display Network avg CTR: 0.35–0.60% (avg 0.46%). Set "benchmark" to 0.46 in the JSON response.`;
} else {
  benchmarkBlock = `\nNote: Use general paid social benchmarks for ${nicheLabel}. Meta avg CTR: 0.9-1.5%. Google Display: 0.35-0.60%.`;
}
```

- [ ] **Step 3: Branch the `systemPrompt` for organic**

Locate `const systemPrompt = \`You are a performance marketing analyst` and replace with a branching expression:

```ts
const systemPrompt = isOrganic
  ? `You are an organic content strategist who has analyzed over 100,000 ${platformLabel} organic posts in the ${nicheLabel} category. You predict organic performance — save rate, share rate, completion, rewatch likelihood, algorithm fit — NOT advertising metrics.

This post scored ${scores?.overall != null ? scores.overall : "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}. Hook: ${scores?.hook != null ? scores.hook : "?"}/10, Shareability & Rewatch: ${scores?.cta != null ? scores.cta : "?"}/10.

CALIBRATION RULES:
- A hook score of 3/10 → predict save rate below 0.3% and completion below 25%. A hook of 8/10 → predict save rate above 2% and completion above 60%.
- A shareability score of 3/10 → predict share rate in the bottom quartile for organic ${nicheLabel} on ${platformLabel}. A shareability of 8/10 → top quartile.
- An overall score of 4/10 → creator should post again in 5-7 days to rebuild momentum. An 8/10 → 2-4 days keeps the wave.
- Every prediction must cite the specific score that drives it: "Save rate predicted at X% because [dimension] scored [N]/10."
- Never guess high to flatter. Weak organic content gets weak predictions.
- You never predict CTR, CPM, CPC, CVR, ROAS, or any advertising-only metric. You never suggest adding CTAs, offers, or conversion tactics.`
  : `You are a performance marketing analyst specializing in ${nicheLabel} ${adTypeLabel} advertising on ${platformLabel}. You have studied over 100,000 ${platformLabel} ad campaigns in the ${nicheLabel} category.

This ad scored ${scores?.overall != null ? scores.overall : "?"}/10 overall. Weakest areas: ${weakDims.join(", ") || "not identified"}. Hook: ${scores?.hook != null ? scores.hook : "?"}/10, CTA: ${scores?.cta != null ? scores.cta : "?"}/10.

CALIBRATION RULES:
- A hook score of 3/10 → predict retention below 20%. A hook of 8/10 → predict retention above 55%.
- A CTA score of 3/10 → predict CTR in the bottom quartile for ${nicheLabel}. A CTA of 8/10 → top quartile.
- An overall score of 4/10 → fatigue in under 7 days at moderate spend. An 8/10 → 14-21 days.
- Every prediction must cite the specific score that drives it: "CTR predicted at X% vs Y% ${platformLabel} average for ${nicheLabel} because [dimension] scored [N]/10."
- Never guess high to flatter. A weak ad gets weak predictions.`;
```

- [ ] **Step 4: Branch the user-message `prompt` to instruct field remapping for organic**

Locate the `const prompt = \`Based on the following creative scorecard` literal. Split into paid + organic branches. The organic version must explicitly tell Claude which field holds which organic metric:

```ts
const promptOrganic = `Based on the following organic content scorecard, generate an organic performance prediction for this ${adTypeLabel} post on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
<analysis>
${safeAnalysis}
</analysis>

Scores: Hook ${scores.hook != null ? scores.hook : 0}/10, Clarity ${scores.clarity != null ? scores.clarity : 0}/10, Shareability ${scores.cta != null ? scores.cta : 0}/10, Production ${scores.production != null ? scores.production : 0}/10, Overall ${scores.overall != null ? scores.overall : 0}/10
Platform: ${platformLabel} | Format: ${adTypeLabel} | Niche: ${nicheLabel}
${benchmarkBlock}

Predict organic performance only. Never predict CTR, CPM, CPC, CVR, or ROAS.

1. Save Rate Range — % of viewers who save this post. Anchor against the organic benchmarks above. (Will be returned in the "ctr" field.)
2. Share Rate Range — % of viewers who share this post via DM or repost. (Will be returned in the "cvr" field.)
3. Hook Retention (video only) — estimated % who watch past 3 seconds on ${platformLabel}. ${platformLabel === "TikTok" ? "TikTok users decide in 0.5-1s." : platformLabel === "YouTube" ? "YouTube users can skip at 5s." : "Meta/Instagram feed users decide in 1-2s."}
4. Creator Posting Rhythm — days until this creator should post next to maintain algorithm momentum. (Will be returned in the "fatigueDays" field.)
5. Confidence Level — how reliable is this prediction?
Rules:
- 'High' = scores are clear-cut (very high 8+ or very low 3-), strong organic signal in the content.
- 'Medium' = scores are mid-range (4-7), mixed signals.
- 'Low' = unusual format, atypical niche, or contradictory signals.
Confidence reflects prediction RELIABILITY, not content quality.
6. Top 2 signals boosting organic performance — be specific to what you saw in the analysis.
7. Top 2 signals limiting organic performance — reference the weakest scores.

IMPORTANT FIELD MAPPING — the response uses paid-named fields for schema compatibility, but the VALUES are organic:
- "ctr" field → save rate values (% who save the post)
- "ctr.benchmark" field → typical save rate for this platform/niche (from the organic benchmarks above)
- "ctr.vsAvg" → "above" / "at" / "below" the organic save-rate benchmark
- "cvr" field → share rate values (% who share or DM the post)
- "fatigueDays" field → days until next post for creator momentum
- "hookRetention" field → % who watch past 3s (same meaning as paid)

Return as JSON:
{
  "ctr": { "low": number, "high": number, "benchmark": number, "vsAvg": "above" | "at" | "below" },
  "cvr": { "low": number, "high": number },
  "hookRetention": { "low": number, "high": number } | null,
  "fatigueDays": { "low": number, "high": number },
  "confidence": "Low" | "Medium" | "High",
  "confidenceReason": string,
  "positiveSignals": [string, string],
  "negativeSignals": [string, string]
}

Return ONLY valid JSON, no markdown fencing. Be calibrated — a hook score of 3/10 should predict low save rate and low completion, not moderate.`;

const promptPaid = `Based on the following creative scorecard, generate a performance prediction for this ${adTypeLabel} ad on ${platformLabel} in the ${nicheLabel} niche.

Scorecard & Analysis:
<analysis>
${safeAnalysis}
</analysis>

Scores: Hook ${scores.hook != null ? scores.hook : 0}/10, Clarity ${scores.clarity != null ? scores.clarity : 0}/10, CTA ${scores.cta != null ? scores.cta : 0}/10, Production ${scores.production != null ? scores.production : 0}/10, Overall ${scores.overall != null ? scores.overall : 0}/10
Platform: ${platformLabel} | Format: ${adTypeLabel} | Niche: ${nicheLabel} | Intent: ${intentLabel}
${benchmarkBlock}

The user's goal is ${intentLabel === "awareness" ? "brand awareness and reach" : intentLabel === "consideration" ? "engagement and click-through rate" : "direct response conversion and ROAS"}.

Predict:
1. CTR Range — for this specific ${nicheLabel} ${adTypeLabel} ad on ${platformLabel}. Anchor against the benchmarks above.
2. CVR Potential — if this ad drives to a typical ${nicheLabel} landing page on ${platformLabel}.
3. Hook Retention (video only) — estimated % who watch past 3 seconds on ${platformLabel}. ${platformLabel === "TikTok" ? "TikTok users decide in 0.5-1s." : platformLabel === "YouTube" ? "YouTube users can skip at 5s." : "Meta feed users decide in 1-2s."}
4. Fatigue Timeline — at moderate spend ($300-500/day on ${platformLabel}), estimated days before fatigue for ${nicheLabel}.
5. Confidence Level — how reliable is this prediction?
Rules:
- 'High' = scores are clear-cut (very high 8+ or very low 3-), large sample of benchmark data for this platform+niche, strong signal in the creative.
- 'Medium' = scores are mid-range (4-7), mixed signals, some dimensions strong and others weak, or limited benchmark data for this niche.
- 'Low' = unusual creative format, niche with sparse benchmark data, or contradictory signals (e.g. great hook but no CTA).
Confidence reflects prediction RELIABILITY, not ad quality.
6. Top 2 signals boosting performance — be specific to what you saw in the analysis.
7. Top 2 signals limiting performance — reference the weakest scores.

Return as JSON:
{
  "ctr": { "low": number, "high": number, "benchmark": number, "vsAvg": "above" | "at" | "below" },
  "cvr": { "low": number, "high": number },
  "hookRetention": { "low": number, "high": number } | null,
  "fatigueDays": { "low": number, "high": number },
  "confidence": "Low" | "Medium" | "High",
  "confidenceReason": string,
  "positiveSignals": [string, string],
  "negativeSignals": [string, string]
}

Return ONLY valid JSON, no markdown fencing. Be calibrated — a hook score of 3/10 should predict low retention, not moderate.`;

const prompt = isOrganic ? promptOrganic : promptPaid;
```

- [ ] **Step 5: Confirm the inline guardrails block still applies**

The `validatedPrediction` post-processing block (Math.max/Math.min clamps on `ctr`, `cvr`, `fatigueDays`) is shape-based, not semantic. It continues to clamp organic values (save rate 0–100%, share rate 0–100%, fatigueDays ≥ 0) correctly. No change needed.

- [ ] **Step 6: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 7: Commit Pass 7.4 with the semantic-remapping note in the commit body**

```bash
git add api/predict-performance.ts
git commit -m "feat(predict-performance): branch on isOrganic — predict organic signals not ad metrics" -m "Keeps the PredictionResult response shape unchanged for component compatibility.
Fields are semantically remapped when isOrganic=true:
  ctr              → save rate
  cvr              → share rate
  fatigueDays      → days until next creator post (momentum cadence)
  hookRetention    → unchanged (applies to both paid and organic video)

PredictedPerformanceCard already relabels the UI when isOrganic. A proper
schema cleanup (primaryEngagement / secondaryEngagement / organic union)
is tracked as a follow-up — do not assume ctr always means click-through
rate in this codebase."
```

**Stop here. Show the diff to the operator for pass-by-pass review before starting Pass 7.5. The operator will eyeball the organic user-prompt to confirm the field-mapping instructions are clear enough for Claude to follow reliably.**

---

## Chunk 5: Pass 7.5 — Fix It (organic rewrites)

### Task 5: Branch `/api/fix-it` on `isOrganic` — rewrite organic content, not ad copy

**Files:**
- Modify: `api/fix-it.ts` (destructure, `platformCopyRules`, `systemPrompt`, user-message `prompt`)
- NO wrapper change — `fixItService.ts` already accepts `isOrganic` per audit
- NO call-site change — `OrganicAnalyzer.tsx:465` already passes `true` per audit

**Why:** Same shape as Pass 7.4 — `isOrganic` already flows to the server but is ignored. Current system prompt: "You are a senior performance creative director specializing in <user_niche>${niche}</user_niche> advertising on <user_platform>${platform}</user_platform>. You're rewriting a <user_ad_type>${adType}</user_ad_type> ad…" Organic version must reframe as a senior creator strategist rewriting organic content to improve organic signals — NOT rewriting CTAs, offers, or conversion copy.

**Skill:** `senior-prompt-engineer`.

**Scope guardrails:**
- Do NOT change the response shape (`rewrittenHook`, `revisedBody`, `newCTA`, `textOverlays[]`, `predictedImprovements[]`, `editorNotes[]`).
- The `newCTA` field stays in the schema; for organic it becomes a "soft engagement prompt" (a non-urgent nudge like "what would you add?" / "save for later"), never a conversion CTA. An empty object is an acceptable fallback for organic when there's genuinely no engagement prompt to add.
- Do NOT modify the `brandVoiceContext` lookup — it applies equally to organic creators.
- Do NOT modify the `ctaFree` branch logic — it's a paid-Meta-specific concern and won't trigger for organic (organic never sets ctaFree).

- [ ] **Step 1: Destructure `isOrganic` in `api/fix-it.ts`**

Locate the body destructure (grep `const { analysisMarkdown: rawAnalysis, platform: rawPlatform`). Add `isOrganic: rawIsOrganic` and compute `const isOrganic = rawIsOrganic === true;`.

- [ ] **Step 2: Add an `ORGANIC_PLATFORM_COPY_RULES` map**

Locate the existing `platformCopyRules` map (grep `const platformCopyRules: Record<string, string>`). Add a sibling organic map covering `tiktok`, `reels`, `shorts`, `meta`, `instagram`, `pinterest`:

```ts
const organicPlatformCopyRules: Record<string, string> = {
  tiktok: "TikTok organic rules: Speak like a creator, not a brand. First person. Hook in the first line of caption. No brand-speak, no corporate tone. Trending-audio-aware phrasing beats generic copy.",
  reels: "Reels organic rules: First line of caption is the hook (before the 'more' truncation). Use line breaks for readability. Caption should reward saves and shares, not drive clicks.",
  shorts: "Shorts organic rules: Title and caption do the heavy lifting for discoverability. Hook in first 5 seconds of the video, supporting text minimal.",
  meta: "Meta organic rules: Caption under 125 chars for full visibility. Conversational tone. No ALL CAPS. Save-worthy content (educational, inspirational, relatable) beats promotional copy.",
  instagram: "Instagram organic rules: First line is the hook (before 'more' truncation). Line breaks for readability. Hashtags at the end, not inline. Caption should invite saves and DMs, not clicks.",
  pinterest: "Pinterest organic rules: Keyword-rich description (Pinterest is search-driven). Include the topic, style, and use case. On-image text should reinforce the pin's value prop.",
};
```

Switch the lookup based on `isOrganic`:

```ts
const platformRules = isOrganic
  ? (organicPlatformCopyRules[platform] || "")
  : (platformCopyRules[platform] || "");
```

- [ ] **Step 3: Branch `systemPrompt` for organic**

Locate the `const systemPrompt = \`You are a senior performance creative director` literal. Replace with a branching expression:

```ts
const systemPrompt = isOrganic
  ? `You are a senior creator strategist specializing in <user_niche>${niche}</user_niche> organic content on <user_platform>${platform}</user_platform>. You're rewriting a <user_content_type>${adType}</user_content_type> post that scored ${scores?.overall ?? "?"}/10 overall, with weakest areas: ${weakDims.join(", ") || "not identified"}.

Your rewrites must:
- Preserve the creator's existing voice and tone — read the original carefully before rewriting
- Be specific to ${niche} content — use language ${niche} creators and audiences actually use, not marketing speak
- Follow ${platform} organic best practices and character limits
- Fix the specific weaknesses identified in the scorecard — don't touch what scored 8+
- Address the weakest dimensions FIRST: ${weakDims.join(", ") || "all areas"}
- Rewrite for organic performance: scroll-stop, save rate, share appeal, completion, rewatch. NOT for conversion.

ANTI-CTA RULES (violations = failure):
- Do NOT suggest adding a CTA, "Shop Now" button, discount code, offer, or purchase language.
- Do NOT invent a product or brand if none is visible in the content.
- Do NOT add urgency copy ("Act now!", "Limited time!", "Last chance!") — organic content earns attention, it doesn't demand it.
- For the "newCTA" field, return a soft engagement prompt only (e.g., "comment your pick", "save for your next plan", "share with someone who needs this") — never a conversion CTA. If no engagement prompt fits, return an empty copy string.
- Every rewritten line must reference something specific from THIS post — a visual element, a creator's phrasing, a score finding.
- If you catch yourself writing copy that could apply to any product in any niche, delete it and try again.${brandVoiceContext}`
  : `You are a senior performance creative director specializing in <user_niche>${niche}</user_niche> advertising on <user_platform>${platform}</user_platform>. You're rewriting a <user_ad_type>${adType}</user_ad_type> ad that scored ${scores?.overall ?? "?"}/10 overall, with weakest areas: ${weakDims.join(", ") || "not identified"}.

Your rewrites must:
- Preserve the brand's existing voice and tone — read the original ad carefully before rewriting
- Be specific to ${niche} category — use language ${niche} audiences actually use, not marketing speak
- Follow ${platform} copy best practices and character limits
- Fix the specific weaknesses identified in the scorecard — don't touch what scored 8+
- Address the weakest dimensions FIRST: ${weakDims.join(", ") || "all areas"}

ANTI-GENERIC RULES (violations = failure):
- No "Transform your [X]" or "Don't miss out" or "Take your [X] to the next level"
- No "Unlock the power of" or "Discover the secret to" or "Join thousands who"
- No generic urgency ("Act now!", "Limited time!") unless the original ad used it
- Every rewritten line must reference something specific from THIS ad — a product feature, a score finding, a visual element
- If you catch yourself writing copy that could apply to any product in any niche, delete it and try again
- The rewrite must be so specific to ${niche} on ${platform} that it would be wrong for any other niche/platform combination${brandVoiceContext}${isCTAFree ? `

CTA-FREE AD: This Meta ad intentionally has no in-creative CTA — it relies on Meta's native CTA button in Ads Manager.
Do NOT suggest adding a CTA, Shop Now button, or any verbal call-to-action to the creative.
For the "newCTA" field in your JSON response, return: { "copy": "", "placement": "Uses Meta native CTA button" }.
Focus rewrite energy on hook strength, visual storytelling, offer clarity, and sound-off viability instead.` : ""}`;
```

- [ ] **Step 4: Branch the user-message `prompt` for organic**

Locate `const prompt = \`A user's ${adType} ad on ${platform}`. Split into organic + paid branches. Organic version:

```ts
const promptOrganic = `A creator's ${adType} post on ${platform} in the ${niche} niche received this organic scorecard:

${analysisMarkdown}

Scores: Hook ${scores?.hook ?? "?"}/10 | Clarity ${scores?.clarity ?? "?"}/10 | Shareability ${scores?.cta ?? "?"}/10 | Production ${scores?.production ?? "?"}/10 | Overall ${scores?.overall ?? "?"}/10
${weakDims.length ? `\nWEAKEST AREAS (fix these first): ${weakDims.join(", ")}` : ""}

${platformRules}

RULES:
1. Read the original carefully. Match its voice — if it's casual, stay casual. If it's storytelling, stay storytelling.
2. The rewritten hook must stop the scroll on ${platform} specifically — organic feed, not paid.
3. Every change must address a specific weakness from the scorecard. Don't change things that scored 8+.
4. Text overlays must be readable on mobile in ${adType === "static" ? "a single glance" : "under 3 seconds"}.
5. The "newCTA" field is an engagement prompt only — never a conversion CTA. Empty string is fine if no prompt fits.
6. Do NOT invent a product or brand if none is visible.

Return a JSON object with these exact keys:
{
  "rewrittenHook": { "copy": "<new hook text/script>", "reasoning": "<1 sentence why this is stronger for organic ${platform}>" },
  "revisedBody": "<full rewrite with **bold** on every changed part>",
  "newCTA": { "copy": "<soft engagement prompt, or empty string>", "placement": "<where to put it, or 'N/A'>" },
  "textOverlays": [{ "timestamp": "<when>", "copy": "<text>", "placement": "<where>" }],
  "predictedImprovements": [{ "dimension": "<metric name>", "oldScore": <number>, "newScore": <number>, "reason": "<why>" }],
  "editorNotes": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}

Return ONLY valid JSON, no markdown fencing.`;

const promptPaid = `A user's ${adType} ad on ${platform} in the ${niche} niche received this scorecard:

${analysisMarkdown}

Scores: Hook ${scores?.hook ?? "?"}/10 | Clarity ${scores?.clarity ?? "?"}/10 | CTA ${scores?.cta ?? "?"}/10 | Production ${scores?.production ?? "?"}/10 | Overall ${scores?.overall ?? "?"}/10
${isCTAFree ? "NOTE: CTA score is intentionally low — this ad uses Meta's native CTA button. Do NOT rewrite or suggest a CTA." : ""}
${weakDims.length ? `\nWEAKEST AREAS (fix these first): ${weakDims.join(", ")}` : ""}

User's intent: ${intent} — optimize the rewrite for ${intent === "awareness" ? "brand recall and reach" : intent === "consideration" ? "engagement and click-through" : "direct response and conversion"}.

${platformRules}

RULES:
1. Read the original ad copy carefully. Match its voice — if it's casual, stay casual. If it's technical, stay technical.
2. The rewritten hook must stop the scroll on ${platform} specifically.
3. Every change must address a specific weakness from the scorecard. Don't change things that scored 8+.
4. Text overlays must be readable on mobile in ${adType === "static" ? "a single glance" : "under 3 seconds"}.
5. The CTA must be specific to ${niche} — no generic "Learn More" unless that was the original.

Return a JSON object with these exact keys:
{
  "rewrittenHook": { "copy": "<new hook text/script>", "reasoning": "<1 sentence why this is stronger for ${platform}>" },
  "revisedBody": "<full rewrite with **bold** on every changed part>",
  "newCTA": { "copy": "<rewritten CTA>", "placement": "<where to put it>" },
  "textOverlays": [{ "timestamp": "<when>", "copy": "<text>", "placement": "<where>" }],
  "predictedImprovements": [{ "dimension": "<metric name>", "oldScore": <number>, "newScore": <number>, "reason": "<why>" }],
  "editorNotes": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}

Return ONLY valid JSON, no markdown fencing.`;

const prompt = isOrganic ? promptOrganic : promptPaid;
```

- [ ] **Step 5: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 6: Commit Pass 7.5**

```bash
git add api/fix-it.ts
git commit -m "feat(fix-it): branch on isOrganic — organic content rewrites not ad copy rewrites"
```

**Stop here. Show the diff to the operator for pass-by-pass review before moving to the Verification chunk.**

---

## Chunk 6: Verification + review

### Task 6: Full verification before handoff

- [ ] **Step 1: Final typecheck**

Run: `npm run build`
Expected: zero new TS errors.

Run: `npm run lint`
Expected: pre-existing errors in `ab-hypothesis.ts` unchanged (4 per prior audit). Zero NEW errors.

- [ ] **Step 2: Paid-branch byte-diff audit**

For each of the 5 modified `api/*.ts` files, confirm that when `isOrganic === false` (the paid default), the paid branch produces the same `systemPrompt` and user-message `prompt` strings as the pre-Pass-7 versions. Reference check: check out the pre-Pass-7 version of each file from git and diff only the paid branch output.

```bash
for f in api/second-eye.ts api/design-review.ts api/platform-score.ts api/predict-performance.ts api/fix-it.ts; do
  echo "=== $f ==="
  git diff "$(git log --format=%H -n 1 HEAD~6)" HEAD -- "$f" | head -200
done
```

Manual read: the paid branch literal inside each file's new branching expression must be identical to the old literal. If any paid branch drifted, revert that pass before continuing.

- [ ] **Step 3: Grep audit — count leak language in each modified `api/*.ts`**

Before/after counts for each file. Expected: organic branches contain zero of these words; paid branches may contain them.

```bash
for f in api/second-eye.ts api/design-review.ts api/platform-score.ts api/predict-performance.ts api/fix-it.ts; do
  echo "=== $f ==="
  for word in "advertising" "campaign" "conversion" "CTR" "CPM" "ROAS" "offer" "CTA"; do
    count=$(grep -c -i "$word" "$f")
    echo "  $word: $count"
  done
done
```

Report the counts in the final handoff message. Expected pattern: every occurrence of a leak word in an `isOrganic` branch should be absent (e.g., "CTR" appears only in paid branches or in neutral schema comments). Paid branches preserve the old count.

- [ ] **Step 4: Run `superpowers:verification-before-completion`**

Confirms: build passes, 0 TS errors, no new `use client` directives, no new hardcoded hex colors in any modified file, all icon/component imports verified in `OrganicAnalyzer.tsx`.

- [ ] **Step 5: Run `code-reviewer` on the full Pass 7 diff**

```bash
git diff main...HEAD -- src/services/claudeService.ts api/second-eye.ts api/design-review.ts api/platform-score.ts api/predict-performance.ts api/fix-it.ts src/pages/app/OrganicAnalyzer.tsx
```

Check: blast radius contained to the 7 planned files, paid flow untouched, no new API surface on the frontend, no new components.

- [ ] **Step 6: Hand off to operator — do NOT push or staging-merge**

Report:
- 5 commits landed on `claude/organic-fix` (plus 1 plan-doc commit).
- `git log --oneline HEAD~6..HEAD` output.
- Leak-word grep counts from step 3.
- Build + lint results.
- Confirmed: no push, no staging merge, no origin contact.

Operator will read the 5 commits, approve, and then push + staging-merge on explicit go.

---

## Post-Ship (after operator push + staging smoke test)

**Staging smoke test protocol (operator runs, not this plan):**

On staging.cutsheet.xyz, re-upload the beach-and-dog lifestyle video to `/app/organic` and verify:
- **Second Eye:** flags are about scroll-stop / rewatch / clarity. NOT "add product" or "add commercial intent."
- **Platform Score:** reframes as organic scoring. NO "will generate zero conversions", NO "e-commerce elements", NO "discount code" recommendations. Verdict reads as organic content critique, not ad critique.
- **Predict Performance:** card labels show "Est. Save Rate" and "Share / DM Potential" (already does, but now backed by organic-calibrated numbers). "What's driving this" cites organic signals (save rate, share appeal, algorithm fit), not CTR/CVR/ROAS.
- **Fix It:** if triggered, rewrites are creator-native — hook, body, soft engagement prompt (not "Shop Now", not "30% off"). No invented products.

Paid regression smoke test on staging:
- Upload the same paid ad used in Pass 6 verification.
- All 5 paid endpoints still produce paid-voiced output (CTAs, urgency, conversion tactics still recommended where appropriate).
- Fix It still rewrites ad copy as direct-response.
- Platform Score still scores as paid performance.
- No crossover organic language appearing in paid output.

**Prompt Registry update (Notion):**

Five prompts were branched, not added. Per CLAUDE.md ("new AI prompt added" rule), registry updates are for *new* prompts. Branches of existing prompts still count as the same registry entry — but add a note to each of these 5 entries that they now have an organic branch gated by `isOrganic`:
- Second Eye Review
- Design Review (Static Second Eye)
- Platform Score
- Predict Performance
- Fix It

**Follow-up tickets (do NOT include in this session):**

1. **Organic niche context map.** Pass 7.3 skipped `nichePlatformContext` for organic. Building an `organicNichePlatformContext` equivalent would give richer per-niche-per-platform organic guidance. Scope: ~80 lines of prompt engineering for 10 niches × 6 organic platforms.

2. **Predict Performance response-shape cleanup.** Pass 7.4 semantically remapped `ctr`/`cvr`/`fatigueDays` for organic. A proper schema would be either a discriminated union (`paid | organic` branch in `PredictionResult`) or a shared `primaryEngagement`/`secondaryEngagement` field naming. Scope: schema change + `PredictedPerformanceCard` + `generatePrediction` wrapper + all callers.

3. **Populate `signals[]` on organic Platform Score.** The `PlatformScore.signals?` field exists on the type but is not populated by any current prompt. Organic `PlatformScoreCard` renders it when present (pass/fail checklist). Building this out would give organic users richer per-platform feedback.

4. **`api/sound-off-check.ts` dead-code audit.** The endpoint exists and has a service wrapper but zero callers in `src/`. Delete the endpoint + service, or wire it up somewhere.

None of these block shipping Pass 7 — they're quality-of-life follow-ups for after the organic hallucination bug is closed on production.
