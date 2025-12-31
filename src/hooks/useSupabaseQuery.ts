import { useEffect, useState, useCallback } from 'react'
import type { DependencyList } from 'react'
import { useToast } from './useToast'

export interface UseSupabaseQueryOptions<T> {
  /**
   * The query function to execute. Should throw an error if the query fails.
   */
  queryFn: () => Promise<T>

  /**
   * Dependencies that trigger a refetch when changed
   */
  deps?: DependencyList

  /**
   * Whether to show an error toast when the query fails
   * @default true
   */
  showErrorToast?: boolean

  /**
   * Whether to execute the query immediately on mount
   * @default true
   */
  enabled?: boolean

  /**
   * Custom error message to show in the toast
   */
  errorMessage?: string

  /**
   * Callback function to run when the query succeeds
   */
  onSuccess?: (data: T) => void

  /**
   * Callback function to run when the query fails
   */
  onError?: (error: Error) => void
}

export interface UseSupabaseQueryResult<T> {
  /**
   * The data returned from the query
   */
  data: T | null

  /**
   * Whether the query is currently loading
   */
  loading: boolean

  /**
   * Error message if the query failed
   */
  error: string | null

  /**
   * Function to manually trigger a refetch
   */
  refetch: () => Promise<void>
}

/**
 * Generic hook for executing Supabase queries with loading, error handling, and toast notifications
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useSupabaseQuery({
 *   queryFn: async () => {
 *     const { data, error } = await supabase
 *       .from('seasons')
 *       .select('*')
 *       .order('season_number', { ascending: false })
 *       .limit(1)
 *
 *     if (error) throw new Error(`Failed to fetch season: ${error.message}`)
 *     if (!data || data.length === 0) throw new Error('No season found')
 *
 *     return data[0]
 *   },
 *   deps: [],
 *   showErrorToast: true
 * })
 * ```
 */
export function useSupabaseQuery<T>({
  queryFn,
  deps = [],
  showErrorToast = true,
  enabled = true,
  errorMessage,
  onSuccess,
  onError
}: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const { addToast } = useToast()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await queryFn()
      setData(result)

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)

      if (showErrorToast) {
        addToast({
          title: 'Error',
          description: errorMessage || errorMsg,
          variant: 'destructive'
        })
      }

      if (onError && err instanceof Error) {
        onError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [queryFn, showErrorToast, errorMessage, onSuccess, onError, addToast])

  useEffect(() => {
    if (enabled) {
      executeQuery()
    }
  }, [enabled, executeQuery, ...deps])

  return {
    data,
    loading,
    error,
    refetch: executeQuery
  }
}
