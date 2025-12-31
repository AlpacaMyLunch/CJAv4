/**
 * EXAMPLE: Refactored useSeasonData using useSupabaseQuery
 *
 * This file demonstrates how to refactor the existing useSeasonData hook
 * to use the new generic useSupabaseQuery hook.
 *
 * BEFORE (original - 60 lines):
 * - Manual loading state management
 * - Manual error state management
 * - Manual try-catch blocks
 * - No error toast
 * - No refetch capability
 *
 * AFTER (refactored - ~40 lines for multiple queries):
 * - Automatic loading/error state
 * - Error toast on failure
 * - Refetch capability
 * - Cleaner, more focused code
 */

import { supabase, type Season, type Track } from '@/lib/supabase'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useSeasonData() {
  // For the season query
  const {
    data: season,
    loading: seasonLoading,
    error: seasonError,
    refetch: refetchSeason
  } = useSupabaseQuery<Season>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(`Failed to fetch season: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No season found')
      }

      return data[0]
    },
    deps: [],
    showErrorToast: true
  })

  // For the tracks query (depends on having fetched season data)
  const {
    data: tracks,
    loading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks
  } = useSupabaseQuery<Track[]>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, name')
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch tracks: ${error.message}`)
      }

      return data || []
    },
    deps: [],
    showErrorToast: true
  })

  // Combine loading and error states
  const loading = seasonLoading || tracksLoading
  const error = seasonError || tracksError

  // Provide a refetch function that refetches both
  const refetch = async () => {
    await Promise.all([refetchSeason(), refetchTracks()])
  }

  return {
    season,
    tracks: tracks || [],
    loading,
    error,
    refetch
  }
}

/**
 * ALTERNATIVE APPROACH: Sequential queries
 *
 * If tracks need to be fetched ONLY after season is loaded,
 * you can use the enabled option:
 */
export function useSeasonDataSequential() {
  const {
    data: season,
    loading: seasonLoading,
    error: seasonError
  } = useSupabaseQuery<Season>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (error) throw new Error(`Failed to fetch season: ${error.message}`)
      if (!data || data.length === 0) throw new Error('No season found')

      return data[0]
    },
    deps: []
  })

  // Only fetch tracks after season is loaded
  const {
    data: tracks,
    loading: tracksLoading,
    error: tracksError
  } = useSupabaseQuery<Track[]>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, name')
        .order('name')

      if (error) throw new Error(`Failed to fetch tracks: ${error.message}`)
      return data || []
    },
    deps: [],
    enabled: !!season // Only fetch if season exists
  })

  return {
    season,
    tracks: tracks || [],
    loading: seasonLoading || tracksLoading,
    error: seasonError || tracksError
  }
}

/**
 * ADVANCED EXAMPLE: Single query with multiple results
 *
 * For cases where you need to fetch multiple pieces of data
 * in a single query function:
 */
export function useSeasonDataCombined() {
  const { data, loading, error, refetch } = useSupabaseQuery<{
    season: Season
    tracks: Track[]
  }>({
    queryFn: async () => {
      // Fetch season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (seasonError) {
        throw new Error(`Failed to fetch season: ${seasonError.message}`)
      }
      if (!seasonData || seasonData.length === 0) {
        throw new Error('No season found')
      }

      // Fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('id, name')
        .order('name')

      if (tracksError) {
        throw new Error(`Failed to fetch tracks: ${tracksError.message}`)
      }

      return {
        season: seasonData[0],
        tracks: tracksData || []
      }
    },
    deps: [],
    showErrorToast: true
  })

  return {
    season: data?.season || null,
    tracks: data?.tracks || [],
    loading,
    error,
    refetch
  }
}
