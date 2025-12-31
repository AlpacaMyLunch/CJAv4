import type { AppReview } from '@/lib/supabase'
import { useReviewsBase, type BaseRating } from './useReviewsBase'

export type AppReviewWithDetails = AppReview & {
  shop: {
    name: string
    has_app: boolean
  }
  ratings: BaseRating[]
}

/** Parameters needed to create/update an app review */
interface AppReviewInsertParams {
  shopId: string
  comments: string | null
}

const APP_REVIEWS_SELECT_QUERY = `
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
`

export function useAppReviews() {
  const baseHook = useReviewsBase<AppReviewWithDetails, AppReviewInsertParams>({
    reviewTable: 'app_reviews',
    ratingsTable: 'app_review_ratings',
    selectQuery: APP_REVIEWS_SELECT_QUERY,
    reviewTypeName: 'app review',
    buildInsertData: (userId, params, existingReviewId) => ({
      user_id: userId,
      shop_id: params.shopId,
      game_id: null,
      comments: params.comments,
      is_current: true,
      supersedes_id: existingReviewId || null
    })
  })

  // Wrapper to maintain the original API signature
  const saveReview = async (
    shopId: string,
    ratings: Record<string, number>,
    comments: string | null,
    existingReviewId?: string
  ) => {
    return baseHook.saveReview(
      { shopId, comments },
      ratings,
      existingReviewId
    )
  }

  return {
    reviews: baseHook.reviews,
    loading: baseHook.loading,
    error: baseHook.error,
    saving: baseHook.saving,
    saveReview,
    deleteReview: baseHook.deleteReview
  }
}
