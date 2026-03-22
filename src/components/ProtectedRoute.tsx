import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
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

    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data || !data.onboarding_completed) {
          navigate('/welcome', { replace: true })
        } else {
          verifiedUserIdRef.current = user.id
        }
        setChecking(false)
      })
      .catch(() => {
        // If query fails, redirect to onboarding to be safe
        navigate('/welcome', { replace: true })
        setChecking(false)
      })
  }, [user, loading])

  if (loading || checking) {
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

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
