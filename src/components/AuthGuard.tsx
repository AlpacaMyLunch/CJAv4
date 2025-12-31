import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}