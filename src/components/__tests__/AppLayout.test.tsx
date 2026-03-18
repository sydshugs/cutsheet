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
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }))
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
const { mockSingleFn, mockFromFn } = vi.hoisted(() => {
  const mockSingleFn = vi.fn()
  const mockEqFn = vi.fn(() => ({ single: mockSingleFn }))
  const mockSelectFn = vi.fn(() => ({ eq: mockEqFn }))
  const mockFromFn = vi.fn(() => ({ select: mockSelectFn }))
  return { mockSingleFn, mockFromFn }
})

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
