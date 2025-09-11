import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface AdminGuardProps {
  children: React.ReactNode
  fallbackPath?: string
}

export function AdminGuard({ children, fallbackPath = '/' }: AdminGuardProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  console.log('🛡️ AdminGuard check:', { isAuthenticated, isAdmin, loading })

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      console.log('🚫 AdminGuard redirecting due to:', { isAuthenticated, isAdmin, loading })
      navigate(fallbackPath, { replace: true })
    }
  }, [isAuthenticated, isAdmin, loading, navigate, fallbackPath])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized message if not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-bold text-foreground mb-4">🔒 Admin Only</h1>
          <p className="text-lg text-muted-foreground mb-6">
            This area is restricted to administrators only.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you back to the homepage...
          </p>
        </div>
      </div>
    )
  }

  // Render children if user is admin
  return <>{children}</>
}