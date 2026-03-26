import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  subscriptionStatus: string | null
  /** null = not yet fetched; false = beta gate shown; true = access granted */
  betaAccess: boolean | null
  refreshUserProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscriptionStatus: null,
  betaAccess: null,
  refreshUserProfile: async () => {},
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [betaAccess, setBetaAccess] = useState<boolean | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, beta_access')
        .eq('id', userId)
        .single()
      setSubscriptionStatus(data?.subscription_status ?? 'free')
      setBetaAccess(data?.beta_access ?? false)
    } catch {
      // Keep existing values on error — don't reset to null (would re-show gate)
    }
  }, [])

  const refreshUserProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) await fetchProfile(currentUser.id)
  }, [fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // fetchProfile sets loading=false via betaAccess state transition
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setSubscriptionStatus(null)
          setBetaAccess(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      subscriptionStatus,
      betaAccess,
      refreshUserProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
