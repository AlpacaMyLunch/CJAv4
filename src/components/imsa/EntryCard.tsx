import { Trophy, GripVertical } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { type ImsaEntryWithDetails } from '@/lib/supabase'

const positionStyles: Record<number, { ring: string; bg: string; text: string; textMuted: string; label: string }> = {
  1: {
    ring: 'ring-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-900 dark:text-yellow-100',
    textMuted: 'text-yellow-700 dark:text-yellow-300',
    label: 'P1'
  },
  2: {
    ring: 'ring-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-900 dark:text-gray-100',
    textMuted: 'text-gray-600 dark:text-gray-300',
    label: 'P2'
  },
  3: {
    ring: 'ring-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-700 dark:text-amber-300',
    label: 'P3'
  }
}

function PositionBadge({ position }: { position: number }) {
  const medals: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }
  const colors: Record<number, string> = {
    1: 'bg-yellow-500 text-yellow-950',
    2: 'bg-gray-400 text-gray-950',
    3: 'bg-amber-600 text-amber-950'
  }

  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
      colors[position]
    )}>
      <Trophy className="h-3 w-3" />
      {medals[position]}
    </div>
  )
}

interface EntryCardContentProps {
  entry: ImsaEntryWithDetails
  selectedPosition?: number | null
  isDragging?: boolean
  showGrip?: boolean
  className?: string
}

export function EntryCardContent({
  entry,
  selectedPosition,
  isDragging,
  showGrip = true,
  className
}: EntryCardContentProps) {
  const posStyle = selectedPosition ? positionStyles[selectedPosition] : null

  return (
    <Card
      className={cn(
        'p-3 transition-all',
        isDragging ? 'shadow-xl rotate-2 scale-105' : 'cursor-grab hover:shadow-md active:cursor-grabbing',
        posStyle
          ? `ring-2 ${posStyle.ring} ${posStyle.bg}`
          : 'hover:bg-muted/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {showGrip && (
            <GripVertical className={cn('h-5 w-5 shrink-0 hidden sm:block', posStyle?.textMuted || 'text-muted-foreground')} />
          )}
          <span className={cn('text-2xl font-bold shrink-0', posStyle?.text || 'text-card-foreground')}>
            #{entry.car_number}
          </span>
          <div className="min-w-0">
            <p className={cn('font-medium truncate', posStyle?.text || 'text-card-foreground')}>{entry.team_name}</p>
            <p className={cn('text-sm', posStyle?.textMuted || 'text-muted-foreground')}>{entry.manufacturer.name}</p>
          </div>
        </div>
        {selectedPosition && <PositionBadge position={selectedPosition} />}
      </div>
      <div className="mt-2">
        <p className={cn('text-xs line-clamp-2', posStyle?.textMuted || 'text-muted-foreground')}>
          {entry.drivers.join(' / ')}
        </p>
      </div>
    </Card>
  )
}

interface DraggableEntryCardProps {
  entry: ImsaEntryWithDetails
  selectedPosition?: number | null
  disabled?: boolean
  onTap?: () => void
  isTouchDevice?: boolean
  className?: string
}

export function DraggableEntryCard({
  entry,
  selectedPosition,
  disabled,
  onTap,
  isTouchDevice,
  className
}: DraggableEntryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: entry.id,
    disabled: disabled || isTouchDevice // Disable dragging on touch devices
  })

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  } : undefined

  // On touch devices, render a simple tappable card without drag functionality
  if (isTouchDevice) {
    return (
      <div
        onClick={disabled ? undefined : onTap}
        className={cn(
          disabled && 'opacity-50',
          className
        )}
      >
        <EntryCardContent
          entry={entry}
          selectedPosition={selectedPosition}
          showGrip={false}
        />
      </div>
    )
  }

  // Desktop: full drag and drop functionality
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onTap}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50',
        disabled && 'opacity-50',
        className
      )}
    >
      <EntryCardContent
        entry={entry}
        selectedPosition={selectedPosition}
        isDragging={isDragging}
      />
    </div>
  )
}

// Legacy export for backwards compatibility
interface EntryCardProps {
  entry: ImsaEntryWithDetails
  isSelected?: boolean
  selectedPosition?: number | null
  onSelect?: () => void
  disabled?: boolean
  className?: string
}

export function EntryCard({
  entry,
  isSelected,
  selectedPosition,
  onSelect,
  disabled,
  className
}: EntryCardProps) {
  const posStyle = selectedPosition ? positionStyles[selectedPosition] : null

  return (
    <Card
      onClick={disabled ? undefined : onSelect}
      className={cn(
        'p-3 transition-all',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md',
        posStyle
          ? `ring-2 ${posStyle.ring} ${posStyle.bg}`
          : isSelected
            ? 'ring-2 ring-primary bg-primary/5'
            : 'hover:bg-muted/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn('text-2xl font-bold shrink-0', posStyle?.text || 'text-card-foreground')}>
            #{entry.car_number}
          </span>
          <div className="min-w-0">
            <p className={cn('font-medium truncate', posStyle?.text || 'text-card-foreground')}>{entry.team_name}</p>
            <p className={cn('text-sm', posStyle?.textMuted || 'text-muted-foreground')}>{entry.manufacturer.name}</p>
          </div>
        </div>
        {selectedPosition && <PositionBadge position={selectedPosition} />}
      </div>
      <div className="mt-2">
        <p className={cn('text-xs line-clamp-2', posStyle?.textMuted || 'text-muted-foreground')}>
          {entry.drivers.join(' / ')}
        </p>
      </div>
    </Card>
  )
}
