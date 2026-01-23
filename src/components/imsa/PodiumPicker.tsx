import { useState } from 'react'
import { Trophy, X, GripVertical } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDroppable
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { type ImsaEntryWithDetails, type ImsaPodiumPrediction } from '@/lib/supabase'
import { DraggableEntryCard, EntryCardContent } from './EntryCard'

interface PodiumUpdate {
  position: number
  entryId: string | null
}

interface PodiumPickerProps {
  entries: ImsaEntryWithDetails[]
  predictions: ImsaPodiumPrediction[]
  onSavePredictionsBatch: (updates: PodiumUpdate[]) => Promise<boolean>
  disabled?: boolean
  saving?: boolean
  className?: string
}

const positions = [1, 2, 3] as const
const positionConfig: Record<number, {
  label: string
  color: string
  bgActive: string
  bgDrop: string
  text: string
  textMuted: string
}> = {
  1: {
    label: '1st Place',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgActive: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400',
    bgDrop: 'bg-yellow-200/50 dark:bg-yellow-900/50 border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-100',
    textMuted: 'text-yellow-700 dark:text-yellow-300'
  },
  2: {
    label: '2nd Place',
    color: 'text-gray-600 dark:text-gray-400',
    bgActive: 'bg-gray-100 dark:bg-gray-800/50 border-gray-400',
    bgDrop: 'bg-gray-200/50 dark:bg-gray-700/50 border-gray-500',
    text: 'text-gray-900 dark:text-gray-100',
    textMuted: 'text-gray-600 dark:text-gray-300'
  },
  3: {
    label: '3rd Place',
    color: 'text-amber-600 dark:text-amber-400',
    bgActive: 'bg-amber-100 dark:bg-amber-900/30 border-amber-600',
    bgDrop: 'bg-amber-200/50 dark:bg-amber-900/50 border-amber-700',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-700 dark:text-amber-300'
  }
}

interface DroppablePodiumSlotProps {
  position: number
  entry?: ImsaEntryWithDetails
  onClear: (e: React.MouseEvent) => void
  disabled?: boolean
  saving?: boolean
}

function DroppablePodiumSlot({ position, entry, onClear, disabled, saving }: DroppablePodiumSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `podium-${position}`,
    data: { position }
  })

  const config = positionConfig[position]

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'p-4 border-2 border-dashed transition-all text-center min-h-[120px]',
        disabled || saving ? 'opacity-50' : '',
        isOver
          ? config.bgDrop
          : entry
            ? config.bgActive
            : 'border-muted hover:border-muted-foreground/50'
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Trophy className={cn('h-5 w-5', config.color)} />
        <span className={cn('font-semibold', config.color)}>{config.label}</span>
      </div>

      {entry ? (
        <div className="space-y-1">
          <p className={cn('font-bold text-lg', config.text)}>#{entry.car_number}</p>
          <p className={cn('text-sm truncate', config.textMuted)}>{entry.team_name}</p>
          {!disabled && (
            <button
              onClick={onClear}
              disabled={saving}
              className="mt-2 inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isOver ? 'Drop here!' : 'Drag a car here'}
        </p>
      )}
    </Card>
  )
}

interface MobilePositionModalProps {
  entry: ImsaEntryWithDetails
  availablePositions: number[]
  onSelect: (position: number) => void
  onClose: () => void
}

