import { useState, useEffect } from 'react'
import { supabase, type ImsaPodiumPrediction, type ImsaManufacturerPrediction } from '@/lib/supabase'

interface ManufacturerRankUpdate {
  manufacturerId: string
  rank: number
}

interface PodiumUpdate {
  position: number
  entryId: string | null // null means delete
}

interface UseImsaPredictionsReturn {
  podiumPredictions: ImsaPodiumPrediction[]
  manufacturerPredictions: ImsaManufacturerPrediction[]
  loading: boolean
  saving: boolean
  error: string | null
  savePodiumPrediction: (classId: string, position: number, entryId: string) => Promise<boolean>
  savePodiumPredictionsBatch: (classId: string, updates: PodiumUpdate[]) => Promise<boolean>
  saveManufacturerPrediction: (classId: string, manufacturerId: string, rank: number) => Promise<boolean>
  saveManufacturerPredictionsBatch: (classId: string, updates: ManufacturerRankUpdate[]) => Promise<boolean>
  deletePodiumPrediction: (classId: string, position: number) => Promise<boolean>
  deleteManufacturerPrediction: (classId: string, manufacturerId: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useImsaPredictions(eventId: string | null, userId: string | null): UseImsaPredictionsReturn {
  const [podiumPredictions, setPodiumPredictions] = useState<ImsaPodiumPrediction[]>([])
  const [manufacturerPredictions, setManufacturerPredictions] = useState<ImsaManufacturerPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = async () => {
    if (!eventId || !userId) {
      setPodiumPredictions([])
      setManufacturerPredictions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: podiumData, error: podiumError } = await supabase
        .from('imsa_podium_predictions')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (podiumError) {
        throw new Error(`Failed to fetch podium predictions: ${podiumError.message}`)
      }

      const { data: mfrData, error: mfrError } = await supabase
        .from('imsa_manufacturer_predictions')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (mfrError) {
        throw new Error(`Failed to fetch manufacturer predictions: ${mfrError.message}`)
      }

      setPodiumPredictions(podiumData || [])
      setManufacturerPredictions(mfrData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
  }, [eventId, userId])

  const savePodiumPrediction = async (classId: string, position: number, entryId: string): Promise<boolean> => {
    if (!eventId || !userId) return false

    try {
      setSaving(true)
      setError(null)

      const { error: upsertError } = await supabase
        .from('imsa_podium_predictions')
        .upsert(
          {
            user_id: userId,
            event_id: eventId,
            class_id: classId,
            position,
            entry_id: entryId,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,event_id,class_id,position'
          }
        )

      if (upsertError) {
        throw new Error(`Failed to save podium prediction: ${upsertError.message}`)
      }

      await fetchPredictions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  const savePodiumPredictionsBatch = async (
    classId: string,
    updates: PodiumUpdate[]
  ): Promise<boolean> => {
    if (!eventId || !userId || updates.length === 0) return false

    try {
      setSaving(true)
      setError(null)

      // Separate deletes and upserts
      const deletes = updates.filter(u => u.entryId === null)
      const upserts = updates.filter(u => u.entryId !== null)

      // Process deletes
      if (deletes.length > 0) {
        const positions = deletes.map(d => d.position)
        const { error: deleteError } = await supabase
          .from('imsa_podium_predictions')
          .delete()
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .eq('class_id', classId)
          .in('position', positions)

        if (deleteError) {
          throw new Error(`Failed to delete podium predictions: ${deleteError.message}`)
        }
      }

      // Process upserts
      if (upserts.length > 0) {
        const records = upserts.map(({ position, entryId }) => ({
          user_id: userId,
          event_id: eventId,
          class_id: classId,
          position,
          entry_id: entryId,
          updated_at: new Date().toISOString()
        }))

        const { error: upsertError } = await supabase
          .from('imsa_podium_predictions')
          .upsert(records, {
            onConflict: 'user_id,event_id,class_id,position'
          })

        if (upsertError) {
          throw new Error(`Failed to save podium predictions: ${upsertError.message}`)
        }
      }

      await fetchPredictions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveManufacturerPrediction = async (
    classId: string,
    manufacturerId: string,
    rank: number
  ): Promise<boolean> => {
    if (!eventId || !userId) return false

    try {
      setSaving(true)
      setError(null)

      const { error: upsertError } = await supabase
        .from('imsa_manufacturer_predictions')
        .upsert(
          {
            user_id: userId,
            event_id: eventId,
            class_id: classId,
            manufacturer_id: manufacturerId,
            predicted_rank: rank,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,event_id,class_id,manufacturer_id'
          }
        )

      if (upsertError) {
        throw new Error(`Failed to save manufacturer prediction: ${upsertError.message}`)
      }

      await fetchPredictions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveManufacturerPredictionsBatch = async (
    classId: string,
    updates: ManufacturerRankUpdate[]
  ): Promise<boolean> => {
    if (!eventId || !userId || updates.length === 0) return false

    try {
      setSaving(true)
      setError(null)

      const records = updates.map(({ manufacturerId, rank }) => ({
        user_id: userId,
        event_id: eventId,
        class_id: classId,
        manufacturer_id: manufacturerId,
        predicted_rank: rank,
        updated_at: new Date().toISOString()
      }))

      const { error: upsertError } = await supabase
        .from('imsa_manufacturer_predictions')
        .upsert(records, {
          onConflict: 'user_id,event_id,class_id,manufacturer_id'
        })

      if (upsertError) {
        throw new Error(`Failed to save manufacturer predictions: ${upsertError.message}`)
      }

      await fetchPredictions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  const deletePodiumPrediction = async (classId: string, position: number): Promise<boolean> => {
    if (!eventId || !userId) return false

    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('imsa_podium_predictions')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('class_id', classId)
        .eq('position', position)

      if (deleteError) {
        throw new Error(`Failed to delete podium prediction: ${deleteError.message}`)
      }

      await fetchPredictions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  const deleteManufacturerPrediction = async (classId: string, manufacturerId: string): Promise<boolean> => {
    if (!eventId || !userId) return false

    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('imsa_manufacturer_predictions')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('class_id', classId)
        .eq('manufacturer_id', manufacturerId)

      if (deleteError) {
        throw new Error(`Failed to delete manufacturer prediction: ${deleteError.message}`)
      }

      await fetchPredictions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    podiumPredictions,
    manufacturerPredictions,
    loading,
    saving,
    error,
    savePodiumPrediction,
    savePodiumPredictionsBatch,
    saveManufacturerPrediction,
    saveManufacturerPredictionsBatch,
    deletePodiumPrediction,
    deleteManufacturerPrediction,
    refetch: fetchPredictions
  }
}
