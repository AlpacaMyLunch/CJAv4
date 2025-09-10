import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type Schedule = {
  id: string
  season_id: string
  week: number
  track_id: string
  race_date?: string
  created_at?: string
  // Joined data
  season?: {
    season_number: number
    name?: string
    prediction_deadline: string
    starts_at?: string
  }
  track?: {
    name: string
  }
}

export function useCurrentRace() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentRace = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the current/upcoming race from the schedule
        // For now, let's get the first race from the latest season
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select(`
            *,
            season:seasons(*),
            track:tracks(*)
          `)
          .order('season_id', { ascending: false })
          .order('week', { ascending: true })
          .limit(1)
          .single()

        if (scheduleError) {
          throw new Error(`Failed to fetch schedule: ${scheduleError.message}`)
        }

        setSchedule(scheduleData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentRace()
  }, [])

  const deadline = schedule?.season?.prediction_deadline ? new Date(schedule.season.prediction_deadline) : new Date()
  const isDeadlinePassed = new Date() > deadline

  return {
    schedule,
    loading,
    error,
    deadline,
    isDeadlinePassed
  }
}