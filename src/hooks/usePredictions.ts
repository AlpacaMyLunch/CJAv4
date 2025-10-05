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

      // Fetch season to check week 1 deadline
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('week_1_prediction_deadline')
        .eq('id', seasonId)
        .single()

      if (seasonError) {
        throw new Error(`Failed to fetch season: ${seasonError.message}`)
      }

      // Check if week 1 deadline has passed
      const week1Deadline = seasonData?.week_1_prediction_deadline ? new Date(seasonData.week_1_prediction_deadline) : null
      const isWeek1DeadlinePassed = week1Deadline ? new Date() > week1Deadline : false

      // Fetch existing predictions to see if user already has predictions
      const { data: existingPredictions, error: fetchError } = await supabase
        .from('nostradouglas')
        .select('*')
        .eq('user_id', user.id)
        .eq('season_id', seasonId)

      if (fetchError) {
        throw new Error(`Failed to fetch existing predictions: ${fetchError.message}`)
      }

      // Check if week 1 deadline has passed
      if (isWeek1DeadlinePassed) {
        // If user has existing predictions, preserve the week 1 prediction
        if (existingPredictions && existingPredictions.length > 0) {
          const existingWeek1 = existingPredictions.find(p => p.position === 1)
          const newWeek1 = trackPredictions.find(p => p.position === 1)

          // Check if they're trying to change week 1 prediction
          if (existingWeek1 && newWeek1 && existingWeek1.track_id !== newWeek1.trackId) {
            throw new Error('The deadline for week 1 predictions has passed. You cannot change your week 1 prediction.')
          }
        } else {
          // New predictions after week 1 deadline - block if they include week 1
          const hasWeek1 = trackPredictions.some(p => p.position === 1)
          if (hasWeek1) {
            throw new Error('The deadline for week 1 predictions has passed. You can no longer submit new predictions with a week 1 selection.')
          }
        }
      }

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