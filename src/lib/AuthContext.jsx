import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { initialAuthCallback, supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(supabase))
  const [session, setSession] = useState(null)
  const [authEvent, setAuthEvent] = useState(null)
  const [passwordRecoveryStatus, setPasswordRecoveryStatus] = useState(() => {
    if (initialAuthCallback.hasError) return 'invalid'
    if (initialAuthCallback.isPasswordRecovery) return 'checking'
    return 'idle'
  })

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session || null)
      setIsAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setAuthEvent(event)
      setSession(nextSession || null)
      setIsAuthLoading(false)

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryStatus('active')
      } else if (event === 'SIGNED_OUT') {
        setPasswordRecoveryStatus('idle')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (passwordRecoveryStatus !== 'checking') return undefined

    const timer = window.setTimeout(() => {
      setPasswordRecoveryStatus((current) => (current === 'checking' ? 'invalid' : current))
    }, 2500)

    return () => window.clearTimeout(timer)
  }, [passwordRecoveryStatus])

  const value = useMemo(
    () => ({
      authEvent,
      isAuthLoading,
      passwordRecoveryErrorCode: initialAuthCallback.errorCode,
      passwordRecoveryStatus,
      session,
      user: session?.user || null,
    }),
    [authEvent, isAuthLoading, passwordRecoveryStatus, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
