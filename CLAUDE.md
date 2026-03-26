# Cutsheet — Project Rules

## Overview
Cutsheet is a video analysis SaaS built with React 19 + Vite 6 + TypeScript + Tailwind CSS v4. Dark-first design system with light mode support.

## Tech Stack
- **Framework:** React 19 (SPA, no SSR)
- **Build:** Vite 6 with `@tailwindcss/vite` plugin
- **Styling:** Tailwind CSS v4 + CSS custom properties in `src/styles/tokens.css`
- **Components:** CVA (class-variance-authority) + Radix UI primitives
- **Icons:** lucide-react
- **Animation:** framer-motion
- **Routing:** react-router-dom v7
- **Backend:** Supabase (auth/db), Express (API), Stripe (payments)
- **AI:** Google Gemini API
- **Path alias:** `@/` maps to project root

## Project Structure
```
src/
├── components/          # App components
│   └── ui/              # Reusable UI primitives (Button, SegmentedControl, etc.)
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── services/            # API services
├── lib/utils.ts         # cn() helper (clsx + tailwind-merge)
├── styles/tokens.css    # Design tokens (CSS custom properties)
├── types/               # TypeScript types
├── utils/               # Utility functions
├── theme.ts             # Light/dark theme token maps
├── index.css            # Tailwind imports + global styles
└── App.tsx              # Root component
api/                     # Vercel serverless functions
```

## Design System

### Color Tokens (from `src/styles/tokens.css`)
- **Background:** `--bg: #08080F` (near-black)
- **Surfaces:** `--surface` (3% white), `--surface-el` (5% white)
- **Borders:** `--border` (10% white), `--border-strong` (18% white)
- **Text:** `--ink` (92% white), `--ink-muted` (50%), `--ink-faint` (25%)
- **Accent:** `--accent: #6366F1` (indigo), `--accent-hover: #5254CC`
- **Gradient:** `--grad: linear-gradient(135deg, #6366F1, #8B5CF6)`
- **Semantic:** `--success: #10B981`, `--error: #EF4444`, `--warn: #F59E0B`
- **Score bands:** excellent (green), good (indigo), average (amber), weak (red)

### Typography
- **Sans:** Geist (`--sans`)
- **Mono:** Geist Mono (`--mono`)
- **Logo font:** TBJ Interval (custom, `@font-face` in tokens.css)
- **Display:** Outfit (used in landing page headings)

### Spacing & Radius
- `--radius-sm: 8px`, `--radius: 16px`, `--radius-lg: 20px`, `--radius-xl: 24px`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`

### Component Patterns
- Use `cn()` from `src/lib/utils.ts` for className merging
- Use CVA for component variants (see `src/components/ui/button.tsx`)
- Use CSS custom properties for theme values, Tailwind utilities for layout
- Button variants: default, destructive, outline, secondary, ghost, link

### Theme System (`src/theme.ts`)
- Two modes: `light` (default) and `dark`
- Dark mode uses aurora-style radial gradients on background
- Light mode: `#FAFAF9` background, `#111110` text

## Figma Integration (MCP)

When translating Figma designs to code:
1. **Use existing tokens** — map Figma colors to CSS custom properties, not hardcoded hex values
2. **Use existing components** — check `src/components/ui/` before creating new ones
3. **Use `cn()` for classNames** — always merge with `cn()`, never concatenate strings
4. **Use CVA for variants** — if a component has multiple visual states, use class-variance-authority
5. **Use lucide-react for icons** — match Figma icons to lucide equivalents
6. **Use framer-motion for animations** — `motion.div` with `initial`/`animate`/`exit` props
7. **Follow file conventions** — components in PascalCase, hooks with `use` prefix, services as plain modules
8. **Responsive approach** — mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
9. **Path imports** — use `@/src/...` alias for imports

## Dev Server
- `npm run dev` → port 3000
- `npm run preview` → port 4173
- `npm run lint` → TypeScript check (`tsc --noEmit`)
- `npm run build` → production build

## Git
- Main branch: `main`
- Keep commits focused and descriptive

---

## Workflow Rules

