import { useState, useEffect } from 'react'
import { supabase, type SetupShop } from '@/lib/supabase'

interface Preference {
  gameId: string
  carClassId?: string
}

export type ShopRecommendation = {
  shop: SetupShop
  averageScore: number
  reviewCount: number
  factorBreakdown: Record<string, number>
  appScore?: number
  matchedGames: string[]
}

export function useRecommendations(preferences: Preference[]) {
  const [recommendations, setRecommendations] = useState<ShopRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create stable key from preferences for useEffect dependency
  const preferencesKey = JSON.stringify(preferences)

  useEffect(() => {
    if (!preferences || preferences.length === 0) {
      setRecommendations([])
      return
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all shops
        const { data: allShops, error: shopsError } = await supabase
          .from('setup_shops')
          .select('*')

        if (shopsError) {
          throw new Error(`Failed to fetch shops: ${shopsError.message}`)
        }

        // Fetch all current shop reviews with ratings
        const { data: shopReviews, error: reviewsError } = await supabase
          .from('shop_reviews')
          .select(`
            *,
            shop:setup_shops!inner (id, name, has_app),
            game:games!inner (id, name),
            car_class:car_classes!inner (id, name),
            review_ratings (
              id,
              factor_id,
              score,
              factor:rating_factors (
                id,
                name
              )
            )
          `)
          .eq('is_current', true)

        if (reviewsError) {
          throw new Error(`Failed to fetch reviews: ${reviewsError.message}`)
        }

        // Filter reviews by preferences
        const matchingReviews = shopReviews?.filter(review => {
          return preferences.some(pref => {
            const gameMatch = review.game_id === pref.gameId
            const carClassMatch = !pref.carClassId || review.car_class_id === pref.carClassId
            return gameMatch && carClassMatch
          })
        }) || []

        // Fetch app reviews for shops with apps
        const { data: appReviews, error: appReviewsError } = await supabase
          .from('app_reviews')
          .select(`
            *,
            shop:setup_shops!inner (id, has_app),
            game:games!inner (id),
            app_review_ratings (
              id,
              factor_id,
              score
            )
          `)
          .eq('is_current', true)

        if (appReviewsError) {
          throw new Error(`Failed to fetch app reviews: ${appReviewsError.message}`)
        }

        // Filter app reviews by preferences (only by game, no car class)
        const matchingAppReviews = appReviews?.filter(review => {
          return preferences.some(pref => review.game_id === pref.gameId)
        }) || []

        // Group reviews by shop
        const shopData = new Map<string, {
          shop: SetupShop
          reviews: typeof matchingReviews
          appReviews: typeof matchingAppReviews
          games: Set<string>
        }>()

        // Process setup reviews
        matchingReviews.forEach(review => {
          const shopId = review.shop_id
          const fullShop = allShops?.find(s => s.id === shopId)
          if (!fullShop) return

          if (!shopData.has(shopId)) {
            shopData.set(shopId, {
              shop: fullShop,
              reviews: [],
              appReviews: [],
              games: new Set()
            })
          }
          const data = shopData.get(shopId)!
          data.reviews.push(review)
          data.games.add(review.game.name)
        })

        // Process app reviews
        matchingAppReviews.forEach(review => {
          const shopId = review.shop_id
          if (shopData.has(shopId)) {
            shopData.get(shopId)!.appReviews.push(review)
          }
        })

        // Calculate recommendations
        const recs: ShopRecommendation[] = []

        shopData.forEach((data) => {
          // Calculate average score from setup reviews
          let totalScore = 0
          let totalRatings = 0
          const factorScores = new Map<string, { total: number, count: number }>()

          data.reviews.forEach(review => {
            review.review_ratings.forEach((rating: any) => {
              totalScore += rating.score
              totalRatings++

              const factorName = rating.factor.name
              if (!factorScores.has(factorName)) {
                factorScores.set(factorName, { total: 0, count: 0 })
              }
              const factor = factorScores.get(factorName)!
              factor.total += rating.score
              factor.count++
            })
          })

          const averageScore = totalRatings > 0 ? totalScore / totalRatings : 0

          // Calculate factor breakdown
          const factorBreakdown: Record<string, number> = {}
          factorScores.forEach((value, factorName) => {
            factorBreakdown[factorName] = value.count > 0 ? value.total / value.count : 0
          })

          // Calculate app score if available
          let appScore: number | undefined
          if (data.shop.has_app && data.appReviews.length > 0) {
            let appTotalScore = 0
            let appTotalRatings = 0
            data.appReviews.forEach(review => {
              review.app_review_ratings.forEach((rating: any) => {
                appTotalScore += rating.score
                appTotalRatings++
              })
            })
            appScore = appTotalRatings > 0 ? appTotalScore / appTotalRatings : undefined
          }

          recs.push({
            shop: data.shop,
            averageScore,
            reviewCount: data.reviews.length,
            factorBreakdown,
            appScore,
            matchedGames: Array.from(data.games)
          })
        })

        // Sort by average score descending, then by review count
        recs.sort((a, b) => {
          if (b.averageScore !== a.averageScore) {
            return b.averageScore - a.averageScore
          }
          return b.reviewCount - a.reviewCount
        })

        setRecommendations(recs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesKey])

  return {
    recommendations,
    loading,
    error
  }
}
