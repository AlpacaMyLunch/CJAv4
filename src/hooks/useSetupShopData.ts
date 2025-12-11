import { useEffect, useState } from 'react'
import { supabase, type SetupShop, type Game, type CarClass, type RatingFactor } from '@/lib/supabase'

export type SetupShopWithGames = SetupShop & {
  games: Game[]
}

export function useSetupShopData() {
  const [shops, setShops] = useState<SetupShopWithGames[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [carClasses, setCarClasses] = useState<CarClass[]>([])
  const [setupFactors, setSetupFactors] = useState<RatingFactor[]>([])
  const [appFactors, setAppFactors] = useState<RatingFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSetupShopData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .order('name')

        if (gamesError) {
          throw new Error(`Failed to fetch games: ${gamesError.message}`)
        }

        setGames(gamesData || [])

        // Fetch all setup shops with their supported games
        const { data: shopsData, error: shopsError } = await supabase
          .from('setup_shops')
          .select(`
            *,
            shop_games (
              game:games (*)
            )
          `)
          .order('name')

        if (shopsError) {
          throw new Error(`Failed to fetch setup shops: ${shopsError.message}`)
        }

        // Transform shops data to include games array
        const shopsWithGames = shopsData?.map(shop => ({
          ...shop,
          games: shop.shop_games?.map((sg: any) => sg.game).filter(Boolean) || []
        })) || []

        setShops(shopsWithGames)

        // Fetch all car classes
        const { data: carClassesData, error: carClassesError } = await supabase
          .from('car_classes')
          .select('*')
          .order('name')

        if (carClassesError) {
          throw new Error(`Failed to fetch car classes: ${carClassesError.message}`)
        }

        setCarClasses(carClassesData || [])

        // Fetch all rating factors
        const { data: factorsData, error: factorsError } = await supabase
          .from('rating_factors')
          .select('*')
          .order('display_order')

        if (factorsError) {
          throw new Error(`Failed to fetch rating factors: ${factorsError.message}`)
        }

        // Separate and sort factors by category
        const setupFactorsData = factorsData?.filter(f => f.category === 'setup') || []
        const appFactorsData = factorsData?.filter(f => f.category === 'app') || []

        setSetupFactors(setupFactorsData)
        setAppFactors(appFactorsData)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSetupShopData()
  }, [])

  return {
    shops,
    games,
    carClasses,
    setupFactors,
    appFactors,
    loading,
    error
  }
}