### Brainstorming Gate
Before any task that touches more than 2 files OR involves structural changes (moving content between components, adding state, wiring new handlers, changing data flow), run `superpowers:brainstorming` then `superpowers:writing-plans` FIRST.

Single-file fixes, removing elements, and style-only changes can skip brainstorming.

If Claude Code is about to write code that touches more than 2 files and no written plan exists — stop and write the plan first.

### Verification Gate
Before marking any task done, run `superpowers:verification-before-completion`. Build must pass with 0 errors and 0 TypeScript failures.

## Icon & Component Import Rule — REQUIRED before every commit
Before marking ANY UI task done, run this check on every file you touched:
```bash
# Find all JSX component usages
grep -n "<[A-Z][a-zA-Z]*" <file> | grep -v "^.*import"
# Find all imports
grep -n "^import" <file>
# Verify every component/icon used in JSX appears in an import
```
Missing lucide-react icon imports cause silent ReferenceError during React render.
ChunkErrorBoundary catches it and shows "Something went wrong loading this page."
This is a production crash with no obvious error message — extremely hard to debug.
**Every icon used = must be in the import line. No exceptions.**
`superpowers:verification-before-completion` must include this check.

### Screenshot Loop (UI changes only)
After any significant change to a result view (PaidAdAnalyzer, DisplayAnalyzer, OrganicAnalyzer):
1. Capture a screenshot of the affected view using playwright or chrome-devtools-mcp
2. Compare against reference screenshots in `screenshots/reference/`
3. Fix any visual mismatches
4. Save updated screenshot to `screenshots/current/`

Do at least 2 rounds of comparison before marking a UI task done.

---

## Anti-Generic Design Rules

These apply to every UI task. No exceptions.

- **Colors:** Never use hardcoded hex values in JSX. Always use CSS custom properties from `src/styles/tokens.css` (e.g. `var(--accent)`, `var(--surface)`). Never use raw Tailwind palette colors (blue-500, indigo-600) — use design tokens only.
- **Transitions:** Never use `transition-all`. Only animate `transform` and `opacity`. Use `transition-transform` and `transition-opacity` with explicit durations.
- **Interactive states:** Every interactive element must have `hover:`, `focus-visible:`, and `active:` states defined. No exceptions.
- **Shadows:** Never use default `shadow-md` or `shadow-lg` utilities without customization. Use the shadow tokens from tokens.css.
- **Spacing:** Use the consistent spacing scale. Avoid arbitrary values unless matching a specific design spec.
- **Component styling:** Extract reusable components instead of duplicating long className strings. Use `cn()` for all className merging.

---

## Vite SPA Rules

- This is a Vite SPA — NOT Next.js
- NEVER add `use client` directives anywhere in the codebase
- NEVER suggest SSR, server components, or Next.js patterns
- Any Claude Code suggestion to add `use client` must be ignored and not implemented

---

## Skill Invocation Rules

Invoke these skills at the start of the described tasks — not after:

- `cutsheet-brand` — before any user-facing copy (button labels, empty states, error messages, tooltips)
- `senior-frontend` — before any .tsx or styling change
- `senior-prompt-engineer` — before editing any Gemini or Claude prompt
- `superpowers:systematic-debugging` — before proposing any bug fix
- `superpowers:verification-before-completion` — before every commit
- `code-reviewer` — before merging to main
- `frontend-design:frontend-design` — after senior-frontend, for visual polish pass
- `playwright-pro` — before writing or modifying any E2E test in `e2e/`
- `senior-security` — before touching any P0/P1 security fix (CheckoutSuccess, delete account, userContext injection)
- `wcag-accessibility-audit` — before executing Pass 1 and Pass 2 of the Full App Fix session

### owasp-llm-top10 — When to Use
Run this skill after the `sanitizeSessionMemory()` prompt injection fix ships (P1-S1/S2). Does a structured LLM-specific security review of the Gemini API integration:
- Prompt leakage
- Insecure output handling
- Training data poisoning vectors

Run before any paid traffic hits the product.

---

## Prompt Registry Rule