function MobilePositionModal({ entry, availablePositions, onSelect, onClose }: MobilePositionModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-xl sm:rounded-xl p-4 w-full sm:max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          Select Position for #{entry.car_number}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{entry.team_name}</p>

        <div className="space-y-2">
          {availablePositions.map(position => {
            const config = positionConfig[position]
            return (
              <button
                key={position}
                onClick={() => onSelect(position)}
                className={cn(
                  'w-full p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors',
                  'hover:opacity-80',
                  config.bgActive
                )}
              >
                <Trophy className={cn('h-5 w-5', config.color)} />
                <span className={cn('font-semibold', config.color)}>{config.label}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function PodiumPicker({
  entries,
  predictions,
  onSavePredictionsBatch,
  disabled,
  saving,
  className
}: PodiumPickerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileSelectEntry, setMobileSelectEntry] = useState<ImsaEntryWithDetails | null>(null)

  // Configure sensors - require some movement before starting drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch to differentiate from scroll
        tolerance: 5,
      },
    })
  )

  // Map predictions to entry IDs by position
  const predictionsByPosition: Record<number, string> = {}
  predictions.forEach(p => {
    predictionsByPosition[p.position] = p.entry_id
  })

  // Get entry ID to position mapping (reverse lookup)
  const positionByEntryId: Record<string, number> = {}
  Object.entries(predictionsByPosition).forEach(([pos, entryId]) => {
    positionByEntryId[entryId] = parseInt(pos)
  })

  const getEntryForPosition = (position: number): ImsaEntryWithDetails | undefined => {
    const entryId = predictionsByPosition[position]
    return entries.find(e => e.id === entryId)
  }

  const getActiveEntry = (): ImsaEntryWithDetails | undefined => {
    return entries.find(e => e.id === activeId)
  }

  // Get available positions (not already assigned, or the one this entry is in)
  const getAvailablePositions = (entryId: string): number[] => {
    const currentPos = positionByEntryId[entryId]
    return positions.filter(pos => !predictionsByPosition[pos] || predictionsByPosition[pos] === entryId || pos === currentPos)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)

    if (disabled || saving) return

    const { active, over } = event

    if (!over) return

    const entryId = active.id as string
    const dropData = over.data.current as { position?: number } | undefined

    if (!dropData?.position) return

    const position = dropData.position
    const currentPosition = positionByEntryId[entryId]

    // If dropping on same position it's already in, do nothing
    if (currentPosition === position) return

    // Build batch updates
    const updates: PodiumUpdate[] = []

    // If this position already has an entry, clear it
    if (predictionsByPosition[position] && predictionsByPosition[position] !== entryId) {
      updates.push({ position, entryId: null })
    }

    // If entry was in another position, clear it
    if (currentPosition) {
      updates.push({ position: currentPosition, entryId: null })
    }

    // Set the new position
    updates.push({ position, entryId })

    await onSavePredictionsBatch(updates)
  }

  const handleClearPosition = async (position: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || saving) return
    await onSavePredictionsBatch([{ position, entryId: null }])
  }

  // Handle tap on mobile - show position selector modal
  const handleEntryTap = (entry: ImsaEntryWithDetails) => {
    if (disabled || saving) return

    // Check if entry is already on podium - if so, show modal to move or remove
    const currentPos = positionByEntryId[entry.id]
    if (currentPos) {
      setMobileSelectEntry(entry)
      return
    }

    const available = getAvailablePositions(entry.id)
    if (available.length === 0) return

    // If only one position available, auto-assign
    if (available.length === 1) {
      onSavePredictionsBatch([{ position: available[0], entryId: entry.id }])
      return
    }

    // Show position selection modal
    setMobileSelectEntry(entry)
  }

  const handleMobilePositionSelect = async (position: number) => {
    if (!mobileSelectEntry || disabled || saving) return

    const entryId = mobileSelectEntry.id
    const currentPosition = positionByEntryId[entryId]

    // If dropping on same position, just close
    if (currentPosition === position) {
      setMobileSelectEntry(null)
      return
    }

    // Build batch updates
    const updates: PodiumUpdate[] = []

    // If position is taken by another entry, clear it
    if (predictionsByPosition[position] && predictionsByPosition[position] !== entryId) {
      updates.push({ position, entryId: null })
    }

    // If entry was in another position, clear it
    if (currentPosition) {
      updates.push({ position: currentPosition, entryId: null })
    }

    // Set the new position
    updates.push({ position, entryId })

    await onSavePredictionsBatch(updates)
    setMobileSelectEntry(null)
  }

  const activeEntry = getActiveEntry()

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('space-y-6', className)}>
        {/* Podium Selection Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {positions.map((position) => (
            <DroppablePodiumSlot
              key={position}
              position={position}
              entry={getEntryForPosition(position)}
              onClear={(e) => handleClearPosition(position, e)}
              disabled={disabled}
              saving={saving}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            <GripVertical className="inline h-4 w-4 mr-1" />
            Drag cards to podium positions above
          </span>
          <span className="sm:hidden">Tap a card to assign it to a podium position</span>
        </div>

        {/* Entry List */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Available Entries:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {entries.map((entry) => {
              const assignedPosition = positionByEntryId[entry.id]

              return (
                <DraggableEntryCard
                  key={entry.id}
                  entry={entry}
                  selectedPosition={assignedPosition}
                  disabled={disabled || saving}
                  onTap={() => handleEntryTap(entry)}
                />
              )
            })}
          </div>
        </div>

        {saving && (
          <div className="text-center text-sm text-muted-foreground">
            Saving prediction...
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEntry ? (
          <div className="opacity-90">
            <EntryCardContent
              entry={activeEntry}
              selectedPosition={positionByEntryId[activeEntry.id]}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Mobile Position Selection Modal */}
      {mobileSelectEntry && (
        <MobilePositionModal
          entry={mobileSelectEntry}
          availablePositions={getAvailablePositions(mobileSelectEntry.id)}
          onSelect={handleMobilePositionSelect}
          onClose={() => setMobileSelectEntry(null)}
        />
      )}
    </DndContext>
  )
}
