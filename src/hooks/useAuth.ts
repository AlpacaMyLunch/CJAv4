import { useEffect, useState } from 'react'
import { type User, type Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  isAdmin: boolean
}

const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user?.id) return false
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle instead of single to handle no results gracefully
    
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
        
        // Set initial state with user, then check admin status
        setAuthState({
          user,
          session,
          loading: false,
          error: null,
          isAdmin: false
        })
        
        // Check admin status if user exists
        if (user) {
          // Temporarily disable admin check to fix loading issue
          // TODO: Re-enable when admin table is set up
          // try {
          //   const isAdmin = await checkIsAdmin(user)
          //   setAuthState(prev => ({
          //     ...prev,
          //     isAdmin
          //   }))
          // } catch (error) {
          //   console.error('Admin check failed:', error)
          //   // Keep isAdmin as false if check fails
          // }
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
        
        // Set initial state with user, then check admin status
        setAuthState({
          user,
          session,
          loading: false,
          error: null,
          isAdmin: false
        })
        
        // Check admin status if user exists
        if (user) {
          // Temporarily disable admin check to fix loading issue
          // TODO: Re-enable when admin table is set up
          // try {
          //   const isAdmin = await checkIsAdmin(user)
          //   setAuthState(prev => ({
          //     ...prev,
          //     isAdmin
          //   }))
          // } catch (error) {
          //   console.error('Admin check failed:', error)
          //   // Keep isAdmin as false if check fails
          // }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithDiscord = async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/`
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