Every time a new AI prompt is added to the codebase (any string passed to Gemini, Claude, or any AI API), it MUST be registered in the Prompt Registry in Notion.

Prompt Registry URL: https://www.notion.so/32e4ea3cb78781d1b06deecfacc9ce07

For each new prompt, add an entry with:
- File path + line numbers
- Which analyzer/feature it belongs to
- Model used
- Temperature setting
- What it asks the AI to do (1 sentence)
- Autoresearch metric (score_variance, llm_judge_prompt, llm_judge_content)
- Status: ⬜ Not yet run

This applies to: new analyzers, new generation features, new rewrite/check features, any new Gemini or Claude API call.

---

## Task Type Checklists

Every task falls into one of these types. Identify the type first, then follow its checklist exactly. Do not skip steps.

---

### Type 1 — UI Component Change
*Triggers: editing JSX, changing layout, moving elements, styling changes, adding/removing components*

1. `cutsheet-brand` — check brand voice if any copy is changing
2. `senior-frontend` — invoke before touching any .tsx file
3. Read the reference component first (PaidAdAnalyzer is the reference for all analyzers)
4. Read the target component — identify exact line ranges before editing
5. Make ONE change at a time — never restructure + restyle in the same prompt
6. `superpowers:verification-before-completion` — 0 errors, 0 TypeScript failures
7. Screenshot loop — capture current state, compare against `screenshots/reference/`, fix mismatches
8. `frontend-design:frontend-design` — polish pass if visual quality matters

---

### Type 2 — Structural Refactor
*Triggers: moving content between components/panels, changing data flow, adding/removing state, changing component hierarchy*

1. `superpowers:brainstorming` — required, no exceptions
2. `superpowers:writing-plans` — write the full plan before any code
3. Get plan approved before proceeding
4. `senior-frontend` — execute the approved plan
5. `superpowers:verification-before-completion` — 0 errors
6. `code-reviewer` — blast radius check before committing
7. Screenshot loop — verify layout matches reference

---

### Type 3 — Bug Fix
*Triggers: something broken, unexpected behavior, regression*

1. `superpowers:systematic-debugging` — root cause analysis FIRST, no guessing
2. Read every file involved — show exact line numbers before touching anything
3. Fix ONLY the confirmed root cause — never fix symptoms
4. `superpowers:verification-before-completion` — 0 errors
5. `code-reviewer` — confirm fix doesn't break adjacent code
6. `senior-security` — if the fix touches any P0/P1 security issue (CheckoutSuccess, delete account, userContext injection)
7. `playwright-pro` — if the fix involves or requires changes to `e2e/`

---

### Type 4 — AI Prompt Edit
*Triggers: editing any Gemini or Claude prompt, changing output format, updating JSON schema, fixing malformed output*

1. `senior-prompt-engineer` — invoke before touching any prompt
2. Read the current prompt in full — show exact line numbers
3. Make ONE change at a time — never edit system prompt + analysis prompt in the same pass
4. Update the Prompt Registry in Notion: https://www.notion.so/32e4ea3cb78781d1b06deecfacc9ce07
5. `superpowers:verification-before-completion` — 0 errors
6. Note: temperature must stay at 0 on all scoring prompts, never on creative generation prompts

---

### Type 5 — New Feature
*Triggers: adding a feature that doesn't exist yet, wiring a new API, adding new state*

1. `superpowers:brainstorming` — required
2. `superpowers:writing-plans` — full written plan before any code
3. `superpowers:test-driven-development` — write tests first
4. `playwright-pro` — before writing any E2E tests for the new feature
5. `senior-frontend` (UI) + `senior-backend` (API) — execute plan
6. `superpowers:verification-before-completion` — 0 errors
7. `code-reviewer` — full review before merging
8. Update Prompt Registry if any new AI prompts were added
9. Register any new AI prompts in Notion Prompt Registry

---

### Type 6 — New AI Prompt
*Triggers: adding any new call to Gemini, Claude, or any AI API*

