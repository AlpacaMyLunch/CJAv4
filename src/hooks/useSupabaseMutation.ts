import { useState, useCallback } from 'react'
import { useToast } from './useToast'

export interface UseSupabaseMutationOptions<TData, TVariables> {
  /**
   * The mutation function to execute. Should throw an error if the mutation fails.
   */
  mutationFn: (variables: TVariables) => Promise<TData>

  /**
   * Whether to show a success toast when the mutation succeeds
   * @default false
   */
  showSuccessToast?: boolean

  /**
   * Whether to show an error toast when the mutation fails
   * @default true
   */
  showErrorToast?: boolean

  /**
   * Custom success message to show in the toast
   */
  successMessage?: string

  /**
   * Custom error message to show in the toast
   */
  errorMessage?: string

  /**
   * Callback function to run when the mutation succeeds
   */
  onSuccess?: (data: TData, variables: TVariables) => void

  /**
   * Callback function to run when the mutation fails
   */
  onError?: (error: Error, variables: TVariables) => void

  /**
   * Callback function to run when the mutation is settled (success or error)
   */
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
}

export interface UseSupabaseMutationResult<TData, TVariables> {
  /**
   * The data returned from the mutation
   */
  data: TData | null

  /**
   * Whether the mutation is currently in progress
   */
  loading: boolean

  /**
   * Error message if the mutation failed
   */
  error: string | null

  /**
   * Function to execute the mutation
   */
  mutate: (variables: TVariables) => Promise<void>

  /**
   * Function to reset the mutation state
   */
  reset: () => void
}

/**
 * Generic hook for executing Supabase mutations with loading, error handling, and toast notifications
 *
 * @example
 * ```tsx
 * const { mutate, loading, error } = useSupabaseMutation({
 *   mutationFn: async ({ shopId, gameId, ratings }) => {
 *     const { data, error } = await supabase
 *       .from('shop_reviews')
 *       .insert({ shop_id: shopId, game_id: gameId, ratings })
 *       .select()
 *       .single()
 *
 *     if (error) throw new Error(`Failed to save review: ${error.message}`)
 *     return data
 *   },
 *   showSuccessToast: true,
 *   successMessage: 'Review saved successfully',
 *   onSuccess: (data) => {
 *     // Invalidate or refetch related queries
 *   }
 * })
 *
 * // Use it
 * await mutate({ shopId: '123', gameId: '456', ratings: {...} })
 * ```
 */
export function useSupabaseMutation<TData = unknown, TVariables = void>({
  mutationFn,
  showSuccessToast = false,
  showErrorToast = true,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  onSettled
}: UseSupabaseMutationOptions<TData, TVariables>): UseSupabaseMutationResult<TData, TVariables> {
  const { addToast } = useToast()
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        setLoading(true)
        setError(null)

        const result = await mutationFn(variables)
        setData(result)

        if (showSuccessToast) {
          addToast({
            title: 'Success',
            description: successMessage || 'Operation completed successfully',
            variant: 'success'
          })
        }

        if (onSuccess) {
          onSuccess(result, variables)
        }

        if (onSettled) {
          onSettled(result, null, variables)
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
          onError(err, variables)
        }

        if (onSettled) {
          onSettled(null, err instanceof Error ? err : new Error(errorMsg), variables)
        }

        throw err
      } finally {
        setLoading(false)
      }
    },
    [mutationFn, showSuccessToast, showErrorToast, successMessage, errorMessage, onSuccess, onError, onSettled, addToast]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    mutate,
    reset
  }
}
