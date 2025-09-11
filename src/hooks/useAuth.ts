import { useEffect, useState, useRef } from 'react'
import { type User, type Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { trackAuth } from '@/utils/analytics'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  isAdmin: boolean
}

// Admin check cache to prevent excessive API calls
const adminCheckCache = new Map<string, boolean>()

// Admin check function with caching
const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user?.id) return false
  
  // Check cache first
  if (adminCheckCache.has(user.id)) {
    return adminCheckCache.get(user.id)!
  }
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) {
      adminCheckCache.set(user.id, false)
      return false
    }
    
    const isAdmin = !!data
    adminCheckCache.set(user.id, isAdmin)
    return isAdmin
  } catch {
    adminCheckCache.set(user.id, false)
    return false
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAdmin: false
  })
  const initialLoadCompleteRef = useRef(false)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setAuthState(prev => ({ ...prev, error, loading: false }))
          initialLoadCompleteRef.current = true
          return
        }
        
        const user = session?.user ?? null
        
        // Check admin status if user exists, then set complete state
        if (user) {
          try {
            const isAdmin = await checkIsAdmin(user)
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
              isAdmin
            })
            initialLoadCompleteRef.current = true
          } catch {
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
              isAdmin: false
            })
            initialLoadCompleteRef.current = true
          }
        } else {
          // No user, set state without admin check
          setAuthState({
            user,
            session,
            loading: false,
            error: null,
            isAdmin: false
          })
          initialLoadCompleteRef.current = true
        }
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: error as AuthError, 
          loading: false 
        }))
        initialLoadCompleteRef.current = true
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip auth state changes until initial load is complete
        if (!initialLoadCompleteRef.current) return
        const user = session?.user ?? null
        
        // Track authentication events
        if (event === 'SIGNED_IN' && user) {
          trackAuth('login')
        } else if (event === 'SIGNED_OUT') {
          trackAuth('logout')
        }
        
        // Check admin status if user exists, then set complete state
        if (user) {
          try {
            const isAdmin = await checkIsAdmin(user)
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
              isAdmin
            })
          } catch {
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
              isAdmin: false
            })
          }
        } else {
          // No user, set state without admin check
          setAuthState({
            user,
            session,
            loading: false,
            error: null,
            isAdmin: false
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signInWithDiscord = async (redirectTo?: string) => {
    const currentOrigin = window.location.origin
    const finalRedirectUrl = redirectTo || `${currentOrigin}/`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: finalRedirectUrl
      }
    })
    
    if (error) {
      setAuthState(prev => ({ ...prev, error }))
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthState(prev => ({ ...prev, error }))
    }
  }

  return {
    ...authState,
    signInWithDiscord,
    signOut,
    isAuthenticated: !!authState.user,
    isAdmin: authState.isAdmin
  }
}