import { useState, useEffect } from 'react'
import { supabase, type ImsaEvent } from '@/lib/supabase'

interface UseImsaEventsReturn {
  events: ImsaEvent[]
  activeEvent: ImsaEvent | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useImsaEvents(): UseImsaEventsReturn {
  const [events, setEvents] = useState<ImsaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('imsa_events')
        .select('*')
        .order('green_flag_time', { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to fetch IMSA events: ${fetchError.message}`)
      }

      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const activeEvent = events.find(e => e.is_active) || null

  return { events, activeEvent, loading, error, refetch: fetchEvents }
}
