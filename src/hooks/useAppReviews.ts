import { useEffect, useState } from 'react'
import { supabase, type AppReview } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

export type AppReviewWithDetails = AppReview & {
  shop: {
    name: string
    has_app: boolean
  }
  ratings: Array<{
    id: string
    factor_id: string
    score: number
    factor: {
      name: string
      category: 'setup' | 'app'
      display_order: number
    }
  }>
}

export function useAppReviews() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [reviews, setReviews] = useState<AppReviewWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setReviews([])
      return
    }

    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: reviewsData, error: reviewsError } = await supabase
          .from('app_reviews')
          .select(`
            *,
            shop:setup_shops!inner (name, has_app),
            ratings:app_review_ratings (
              id,
              factor_id,
              score,
              factor:rating_factors (
                name,
                category,
                display_order
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('is_current', true)
          .order('created_at', { ascending: false })

        if (reviewsError) {
          throw new Error(`Failed to fetch app reviews: ${reviewsError.message}`)
        }

        setReviews(reviewsData || [])
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
    }

    fetchReviews()
  }, [user, addToast])

  const saveReview = async (
    shopId: string,
    ratings: Record<string, number>,
    comments: string | null,
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
          .from('app_reviews')
          .update({ is_current: false })
          .eq('id', existingReviewId)

        if (updateError) {
          throw new Error(`Failed to update old review: ${updateError.message}`)
        }
      }

      // Create new review
      const { data: newReview, error: insertError } = await supabase
        .from('app_reviews')
        .insert({
          user_id: user.id,
          shop_id: shopId,
          game_id: null,
          comments,
          is_current: true,
          supersedes_id: existingReviewId || null
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to save app review: ${insertError.message}`)
      }

      // Create app review ratings
      const ratingInserts = Object.entries(ratings).map(([factorId, score]) => ({
        review_id: newReview.id,
        factor_id: factorId,
        score
      }))

      const { error: ratingsError } = await supabase
        .from('app_review_ratings')
        .insert(ratingInserts)

      if (ratingsError) {
        throw new Error(`Failed to save ratings: ${ratingsError.message}`)
      }

      // Fetch the complete review with all joins
      const { data: completeReview, error: fetchError } = await supabase
        .from('app_reviews')
        .select(`
          *,
          shop:setup_shops!inner (name, has_app),
          ratings:app_review_ratings (
            id,
            factor_id,
            score,
            factor:rating_factors (
              name,
              category,
              display_order
            )
          )
        `)
        .eq('id', newReview.id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch updated review: ${fetchError.message}`)
      }

      // Update local state
      if (existingReviewId) {
        // Remove old review and add new one (new review has different ID)
        setReviews(prev =>
          [completeReview, ...prev.filter(r => r.id !== existingReviewId)]
        )
      } else {
        setReviews(prev => [completeReview, ...prev])
      }

      addToast({
        title: 'Success',
        description: existingReviewId ? 'App review updated successfully' : 'App review created successfully',
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

  const deleteReview = async (reviewId: string) => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('app_reviews')
        .update({ is_current: false })
        .eq('id', reviewId)

      if (updateError) {
        throw new Error(`Failed to delete app review: ${updateError.message}`)
      }

      // Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewId))

      addToast({
        title: 'Success',
        description: 'App review deleted successfully',
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
    deleteReview
  }
}
