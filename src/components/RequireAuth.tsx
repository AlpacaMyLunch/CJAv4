import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

export interface RequireAuthProps {
  /** Content to render when authenticated */
  children: ReactNode
  /** Message to show while loading auth state */
  loadingMessage?: string
  /** Title for the sign-in prompt */
  title?: string
  /** Description text for the sign-in prompt */
  description?: string
  /** Icon component to display (from lucide-react) */
  icon?: LucideIcon
  /** Additional info/instructions to show below description */
  additionalInfo?: ReactNode
  /** Whether to show sign-in button */
  showSignInButton?: boolean
  /** Custom sign-in button text */
  signInButtonText?: string
  /** Whether to use Card wrapper for not-authenticated state */
  useCard?: boolean
}

/**
 * RequireAuth - Wrapper component that handles authentication checks
 *
 * Shows loading state while checking auth, sign-in prompt when not authenticated,
 * and renders children when user is authenticated.
 *
 * @example
 * // Basic usage
 * <RequireAuth
 *   title="Sign In to View Predictions"
 *   description="Sign in to make your predictions!"
 * >
 *   <YourProtectedContent />
 * </RequireAuth>
 *
 * @example
 * // With custom icon and sign-in button
 * <RequireAuth
 *   title="Sign In to Review"
 *   description="Sign in with Discord to create reviews"
 *   icon={Star}
 *   showSignInButton={true}
 *   signInButtonText="Sign In with Discord"
 * >
 *   <YourProtectedContent />
 * </RequireAuth>
 */
export function RequireAuth({
  children,
  loadingMessage = 'Loading...',
  title = 'Sign In Required',
  description,
  icon: Icon = User,
  additionalInfo,
  showSignInButton = false,
  signInButtonText = 'Sign In',
  useCard = false,
}: RequireAuthProps) {
  const { user, loading, signInWithDiscord } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner message={loadingMessage} center />
        </div>
      </div>
    )
  }

  // Show sign-in prompt when not authenticated
  if (!user) {
    const content = (
      <div className="text-center">
        <Icon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground mb-6">{description}</p>
        )}
        {additionalInfo && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            {additionalInfo}
          </div>
        )}
        {showSignInButton && (
          <Button onClick={() => signInWithDiscord()}>
            {signInButtonText}
          </Button>
        )}
      </div>
    )

    if (useCard) {
      return (
        <Card>
          <CardContent className="p-12">
            {content}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md">
          {content}
        </div>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}
