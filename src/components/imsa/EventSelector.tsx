import { Calendar, Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ImsaEvent } from '@/lib/supabase'

interface EventSelectorProps {
  events: ImsaEvent[]
  selectedEventId: string | null
  onSelectEvent: (eventId: string) => void
  loading?: boolean
  className?: string
}

export function EventSelector({
  events,
  selectedEventId,
  onSelectEvent,
  loading,
  className
}: EventSelectorProps) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="text-sm font-medium text-muted-foreground">Select Event</div>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  const now = new Date()

  const getEventStatus = (event: ImsaEvent) => {
    const deadline = new Date(event.prediction_deadline)
    const isPastDeadline = now > deadline
    return { isPastDeadline }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Select Event
      </label>
      <Select value={selectedEventId || ''} onValueChange={onSelectEvent}>
        <SelectTrigger>
          <SelectValue placeholder="Choose an event..." />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => {
            const { isPastDeadline } = getEventStatus(event)

            return (
              <SelectItem key={event.id} value={event.id}>
                <div className="flex items-center gap-2">
                  <span>{event.name} ({event.year})</span>
                  {event.is_active && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                  {isPastDeadline && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
