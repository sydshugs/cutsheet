# Organic Analyzer Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two production bugs in the Organic Analyzer — product/CTA hallucination on lifestyle content, and score variance across repeated runs — without regressing the paid flow.

**Architecture:** Replace the thin organic prefix band-aid with a dedicated organic prompt path threaded through the analyzer service, improvements Claude endpoint, and hook. Add deterministic sampling to Gemini (seed:42), harden the system prompt with subject-grounding + evidence citation, and tighten the paid rubric anchors to single-integer calibration points.

**Tech Stack:** TypeScript, Vite SPA, Gemini 2.5 Flash via `/api/analyze` proxy, Claude Sonnet 4 via `/api/improvements`, Supabase auth.

**Branch:** `claude/organic-fix`

**Non-negotiable constraints (from session instructions):**
- Do NOT touch auth, billing, Stripe, Supabase schema, API keys.
- Do NOT touch `scoreGuardrails.ts` clamp/average logic.
- Paid flow behavior unchanged except Pass 6 rubric tightening (consistency-only).
- `parseScores` regex for "Shareability & Rewatch" / "Shareability & Save-Worthiness" already maps to `cta` field — verified at `src/services/analyzerService.ts:524`. Do not touch.
- Run `npm run build` after every pass — zero new TypeScript errors allowed.
- Each pass is one discrete commit on `claude/organic-fix`.

**Locate-don't-count rule (approval flag #1):**
Line numbers in this plan reflect the file state when the plan was written and may have drifted. For every edit, locate the target by content (Grep for the surrounding block, section header, or literal string) rather than jumping to a literal line number. Passes affected specifically:
- Pass 2: grep for the `const SYSTEM_PROMPT = ` declaration.
- Pass 3: grep for `// ─── TYPES ───` and insert immediately before it.
- Pass 6: grep for the `Scoring anchors — use these as calibration reference:` line inside ANALYSIS_PROMPT.