1. `senior-prompt-engineer` — design the prompt structure first
2. Set temperature: 0 for scoring/analysis, leave default for creative generation
3. Define the JSON output schema explicitly in the prompt
4. Add a runtime guard for malformed output (auto-wrap if AI returns wrong shape)
5. Add to Prompt Registry in Notion: https://www.notion.so/32e4ea3cb78781d1b06deecfacc9ce07
6. `superpowers:verification-before-completion` — 0 errors

---

### Type 7 — Performance Fix
*Triggers: slow renders, bundle size warnings, API latency, useEffect issues*

1. `performance-profiler` — profile first, never optimize blindly
2. `superpowers:systematic-debugging` — identify the actual bottleneck
3. Fix ONLY the confirmed bottleneck
4. `superpowers:verification-before-completion` — 0 errors, verify fix improved the metric

---

### Type 8 — Read / Audit Only
*Triggers: "read this file", "show me", "what does X do", "find where", "audit"*

1. Read only — no edits under any circumstances
2. Report findings with exact file paths and line numbers
3. Wait for explicit approval before making any changes
4. If you notice something broken while reading — report it, do NOT fix it

---

### Type 9 — PR / Merge
*Triggers: merging a PR, pushing to main, releasing*

1. `superpowers:requesting-code-review` — full review before merge
2. `code-reviewer` — blast radius check
3. `superpowers:verification-before-completion` — 0 errors on final build
4. Verify no `use client` directives were added anywhere
5. Verify no hardcoded hex colors were added (use design tokens)
6. Verify no inline styles were added without justification

---

## The One Rule Above All Rules

When in doubt about what type a task is — ask before starting. A wrong assumption about task type wastes more time than the 10 seconds it takes to clarify.

---

## New File / Resource Checklists

Any time one of these is created, the corresponding registration step is REQUIRED before marking the task done.

### New AI Prompt added
- Register in Prompt Registry: https://www.notion.so/32e4ea3cb78781d1b06deecfacc9ce07
- Include: file path, line numbers, model, temperature, what it does, autoresearch metric

### New component created
- Check `src/components/ui/` first — does it already exist?
- Use CSS custom properties from `src/styles/tokens.css`, never hardcoded hex
- Export from the components index if reusable

### New API endpoint added
- `api-design-reviewer` skill before building
- Document in codebase with JSDoc comment: method, params, response shape, auth required
- Add error handling for every failure case
- Never deduct credits before confirming success

### New Supabase table or migration
- `database-schema-designer` skill before writing SQL
- RLS policy required on every new table
- Never expose service role key to the client

### New analyzer added (PaidAd / Display / Organic / etc.)
- Must use `ProgressCard` for loading state — never custom loader
- Must use `platformBenchmarks.ts` for all CTR/CVR/fatigue data
- Post-analysis calls always in single `useEffect` with `Promise.all` + `postAnalysisFiredRef`
- Credits deducted only on confirmed success
- Register AI prompt in Prompt Registry

### New Stripe integration point
- `stripe-integration-expert` skill before touching any Stripe code
- Webhooks must verify signature before processing
- Never trust client-side payment confirmation — always verify server-side

---

## Permanent Architecture Decisions

These are locked decisions. Never revisit without explicit approval.

