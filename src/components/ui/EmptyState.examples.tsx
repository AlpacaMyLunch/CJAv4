/**
 * EmptyState Component - Usage Examples
 *
 * This file demonstrates different ways to use the EmptyState component.
 */

import { Settings, Star, AlertCircle } from 'lucide-react'
import { EmptyState } from './EmptyState'

// Example 1: Basic empty state with icon
export function BasicExample() {
  return (
    <EmptyState
      icon={Settings}
      title="No items found"
      description="Try adjusting your filters or adding new items"
    />
  )
}

// Example 2: Empty state with emoji instead of icon
export function EmojiExample() {
  return (
    <EmptyState
      emoji="🎉"
      title="No celebrations yet"
      description="Create your first celebration to get started"
    />
  )
}

// Example 3: Empty state wrapped in a Card
export function CardExample() {
  return (
    <EmptyState
      icon={Star}
      title="No reviews yet"
      description="Be the first to leave a review!"
      card
    />
  )
}

// Example 4: Empty state with action button
export function WithActionExample() {
  const handleAction = () => {
    console.log('Action clicked')
  }

  return (
    <EmptyState
      icon={Settings}
      title="No setup reviews yet"
      description='Click "Add Review" to get started!'
      actionLabel="Add Review"
      onAction={handleAction}
    />
  )
}

// Example 5: Empty state with primary and secondary actions
export function WithMultipleActionsExample() {
  const handlePrimary = () => console.log('Primary action')
  const handleSecondary = () => console.log('Secondary action')

  return (
    <EmptyState
      icon={AlertCircle}
      title="No data available"
      description="Import data or create new entries to get started"
      actionLabel="Import Data"
      onAction={handlePrimary}
      secondaryActionLabel="Create New"
      onSecondaryAction={handleSecondary}
      card
    />
  )
}

// Example 6: Small size variant
export function SmallSizeExample() {
  return (
    <EmptyState
      icon={Star}
      title="No favorites"
      description="Mark items as favorites to see them here"
      size="sm"
    />
  )
}

// Example 7: Large size variant
export function LargeSizeExample() {
  return (
    <EmptyState
      emoji="🚀"
      title="Ready to launch"
      description="Everything is set up. Click below to begin your journey!"
      actionLabel="Get Started"
      onAction={() => console.log('Started')}
      size="lg"
      card
    />
  )
}

// Example 8: Custom className
export function CustomClassExample() {
  return (
    <EmptyState
      icon={Settings}
      title="Customized empty state"
      description="This has custom margins and background"
      className="my-8 bg-muted/30 rounded-lg"
    />
  )
}
