import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Game, CarClass } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { GamesManager } from '@/components/admin/GamesManager'
import { ShopsManager, type ShopWithGames } from '@/components/admin/ShopsManager'
import { CarClassesManager } from '@/components/admin/CarClassesManager'
import { ReviewModerationPanel, type ReviewForModeration } from '@/components/admin/ReviewModerationPanel'

export function AdminSetupShops() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)

  // Data states
  const [games, setGames] = useState<Game[]>([])
  const [shops, setShops] = useState<ShopWithGames[]>([])
  const [carClasses, setCarClasses] = useState<CarClass[]>([])
  const [reviews, setReviews] = useState<ReviewForModeration[]>([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchGames(),
        fetchShops(),
        fetchCarClasses(),
        fetchReviews()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      showErrorToast(addToast, 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ============ GAMES ============
  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('name')

    if (error) throw error
    setGames(data || [])
  }

  const saveGame = async (game: Partial<Game>, editingId?: string) => {
    if (editingId) {
      const { error } = await supabase
        .from('games')
        .update({ name: game.name, short_name: game.short_name })
        .eq('id', editingId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('games')
        .insert({ name: game.name, short_name: game.short_name })

      if (error) throw error
    }

    await fetchGames()
    showSuccessToast(addToast, `Game ${editingId ? 'updated' : 'created'} successfully`)
  }

  const deleteGame = async (id: string) => {
    if (!confirm('Are you sure? This will also delete associated car classes and shop games.')) return

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) {
      showErrorToast(addToast, error.message)
      return
    }

    await fetchGames()
    showSuccessToast(addToast, 'Game deleted successfully')
  }

  // ============ SHOPS ============
  const fetchShops = async () => {
    const { data, error } = await supabase
      .from('setup_shops')
      .select('*, shop_games (game_id)')
      .order('name')

    if (error) throw error
    setShops(data || [])
  }

  const saveShop = async (shop: Partial<ShopWithGames>, selectedGameIds: string[], editingId?: string) => {
    try {
      let shopId = editingId

      if (shopId) {
        const { error: updateError } = await supabase
          .from('setup_shops')
          .update({
            name: shop.name,
            website_url: shop.website_url,
            has_app: shop.has_app
          })
          .eq('id', shopId)

        if (updateError) throw updateError
      } else {
        const { data: newShop, error: insertError } = await supabase
          .from('setup_shops')
          .insert({
            name: shop.name,
            website_url: shop.website_url,
            has_app: shop.has_app
          })
          .select()
          .single()

        if (insertError) throw insertError
        shopId = newShop.id
      }

      // Update shop_games - delete existing
      await supabase
        .from('shop_games')
        .delete()
        .eq('shop_id', shopId)

      // Insert new game associations
      if (selectedGameIds.length > 0) {
        const { error: gamesError } = await supabase
          .from('shop_games')
          .insert(selectedGameIds.map(gameId => ({ shop_id: shopId, game_id: gameId })))

        if (gamesError) throw gamesError
      }

      await fetchShops()
      showSuccessToast(addToast, `Shop ${editingId ? 'updated' : 'created'} successfully`)
    } catch (error: any) {
      showErrorToast(addToast, error.message)
    }
  }

  const deleteShop = async (id: string) => {
    if (!confirm('Are you sure? This will also delete associated reviews.')) return

    const { error } = await supabase
      .from('setup_shops')
      .delete()
      .eq('id', id)

    if (error) {
      showErrorToast(addToast, error.message)
      return
    }

    await fetchShops()
    showSuccessToast(addToast, 'Shop deleted successfully')
  }

  // ============ CAR CLASSES ============
  const fetchCarClasses = async () => {
    const { data, error } = await supabase
      .from('car_classes')
      .select('*')
      .order('game_id')
      .order('name')

    if (error) throw error
    setCarClasses(data || [])
  }

  const saveCarClass = async (carClass: Partial<CarClass>, editingId?: string) => {
    if (editingId) {
      const { error } = await supabase
        .from('car_classes')
        .update({ name: carClass.name, game_id: carClass.game_id })
        .eq('id', editingId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('car_classes')
        .insert({ name: carClass.name, game_id: carClass.game_id })

      if (error) throw error
    }

    await fetchCarClasses()
    showSuccessToast(addToast, `Car class ${editingId ? 'updated' : 'created'} successfully`)
  }

  const deleteCarClass = async (id: string) => {
    if (!confirm('Are you sure? This will also delete associated reviews.')) return

    const { error } = await supabase
      .from('car_classes')
      .delete()
      .eq('id', id)

    if (error) {
      showErrorToast(addToast, error.message)
      return
    }

    await fetchCarClasses()
    showSuccessToast(addToast, 'Car class deleted successfully')
  }

  // ============ REVIEWS ============
  const fetchReviews = async () => {
    try {
      // Fetch shop reviews
      const { data: shopReviews, error: shopError } = await supabase
        .from('shop_reviews')
        .select(`
          id,
          created_at,
          shop:setup_shops!inner (name),
          game:games!inner (name),
          car_class:car_classes!inner (name),
          user:user_profiles_public!inner (display_name)
        `)
        .eq('is_current', true)
        .order('created_at', { ascending: false })

      if (shopError) throw shopError

      // Fetch app reviews
      const { data: appReviews, error: appError } = await supabase
        .from('app_reviews')
        .select(`
          id,
          created_at,
          shop:setup_shops!inner (name),
          user:user_profiles_public!inner (display_name)
        `)
        .eq('is_current', true)
        .order('created_at', { ascending: false })

      if (appError) throw appError

      const allReviews: ReviewForModeration[] = [
        ...(shopReviews || []).map((r: any) => ({
          id: r.id,
          type: 'shop' as const,
          shop_name: r.shop.name,
          user_name: r.user.display_name,
          created_at: r.created_at,
          game_name: r.game.name,
          car_class_name: r.car_class.name
        })),
        ...(appReviews || []).map((r: any) => ({
          id: r.id,
          type: 'app' as const,
          shop_name: r.shop.name,
          user_name: r.user.display_name,
          created_at: r.created_at
        }))
      ]

      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setReviews(allReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const deleteReview = async (review: ReviewForModeration) => {
    if (!confirm('Are you sure? This will soft-delete the review.')) return

    const table = review.type === 'shop' ? 'shop_reviews' : 'app_reviews'
    const { error } = await supabase
      .from(table)
      .update({ is_current: false })
      .eq('id', review.id)

    if (error) {
      showErrorToast(addToast, error.message)
      return
    }

    await fetchReviews()
    showSuccessToast(addToast, 'Review deleted successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <LoadingSpinner size="xl" message="Loading..." center />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Setup Shops Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage games, setup shops, car classes, and moderate reviews
          </p>
        </motion.div>

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="shops">Setup Shops</TabsTrigger>
            <TabsTrigger value="classes">Car Classes</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <GamesManager
              games={games}
              onSave={saveGame}
              onDelete={deleteGame}
            />
          </TabsContent>

          <TabsContent value="shops">
            <ShopsManager
              shops={shops}
              games={games}
              onSave={saveShop}
              onDelete={deleteShop}
            />
          </TabsContent>

          <TabsContent value="classes">
            <CarClassesManager
              carClasses={carClasses}
              games={games}
              onSave={saveCarClass}
              onDelete={deleteCarClass}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewModerationPanel
              reviews={reviews}
              onDelete={deleteReview}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
