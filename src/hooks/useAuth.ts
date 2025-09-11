import { useEffect, useState } from 'react'
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

// Admin check function 
const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user?.id) return false
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) {
      console.error('Admin check error:', error)
      return false
    }
    
    return !!data
  } catch (error) {
    console.error('Admin check exception:', error)
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Initial session error:', error)
          setAuthState(prev => ({ ...prev, error, loading: false }))
          return
        }
        
        const user = session?.user ?? null
        
        // Check admin status if user exists, then set complete state
        if (user) {
          console.log('🔑 Current user ID for admin setup:', user.id)
          try {
            const isAdmin = await checkIsAdmin(user)
            console.log('🔐 Admin check result:', isAdmin)
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
              isAdmin
            })
          } catch (error) {
            console.error('Admin check failed:', error)
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
      } catch (error) {
        console.error('Initial session catch:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error as AuthError, 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        
        // Track authentication events
        if (event === 'SIGNED_IN' && user) {
          trackAuth('login')
        } else if (event === 'SIGNED_OUT') {
          trackAuth('logout')
        }
        
        // Check admin status if user exists, then set complete state
        if (user) {
          console.log('🔑 Current user ID for admin setup:', user.id)
          try {
            const isAdmin = await checkIsAdmin(user)
            console.log('🔐 Admin check result:', isAdmin)
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
              isAdmin
            })
          } catch (error) {
            console.error('Admin check failed:', error)
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
      console.error('Discord OAuth error:', error)
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