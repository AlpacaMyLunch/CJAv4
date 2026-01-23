import { useState, useEffect } from 'react'
import {
  supabase,
  type ImsaClass,
  type ImsaManufacturer,
  type ImsaEntry,
  type ImsaClassWithEntries
} from '@/lib/supabase'

interface UseImsaEventDataReturn {
  classes: ImsaClassWithEntries[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useImsaEventData(eventId: string | null): UseImsaEventDataReturn {
  const [classes, setClasses] = useState<ImsaClassWithEntries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEventData = async () => {
    if (!eventId) {
      setClasses([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('imsa_classes')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order')

      if (classesError) {
        throw new Error(`Failed to fetch classes: ${classesError.message}`)
      }

      // Fetch manufacturers
      const { data: manufacturersData, error: mfrError } = await supabase
        .from('imsa_manufacturers')
        .select('*')
        .eq('event_id', eventId)

      if (mfrError) {
        throw new Error(`Failed to fetch manufacturers: ${mfrError.message}`)
      }

      // Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('imsa_entries')
        .select('*')
        .eq('event_id', eventId)
        .order('car_number')

      if (entriesError) {
        throw new Error(`Failed to fetch entries: ${entriesError.message}`)
      }

      // Combine data into ImsaClassWithEntries structure
      const classesWithEntries: ImsaClassWithEntries[] = (classesData || []).map(cls => {
        const classManufacturers = (manufacturersData || []).filter(
          (m: ImsaManufacturer) => m.class_id === cls.id
        )
        const classEntries = (entriesData || [])
          .filter((e: ImsaEntry) => e.class_id === cls.id)
          .map((entry: ImsaEntry) => ({
            ...entry,
            manufacturer: classManufacturers.find(
              (m: ImsaManufacturer) => m.id === entry.manufacturer_id
            )!,
            class: cls
          }))

        return {
          ...cls,
          entries: classEntries,
          manufacturers: classManufacturers
        }
      })

      setClasses(classesWithEntries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  return { classes, loading, error, refetch: fetchEventData }
}
