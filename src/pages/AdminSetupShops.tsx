import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SetupShop, Game, CarClass } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type ShopWithGames = SetupShop & {
  shop_games: { game_id: string }[]
}

type ReviewForModeration = {
  id: string
  type: 'shop' | 'app'
  shop_name: string
  user_name: string
  created_at: string
  game_name?: string
  car_class_name?: string
}

export function AdminSetupShops() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)

  // Data states
  const [games, setGames] = useState<Game[]>([])
  const [shops, setShops] = useState<ShopWithGames[]>([])
  const [carClasses, setCarClasses] = useState<CarClass[]>([])
  const [reviews, setReviews] = useState<ReviewForModeration[]>([])

  // Form states
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [showGameForm, setShowGameForm] = useState(false)
  const [editingShop, setEditingShop] = useState<ShopWithGames | null>(null)
  const [showShopForm, setShowShopForm] = useState(false)
  const [editingCarClass, setEditingCarClass] = useState<CarClass | null>(null)
  const [showCarClassForm, setShowCarClassForm] = useState(false)

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
      addToast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      })
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

  const saveGame = async (game: Partial<Game>) => {
    if (editingGame?.id) {
      const { error } = await supabase
        .from('games')
        .update({ name: game.name, short_name: game.short_name })
        .eq('id', editingGame.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('games')
        .insert({ name: game.name, short_name: game.short_name })

      if (error) throw error
    }

    await fetchGames()
    setShowGameForm(false)
    setEditingGame(null)
    addToast({
      title: 'Success',
      description: `Game ${editingGame ? 'updated' : 'created'} successfully`,
      variant: 'success'
    })
  }

  const deleteGame = async (id: string) => {
    if (!confirm('Are you sure? This will also delete associated car classes and shop games.')) return

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    await fetchGames()
    addToast({
      title: 'Success',
      description: 'Game deleted successfully',
      variant: 'success'
    })
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

  const saveShop = async (shop: Partial<ShopWithGames>, selectedGameIds: string[]) => {
    try {
      let shopId = editingShop?.id

      if (shopId) {
        // Update existing shop
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
        // Create new shop
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

      // Update shop_games
      // Delete existing
      await supabase
        .from('shop_games')
        .delete()
        .eq('shop_id', shopId)

      // Insert new
      if (selectedGameIds.length > 0) {
        const { error: gamesError } = await supabase
          .from('shop_games')
          .insert(selectedGameIds.map(gameId => ({ shop_id: shopId, game_id: gameId })))

        if (gamesError) throw gamesError
      }

      await fetchShops()
      setShowShopForm(false)
      setEditingShop(null)
      addToast({
        title: 'Success',
        description: `Shop ${editingShop ? 'updated' : 'created'} successfully`,
        variant: 'success'
      })
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const deleteShop = async (id: string) => {
    if (!confirm('Are you sure? This will also delete associated reviews.')) return

    const { error } = await supabase
      .from('setup_shops')
      .delete()
      .eq('id', id)

    if (error) {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    await fetchShops()
    addToast({
      title: 'Success',
      description: 'Shop deleted successfully',
      variant: 'success'
    })
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

  const saveCarClass = async (carClass: Partial<CarClass>) => {
    if (editingCarClass?.id) {
      const { error } = await supabase
        .from('car_classes')
        .update({ name: carClass.name, game_id: carClass.game_id })
        .eq('id', editingCarClass.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('car_classes')
        .insert({ name: carClass.name, game_id: carClass.game_id })

      if (error) throw error
    }

    await fetchCarClasses()
    setShowCarClassForm(false)
    setEditingCarClass(null)
    addToast({
      title: 'Success',
      description: `Car class ${editingCarClass ? 'updated' : 'created'} successfully`,
      variant: 'success'
    })
  }

  const deleteCarClass = async (id: string) => {
    if (!confirm('Are you sure? This will also delete associated reviews.')) return

    const { error } = await supabase
      .from('car_classes')
      .delete()
      .eq('id', id)

    if (error) {
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    await fetchCarClasses()
    addToast({
      title: 'Success',
      description: 'Car class deleted successfully',
      variant: 'success'
    })
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
      addToast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    await fetchReviews()
    addToast({
      title: 'Success',
      description: 'Review deleted successfully',
      variant: 'success'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading...</p>
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

          {/* GAMES TAB */}
          <TabsContent value="games">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Games</CardTitle>
                  <Button onClick={() => { setEditingGame(null); setShowGameForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Game
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showGameForm && (
                  <GameForm
                    game={editingGame}
                    onSave={saveGame}
                    onCancel={() => { setShowGameForm(false); setEditingGame(null) }}
                  />
                )}

                <div className="space-y-2 mt-4">
                  {games.map(game => (
                    <div key={game.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{game.name}</div>
                        <div className="text-sm text-muted-foreground">Short name: {game.short_name}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingGame(game); setShowGameForm(true) }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGame(game.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SHOPS TAB */}
          <TabsContent value="shops">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Setup Shops</CardTitle>
                  <Button onClick={() => { setEditingShop(null); setShowShopForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shop
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showShopForm && (
                  <ShopForm
                    shop={editingShop}
                    games={games}
                    onSave={saveShop}
                    onCancel={() => { setShowShopForm(false); setEditingShop(null) }}
                  />
                )}

                <div className="space-y-2 mt-4">
                  {shops.map(shop => (
                    <div key={shop.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{shop.name}</div>
                          <div className="text-sm text-muted-foreground">{shop.website_url}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {shop.has_app ? 'Has App' : 'No App'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingShop(shop); setShowShopForm(true) }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShop(shop.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Supported games: {shop.shop_games.map(sg =>
                          games.find(g => g.id === sg.game_id)?.name
                        ).filter(Boolean).join(', ') || 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CAR CLASSES TAB */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Car Classes</CardTitle>
                  <Button onClick={() => { setEditingCarClass(null); setShowCarClassForm(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Car Class
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showCarClassForm && (
                  <CarClassForm
                    carClass={editingCarClass}
                    games={games}
                    onSave={saveCarClass}
                    onCancel={() => { setShowCarClassForm(false); setEditingCarClass(null) }}
                  />
                )}

                <div className="space-y-6 mt-4">
                  {games.map(game => {
                    const gameClasses = carClasses.filter(cc => cc.game_id === game.id)
                    if (gameClasses.length === 0) return null

                    return (
                      <div key={game.id}>
                        <h3 className="font-semibold mb-2">{game.name}</h3>
                        <div className="space-y-2">
                          {gameClasses.map(carClass => (
                            <div key={carClass.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="font-medium">{carClass.name}</div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setEditingCarClass(carClass); setShowCarClassForm(true) }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteCarClass(carClass.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reviews.map(review => (
                    <div key={`${review.type}-${review.id}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{review.shop_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                            {review.type === 'shop' ? 'Setup' : 'App'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          By {review.user_name} · {new Date(review.created_at).toLocaleDateString()}
                          {review.game_name && ` · ${review.game_name}`}
                          {review.car_class_name && ` · ${review.car_class_name}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReview(review)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ============ FORM COMPONENTS ============

function GameForm({ game, onSave, onCancel }: {
  game: Game | null
  onSave: (game: Partial<Game>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(game?.name || '')
  const [shortName, setShortName] = useState(game?.short_name || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, short_name: shortName })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="game-name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="game-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="game-short" className="block text-sm font-medium mb-2">Short Name</label>
          <input
            id="game-short"
            type="text"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ShopForm({ shop, games, onSave, onCancel }: {
  shop: ShopWithGames | null
  games: Game[]
  onSave: (shop: Partial<ShopWithGames>, gameIds: string[]) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(shop?.name || '')
  const [websiteUrl, setWebsiteUrl] = useState(shop?.website_url || '')
  const [hasApp, setHasApp] = useState(shop?.has_app || false)
  const [selectedGames, setSelectedGames] = useState<string[]>(
    shop?.shop_games.map(sg => sg.game_id) || []
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        website_url: websiteUrl,
        has_app: hasApp
      }, selectedGames)
    } finally {
      setSaving(false)
    }
  }

  const toggleGame = (gameId: string) => {
    setSelectedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="shop-name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="shop-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="shop-url" className="block text-sm font-medium mb-2">Website URL</label>
          <input
            id="shop-url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasApp}
            onChange={(e) => setHasApp(e.target.checked)}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Has App</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Supported Games</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {games.map(game => (
            <label key={game.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted">
              <input
                type="checkbox"
                checked={selectedGames.includes(game.id)}
                onChange={() => toggleGame(game.id)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">{game.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}

function CarClassForm({ carClass, games, onSave, onCancel }: {
  carClass: CarClass | null
  games: Game[]
  onSave: (carClass: Partial<CarClass>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(carClass?.name || '')
  const [gameId, setGameId] = useState(carClass?.game_id || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, game_id: gameId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="class-name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="class-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Game</label>
          <Select value={gameId} onValueChange={setGameId}>
            <SelectTrigger>
              <SelectValue placeholder="Select game" selectedValue={games.find(g => g.id === gameId)?.name || ''} />
            </SelectTrigger>
            <SelectContent>
              {games.map(game => (
                <SelectItem key={game.id} value={game.id}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !gameId}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}
