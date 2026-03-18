# Unit Tests — Nav Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 targeted unit tests across 3 test files covering the highest-risk areas from the PR #21 nav restructure (analyzerService contextPrefix, claudeService Second Eye errors, AppLayout context + ProtectedRoute auth guards).

**Architecture:** Vitest + jsdom, vi.mock at module level in each self-contained file. No real network calls. Capture Gemini prompt via mock implementation before any parse step. Mock all Supabase chains synchronously to avoid async timing issues.

**Tech Stack:** Vitest 2.x, @testing-library/react, @testing-library/jest-dom, jsdom, React Router 6 MemoryRouter

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `vite.config.ts` | Add `test: { environment: 'jsdom', globals: true }` |
| Modify | `package.json` | Add `"test": "vitest"` script |
| Create | `src/services/__tests__/analyzerService.test.ts` | 3 tests: contextPrefix with/without, error path |
| Create | `src/services/__tests__/claudeService.test.ts` | 3 tests: happy path, malformed JSON, network error |
| Create | `src/components/__tests__/AppLayout.test.tsx` | 4 tests: renders, context shape, redirect, auth pass |

---

## Chunk 1: Setup + analyzerService

### Task 1: Install and configure Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install test dependencies**

```bash
cd /Users/atlas/cutsheet && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: packages added to `devDependencies`, no peer-dep errors.

- [ ] **Step 2: Add `"test"` script to package.json**

In `package.json`, inside `"scripts"`, add:
```json
"test": "vitest"
```

- [ ] **Step 3: Add vitest block to vite.config.ts**

Add `/// <reference types="vitest" />` as the **first line** of the file (before all imports).

Inside the `return { ... }` object (alongside `plugins`, `define`, `resolve`, etc.), add:

```ts
test: {
  environment: 'jsdom',
  globals: true,
},
```

- [ ] **Step 4: Verify vitest resolves**

```bash
cd /Users/atlas/cutsheet && npm test -- --run 2>&1 | tail -5
```

Expected: `No test files found` or `0 tests` — confirms vitest starts without crashing.

- [ ] **Step 5: Commit setup**

```bash
cd /Users/atlas/cutsheet && git add package.json package-lock.json vite.config.ts && git commit -m "test: install vitest, configure jsdom environment"
```

---

### Task 2: analyzerService tests

**Files:**
- Create: `src/services/__tests__/analyzerService.test.ts`

