import { useState, useEffect } from 'react'
import { supabase, type Prediction } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function usePredictions(seasonId: string | null) {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !seasonId) {
      setPredictions([])
      return
    }

    const fetchPredictions = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('nostradouglas')
          .select('*')
          .eq('user_id', user.id)
          .eq('season_id', seasonId)
          .order('position')

        if (fetchError) {
          throw new Error(`Failed to fetch predictions: ${fetchError.message}`)
        }

        setPredictions(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [user, seasonId])

  const savePredictions = async (trackPredictions: { trackId: string; position: number }[]) => {
    if (!user || !seasonId) {
      throw new Error('User must be authenticated and season must be selected')
    }

    try {
      setLoading(true)
      setError(null)

      // Delete existing predictions for this user and season
      const { error: deleteError } = await supabase
        .from('nostradouglas')
        .delete()
        .eq('user_id', user.id)
        .eq('season_id', seasonId)

      if (deleteError) {
        throw new Error(`Failed to clear existing predictions: ${deleteError.message}`)
      }

      // Insert new predictions
      const predictionsToInsert = trackPredictions.map(prediction => ({
        user_id: user.id,
        season_id: seasonId,
        track_id: prediction.trackId,
        position: prediction.position
      }))

      const { data, error: insertError } = await supabase
        .from('nostradouglas')
        .insert(predictionsToInsert)
        .select()

      if (insertError) {
        throw new Error(`Failed to save predictions: ${insertError.message}`)
      }

      setPredictions(data || [])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    predictions,
    loading,
    error,
    savePredictions
  }
}