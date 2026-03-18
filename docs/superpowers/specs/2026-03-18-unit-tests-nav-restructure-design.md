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

Mock `@google/generative-ai` at module level with `vi.mock`. Spy on `generateContent` to capture the full prompt passed to the Gemini API. Three cases:

1. **With `contextPrefix`** — call `analyzeVideo(file, apiKey, cb, 'CONTEXT')`. Assert the captured prompt starts with `'CONTEXT\n\n'`.
2. **Without `contextPrefix`** — call `analyzeVideo(file, apiKey, cb)`. Assert the captured prompt does NOT contain `'undefined'` or `'null'`.
3. **Error path** — make `generateContent` throw. Assert the error propagates from `analyzeVideo`, and `onStatusChange` was called with `'error'`.

Implementation note: `analyzeVideo` calls `fileToBase64` (reads the File object) before the Gemini call. The mock file must be a real `File` instance or `fileToBase64` must also be mocked.

---

## Test 2 — `claudeService.ts`: `generateSecondEyeReview()` error paths

**File:** `src/services/__tests__/claudeService.test.ts`

Mock `@anthropic-ai/sdk` at module level. The actual function extracts JSON with a regex from the response text before parsing. Three cases:

1. **Happy path** — mock `messages.create` returning a text content block with valid JSON matching `SecondEyeResult`: `{ scrollMoment, flags: [], whatItCommunicates, whatItFails }`. Assert the resolved value has all four fields with correct types.
2. **Malformed JSON** — mock `messages.create` returning plain text with no JSON block. Assert `generateSecondEyeReview` throws (or rejects).
3. **Network error** — mock `messages.create` throwing `new Error('fetch failed')`. Assert the error propagates from `generateSecondEyeReview`.

Implementation note: `generateSecondEyeReview` calls `getClient()` which reads `VITE_ANTHROPIC_API_KEY` from `import.meta.env`. Set `import.meta.env.VITE_ANTHROPIC_API_KEY = 'test-key'` in the test setup or mock `getClient` directly.

---

## Test 3 — `AppLayout.tsx` + `ProtectedRoute.tsx`: context shape and auth guards

**File:** `src/components/__tests__/AppLayout.test.tsx`

Mock `../context/AuthContext` (return configurable `{ user, session, loading, signOut }`), mock `../lib/supabase` (no-op stubs), mock `../hooks/useUsage` (return stub values), mock `../hooks/useHistory`, mock `../hooks/useSwipeFile`, mock `../hooks/useKeyboardShortcuts`. Four cases:

1. **AppLayout renders without crashing** — wrap in `MemoryRouter` with `AuthProvider` mock returning a valid user. Assert the layout mounts without error.
2. **AppLayout provides correct context to children** — render a child component via a fake route that calls `useOutletContext<AppSharedContext>()`. Assert the child receives `canAnalyze`, `isPro`, `increment`, `FREE_LIMIT`, `usageCount`, `registerCallbacks`, and history/swipe fields.
3. **ProtectedRoute redirects unauthenticated users** — mock `useAuth()` returning `{ user: null, loading: false }`. Render `<ProtectedRoute><div>secret</div></ProtectedRoute>` in `MemoryRouter initialEntries={['/app/paid']}`. Assert `"secret"` is not in the document and the router navigated to `/login`.
4. **ProtectedRoute allows authenticated users** — mock `useAuth()` returning a valid user with `onboarding_completed: true` in `user_metadata`. Assert the protected content renders.

---

## Constraints

- Mock all external services: Supabase, Anthropic SDK, Gemini SDK. No real network calls.
- Each test file is self-contained with its own mocks.
- Do not modify any existing source files.
- Add test files only under `src/**/__tests__/`.

---

## Success Criteria

`npm test` — all tests pass, 0 failures.
