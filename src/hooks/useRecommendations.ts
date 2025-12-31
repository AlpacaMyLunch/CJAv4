import { useState, useEffect } from 'react'
import { supabase, type SetupShop } from '@/lib/supabase'

interface Preference {
  gameId: string
  carClassId?: string
}

export type ReviewComment = {
  text: string
  reviewerName: string
  date: string
}

export type ShopRecommendation = {
  shop: SetupShop
  averageScore: number
  reviewCount: number
  setupFactorBreakdown: Record<string, number>
  appFactorBreakdown: Record<string, number>
  setupScore: number
  appScore?: number
  matchedGames: string[]
  setupComments: ReviewComment[]
  appComments: ReviewComment[]
  totalReviewCount: number
  uniqueUserCount: number
}

export function useRecommendations(preferences: Preference[]) {
  const [recommendations, setRecommendations] = useState<ShopRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create stable key from preferences for useEffect dependency
  const preferencesKey = JSON.stringify(preferences)

  useEffect(() => {
    // Parse preferences from the stable key to ensure proper dependency tracking
    const currentPreferences: Preference[] = JSON.parse(preferencesKey)

    if (!currentPreferences || currentPreferences.length === 0) {
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
        const { data: shopReviews, error: reviewsError} = await supabase
          .from('shop_reviews')
          .select(`
            *,
            shop:setup_shops!inner (id, name, has_app),
            game:games!inner (id, name),
            car_class:car_classes!inner (id, name),
            user:user_profiles_public!inner (display_name),
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
          return currentPreferences.some(pref => {
            const gameMatch = review.game_id === pref.gameId
            const carClassMatch = !pref.carClassId || review.car_class_id === pref.carClassId
            return gameMatch && carClassMatch
          })
        }) || []

        // Fetch all current app reviews (not filtered by game since they have null game_id)
        const { data: appReviews, error: appReviewsError } = await supabase
          .from('app_reviews')
          .select(`
            *,
            shop:setup_shops!inner (id, has_app),
            user:user_profiles_public!inner (display_name),
            app_review_ratings (
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

        if (appReviewsError) {
          throw new Error(`Failed to fetch app reviews: ${appReviewsError.message}`)
        }

        // Group reviews by shop
        const shopData = new Map<string, {
          shop: SetupShop
          reviews: typeof matchingReviews
          appReviews: typeof appReviews
          games: Set<string>
          userIds: Set<string>
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
              games: new Set(),
              userIds: new Set()
            })
          }
          const data = shopData.get(shopId)!
          data.reviews.push(review)
          data.games.add(review.game.name)
          data.userIds.add(review.user_id)
        })

        // Process app reviews for shops that have matching setup reviews
        appReviews?.forEach(review => {
          const shopId = review.shop_id
          if (shopData.has(shopId)) {
            const data = shopData.get(shopId)!
            data.appReviews.push(review)
            data.userIds.add(review.user_id)
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

          const setupScore = totalRatings > 0 ? totalScore / totalRatings : 0

          // Calculate setup factor breakdown
          const setupFactorBreakdown: Record<string, number> = {}
          factorScores.forEach((value, factorName) => {
            setupFactorBreakdown[factorName] = value.count > 0 ? value.total / value.count : 0
          })

          // Calculate app score and factor breakdown if available
          let appScore: number | undefined
          const appFactorBreakdown: Record<string, number> = {}
          if (data.shop.has_app && data.appReviews.length > 0) {
            let appTotalScore = 0
            let appTotalRatings = 0
            const appFactorScores = new Map<string, { total: number, count: number }>()

            data.appReviews.forEach(review => {
              review.app_review_ratings.forEach((rating: any) => {
                appTotalScore += rating.score
                appTotalRatings++

                const factorName = rating.factor?.name
                if (factorName) {
                  if (!appFactorScores.has(factorName)) {
                    appFactorScores.set(factorName, { total: 0, count: 0 })
                  }
                  const factor = appFactorScores.get(factorName)!
                  factor.total += rating.score
                  factor.count++
                }
              })
            })

            appScore = appTotalRatings > 0 ? appTotalScore / appTotalRatings : undefined

            // Build app factor breakdown
            appFactorScores.forEach((value, factorName) => {
              appFactorBreakdown[factorName] = value.count > 0 ? value.total / value.count : 0
            })
          }

          // Use setup score as the average score
          const averageScore = setupScore

          // Collect setup comments from setup reviews
          const setupComments: ReviewComment[] = []
          data.reviews.forEach(review => {
            if (review.comments && review.comments.trim()) {
              setupComments.push({
                text: review.comments,
                reviewerName: review.user.display_name,
                date: review.created_at
              })
            }
          })

          // Collect app comments from app reviews
          const appComments: ReviewComment[] = []
          data.appReviews.forEach(review => {
            if (review.comments && review.comments.trim()) {
              appComments.push({
                text: review.comments,
                reviewerName: review.user.display_name,
                date: review.created_at
              })
            }
          })

          const totalReviewCount = data.reviews.length + data.appReviews.length

          recs.push({
            shop: data.shop,
            averageScore,
            reviewCount: data.reviews.length,
            setupFactorBreakdown,
            appFactorBreakdown,
            setupScore,
            appScore,
            matchedGames: Array.from(data.games),
            setupComments,
            appComments,
            totalReviewCount,
            uniqueUserCount: data.userIds.size
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
  }, [preferencesKey])

  return {
    recommendations,
    loading,
    error
  }
}
