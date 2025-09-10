import { useState, useEffect } from 'react'
import { supabase, type DriverPublic, type RacePrediction } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useRacePredictions(scheduleId: string | null) {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<DriverPublic[]>([])
  const [predictions, setPredictions] = useState<RacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch drivers and existing predictions
  useEffect(() => {
    if (!scheduleId) {
      setDrivers([])
      setPredictions([])
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all drivers using public view
        const { data: driversData, error: driversError } = await supabase
          .from('drivers_public')
          .select('*')
          .order('division, division_split, driver_number')

        if (driversError) {
          throw new Error(`Failed to fetch drivers: ${driversError.message}`)
        }

        setDrivers(driversData || [])

        // Fetch user's existing predictions if authenticated
        if (user) {
          const { data: predictionsData, error: predictionsError } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .eq('schedule_id', scheduleId)

          if (predictionsError) {
            throw new Error(`Failed to fetch predictions: ${predictionsError.message}`)
          }

          setPredictions(predictionsData || [])
        } else {
          setPredictions([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, scheduleId])

  const savePrediction = async (division: number, split: 'Gold' | 'Silver', driverId: string) => {
    if (!user || !scheduleId) {
      throw new Error('User must be authenticated and schedule must be selected')
    }

    try {
      setSaving(true)
      setError(null)

      // Check if prediction already exists for this division/split
      const existingPrediction = predictions.find(
        p => p.division === division && p.split === split
      )

      if (existingPrediction) {
        // Update existing prediction
        const { data, error: updateError } = await supabase
          .from('predictions')
          .update({ 
            driver_id: driverId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrediction.id)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Failed to update prediction: ${updateError.message}`)
        }

        // Update local state
        setPredictions(prev => 
          prev.map(p => p.id === existingPrediction.id ? data : p)
        )
      } else {
        // Create new prediction
        const { data, error: insertError } = await supabase
          .from('predictions')
          .insert({
            user_id: user.id,
            schedule_id: scheduleId,
            division,
            split,
            driver_id: driverId
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to save prediction: ${insertError.message}`)
        }

        // Update local state
        setPredictions(prev => [...prev, data])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const getPredictionForDivisionSplit = (division: number, split: 'Gold' | 'Silver') => {
    return predictions.find(p => p.division === division && p.split === split)
  }

  const getDriversForDivisionSplit = (division: number, split: 'Gold' | 'Silver'): DriverPublic[] => {
    return drivers.filter(d => d.division === division && d.division_split === split)
  }

  const deletePrediction = async (division: number, split: 'Gold' | 'Silver') => {
    if (!user || !scheduleId) {
      throw new Error('User must be authenticated and schedule must be selected')
    }

    try {
      setSaving(true)
      setError(null)

      // Find existing prediction
      const existingPrediction = predictions.find(
        p => p.division === division && p.split === split
      )

      if (!existingPrediction) {
        throw new Error('No prediction found to delete')
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('predictions')
        .delete()
        .eq('id', existingPrediction.id)

      if (deleteError) {
        throw new Error(`Failed to delete prediction: ${deleteError.message}`)
      }

      // Update local state
      setPredictions(prev => prev.filter(p => p.id !== existingPrediction.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    drivers,
    predictions,
    loading,
    saving,
    error,
    savePrediction,
    deletePrediction,
    getPredictionForDivisionSplit,
    getDriversForDivisionSplit
  }
}