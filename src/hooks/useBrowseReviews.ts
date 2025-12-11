import { useState, useEffect } from 'react'
import { supabase, type ShopReview, type AppReview } from '@/lib/supabase'

export type BrowseShopReview = ShopReview & {
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
  reviewer_display_name: string
}

export type BrowseAppReview = AppReview & {
  shop: {
    name: string
    has_app: boolean
  }
  game: {
    name: string
    short_name: string
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
  reviewer_display_name: string
}

interface Filters {
  shopId?: string
  gameId?: string
  carClassId?: string
}

export function useBrowseReviews(filters?: Filters) {
  const [shopReviews, setShopReviews] = useState<BrowseShopReview[]>([])
  const [appReviews, setAppReviews] = useState<BrowseAppReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch shop reviews
      let shopQuery = supabase
        .from('shop_reviews')
        .select(`
          *,
          shop:setup_shops!inner (name),
          game:games!inner (name, short_name),
          car_class:car_classes!inner (name),
          review_ratings (
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
        .eq('is_current', true)

      // Apply filters
      if (filters?.shopId) {
        shopQuery = shopQuery.eq('shop_id', filters.shopId)
      }
      if (filters?.gameId) {
        shopQuery = shopQuery.eq('game_id', filters.gameId)
      }
      if (filters?.carClassId) {
        shopQuery = shopQuery.eq('car_class_id', filters.carClassId)
      }

      const { data: shopData, error: shopError } = await shopQuery
        .order('updated_at', { ascending: false })

      if (shopError) {
        throw new Error(`Failed to fetch shop reviews: ${shopError.message}`)
      }

      // Fetch app reviews
      let appQuery = supabase
        .from('app_reviews')
        .select(`
          *,
          shop:setup_shops!inner (name, has_app),
          game:games!inner (name, short_name),
          app_review_ratings (
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
        .eq('is_current', true)

      // Apply filters (no car class for app reviews)
      if (filters?.shopId) {
        appQuery = appQuery.eq('shop_id', filters.shopId)
      }
      if (filters?.gameId) {
        appQuery = appQuery.eq('game_id', filters.gameId)
      }

      const { data: appData, error: appError } = await appQuery
        .order('updated_at', { ascending: false })

      if (appError) {
        throw new Error(`Failed to fetch app reviews: ${appError.message}`)
      }

      // Fetch user profiles for all reviewers
      const allUserIds = [
        ...(shopData || []).map(r => r.user_id),
        ...(appData || []).map(r => r.user_id)
      ]
      const uniqueUserIds = [...new Set(allUserIds)]
      const userNames = new Map<string, string>()

      if (uniqueUserIds.length > 0) {
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles_public')
          .select('user_id, display_name')
          .in('user_id', uniqueUserIds)

        if (!profilesError && userProfiles) {
          userProfiles.forEach(profile => {
            userNames.set(profile.user_id, profile.display_name)
          })
        }
      }

      // Add reviewer display names to reviews
      const shopReviewsWithNames = (shopData || []).map(review => ({
        ...review,
        reviewer_display_name: userNames.get(review.user_id) || 'Anonymous'
      }))

      const appReviewsWithNames = (appData || []).map(review => ({
        ...review,
        reviewer_display_name: userNames.get(review.user_id) || 'Anonymous'
      }))

      setShopReviews(shopReviewsWithNames)
      setAppReviews(appReviewsWithNames)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.shopId, filters?.gameId, filters?.carClassId])

  const refetch = () => {
    fetchReviews()
  }

  return {
    shopReviews,
    appReviews,
    loading,
    error,
    refetch
  }
}
