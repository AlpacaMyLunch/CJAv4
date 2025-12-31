import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

/**
 * Configuration for the generic reviews hook
 */
export interface ReviewsConfig<TInsertData> {
  /** The main reviews table name (e.g., 'shop_reviews', 'app_reviews') */
  reviewTable: string
  /** The ratings junction table name (e.g., 'review_ratings', 'app_review_ratings') */
  ratingsTable: string
  /** The select query string for fetching reviews with joins */
  selectQuery: string
  /** Display name for toast messages (e.g., 'review', 'app review') */
  reviewTypeName: string
  /** Function to build insert data from the save parameters */
  buildInsertData: (userId: string, params: TInsertData, existingReviewId?: string) => Record<string, unknown>
}

/**
 * Base rating structure that all review types share
 */
export interface BaseRating {
  id: string
  factor_id: string
  score: number
  factor: {
    name: string
    category: 'setup' | 'app'
    display_order: number
  }
}

/**
 * Generic reviews hook that handles common CRUD operations for reviews.
 * This reduces duplicate code between useShopReviews and useAppReviews.
 */
export function useReviewsBase<TReview extends { id: string }, TInsertData>(
  config: ReviewsConfig<TInsertData>
) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [reviews, setReviews] = useState<TReview[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { reviewTable, ratingsTable, selectQuery, reviewTypeName, buildInsertData } = config

  // Fetch reviews for the current user
  const fetchReviews = useCallback(async () => {
    if (!user) {
      setReviews([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from(reviewTable)
        .select(selectQuery)
        .eq('user_id', user.id)
        .eq('is_current', true)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to fetch ${reviewTypeName}s: ${fetchError.message}`)
      }

      setReviews((data as unknown as TReview[]) || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      addToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user, reviewTable, selectQuery, reviewTypeName, addToast])

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Save a review (create or update)
  const saveReview = async (
    insertParams: TInsertData,
    ratings: Record<string, number>,
    existingReviewId?: string
  ) => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    try {
      setSaving(true)
      setError(null)

      // If editing existing review, set old review to not current
      if (existingReviewId) {
        const { error: updateError } = await supabase
          .from(reviewTable)
          .update({ is_current: false })
          .eq('id', existingReviewId)

        if (updateError) {
          throw new Error(`Failed to update old ${reviewTypeName}: ${updateError.message}`)
        }
      }

      // Create new review
      const insertData = buildInsertData(user.id, insertParams, existingReviewId)
      const { data: newReview, error: insertError } = await supabase
        .from(reviewTable)
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to save ${reviewTypeName}: ${insertError.message}`)
      }

      // Create review ratings
      const ratingInserts = Object.entries(ratings).map(([factorId, score]) => ({
        review_id: newReview.id,
        factor_id: factorId,
        score
      }))

      const { error: ratingsError } = await supabase
        .from(ratingsTable)
        .insert(ratingInserts)

      if (ratingsError) {
        throw new Error(`Failed to save ratings: ${ratingsError.message}`)
      }

      // Fetch the complete review with all joins
      const { data: completeReview, error: fetchError } = await supabase
        .from(reviewTable)
        .select(selectQuery)
        .eq('id', newReview.id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch updated ${reviewTypeName}: ${fetchError.message}`)
      }

      // Update local state
      if (existingReviewId) {
        setReviews(prev => [completeReview as unknown as TReview, ...prev.filter(r => r.id !== existingReviewId)])
      } else {
        setReviews(prev => [completeReview as unknown as TReview, ...prev])
      }

      addToast({
        title: 'Success',
        description: existingReviewId
          ? `${reviewTypeName.charAt(0).toUpperCase() + reviewTypeName.slice(1)} updated successfully`
          : `${reviewTypeName.charAt(0).toUpperCase() + reviewTypeName.slice(1)} created successfully`,
        variant: 'success'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      addToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Delete a review (soft delete by setting is_current to false)
  const deleteReview = async (reviewId: string) => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from(reviewTable)
        .update({ is_current: false })
        .eq('id', reviewId)

      if (updateError) {
        throw new Error(`Failed to delete ${reviewTypeName}: ${updateError.message}`)
      }

      setReviews(prev => prev.filter(r => r.id !== reviewId))

      addToast({
        title: 'Success',
        description: `${reviewTypeName.charAt(0).toUpperCase() + reviewTypeName.slice(1)} deleted successfully`,
        variant: 'success'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      addToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    reviews,
    loading,
    error,
    saving,
    saveReview,
    deleteReview,
    refetch: fetchReviews
  }
}
