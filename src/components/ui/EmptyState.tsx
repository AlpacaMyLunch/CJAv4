import type { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'

interface EmptyStateProps {
  /**
   * Icon to display (from lucide-react)
   */
  icon?: LucideIcon

  /**
   * Emoji to display instead of an icon
   */
  emoji?: string

  /**
   * Main title/message
   */
  title: string

  /**
   * Optional description/subtitle
   */
  description?: string

  /**
   * Optional action button label
   */
  actionLabel?: string

  /**
   * Optional action button click handler
   */
  onAction?: () => void

  /**
   * Optional secondary action button label
   */
  secondaryActionLabel?: string

  /**
   * Optional secondary action button click handler
   */
  onSecondaryAction?: () => void

  /**
   * Whether to wrap in a Card component
   * @default false
   */
  card?: boolean

  /**
   * Custom className for the container
   */
  className?: string

  /**
   * Size of the empty state
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  card = false,
  className = '',
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-8 w-8 mb-2',
      emoji: 'text-3xl mb-2',
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12 mb-3',
      emoji: 'text-4xl mb-4',
      title: 'text-lg',
      description: 'text-sm'
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16 mb-4',
      emoji: 'text-5xl mb-6',
      title: 'text-xl',
      description: 'text-base'
    }
  }

  const sizes = sizeClasses[size]

  const content = (
    <div className={`text-center ${sizes.container} ${className}`}>
      {/* Icon or Emoji */}
      {Icon && (
        <Icon className={`${sizes.icon} text-muted-foreground mx-auto opacity-50`} />
      )}
      {emoji && (
        <div className={sizes.emoji}>{emoji}</div>
      )}

      {/* Title */}
      <h3 className={`${sizes.title} font-medium mb-2 text-muted-foreground`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`${sizes.description} text-muted-foreground mt-1`}>
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center justify-center gap-3 mt-4">
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (card) {
    return (
      <Card>
        <CardContent className="p-8">
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}
