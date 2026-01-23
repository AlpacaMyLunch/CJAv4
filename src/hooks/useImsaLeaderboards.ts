import { useState } from 'react'
import {
  supabase,
  type ImsaEventLeaderboardRow,
  type ImsaSeasonLeaderboardRow,
  type ImsaAllTimeLeaderboardRow
} from '@/lib/supabase'

interface UseImsaLeaderboardsReturn {
  eventLeaderboard: ImsaEventLeaderboardRow[]
  seasonLeaderboard: ImsaSeasonLeaderboardRow[]
  allTimeLeaderboard: ImsaAllTimeLeaderboardRow[]
  loading: boolean
  error: string | null
  fetchEventLeaderboard: (eventId: string) => Promise<void>
  fetchSeasonLeaderboard: (year: number) => Promise<void>
  fetchAllTimeLeaderboard: () => Promise<void>
}

export function useImsaLeaderboards(): UseImsaLeaderboardsReturn {
  const [eventLeaderboard, setEventLeaderboard] = useState<ImsaEventLeaderboardRow[]>([])
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<ImsaSeasonLeaderboardRow[]>([])
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<ImsaAllTimeLeaderboardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEventLeaderboard = async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('imsa_event_leaderboard')
        .select('*')
        .eq('event_id', eventId)
        .order('rank')

      if (fetchError) {
        throw new Error(`Failed to fetch event leaderboard: ${fetchError.message}`)
      }

      setEventLeaderboard(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchSeasonLeaderboard = async (year: number) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('imsa_season_leaderboard')
        .select('*')
        .eq('year', year)
        .order('rank')

      if (fetchError) {
        throw new Error(`Failed to fetch season leaderboard: ${fetchError.message}`)
      }

      setSeasonLeaderboard(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTimeLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('imsa_all_time_leaderboard')
        .select('*')
        .order('rank')

      if (fetchError) {
        throw new Error(`Failed to fetch all-time leaderboard: ${fetchError.message}`)
      }

      setAllTimeLeaderboard(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return {
    eventLeaderboard,
    seasonLeaderboard,
    allTimeLeaderboard,
    loading,
    error,
    fetchEventLeaderboard,
    fetchSeasonLeaderboard,
    fetchAllTimeLeaderboard
  }
}
