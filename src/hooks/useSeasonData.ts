import { useEffect, useState } from 'react'
import { supabase, type Season, type Track } from '@/lib/supabase'

export function useSeasonData() {
  const [season, setSeason] = useState<Season | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the season with the highest season number
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('*')
          .order('season_number', { ascending: false })
          .limit(1)
          .single()

        if (seasonError) {
          throw new Error(`Failed to fetch season: ${seasonError.message}`)
        }

        setSeason(seasonData)

        // Then fetch all tracks
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('id, name')
          .order('name')

        if (tracksError) {
          throw new Error(`Failed to fetch tracks: ${tracksError.message}`)
        }

        setTracks(tracksData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSeasonData()
  }, [])

  return {
    season,
    tracks,
    loading,
    error
  }
}