**Pass 6 risk addendum (approval flag #2):**
Tightening 3-point anchors into 8 single-integer anchors across 4 dimensions will shift the paid score distribution. Acceptable direction: variance drops, median moves ≤1 point. Unacceptable: median shifts >1 point on any dimension. Verification protocol for Pass 6 (added to Chunk 7):
- Run the same paid ad 3 times on staging post-Pass-6. Confirm variance dropped.
- Compare median score to current production median. If any dimension shifted >1 point, **revert Pass 6 only** (single commit) and keep Passes 1–5.

---

## File Structure

Seven files, six commits:

| File | Pass | Responsibility |
|------|------|----------------|
| `api/analyze.ts` | 1 | Accept and forward `seed` param to Gemini generationConfig |
| `src/services/analyzerService.ts` | 2, 3, 4, 5 (call site), 6 | SYSTEM_PROMPT hardening; new organic prompts; `contentType` param in `analyzeVideo`; paid rubric anchor tightening |
| `src/hooks/useVideoAnalyzer.ts` | 4 | Thread `contentType` through the `analyze` callback |
| `src/pages/app/OrganicAnalyzer.tsx` | 4 | Pass `"organic"` to `analyze()` |
| `src/components/organic/organicContextPrefix.ts` | 4 | Deprecate — return empty string to avoid double-prompting |
| `src/services/claudeService.ts` | 5 | Add `adType` param to `generateImprovements` |
| `api/improvements.ts` | 5 | Branch system prompt + user message on `adType === "organic"` |

---

## Chunk 1: Deterministic sampling (Pass 1)

### Task 1: Add `seed:42` to the Gemini proxy

**Files:**
- Modify: `api/analyze.ts`

**Why:** Gemini's default is non-deterministic token sampling. With `temperature:0 + seed:42`, token sampling becomes reproducible for identical prompts + inputs. Video frame sampling remains server-side non-deterministic (known Phase 2 limit — documented post-ship).

- [ ] **Step 1: Add `seed` to `AnalyzeRequest` interface**

Location: `api/analyze.ts:31-43`. Add after line 40 (`topK?: number;`):

```ts
seed?: number;
```

- [ ] **Step 2: Destructure `seed` with default 42 in handler**

Location: `api/analyze.ts:62-74`. Change:

```ts
const {
  base64Data,
  fileUrl,
  mimeType,
  prompt,
  systemInstruction,
  maxOutputTokens = 8192,
  temperature = 0,
  topP = 0.8,
  topK = 40,
  niche,
  platform,
} = (req.body ?? {}) as AnalyzeRequest;
```

to:

```ts
const {
  base64Data,
  fileUrl,
  mimeType,
  prompt,
  systemInstruction,
  maxOutputTokens = 8192,
  temperature = 0,
  topP = 0.8,
  topK = 40,
  seed = 42,
  niche,
  platform,
} = (req.body ?? {}) as AnalyzeRequest;
```

- [ ] **Step 3: Pass `seed` into `generationConfig`**

Location: `api/analyze.ts:135-140`. Change the `generationConfig` block to:

```ts
generationConfig: {
  maxOutputTokens: Math.min(maxOutputTokens, 16384),
  temperature: Math.min(Math.max(temperature, 0), 2),
  topP: Math.min(Math.max(topP, 0), 1),
  topK: Math.min(Math.max(topK, 1), 100),
  // Fixed seed + temp:0 = deterministic token sampling. Video frame sampling is non-deterministic server-side (known Phase 2 limit).
  seed: Math.floor(seed),
},
```

- [ ] **Step 4: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 5: Commit**

```bash
git add api/analyze.ts
git commit -m "fix(analyze): add seed:42 to Gemini config for deterministic scoring"
```

---

## Chunk 2: Subject-grounding in SYSTEM_PROMPT (Pass 2)

### Task 2: Replace SYSTEM_PROMPT with subject-grounding + evidence citation

**Files:**
- Modify: `src/services/analyzerService.ts:75-96`

**Why:** Current SYSTEM_PROMPT frames analyst as "paid social ads" expert. This primes product-hallucination. New prompt reframes as general creative analyst, adds explicit subject-grounding rules (don't invent product/brand if not visible) and an evidence-citation rule (every score must cite an observation) to stabilize scores run-over-run.

**Skill:** Use `senior-prompt-engineer` and `prompt-engineer-toolkit` — this is calibration, not just text editing.

- [ ] **Step 1: Replace SYSTEM_PROMPT**

Location: `src/services/analyzerService.ts:75-96`. Replace the entire constant (from `const SYSTEM_PROMPT = \`...` through the closing backtick-semicolon) with:

```ts
const SYSTEM_PROMPT = `You are an expert performance marketing creative analyst with 10+ years experience buying and producing social creative across Meta, TikTok, and YouTube.

Your job is to analyze creative the way a senior media buyer would — not as a film critic, not as an AI assistant, but as someone whose job is to predict whether creative will perform and why.

Your analysis must be:
- Direct and opinionated. Don't hedge.
- If something is weak, say it's weak and explain why.
- Written like a human expert briefing a creative team, not a robot summarizing content.
- Focused on performance signals: hook strength, message clarity, retention, emotion.

SUBJECT-GROUNDING RULES — DO NOT HALLUCINATE:
Describe only what you can actually see in the creative. Do NOT infer a product, brand, offer, service, or call-to-action unless it is visibly present.

If the creative shows only a lifestyle scene (a person, place, activity, animal, travel moment, etc.) with no visible product, brand logo, or sales message, treat it as brand/lifestyle content:
- State explicitly that no product is visible.
- Do NOT invent a product, category, or offer to score against.
- Do NOT assume the creator is selling something.
- Score Hook, Clarity, and Production on what is actually shown.
- Do not penalize the creative for lacking a CTA when no CTA is intended — acknowledge it as brand/lifestyle content.

If you cannot determine what the creative is advertising with certainty, say so. Do not guess.

SCORING RULES — DETERMINISTIC:
You are a scoring engine. Apply these criteria mechanically and consistently.
For the same input, always produce the same score. Do not vary assessment based on phrasing — score only what is visually and factually present.
Scores must be integers 1–10. No decimals. No ranges. No "around" or "approximately."

EVIDENCE-CITATION RULE:
Before outputting any score, anchor it to a specific observation from the creative. Every score statement must be followed by a brief evidence clause citing what you saw (e.g., "Hook: 6/10 — opening frame is a wide beach shot with no text overlay and no motion in the first 0.5s"). No score without a cited observation. This prevents drift between runs.

Scoring scale:
1–3: Significant problems. Multiple critical issues present.
4–6: Functional but weak. Core elements present but underperforming.
7–8: Solid. Meets platform best practices with minor improvements possible.
9–10: Excellent. Exceeds platform benchmarks. Production-ready.

Return analysis in exact structured markdown format. Do not add commentary before or after the structured output.`;
```

- [ ] **Step 2: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/analyzerService.ts
git commit -m "feat(analyzer): add subject-grounding and evidence-citation rules to SYSTEM_PROMPT"
```

---

## Chunk 3: Organic-native prompts (Pass 3)

### Task 3: Insert ORGANIC_ANALYSIS_PROMPT and ORGANIC_STATIC_ANALYSIS_PROMPT

**Files:**
- Modify: `src/services/analyzerService.ts` — insert after line 389 (end of `STATIC_ANALYSIS_PROMPT`), before `// ─── TYPES ─── `

**Why:** Paid ANALYSIS_PROMPT asks for CTA analysis, platform CTA detection, and scene-by-scene ad breakdowns. These are wrong for organic. A thin prefix telling the AI to "replace CTA with Shareability" fights the base prompt. Cleaner to have dedicated organic prompts.

**Skill:** Use `senior-prompt-engineer` + `prompt-engineer-toolkit` paired.

**Parser compatibility (verified):**
- `parseScores` at `src/services/analyzerService.ts:520-543` already recognizes:
  - `hook` ← `Hook Strength`, `Hook`, `Thumb-Stop`
  - `clarity` ← `Message Clarity`, `Message`, `Sound-Off`, `Retention`, `Audio & Captions`
  - `cta` ← `CTA Effectiveness`, `CTA`, `Call to Action`, **`Shareability & Save-Worthiness`**, **`Shareability & Rewatch`**, `Shareability`
  - `production` ← `Production Quality`, `Production`, `Visual`, `Brand`
  - `overall` ← `Overall Ad Strength`, `Overall Ad`, **`Overall Content Strength`**, `Overall`, `Total Score`
- `parseHashtags` at `src/services/analyzerService.ts:729-766` recognizes `TIKTOK`, `META`, `INSTAGRAM`, `YOUTUBE SHORTS`, `INSTAGRAM REELS`, `PINTEREST`.
- `parseHookDetail` at `src/services/analyzerService.ts:548-572` recognizes `First 3 Seconds` (video) and `First Glance` (static).
- `parseImprovements`, `parseStructuredImprovements`, `parseVerdict`, `parseScenes`, `parseBudget` — structure-based, platform-agnostic.

**Prompt shape rules — must match existing parsers:**
- Use the exact section headers: `## 🎣 HOOK ANALYSIS`, `## 📢 MESSAGING STRUCTURE`, `## 😮 EMOTION ARC` (or `EMOTIONAL IMPACT` for static), `## 📝 FULL TRANSCRIPT` (video only), `## 📋 VERDICT`, `## 🧠 CREATIVE VERDICT`, `## 📊 QUICK SCORES`, `## 🪝 HOOK DETAIL`, `## 🔧 IMPROVEMENTS`, `## #️⃣ HASHTAGS`. Video also uses `## 🎬 SCENE BREAKDOWN`, `## ⚡ PACING & RETENTION SIGNALS`, `## 🎬 SCENE JSON`.
- In QUICK SCORES, use `Shareability & Rewatch: X/10` (video) or `Shareability & Save-Worthiness: X/10` (static) as the third dimension. Use `Overall Content Strength: X/10` as the fifth.
- In HOOK DETAIL, keep the exact strings `First 3 Seconds:` (video) / `First Glance:` (static) so `parseHookDetail` finds them.
- VERDICT block: exact lines `State: [not_ready | needs_work | ready]`, `Headline:`, `Sub:`.
- In HASHTAGS, use labels exactly: `TIKTOK:`, `INSTAGRAM REELS:`, `YOUTUBE SHORTS:` (video organic) and `META:`, `INSTAGRAM:`, `PINTEREST:` (static organic).

- [ ] **Step 1: Write ORGANIC_ANALYSIS_PROMPT (video)**

Location: Insert immediately after `src/services/analyzerService.ts:389` (end of `STATIC_ANALYSIS_PROMPT`), before `// ─── TYPES ───` at line 391.

Key rules the prompt body MUST encode:
- NO product language anywhere in the markdown skeleton.
- NO CTA dimension in QUICK SCORES. Five dimensions: Hook Strength, Message Clarity, Shareability & Rewatch, Production Quality, Overall Content Strength.
- Every score line followed by an evidence clause (e.g., `Hook Strength: 7/10 — the first 0.8s cuts to a close-up dog face with bold reaction — clear pattern interrupt`).
- Integer-specific scoring anchors (2, 3, 4, 5, 6, 7, 8, 9) for each of the four component dimensions.
- Explicit `Do NOT invent a product or brand if none is visible. If this is brand/lifestyle content, score it as brand/lifestyle content.`
- Improvements: 4–6 bullets, each targeting organic performance (reach, saves, shares, rewatch) — NOT CTAs, offers, products, urgency.
- Hashtags block uses `TIKTOK` (12 tags), `INSTAGRAM REELS` (8), `YOUTUBE SHORTS` (5).
- Omit `## 📢 MESSAGING STRUCTURE > CTA` line. Replace with `Core idea:` and `Proof points:`.
- Retain `## 🎬 SCENE BREAKDOWN`, `## ⚡ PACING & RETENTION SIGNALS`, `## 📝 FULL TRANSCRIPT`, `## 🎬 SCENE JSON`.
- Omit all budget language.

Use `senior-prompt-engineer` to draft the full prompt text matching this shape. The structure mirrors `ANALYSIS_PROMPT` at `src/services/analyzerService.ts:100-255` minus CTA language, with organic anchors substituted.

- [ ] **Step 2: Write ORGANIC_STATIC_ANALYSIS_PROMPT**

Location: Insert immediately after `ORGANIC_ANALYSIS_PROMPT`.

Rules:
- Mirror `STATIC_ANALYSIS_PROMPT` shape at `src/services/analyzerService.ts:259-389` minus CTA language.
- Replace `⚡ PACING & RETENTION` / `🎬 SCENE BREAKDOWN` with `## 🎯 FIRST-GLANCE HOOK` and `## 🎨 VISUAL ANALYSIS` (composition, color/light, subject, on-image text).
- QUICK SCORES: Hook Strength, Message Clarity, **Shareability & Save-Worthiness**, Production Quality, Overall Content Strength. Integer-specific anchors.
- Hashtags: `META` (3), `INSTAGRAM` (5), `PINTEREST` (8).
- `## 🪝 HOOK DETAIL` with `First Glance:` label intact.
- No `## 🎥 MOTION TEST IDEA` section — remove (that's a paid-static thing).
- Omit budget language.

- [ ] **Step 3: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors. The prompts are string constants — no type impact.

- [ ] **Step 4: Commit**

```bash
git add src/services/analyzerService.ts
git commit -m "feat(analyzer): add organic-native video and static prompts"
```

---

## Chunk 4: Thread `contentType` through hook + service (Pass 4)

### Task 4: Add `contentType` param to `analyzeVideo`

**Files:**
- Modify: `src/services/analyzerService.ts:808-815` (function signature) and `:837` (prompt selection)
- Modify: `src/hooks/useVideoAnalyzer.ts:88` (interface) and `:101, :107` (callback)
- Modify: `src/pages/app/OrganicAnalyzer.tsx:294` (call site)
- Modify: `src/components/organic/organicContextPrefix.ts` (deprecate)

**Why:** Currently organic calls `analyze()` with only a `contextPrefix` string — the analyzer service can't tell organic from paid. Adding an explicit `contentType` param lets us select the right prompt and pass the flag downstream to improvements.

- [ ] **Step 1: Extend `analyzeVideo` signature**

Location: `src/services/analyzerService.ts:808-815`. Change:

```ts
export async function analyzeVideo(
  file: File,
  _apiKey: string,
  onStatusChange?: (status: AnalysisStatus, message?: string) => void,
  contextPrefix?: string,
  userContext?: string,
  sessionMemory?: string
): Promise<AnalysisResult> {
```

to:

```ts
export async function analyzeVideo(
  file: File,
  _apiKey: string,
  onStatusChange?: (status: AnalysisStatus, message?: string) => void,
  contextPrefix?: string,
  userContext?: string,
  sessionMemory?: string,
  contentType: "paid" | "organic" = "paid"
): Promise<AnalysisResult> {
```

- [ ] **Step 2: Branch prompt selection on `contentType`**

Location: `src/services/analyzerService.ts:837`. Change:

```ts
const basePrompt = isImage ? STATIC_ANALYSIS_PROMPT : ANALYSIS_PROMPT;
```

to:

```ts
const isOrganic = contentType === "organic";
const basePrompt = isOrganic
  ? (isImage ? ORGANIC_STATIC_ANALYSIS_PROMPT : ORGANIC_ANALYSIS_PROMPT)
  : (isImage ? STATIC_ANALYSIS_PROMPT : ANALYSIS_PROMPT);
```

Note: `isOrganic` is also used in Chunk 5 below (Pass 5 call site) — declare it here once.

- [ ] **Step 3: Extend `useVideoAnalyzer` interface**

Location: `src/hooks/useVideoAnalyzer.ts:88`. Change:

```ts
analyze: (file: File, apiKey: string, contextPrefix?: string, userContext?: string, sessionMemory?: string) => Promise<AnalysisResult | undefined>;
```

to:

```ts
analyze: (file: File, apiKey: string, contextPrefix?: string, userContext?: string, sessionMemory?: string, contentType?: "paid" | "organic") => Promise<AnalysisResult | undefined>;
```

- [ ] **Step 4: Update `useVideoAnalyzer` callback**

Location: `src/hooks/useVideoAnalyzer.ts:101-120`. Change:

```ts
const analyze = useCallback(async (file: File, apiKey: string, contextPrefix?: string, userContext?: string, sessionMemory?: string): Promise<AnalysisResult | undefined> => {
```

to:

```ts
const analyze = useCallback(async (file: File, apiKey: string, contextPrefix?: string, userContext?: string, sessionMemory?: string, contentType?: "paid" | "organic"): Promise<AnalysisResult | undefined> => {
```

And change line 107 from:

```ts
const analysis = await analyzeVideo(file, apiKey, (s, msg) => {
  setStatus(s);
  setStatusMessage(msg ?? "");
}, contextPrefix, userContext, sessionMemory);
```

to:

```ts
const analysis = await analyzeVideo(file, apiKey, (s, msg) => {
  setStatus(s);
  setStatusMessage(msg ?? "");
}, contextPrefix, userContext, sessionMemory, contentType);
```

- [ ] **Step 5: Pass `"organic"` from OrganicAnalyzer**

Location: `src/pages/app/OrganicAnalyzer.tsx:294`. Change:

```ts
await analyze(file, API_KEY, contextPrefix, userContext || undefined, sessionMemory);
```

to:

```ts
await analyze(file, API_KEY, contextPrefix, userContext || undefined, sessionMemory, "organic");
```

Verify (via Grep) that no other `analyzeVideo` call site exists outside PaidAdAnalyzer — PaidAdAnalyzer will default to "paid" via the parameter default, no change needed.

- [ ] **Step 6: Deprecate `organicContextPrefix.ts`**

Location: `src/components/organic/organicContextPrefix.ts`. Replace the entire file with:

```ts
// src/components/organic/organicContextPrefix.ts
// DEPRECATED — superseded by ORGANIC_ANALYSIS_PROMPT in analyzerService.ts.
// Returning empty string to avoid double-prompting. Remove after one week of clean staging.

export function getOrganicContextPrefix(
  _organicFormat: "video" | "static",
  _platformLabel: string,
): string {
  return "";
}
```

Keep the function signature for backwards compatibility; all import sites continue to compile.

- [ ] **Step 7: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 8: Commit**

```bash
git add src/services/analyzerService.ts src/hooks/useVideoAnalyzer.ts src/pages/app/OrganicAnalyzer.tsx src/components/organic/organicContextPrefix.ts
git commit -m "feat(analyzer): thread contentType param, select organic prompts when organic"
```

---

## Chunk 5: Branch /api/improvements on `adType` (Pass 5)

### Task 5: Pass `adType` through Claude improvements + branch on organic

**Files:**
- Modify: `src/services/claudeService.ts:75-88` (add `adType` param)
- Modify: `src/services/analyzerService.ts:868` (call site — pass `contentType` as `adType`)
- Modify: `api/improvements.ts:52-99` (branch system prompt + user message)

**Why:** Claude-enhanced improvements currently run with a paid-ads system prompt regardless. For organic, this is where "add a CTA" and "add urgency" suggestions originate — after Gemini already gave organic output. Branching the Claude prompt is mandatory to close the hallucination loop.

**Skill:** Use `senior-backend` for API branching + `senior-prompt-engineer` for the organic system prompt.

- [ ] **Step 1: Add `adType` param to `generateImprovements`**

Location: `src/services/claudeService.ts:75-88`. Change:

```ts
export async function generateImprovements(
  analysisMarkdown: string,
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  userContext?: string,
  platform?: string,
  sessionMemory?: string
): Promise<string[]> {
  if (!scores) return [];
  const data = await callApi<{ improvements: string[] }>("/api/improvements", {
    action: "improvements",
    payload: { analysisMarkdown, scores, userContext, platform, sessionMemory },
  });
  return data.improvements ?? [];
}
```

to:

```ts
export async function generateImprovements(
  analysisMarkdown: string,
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  userContext?: string,
  platform?: string,
  sessionMemory?: string,
  adType?: "paid" | "organic"
): Promise<string[]> {
  if (!scores) return [];
  const data = await callApi<{ improvements: string[] }>("/api/improvements", {
    action: "improvements",
    payload: { analysisMarkdown, scores, userContext, platform, sessionMemory, adType },
  });
  return data.improvements ?? [];
}
```

- [ ] **Step 2: Update call site in `analyzeVideo`**

Location: `src/services/analyzerService.ts:868`. Change:

```ts
const enhanced = await claudeImprovements(markdown, scores, userContext, undefined, sessionMemory);
```

to:

```ts
const enhanced = await claudeImprovements(markdown, scores, userContext, undefined, sessionMemory, contentType);
```

`contentType` is in scope from the function parameter introduced in Pass 4.

- [ ] **Step 3: Branch system prompt + user message in `api/improvements.ts`**

Location: `api/improvements.ts:52-99` (the `action === "improvements"` branch).

Change the destructuring at line 56:

```ts
const { analysisMarkdown: rawAnalysis, scores, userContext: rawContext, platform: rawPlatform, sessionMemory: rawMemory } = payload ?? {};
```

to:

```ts
const { analysisMarkdown: rawAnalysis, scores, userContext: rawContext, platform: rawPlatform, sessionMemory: rawMemory, adType: rawAdType } = payload ?? {};
const isOrganic = rawAdType === "organic";
```

Change the system prompt construction at line 83. Replace:

```ts
system: `You are a senior performance marketing creative strategist. You write short, specific, actionable improvement suggestions for ads. Each suggestion should be 1-2 sentences max. Focus on the weakest scoring areas. No fluff, no preamble.${contextBlock}${platformBlock}${memoryBlock}${brandVoiceContext}`,
```

with:

```ts
system: `${isOrganic
  ? "You are a senior organic content strategist who advises creators on how to grow reach, saves, shares, and rewatches on TikTok, Instagram Reels, and YouTube Shorts. You write short, specific, actionable improvements for organic content. Each suggestion is 1-2 sentences max. Focus on the weakest scoring areas for ORGANIC performance: hook, clarity, shareability, production. Do NOT suggest adding CTAs, product mentions, offers, urgency language, or conversion tactics — this is organic content, not a paid ad. Do NOT invent a product or brand if none is visible in the creative. No fluff, no preamble."
  : "You are a senior performance marketing creative strategist. You write short, specific, actionable improvement suggestions for ads. Each suggestion should be 1-2 sentences max. Focus on the weakest scoring areas. No fluff, no preamble."
}${contextBlock}${platformBlock}${memoryBlock}${brandVoiceContext}`,
```

Change the user message at line 87. Replace:

```ts
content: `Here is a video ad analysis:\n\n${analysisMarkdown}\n\nWeakest areas: ${weakAreas || "none particularly weak"}${platform && platform !== "all" ? `\nTarget platform: ${platform}` : ""}\n\nWrite exactly 4-6 bullet-point improvements. Return ONLY the bullet points, one per line, starting with "- ". No headers, no numbering, no extra text.`,
```

with:

```ts
content: `Here is a ${isOrganic ? "video analysis of organic creator content" : "video ad analysis"}:\n\n${analysisMarkdown}\n\nWeakest areas: ${weakAreas || "none particularly weak"}${platform && platform !== "all" ? `\nTarget platform: ${platform}` : ""}\n\nWrite exactly 4-6 bullet-point improvements${isOrganic ? " for organic performance (reach, saves, shares, rewatch)" : ""}. Return ONLY the bullet points, one per line, starting with "- ". No headers, no numbering, no extra text.`,
```

- [ ] **Step 4: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/claudeService.ts src/services/analyzerService.ts api/improvements.ts
git commit -m "feat(improvements): branch on adType for organic content strategy"
```

---

## Chunk 6: Tighten paid rubric anchors (Pass 6)

### Task 6: Replace 3-point anchor ranges with single-integer anchors in paid ANALYSIS_PROMPT

**Files:**
- Modify: `src/services/analyzerService.ts:184-194` (Scoring anchors block inside ANALYSIS_PROMPT)

**Why:** Current anchors are only defined at 2/5/8 — a 3-point spacing that gives the model latitude to drift ±1 run-over-run. Defining each integer 2–9 narrows each score's valid range to a single observation type.

**Skill:** Use `senior-prompt-engineer` — calibration work.

**Scope guardrails:**
- ONLY modify ANALYSIS_PROMPT's "Scoring anchors" section. Do NOT change STATIC_ANALYSIS_PROMPT's anchors. Do NOT touch the organic prompts (their anchors are already integer-specific from Pass 3).
- Keep `Overall Ad Strength` as derived-only (validated by `validateScores` in `scoreGuardrails.ts` — do not touch).

- [ ] **Step 1: Replace paid ANALYSIS_PROMPT anchors**

Location: `src/services/analyzerService.ts:184-194`. Replace the block:

```
Scoring anchors — use these as calibration reference:
- Hook 2/10: Static product shot with no text, no motion, no pattern interrupt. Generic thumbnail.
- Hook 5/10: Has movement or text overlay but hook is predictable. "Check this out" type opener.
- Hook 8/10: Immediate pattern interrupt — unexpected visual, bold claim, or strong curiosity gap in first frame.
- CTA 2/10: No call to action present, or a generic "Learn More" with no urgency.
- CTA 5/10: CTA exists but is weak — small text, buried, or generic ("Shop Now" with no incentive).
- CTA 8/10: Clear, urgent, specific CTA with a reason to act now ("Get 30% off — ends tonight").
- Message 3/10: Unclear what the product is or does. No value proposition visible.
- Message 7/10: Clear value prop but generic — could apply to any competitor in the space.
- Production 3/10: Poor lighting, low resolution, awkward framing, amateur look.
- Production 8/10: Professional grade — clean lighting, intentional composition, platform-native style.
```

with integer-specific anchors from 2–9 for Hook, Message, CTA, Production. Example shape for Hook:

```
Scoring anchors — use these as calibration reference. Match each score to ONE anchor.

Hook Strength:
- 2: Static shot. No motion, no text, no scroll-stop factor.
- 3: Minimal motion or one text element, but predictable or low-contrast.
- 4: Has motion AND text, but opener is generic ("Check this out" / "Have you ever...").
- 5: Clear but predictable opener. Motion + text + one attention element but no genuine pattern interrupt.
- 6: One specific pattern interrupt (sharp visual cut, bold claim, unexpected subject). Earns 2–3 seconds.
- 7: Strong pattern interrupt + clear curiosity gap or bold visual. Earns the next 5 seconds.
- 8: Immediate scroll-stop. Unexpected visual + bold text + strong curiosity gap in first 1.5s.
- 9: Exceptional. Platform-native, pattern-interrupt-dense, unique. Viewer cannot scroll past.

Message Clarity:
- 2: Unclear what the product is or does. No value proposition visible.
- 3: Product category is guessable but value prop is absent or contradictory.
- 4: Product is visible but the promise is generic or buried.
- 5: Value prop is stated but generic — could apply to any competitor in the space.
- 6: Clear value prop + one specific differentiator, but copy is cluttered or slow to land.
- 7: Clear, specific value prop delivered in under 5 seconds.
- 8: Crisp single-sentence promise, reinforced by visuals. Differentiated.
- 9: Unforgettable one-liner + perfectly-matched visual. Viewer knows the product and promise in one beat.

CTA Effectiveness:
- 2: No call to action present, or a generic "Learn More" with no urgency.
- 3: CTA appears but is a throwaway line with no visual anchor.
- 4: Generic CTA ("Shop Now") with no incentive or reason to click.
- 5: CTA exists but is weak — small text, buried, or generic ("Shop Now" with no incentive).
- 6: Clear CTA with one specific reason to act, but low visual weight.
- 7: Clear, specific CTA with visual anchor ("Tap the link — free trial ends Friday").
- 8: Clear, urgent, specific CTA with a reason to act now ("Get 30% off — ends tonight").
- 9: CTA is visually dominant, urgent, specific, and matches the emotional peak of the ad.

Production Quality:
- 2: Poor lighting, low resolution, awkward framing, amateur look.
- 3: Functional but inconsistent — mixed lighting, shaky camera, rough cuts.
- 4: Clean capture but flat composition, no intentional design.
- 5: Acceptable — lighting and framing are competent but unmemorable.
- 6: Intentional composition, clean lighting, some brand style.
- 7: Platform-native style, consistent branding, confident cuts.
- 8: Professional grade — clean lighting, intentional composition, platform-native style.
- 9: Reference-quality. Every frame is intentional and contributes to the message.
```

- [ ] **Step 2: Build + typecheck**

Run: `npm run build`
Expected: zero new TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/analyzerService.ts
git commit -m "fix(scoring): tighten paid rubric to single-integer anchors to reduce run-to-run variance"
```

---

## Chunk 7: Verification + review

### Task 7: Full verification before PR

- [ ] **Step 1: Final typecheck**

Run: `npm run build`
Expected: zero new TS errors.

Run: `npm run lint`
Expected: zero TS errors.

- [ ] **Step 2: Push branch to staging**

```bash
git push origin claude/organic-fix
```

Merge `claude/organic-fix` → `staging` per CLAUDE.md workflow.

- [ ] **Step 3: Staging — organic lifestyle smoke test (THE BUG)**

On staging.cutsheet.xyz:
- Upload the original beach-and-dog video to the Organic Analyzer.
- Expected: zero product mentions; scores include `Shareability & Rewatch` (maps to `cta` field, not a CTA in the UI); improvements list does NOT suggest CTAs, offers, or products; creative verdict explicitly acknowledges brand/lifestyle content.
- `PredictedPerformanceCard` renders organic-appropriate content (`isOrganic` prop already threaded per ScoreCard — verified, not in scope here).

- [ ] **Step 4: Staging — paid determinism smoke test (THE VARIANCE BUG)**

On staging.cutsheet.xyz:
- Upload any paid static image ad (no frame-sampling variance).
- Record all 5 score values.
- Re-analyze the same file.
- Expected: scores match exactly for static.
- Repeat with a video ad — scores should still vary at most ±1 on one dimension (server-side frame sampling limit).

- [ ] **Step 5: Staging — paid regression test**

- Run the same paid ad through to confirm scoring distribution looks normal (not skewed low or high from the tightened anchors).
- Confirm Fix It still works on paid.
- Confirm improvements are still paid-voiced (CTAs, urgency, conversion language allowed).

- [ ] **Step 6: Run `superpowers:verification-before-completion`**

Confirms: build passes, 0 TS errors, all icon/component imports verified, no `use client` added, no hardcoded hex.

- [ ] **Step 7: Run `code-reviewer` on the full diff**

Check blast radius, confirm the paid path is untouched except for the rubric tightening in Pass 6.

- [ ] **Step 8: Open PR from `claude/organic-fix` → `main` via `staging`**

Standard two-step per CLAUDE.md: staging → check staging.cutsheet.xyz → merge staging to main.

---

## Post-Ship

Add to Notion Product Roadmap (one line):
> Video score determinism is partial — Gemini frame sampling is non-deterministic server-side. Full determinism requires client-side frame extraction at fixed timestamps (Phase 2).

No new AI prompts are being added — all prompt constants are refactors of existing ones. Prompt Registry update not required per CLAUDE.md ("new AI prompt added" rule).
