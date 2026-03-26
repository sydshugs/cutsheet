import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { BetaGate } from './BetaGate'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, betaAccess } = useAuth()
  const navigate = useNavigate()
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

  // ── Loading spinner ──────────────────────────────────────────────────────
  // Show while auth is loading OR while we're checking onboarding status.
  // Also show while betaAccess is null (profile fetch not yet complete) to
  // prevent a flash of the gate before we know the user's actual access state.
  if (loading || checking || (user && betaAccess === null)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#09090b',
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
  if (betaAccess === false) return <BetaGate />

  // ── Authenticated + beta access granted ─────────────────────────────────
  return <>{children}</>
}
