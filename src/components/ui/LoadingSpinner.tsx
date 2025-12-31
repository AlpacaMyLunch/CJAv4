import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Optional message to display below the spinner
   */
  message?: string
  /**
   * Additional CSS classes for the container
   */
  className?: string
  /**
   * Center the spinner in its container
   * @default false
   */
  center?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

export function LoadingSpinner({
  size = 'md',
  message,
  className,
  center = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('inline-flex items-center gap-2', center && 'justify-center', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
      {message && <span className="text-muted-foreground">{message}</span>}
    </div>
  )

  if (center) {
    return (
      <div className="flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}
