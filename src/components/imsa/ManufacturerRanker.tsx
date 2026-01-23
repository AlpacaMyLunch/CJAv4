import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { type ImsaManufacturer, type ImsaManufacturerPrediction } from '@/lib/supabase'

interface ManufacturerRankUpdate {
  manufacturerId: string
  rank: number
}

interface ManufacturerRankerProps {
  manufacturers: ImsaManufacturer[]
  predictions: ImsaManufacturerPrediction[]
  onSavePredictionsBatch: (updates: ManufacturerRankUpdate[]) => Promise<boolean>
  disabled?: boolean
  saving?: boolean
  className?: string
}

interface SortableManufacturerItemProps {
  manufacturer: ImsaManufacturer
  rank: number
  disabled?: boolean
}

function SortableManufacturerItem({ manufacturer, rank, disabled }: SortableManufacturerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: manufacturer.id,
    disabled
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-3 bg-primary/5 border-primary/20',
        isDragging && 'opacity-50 shadow-lg z-50',
        !disabled && 'cursor-grab active:cursor-grabbing'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold bg-primary text-primary-foreground">
          {rank}
        </span>
        <span className="font-medium text-card-foreground">{manufacturer.name}</span>
      </div>
      {!disabled && (
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      )}
    </Card>
  )
}

function ManufacturerItemOverlay({ manufacturer, rank }: { manufacturer: ImsaManufacturer; rank: number }) {
  return (
    <Card className="flex items-center justify-between p-3 bg-primary/10 border-primary shadow-xl rotate-2 scale-105">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold bg-primary text-primary-foreground">
          {rank}
        </span>
        <span className="font-medium text-card-foreground">{manufacturer.name}</span>
      </div>
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </Card>
  )
}

export function ManufacturerRanker({
  manufacturers,
  predictions,
  onSavePredictionsBatch,
  disabled,
  saving,
  className
}: ManufacturerRankerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5
      }
    })
  )

  // Build ranked list from predictions
  const predictionMap = new Map(predictions.map(p => [p.manufacturer_id, p.predicted_rank]))

  // Sort manufacturers by their predicted rank, unranked ones go to the end
  const rankedManufacturers = [...manufacturers].sort((a, b) => {
    const rankA = predictionMap.get(a.id) ?? Infinity
    const rankB = predictionMap.get(b.id) ?? Infinity
    return rankA - rankB
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)

    if (disabled || saving) return

    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = rankedManufacturers.findIndex(m => m.id === active.id)
    const newIndex = rankedManufacturers.findIndex(m => m.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Calculate the new order
    const reordered = arrayMove(rankedManufacturers, oldIndex, newIndex)

    // Batch save all rankings at once
    const updates: ManufacturerRankUpdate[] = reordered.map((m, i) => ({
      manufacturerId: m.id,
      rank: i + 1
    }))

    await onSavePredictionsBatch(updates)
  }

  const activeManufacturer = activeId ? manufacturers.find(m => m.id === activeId) : null
  const activeRank = activeId ? rankedManufacturers.findIndex(m => m.id === activeId) + 1 : 0

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('space-y-3', className)}>
        {!disabled && (
          <p className="text-xs text-muted-foreground text-center">
            Drag to reorder
          </p>
        )}

        <SortableContext
          items={rankedManufacturers.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {rankedManufacturers.map((manufacturer, index) => (
              <SortableManufacturerItem
                key={manufacturer.id}
                manufacturer={manufacturer}
                rank={index + 1}
                disabled={disabled || saving}
              />
            ))}
          </div>
        </SortableContext>

        {saving && (
          <div className="text-center text-sm text-muted-foreground">
            Saving ranking...
          </div>
        )}
      </div>

      <DragOverlay>
        {activeManufacturer ? (
          <ManufacturerItemOverlay
            manufacturer={activeManufacturer}
            rank={activeRank}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
