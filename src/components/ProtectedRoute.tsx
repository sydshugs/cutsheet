import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { BetaGate } from './BetaGate'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, betaAccess, refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [checking, setChecking] = useState(true)
  const verifiedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      verifiedUserIdRef.current = null
      setChecking(false)
      return
    }

    // Skip profile re-check if we already verified this user
    // (prevents flash to loading state on Supabase TOKEN_REFRESHED events)
    if (verifiedUserIdRef.current === user.id) {
      setChecking(false)
      return
    }

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (error) {
          // Log but don't redirect — could be RLS misconfiguration or network issue.
          // Punishing users for a DB error by sending them back through onboarding
          // is worse than letting them through.
          console.error('[ProtectedRoute] profiles fetch error:', error.message)
          verifiedUserIdRef.current = user.id
        } else if (!data || !data.onboarding_completed) {
          navigate('/welcome', { replace: true })
        } else {
          verifiedUserIdRef.current = user.id
        }
      } catch (err) {
        console.error('[ProtectedRoute] unexpected error:', err)
        verifiedUserIdRef.current = user.id
      } finally {
        setChecking(false)
      }
    })()
  }, [user, loading])

  // ── Auto-redeem pending beta code ────────────────────────────────────────
  // Fires when a newly-authed user has betaAccess=false and localStorage
  // holds a code validated at /access. Covers email-confirm + Google OAuth.
  useEffect(() => {
    if (!user || betaAccess !== false || checking) return

    const pendingCode = localStorage.getItem('pending_beta_code')
    if (!pendingCode) return

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const res = await fetch('/api/redeem-beta-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code: pendingCode }),
        })

        if (res.ok) {
          localStorage.removeItem('pending_beta_code')
          await refreshUserProfile()
        }
      } catch (err) {
        console.error('[ProtectedRoute] auto-redeem error:', err)
      }
    })()
  }, [user, betaAccess, checking])

  // ── Loading spinner ──────────────────────────────────────────────────────
  // Show while auth is loading OR while we're checking onboarding status.
  // Also show while betaAccess is null (profile fetch not yet complete) to
  // prevent a flash of the gate before we know the user's actual access state.
  if (loading || checking || (user && betaAccess === null)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 24,
          height: 24,
          border: '2px solid rgba(99,102,241,0.3)',
          borderTop: '2px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!user) return <Navigate to="/login" replace />

  // ── Beta gate — authenticated + onboarded, but no beta access yet ────────
  // Only enforce the gate on /app/* routes — not /settings or other thin
  // protected pages where the gate would be unexpected and confusing.
  if (betaAccess === false && pathname.startsWith('/app')) return <BetaGate />

  // ── Authenticated + beta access granted ─────────────────────────────────
  return <>{children}</>
}
