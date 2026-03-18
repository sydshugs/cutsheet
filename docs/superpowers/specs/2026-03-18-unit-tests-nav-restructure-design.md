# Unit Tests — Nav Restructure: Design Spec
**Date:** 2026-03-18
**Scope:** Targeted unit tests for the three highest-risk areas from PR #21 (nav restructure, 4,307 lines, 0 tests).

---

## Goals

Add test coverage for the three highest-risk areas only. Do not test everything. Ship a working test suite that catches regressions in critical paths.

---

## Setup

Install test dependencies (not yet present):
```
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/globals jsdom
```

Add to `vite.config.ts`:
```ts
test: { environment: 'jsdom', globals: true }
```

Add to `package.json` scripts:
```json
"test": "vitest"
```

---

## Test 1 — `analyzerService.ts`: contextPrefix behavior

**File:** `src/services/__tests__/analyzerService.test.ts`

Mock `@google/generative-ai` at module level with `vi.mock`. Also mock `@anthropic-ai/sdk` (required because `analyzerService.ts` imports `claudeService.ts` at module load time, which imports the Anthropic SDK — the `claudeImprovements` call inside `analyzeVideo` is wrapped in a silent catch so it won't fail tests, but the module must resolve). Spy on `generateContent` to capture the full prompt. Three cases:

1. **With `contextPrefix`** — call `analyzeVideo(file, apiKey, cb, 'CONTEXT')`. Assert the captured prompt starts with `'CONTEXT\n\n'`.
2. **Without `contextPrefix`** — call `analyzeVideo(file, apiKey, cb)`. Assert the captured prompt does NOT contain `'undefined'` or `'null'`.
3. **Error path** — make `generateContent` throw `new Error('fetch failed')`. Assert `analyzeVideo` rejects with message `'Analysis failed: fetch failed'` (the real code wraps thrown errors with this prefix). Assert `onStatusChange` was called with `'error'`.

Implementation note: `analyzeVideo` calls `fileToBase64` before the Gemini call. Use a real `File` instance (`new File([''], 'test.mp4', { type: 'video/mp4' })`) or mock `fileToBase64` to return a stub base64 string.

---

## Test 2 — `claudeService.ts`: `generateSecondEyeReview()` error paths

**File:** `src/services/__tests__/claudeService.test.ts`

Mock `@anthropic-ai/sdk` at module level. Set `import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-key'` in the test setup (or mock `getClient` directly) since `claudeService.ts` reads this env var inside `getClient()`.

The function extracts JSON using a `/\{[\s\S]*\}/` regex from the raw response text — mocks must return raw JSON strings, not markdown code blocks. `flags: []` (empty array) is valid per the normalization logic. Three cases:

1. **Happy path** — mock `messages.create` returning a content block of type `'text'` with text value:
   ```json
   { "scrollMoment": "0:02", "flags": [], "whatItCommunicates": "test", "whatItFails": "test" }
   ```
   Assert the resolved `SecondEyeResult` has all four fields: `scrollMoment` (string), `flags` (array), `whatItCommunicates` (string), `whatItFails` (string).

2. **Malformed JSON** — mock `messages.create` returning plain text with no JSON (e.g. `"This is not JSON"`). Assert `generateSecondEyeReview` throws or rejects.

3. **Network error** — mock `messages.create` throwing `new Error('fetch failed')`. Assert the error propagates from `generateSecondEyeReview`.

---

## Test 3 — `AppLayout.tsx` + `ProtectedRoute.tsx`: context shape and auth guards

**File:** `src/components/__tests__/AppLayout.test.tsx`

Mocks required:
- `../context/AuthContext` — return configurable `{ user, session, loading, signOut }`
- `../lib/supabase` — stub with `{ auth: { getUser: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) }, from: vi.fn() }`
- `../hooks/useUsage` — return `{ usageCount: 0, isPro: false, canAnalyze: true, increment: vi.fn(() => 1), FREE_LIMIT: 5 }`
- `../hooks/useHistory` — return `{ entries: [], addEntry: vi.fn(), deleteEntry: vi.fn(), clearAll: vi.fn() }`
- `../hooks/useSwipeFile` — return `{ items: [], addItem: vi.fn() }`
- `../hooks/useKeyboardShortcuts` — no-op `vi.fn()`

Four cases:

1. **AppLayout renders without crashing** — wrap in `MemoryRouter` with mocked auth returning a valid user. Assert the layout mounts without error.

2. **AppLayout provides correct context to children** — render a child route component that calls `useOutletContext<AppSharedContext>()` and renders field names to the DOM. Assert the child receives: `canAnalyze`, `isPro`, `increment`, `FREE_LIMIT`, `usageCount`, `registerCallbacks`, `onUpgradeRequired`, and the history/swipe fields (`historyEntries`, `addHistoryEntry`, `addSwipeItem`).

3. **ProtectedRoute redirects unauthenticated users** — mock `useAuth()` returning `{ user: null, loading: false }`. Mock the Supabase `from().select().eq().single()` chain to be irrelevant (user is null, redirect happens before the profile query). Render `<ProtectedRoute><div>secret</div></ProtectedRoute>` in `MemoryRouter initialEntries={['/app/paid']}` with a `/login` route. Use `waitFor` to await the async redirect. Assert `"secret"` is not in the document and `/login` route content is rendered.

4. **ProtectedRoute allows authenticated users** — mock `useAuth()` returning a valid `User` object. Mock the Supabase `from('profiles').select('onboarding_completed').eq().single()` chain to resolve `{ data: { onboarding_completed: true }, error: null }`. Use `waitFor` to await the async `checking` state to resolve. Assert the protected content renders.

Important: `ProtectedRoute` queries the Supabase `profiles` table (not `user_metadata`) to determine `onboarding_completed`. The Supabase mock must correctly stub the `.from().select().eq().single()` chain — setting `user.user_metadata.onboarding_completed` will have no effect.

---

## Constraints

- Mock all external services: Supabase, Anthropic SDK, Gemini SDK. No real network calls.
- Each test file is self-contained with its own mocks.
- Do not modify any existing source files.
- Add test files only under `src/**/__tests__/`.
- Use `waitFor` for any assertions on async component state (e.g., `ProtectedRoute.checking`).

---

## Success Criteria

`npm test` — all tests pass, 0 failures.