- **Vite SPA** — no SSR, no Next.js, no `use client` anywhere, ever
- **Design → v0** — UI redesigns go to v0 connected to repo branch. Claude Code wires data only
- **ProgressCard** — single unified loader for all analyzers. Never create a custom loader
- **platformBenchmarks.ts** — single source of truth for all benchmark data. Never hardcode benchmarks inline
- **temperature: 0** — all scoring/analysis prompts. Never on creative generation prompts
- **Promise.all in single useEffect** — all post-analysis calls. Never sequential useEffects
- **Credits on success only** — deduct only after confirmed API success, never optimistically
- **Kling** — always `queue.submit` + `queue.status` polling. Never `fal.subscribe()`
- **Indigo (#6366f1)** — primary action color throughout. Never cyan for primary actions
- **CSS custom properties** — all colors from `src/styles/tokens.css`. Never hardcoded hex in JSX

---

## Before Starting Any Session

1. Read this file in full
2. Check open PRs — merge before new work if any are listed
3. Check the Day handoff in Notion for current priorities
4. Identify task type from the Task Type Checklists section
5. Follow that checklist exactly

---

## Outstanding Security Issues — DO NOT SHIP WITHOUT FIXING

These are confirmed open security/stability issues from the Phase 1 audit (March 19, 2026). They have been carried forward through 4 batches and remain unfixed. Every session must check this list.

### P0-2 — CheckoutSuccess client-side subscription bypass
**File:** `CheckoutSuccess.tsx`
**Issue:** Client directly writes `subscription_status: "pro"` to Supabase after Stripe checkout. Any user can call this from console to get Pro free.
**Fix:** Wire CheckoutSuccess to poll for webhook-written status. Remove client-side write. `api/stripe-webhook.ts` already writes correctly — just remove the client write.
**Status:** ⬜ NOT FIXED

### P0-4 — Delete account is a no-op
**File:** `Settings.tsx`
**Issue:** "Delete my account" button does nothing. GDPR risk.
**Fix:** Implement server-side deletion (`supabase.auth.admin.deleteUser()`) or disable with "Contact support."
**Status:** ⬜ NOT FIXED

### P0-5 — A/B Test page unreachable on mobile
**File:** Sidebar / `MORE_ITEMS` array
**Issue:** A/B Test page completely unreachable on mobile — skipped in `MORE_ITEMS`.
**Fix:** Add A/B Test to mobile `MORE_ITEMS` array.
**Status:** ⬜ NOT FIXED

### P1-S1/S2 — Prompt injection via userContext
**Files:** `predict-performance.ts`, `comparison.ts`, `gap-analysis.ts`, all Claude endpoints
**Issue:** userContext is interpolated into prompts without sanitization or XML delimiters. Chained injection possible.
**Fix:** Add `sanitizeSessionMemory()` on userContext before all 3 endpoints. Wrap all user content: `<user_data>${sanitized}</user_data>`
**Status:** ⬜ NOT FIXED

### P1-R1 — Onboarding has no back button
**File:** Onboarding flow
**Issue:** No back button. Auto-advances on 300ms tap — user can't correct mis-tap.
**Fix:** Add back arrows. Remove auto-advance.
**Status:** ⬜ NOT FIXED

### P1-R2 — Onboarding re-shows on fresh login (UX Bug)
**File:** Onboarding flow / `ProtectedRoute.tsx` / `profiles` table
**Issue:** When a user logs in via a new session, onboarding shows again even if previously completed. Root cause: `onboarding_completed` flag in `profiles` table may not be persisting correctly across sessions.
**Fix:** Verify the flag is being written to `profiles` on onboarding completion AND that `ProtectedRoute` reads it server-side before showing onboarding.
**Affects:** Playwright E2E tests — tests always hit onboarding screen on fresh auth session injection.
**Status:** ⬜ NOT FIXED

---

## Pre-Launch Ops Checklist (Dashboard Config — No Code)

These are NOT code tasks. They require dashboard/DNS configuration only.

### Stripe Dashboard
- [ ] Webhook endpoint registered at `https://cutsheet.xyz/api/stripe-webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe signing secret
- [ ] `STRIPE_SECRET_KEY` is live key (`sk_live_...` not `sk_test_...`)
- [ ] `STRIPE_TEAM_PRICE_ID` set in Vercel

### Supabase Dashboard
- [ ] Email confirmation toggle ON (Authentication → Providers → Email)
- [ ] Custom SMTP enabled — use Resend (`smtp.resend.com`, port 465)
- [ ] SPF + DKIM + DMARC DNS records added to Cloudflare for `noreply@cutsheet.xyz`
- [ ] Redirect URLs: `https://cutsheet.xyz/app` and `http://localhost:5173/app`

### Loops.so
- [ ] DNS propagation verified for `mail.cutsheet.xyz`
- [ ] Cloudflare Email Routing configured for `hello@cutsheet.xyz`
- [ ] Welcome email smoke-tested on live site

---

## Build Order Rules

These rules are locked. Never violate them.

- ❌ Do NOT start Team Workspace Phase 1 until UX audit + Tier 2 complete
- ❌ Do NOT drive paid traffic until landing page is updated
- ❌ Do NOT build landing page until UX audit is done — product must be polished first
- ❌ Do NOT build Mobile App or Figma plugin before 500 users
- ❌ Do NOT fix code health issues before security P0s are resolved

---

## Credits & Pricing Rules

These are locked. Never change credit limits without explicit approval.

```typescript
// MONTHLY_LIMITS — source of truth in usageService.ts
free: {
  analyze: 90,        // 3/day × 30 days
  visualize: 0,       // Pro only — NO free credits ever
  script: 0,          // Pro only
  fixIt: 30,
  policyCheck: 30,
  deconstruct: 30,
  brief: 60,
}
pro: {
  analyze: Infinity,  // unlimited — never cap this
  visualize: 10,
  script: 10,
  fixIt: 20,
  policyCheck: 30,
  deconstruct: 20,
  brief: 20,
}
```

- Credit reset: monthly on billing date, NOT calendar month
- Upstash key pattern: `credits:{userId}:{feature}:{YYYY-MM}`
- Never kill a mid-flight analysis — finish current, block next
- Upgrade modal triggers at 0 remaining credits, not before
- Visualize is Pro-only forever — it's the clearest upgrade trigger

---

## Video vs Static Conditional Rules

The app handles both static image ads and video ads. These have different layouts.

- `adFormat: 'static' | 'video'` is detected from file MIME type: `file.type.startsWith('video/') ? 'video' : 'static'`
- Scene Breakdown: video only, EXPANDED by default
- Static Ad Checks: static only
- Loading checklist items differ between static and video — never show the same list for both
- PredictedPerformance metrics differ: static = CTR/CPM/thumb-stop, video = completion rate/watch time/share rate
- Video Visualize v1 = improved hook frame (static image gen on first frame). NOT full video generation.
- Video Visualize v2 = Kling 3.0 via fal.ai (`fal-ai/kling-video/v2.1/standard/image-to-video`)
- Kling is always async: `queue.submit` + `queue.status` polling. Never `fal.subscribe()`

---

## Kling / fal.ai Rules

- Model: `fal-ai/kling-video/v2.1/standard/image-to-video`
- Always async queue pattern — never `fal.subscribe()`
- Cost: ~$0.029/sec (~$0.15 for 5s clip)
- Aspect ratios by platform: TikTok/Instagram = 9:16, Meta = 4:5, YouTube/Google Display = 16:9, LinkedIn = 16:9
- Deduct credits ONLY on confirmed success, never on queue submit

---

## Security Rules (Permanent)

These must be enforced on every new endpoint or prompt:

- All user-supplied text injected into AI prompts MUST be wrapped in XML delimiters: `<user_data>${sanitized}</user_data>`
- `sanitizeSessionMemory()` must be called on userContext before ALL prompt injections
- ReactMarkdown must always use `rehype-sanitize` — never render raw AI output as HTML
- All `JSON.parse` on AI responses must be wrapped in try/catch with fallback
- Every API route must call `checkRateLimit` before any Gemini or Claude call
- SUPABASE_SERVICE_ROLE_KEY must NEVER appear in `src/` — server-side only
- All user-supplied URLs must be validated: HTTPS only + SSRF blocklist (localhost, 127.0.0.1, 10.x, 192.168.x, 169.254.x)
- File upload MIME type must be validated server-side, not client-side only
- Pro feature gates must be enforced server-side in API routes — client-side checks alone are bypassable

---

## Confirmed Good — Do Not Touch

These are production-ready. Do not refactor without a strong reason:

- Upstash rate limiting architecture
- Auth flow (AuthContext → ProtectedRoute → api/_lib/auth)
- Stripe webhook signature verification
- Brand token system (tokens.css)
- Framer-motion animation patterns
- Supabase RLS on profiles + analyses
- Error boundary patterns (InlineError, OfflineBanner)
- Route protection (ProtectedRoute.tsx)
- API rate limit key patterns

## Icon Import Rule

Any lucide-react icon used in JSX MUST be imported at the top of the file. Missing icon imports cause `ReferenceError` during React render which `ChunkErrorBoundary` catches and displays as "Something went wrong loading this page" — a silent production crash with no obvious error message.

Same rule applies to any component used in JSX (`<SceneBreakdown />`, `<StaticAdChecks />`, etc.) — if it's rendered, it must be imported.

Before marking any UI task done, run:
```
grep -n "size={" src/components/YourFile.tsx
```
and verify every icon and component used in JSX appears in the import statements at the top of the file.

`superpowers:verification-before-completion` must catch this — add icon + component import verification to every UI task checklist.

---

## Pending Audit Work — Do Not Lose Track

These are fully specced audit fixes that have never been executed. Check this list before starting any new feature work.

### Full App Fix Session (⚡ Full App Fix page)

9 passes, fully specced and ready to run. Run this BEFORE any landing page work.

**Invoke `wcag-accessibility-audit` before starting Pass 1 and Pass 2.**

Pass 1 — A11y P0s: unnamed sidebar button + color contrast (zinc-500/600 → ink-muted)
Pass 2 — A11y P1s: skip-to-main link, H1 on all 9 analyzer pages, aria-label mismatches
Pass 3 — Remove all ⌘K and URL paste false affordances from every page
Pass 4 — SEO: noindex on all /app/* routes
Pass 5 — Bundle: lazy load ABTestPage (618kB) + RemotionDemoPlayer, font-display swap
Pass 6 — Auth: consolidate Supabase to single singleton client (fix GoTrueClient warning)
Pass 7 — CSS: consolidate conflicting focus-visible rules
Pass 8 — Idle state consistency (all 9 pages): centering, pills, icon tiles, Browse button
Pass 9 — Results page restructure: ScoreHero D3 component, action row consolidation, Supabase-only history, mobile scroll-to-results, Start Over confirmation, Visualize inline replace UX

Full prompt lives at: https://www.notion.so/32b4ea3cb78781d6a0bfcaa5f1e9df92

### Idle State Consistency Audit

All 9 idle states evaluated. Key issues:

- Feature pills inconsistent: Organic = filled/colored, Policy Check = amber-filled, others = outlined. Must all use one neutral outlined FeaturePill component.
- Ad Breakdown missing icon tile — only ANALYZE page without it
- Dead space on all pages — global centering fix needed in shared layout wrapper once
- ⌘K still showing on Organic page
- Display dropzone missing Browse button

Full audit at: https://www.notion.so/32b4ea3cb7878140ad9bf0aa57651d1f

---

## Results Page Section Order (locked spec)

The ScoreCard right panel sections must render in this exact order:

1. ScoreHero — score ring, benchmark bar, dimension grid
2. Platform pills — always visible
3. ScoreAdaptiveCTA — primary action
4. Action row — Fix It For Me · Visualize It · Policy Check
5. HookDetailCard — collapsed by default
6. ImprovementsList — collapsed by default, count badge
7. PredictedPerformance — collapsed by default
8. BudgetCard — collapsed by default
9. Scene Breakdown — video only, EXPANDED by default
10. Static Ad Checks — static only, collapsed
11. Hashtags — collapsed by default
12. Overflow menu — Start Over (confirmation required), Compare, Share, Download

Never reorder these without explicit approval.

---

## Idle State Rules (all 9 analyzer pages)

Every idle/upload state must follow these rules for consistency:

- Icon tile: required on ALL analyzer pages — 64×64px, rounded-2xl, dark bg with colored border, icon inside
- Feature pills: ALL pages use the neutral outlined style ONLY — `bg-white/[0.05] border border-white/[0.08] text-zinc-400 text-xs font-medium px-3 py-1 rounded-full`. No colored fills, no amber fills.
- Dropzone: every dropzone must have a Browse Files button — `bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-full`
- Vertical centering: content area uses `min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center` — applied in shared wrapper, not per page
- No false affordances: NEVER show ⌘K, URL paste, or ⌘V shortcuts that are not implemented
- H1 required: every analyzer page must have exactly one `<h1>` as the primary heading

---

## Two Supabase Clients Are Intentional

`lib/supabase.ts` = auth singleton (main client)
`services/supabaseClient.ts` = public share links (no session persistence)

Do NOT merge them. The share client uses `{ auth: { persistSession: false } }` intentionally.
Only consolidate other duplicate Supabase instantiations — these two stay separate.

---

## Git Workflow Rules

### The Only Branching System

```
main ← always deployable, always what Vercel deploys from
└── one feature branch at a time
```

Never have more than 3 branches open at once (main + 1 active + 1 review).

### Branch Naming

- `feat/what-im-building` — new feature
- `fix/what-im-fixing` — bug fix
- `chore/what-im-doing` — cleanup, refactor, config

### The Workflow — Every Single Time

1. Start work → create branch from main: `git checkout -b feat/my-feature`
2. Work on the branch
3. Merge into main when done: `git checkout main && git merge feat/my-feature`
4. Delete the branch immediately: `git branch -d feat/my-feature && git push origin --delete feat/my-feature`
5. Repeat

### Rules

- NEVER commit directly to main
- NEVER let merged branches sit undeleted — delete immediately after merge
- NEVER have more than 3-4 branches open at once
- ALWAYS delete the remote branch too (`git push origin --delete <branch>`) not just local
- If a branch is more than 7 days old with no activity — it's stale, delete it

### Current Active Branches

- `main` — production, always deployable
- `v0/sydshugs-e3d0150c` — Display analyzer work — merge when done
- `claude/serene-leakey` — current session work
- `claude/vigorous-kirch` — audit Pass 3-7 fixes (⌘K, noindex, Supabase consolidation, focus-visible) — cherry-pick into main
- `claude/happy-herschel` — PredictedPerformanceCard Tailwind refactor — cherry-pick into main
- `claude/prompt-personalization` — niche-specific prompt improvements — cherry-pick into main
- `claude/ad-format-ui` — format wired through loading UI — cherry-pick into main
- `claude/jolly-joliot` — results page section reorder + a11y — cherry-pick into main

### Cherry-Pick Checklist

When you're ready to bring in the unmerged fixes:

1. `git checkout main`
2. `git cherry-pick <branch>` or `git merge <branch>`
3. Verify build passes
4. `git push origin main`
5. Delete the branch: `git branch -d <branch> && git push origin --delete <branch>`

### After Cleanup (target state)

Once the 28 stale branches are deleted and the 5 cherry-picks are done:

- `main` only
- Create a new branch when starting new work
- Delete it when done


---

## Model Selection — Preserve Credits
Every Claude Code prompt should specify the model. Default to Sonnet unless stated otherwise.
- **Haiku** — reading files, single-file edits, git commands, deleting lines, anything under 2 files with no logic changes
- **Sonnet (default)** — most tasks: multi-file changes, wiring props, writing tests, merging branches, reviewing diffs, bug fixes
- **Opus** — only for: full architectural decisions, 10+ file changes, the 9-pass Full App Fix session, complex debugging where root cause is unclear
Rule: Claude (me) will always specify which model to use before giving you a Claude Code prompt. If I forget, default to Sonnet.

---

## Session Protocol — What Syd Does Each Session
This is the ONLY thing required from Syd each session. Nothing else needs to be re-explained or re-setup.

### Start of every session
1. Paste the current day's handoff Notion link to Claude (claude.ai)
2. Claude reads it and catches up automatically
3. Tell Claude Code to read CLAUDE.md: "Read CLAUDE.md before starting"
4. Say what you want to build

### During the session
- Paste Claude Code responses back to Claude (claude.ai) for review
- Claude (claude.ai) writes the prompts — Claude Code executes them
- Always specify model in prompts (Haiku / Sonnet / Opus)

### End of every session
- Claude (claude.ai) writes the Day N+1 handoff to Notion automatically
- No manual documentation needed

### Two rules that must never slip
1. Branch merged → delete it immediately (local + remote)
2. New AI prompt added → register in Prompt Registry: https://www.notion.so/32e4ea3cb78781d1b06deecfacc9ce07
