import type { ShopReview } from '@/lib/supabase'
import { useReviewsBase, type BaseRating } from './useReviewsBase'

export type ShopReviewWithDetails = ShopReview & {
  shop: {
    name: string
  }
  game: {
    name: string
    short_name: string
  }
  car_class: {
    name: string
  }
  ratings: BaseRating[]
}

/** Parameters needed to create/update a shop review */
interface ShopReviewInsertParams {
  shopId: string
  gameId: string
  carClassId: string
  comments: string | null
}

const SHOP_REVIEWS_SELECT_QUERY = `
  *,
  shop:setup_shops!inner (name),
  game:games!inner (name, short_name),
  car_class:car_classes!inner (name),
  ratings:review_ratings (
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

export function useShopReviews() {
  const baseHook = useReviewsBase<ShopReviewWithDetails, ShopReviewInsertParams>({
    reviewTable: 'shop_reviews',
    ratingsTable: 'review_ratings',
    selectQuery: SHOP_REVIEWS_SELECT_QUERY,
    reviewTypeName: 'review',
    buildInsertData: (userId, params, existingReviewId) => ({
      user_id: userId,
      shop_id: params.shopId,
      game_id: params.gameId,
      car_class_id: params.carClassId,
      comments: params.comments,
      is_current: true,
      supersedes_id: existingReviewId || null
    })
  })

  // Wrapper to maintain the original API signature
  const saveReview = async (
    shopId: string,
    gameId: string,
    carClassId: string,
    ratings: Record<string, number>,
    comments: string | null,
    existingReviewId?: string
  ) => {
    return baseHook.saveReview(
      { shopId, gameId, carClassId, comments },
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