Key facts about `analyzeVideo` (`src/services/analyzerService.ts:365`):
- Signature: `analyzeVideo(file, apiKey, onStatusChange?, contextPrefix?)`
- Prompt: `contextPrefix ? \`${contextPrefix}\n\n${basePrompt}\` : basePrompt` (line 397)
- `generateContent` called with `[{ inlineData: ... }, { text: prompt }]` (line 399)
- Errors wrapped: `throw new Error(\`Analysis failed: ${err.message}\`)` (line 459)
- `analyzerService` imports `claudeService` which imports `@anthropic-ai/sdk` — mock it too (the `claudeImprovements` call is in a silent catch so won't fail tests, but the module must resolve)

**Strategy for contextPrefix tests:** Capture the prompt inside the mock implementation itself, then check it regardless of whether `parseResult` succeeds. This makes tests robust to parser changes.

- [ ] **Step 1: Create the test file**

Create `src/services/__tests__/analyzerService.test.ts`:

```typescript
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── MOCKS (hoisted before imports) ────────────────────────────────────────

let capturedPrompt = ''
const mockGenerateContent = vi.fn()

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGenerateContent,
    })),
  })),
}))

// analyzerService imports claudeService which imports @anthropic-ai/sdk.
// claudeImprovements is called in a silent catch — mock to prevent resolution errors.
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: { create: vi.fn().mockRejectedValue(new Error('mocked')) },
  })),
}))

import { analyzeVideo } from '../analyzerService'

// ── HELPERS ───────────────────────────────────────────────────────────────

const mockFile = new File(['fake-video-data'], 'test.mp4', { type: 'video/mp4' })
const mockApiKey = 'test-gemini-api-key'
const mockStatusCb = vi.fn()

// Capture the prompt inside the mock implementation.
// We intentionally reject after capture so we don't need parseResult to succeed.
function makeCaptureAndReject() {
  return vi.fn().mockImplementation((parts: Array<{ text?: string; inlineData?: unknown }>) => {
    capturedPrompt = parts.find((p) => p.text !== undefined)?.text ?? ''
    return Promise.reject(new Error('intentional mock rejection'))
  })
}

// ── TESTS ─────────────────────────────────────────────────────────────────

describe('analyzeVideo — contextPrefix behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedPrompt = ''
  })

  it('includes contextPrefix at the start of the prompt when provided', async () => {
    mockGenerateContent.mockImplementation(
      (parts: Array<{ text?: string; inlineData?: unknown }>) => {
        capturedPrompt = parts.find((p) => p.text !== undefined)?.text ?? ''
        return Promise.reject(new Error('intentional mock rejection'))
      }
    )

    try {
      await analyzeVideo(mockFile, mockApiKey, mockStatusCb, 'MY_CONTEXT_PREFIX')
    } catch {
      // expected rejection
    }

    expect(capturedPrompt).toMatch(/^MY_CONTEXT_PREFIX\n\n/)
  })

  it('does not include "undefined" or "null" in the prompt when contextPrefix is omitted', async () => {
    mockGenerateContent.mockImplementation(
      (parts: Array<{ text?: string; inlineData?: unknown }>) => {
        capturedPrompt = parts.find((p) => p.text !== undefined)?.text ?? ''
        return Promise.reject(new Error('intentional mock rejection'))
      }
    )

    try {
      await analyzeVideo(mockFile, mockApiKey, mockStatusCb)
    } catch {
      // expected rejection
    }

    expect(capturedPrompt).not.toContain('undefined')
    expect(capturedPrompt).not.toContain('null')
  })

  it('wraps errors with "Analysis failed:" prefix and calls status callback with "error"', async () => {
    mockGenerateContent.mockRejectedValue(new Error('network timeout'))

    await expect(
      analyzeVideo(mockFile, mockApiKey, mockStatusCb)
    ).rejects.toThrow('Analysis failed: network timeout')

    // emit("error") is called with no second argument (analyzerService.ts:464)
    expect(mockStatusCb).toHaveBeenCalledWith('error')
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/atlas/cutsheet && npm test -- --run src/services/__tests__/analyzerService.test.ts 2>&1 | tail -20
```

Expected: `3 tests passed`.

Common fixes:
- If `mockGenerateContent` is `undefined` in the test body, ensure the `vi.mock` block is at the top before imports (vitest hoists `vi.mock` automatically, but the `mockGenerateContent` variable must be declared before the mock factory).
- If `capturedPrompt` is empty, `generateContent` wasn't called — check that `fileToBase64` resolved (mock `File` with non-empty content).

- [ ] **Step 3: Commit**

```bash
cd /Users/atlas/cutsheet && git add src/services/__tests__/analyzerService.test.ts && git commit -m "test: analyzerService contextPrefix and error path"
```

---

## Chunk 2: claudeService + AppLayout/ProtectedRoute

### Task 3: claudeService tests

**Files:**
- Create: `src/services/__tests__/claudeService.test.ts`

Key facts about `generateSecondEyeReview` (`src/services/claudeService.ts:139`):
- Returns `Promise<SecondEyeResult>` where `SecondEyeResult = { scrollMoment: string | null, flags: SecondEyeFlag[], whatItCommunicates: string, whatItFails: string }`
- Calls `client.messages.create(...)`, gets `message.content[0].text`
- Extracts JSON with `text.match(/\{[\s\S]*\}/)` (line 225) — mock must return raw JSON, not fenced blocks
- `flags: []` is valid — the normalization loop handles empty arrays
- `getClient()` calls `new Anthropic({ apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY })` — since Anthropic is mocked, no env var setup needed

- [ ] **Step 1: Create the test file**

Create `src/services/__tests__/claudeService.test.ts`:

```typescript
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── MOCKS ─────────────────────────────────────────────────────────────────

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: { create: mockCreate },
  })),
}))

import { generateSecondEyeReview } from '../claudeService'

// ── HELPERS ───────────────────────────────────────────────────────────────

// Raw JSON (no markdown fences) — the regex /\{[\s\S]*\}/ matches this directly
const VALID_RESPONSE_JSON = JSON.stringify({
  scrollMoment: '0:02',
  flags: [],
  whatItCommunicates: 'Promotes a skincare product with a before/after hook.',
  whatItFails: 'No clear CTA until the final 2 seconds.',
})

function mockAnthropicResponse(text: string) {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text }],
  })
}

// ── TESTS ─────────────────────────────────────────────────────────────────

describe('generateSecondEyeReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path — returns parsed SecondEyeResult with all four fields', async () => {
    mockAnthropicResponse(VALID_RESPONSE_JSON)

    const result = await generateSecondEyeReview(
      'Some analysis markdown',
      'test.mp4',
      { hook: 6, overall: 7 },
      ['Improve the hook', 'Add text overlay']
    )

    expect(result).toMatchObject({
      scrollMoment: expect.anything(),   // string | null
      flags: expect.any(Array),
      whatItCommunicates: expect.any(String),
      whatItFails: expect.any(String),
    })
    expect(result.flags).toEqual([])
    expect(result.whatItCommunicates).toContain('skincare')
  })

  it('malformed JSON response — rejects', async () => {
    mockAnthropicResponse('This is plain text with no JSON object.')

    await expect(
      generateSecondEyeReview('analysis markdown', 'test.mp4')
    ).rejects.toThrow()
  })

  it('network error — propagates without hanging', async () => {
    mockCreate.mockRejectedValue(new Error('fetch failed'))

    await expect(
      generateSecondEyeReview('analysis markdown', 'test.mp4')
    ).rejects.toThrow('fetch failed')
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/atlas/cutsheet && npm test -- --run src/services/__tests__/claudeService.test.ts 2>&1 | tail -20
```

Expected: `3 tests passed`.

Common fix: if the malformed JSON test doesn't reject, inspect `claudeService.ts` lines 220–250 — if the function returns a default object instead of throwing, change the assertion to check the returned value instead.

- [ ] **Step 3: Commit**

```bash
cd /Users/atlas/cutsheet && git add src/services/__tests__/claudeService.test.ts && git commit -m "test: claudeService generateSecondEyeReview error paths"
```

---

### Task 4: AppLayout + ProtectedRoute tests

**Files:**
- Create: `src/components/__tests__/AppLayout.test.tsx`

Key facts:
- `AppLayout` is a **default export** (`export default function AppLayout`)
- `ProtectedRoute` is a **named export** (`export function ProtectedRoute`)
- `ProtectedRoute` queries Supabase: `.from('profiles').select('onboarding_completed').eq('id', user.id).single().then(cb)` — mock the `.then()` synchronously
- `ProtectedRoute` starts with `checking: true` — use `waitFor` before asserting final state
- `AppLayout` imports `{ themes }` from `"../theme"` — mock it to avoid side effects
- All subcomponents (Sidebar, TopBar, etc.) must be mocked to avoid deep dependency chains

Supabase chain mock approach — synchronous `.then()` for ProtectedRoute:
```ts
mockSingleFn.mockImplementation(() => ({
  then: (onFulfilled: (r: unknown) => void) => {
    onFulfilled({ data: { onboarding_completed: true }, error: null })
    return { catch: vi.fn() }
  },
}))
```

- [ ] **Step 1: Create the test file**

Create `src/components/__tests__/AppLayout.test.tsx`:

```tsx
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route, useOutletContext } from 'react-router-dom'

// ── MOCK SUBCOMPONENTS ────────────────────────────────────────────────────
vi.mock('../Sidebar', () => ({ Sidebar: () => <div data-testid="sidebar" /> }))
vi.mock('../TopBar', () => ({ TopBar: () => <div data-testid="topbar" /> }))
vi.mock('../UpgradeModal', () => ({ UpgradeModal: () => null }))
vi.mock('../KeyboardShortcutsModal', () => ({ default: () => null }))
vi.mock('../../theme', () => ({ themes: { dark: {}, light: {} } }))

// ── MOCK HOOKS ────────────────────────────────────────────────────────────
const mockUseAuth = vi.fn()
vi.mock('../../context/AuthContext', () => ({ useAuth: mockUseAuth }))

vi.mock('../../hooks/useUsage', () => ({
  useUsage: vi.fn(() => ({
    usageCount: 2,
    isPro: false,
    canAnalyze: true,
    increment: vi.fn(() => 3),
    FREE_LIMIT: 5,
  })),
}))

vi.mock('../../hooks/useHistory', () => ({
  useHistory: vi.fn(() => ({
    entries: [],
    addEntry: vi.fn(),
    deleteEntry: vi.fn(),
    clearAll: vi.fn(),
  })),
}))

vi.mock('../../hooks/useSwipeFile', () => ({
  useSwipeFile: vi.fn(() => ({ items: [], addItem: vi.fn() })),
}))

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}))

// ── MOCK SUPABASE ─────────────────────────────────────────────────────────
const mockSingleFn = vi.fn()
const mockEqFn = vi.fn(() => ({ single: mockSingleFn }))
const mockSelectFn = vi.fn(() => ({ eq: mockEqFn }))
const mockFromFn = vi.fn(() => ({ select: mockSelectFn }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: mockFromFn,
  },
}))

// ── IMPORTS (after mocks) ─────────────────────────────────────────────────
import AppLayout, { type AppSharedContext } from '../AppLayout'
import { ProtectedRoute } from '../ProtectedRoute'

// ── HELPERS ───────────────────────────────────────────────────────────────
const mockUser = { id: 'user-1', email: 'test@example.com' }

function makeAuth(overrides: Partial<{ user: unknown; loading: boolean }> = {}) {
  return {
    user: mockUser,
    session: null,
    loading: false,
    signOut: vi.fn(),
    ...overrides,
  }
}

// Child that reads outlet context and renders field names to DOM
function ContextConsumer() {
  const ctx = useOutletContext<AppSharedContext>()
  return <div data-testid="ctx-keys">{Object.keys(ctx).join(',')}</div>
}

// ── TESTS ─────────────────────────────────────────────────────────────────

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue(makeAuth())
  })

  it('renders without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<div>child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })

  it('provides correct context shape to outlet children', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<ContextConsumer />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    const keys = screen.getByTestId('ctx-keys').textContent ?? ''
    const expectedKeys = [
      'canAnalyze', 'isPro', 'increment', 'FREE_LIMIT', 'usageCount',
      'registerCallbacks', 'onUpgradeRequired', 'historyEntries',
      'addHistoryEntry', 'deleteHistoryEntry', 'clearAllHistory', 'addSwipeItem',
    ]
    expectedKeys.forEach((key) => expect(keys).toContain(key))
  })
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to /login', async () => {
    mockUseAuth.mockReturnValue(makeAuth({ user: null }))

    render(
      <MemoryRouter initialEntries={['/app/paid']}>
        <Routes>
          <Route
            path="/app/paid"
            element={
              <ProtectedRoute>
                <div>secret content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('secret content')).not.toBeInTheDocument()
    })
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders protected content for authenticated users with completed onboarding', async () => {
    mockUseAuth.mockReturnValue(makeAuth())

    // Stub .from('profiles').select().eq().single().then() synchronously
    mockSingleFn.mockImplementation(() => ({
      then: (onFulfilled: (r: { data: unknown; error: null }) => void) => {
        onFulfilled({ data: { onboarding_completed: true }, error: null })
        return { catch: vi.fn() }
      },
    }))

    render(
      <MemoryRouter initialEntries={['/app/paid']}>
        <Routes>
          <Route
            path="/app/paid"
            element={
              <ProtectedRoute>
                <div>protected content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/welcome" element={<div>welcome page</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run all tests together**

```bash
cd /Users/atlas/cutsheet && npm test -- --run 2>&1 | tail -30
```

Expected: `10 tests passed, 0 failed`.

Common fixes:
- **"Cannot find module '../Sidebar'"** — the mock path must match exactly how AppLayout imports it (relative path, no `.tsx` extension).
- **"useNavigate() may only be used in a Router context"** — ensure ProtectedRoute tests are always inside `<MemoryRouter>`.
- **`.then is not a function` on Supabase single()** — the `mockSingleFn` must return an object with a `then` method, not a real Promise. The synchronous approach shown avoids `waitFor` timing issues.
- **context fields missing** — if AppLayout exports new context fields in future, add them to the assertion list. Test asserts a minimum subset, not exact equality.

- [ ] **Step 3: Confirm 0 failures**

```bash
cd /Users/atlas/cutsheet && npm test -- --run 2>&1
```

Expected final lines include: `Tests 10 passed (10)`.

- [ ] **Step 4: Commit and push**

```bash
cd /Users/atlas/cutsheet && git add src/components/__tests__/AppLayout.test.tsx && git commit -m "test: unit tests for analyzerService, claudeService, AppLayout" && git push
```
