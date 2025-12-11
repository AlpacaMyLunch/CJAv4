import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Plus, Settings, Smartphone, Search, Sparkles, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSetupShopData } from '@/hooks/useSetupShopData'
import { useShopReviews } from '@/hooks/useShopReviews'
import { useAppReviews } from '@/hooks/useAppReviews'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ShopReviewCard } from '@/components/ShopReviewCard'
import { AppReviewCard } from '@/components/AppReviewCard'
import { ShopReviewForm } from '@/components/ShopReviewForm'
import { AppReviewForm } from '@/components/AppReviewForm'
import { RecommendationWizard } from '@/components/RecommendationWizard'

export function SetupShopReviews() {
  const { user, signInWithDiscord, loading: authLoading } = useAuth()
  const { shops, games, carClasses, setupFactors, appFactors, loading: dataLoading } = useSetupShopData()
  const { reviews: shopReviews, loading: shopReviewsLoading, saving: savingShop, saveReview: saveShopReview, deleteReview: deleteShopReview } = useShopReviews()
  const { reviews: appReviews, loading: appReviewsLoading, saving: savingApp, saveReview: saveAppReview, deleteReview: deleteAppReview } = useAppReviews()

  const [showShopForm, setShowShopForm] = useState(false)
  const [showAppForm, setShowAppForm] = useState(false)
  const [editingShopReview, setEditingShopReview] = useState<typeof shopReviews[0] | null>(null)
  const [editingAppReview, setEditingAppReview] = useState<typeof appReviews[0] | null>(null)

  const loading = authLoading || dataLoading

  const handleSaveShopReview = async (data: {
    shopId: string
    gameId: string
    carClassId: string
    ratings: Record<string, number>
    comments: string | null
  }) => {
    await saveShopReview(
      data.shopId,
      data.gameId,
      data.carClassId,
      data.ratings,
      data.comments,
      editingShopReview?.id
    )
    setShowShopForm(false)
    setEditingShopReview(null)
  }

  const handleSaveAppReview = async (data: {
    shopId: string
    ratings: Record<string, number>
    comments: string | null
  }) => {
    await saveAppReview(
      data.shopId,
      data.ratings,
      data.comments,
      editingAppReview?.id
    )
    setShowAppForm(false)
    setEditingAppReview(null)
  }

  const handleEditShopReview = (review: typeof shopReviews[0]) => {
    setEditingShopReview(review)
    setShowShopForm(true)
  }

  const handleEditAppReview = (review: typeof appReviews[0]) => {
    setEditingAppReview(review)
    setShowAppForm(true)
  }

  const handleCancelForm = () => {
    setShowShopForm(false)
    setShowAppForm(false)
    setEditingShopReview(null)
    setEditingAppReview(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Setup Shop Reviews</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share your experiences with setup shops and their apps. Help the community find the best setups for their sim racing needs.
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="my-reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="my-reviews" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Reviews
            </TabsTrigger>
            <TabsTrigger value="browse-all" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse All
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Get Recommendations
            </TabsTrigger>
          </TabsList>

          {/* My Reviews Tab */}
          <TabsContent value="my-reviews">
            {!user ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Sign In to Review</h2>
                  <p className="text-muted-foreground mb-6">
                    Sign in with Discord to create and manage your setup shop reviews
                  </p>
                  <Button onClick={() => signInWithDiscord()}>
                    Sign In with Discord
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Setup Reviews Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">Setup Reviews</h2>
                    </div>
                    {!showShopForm && (
                      <Button onClick={() => setShowShopForm(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Setup Review
                      </Button>
                    )}
                  </div>

                  {showShopForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <ShopReviewForm
                        shops={shops}
                        games={games}
                        carClasses={carClasses}
                        factors={setupFactors}
                        initialData={editingShopReview ? {
                          shopId: editingShopReview.shop_id,
                          gameId: editingShopReview.game_id,
                          carClassId: editingShopReview.car_class_id,
                          ratings: (editingShopReview.ratings || []).reduce((acc, r) => {
                            acc[r.factor_id] = r.score
                            return acc
                          }, {} as Record<string, number>),
                          comments: editingShopReview.comments
                        } : undefined}
                        onSave={handleSaveShopReview}
                        onCancel={handleCancelForm}
                        saving={savingShop}
                      />
                    </motion.div>
                  )}

                  {shopReviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : shopReviews.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No setup reviews yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Add Setup Review" to get started!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {shopReviews.map(review => (
                        <ShopReviewCard
                          key={review.id}
                          review={review}
                          onEdit={() => handleEditShopReview(review)}
                          onDelete={() => deleteShopReview(review.id)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* App Reviews Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">App Reviews</h2>
                    </div>
                    {!showAppForm && (
                      <Button onClick={() => setShowAppForm(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add App Review
                      </Button>
                    )}
                  </div>

                  {showAppForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <AppReviewForm
                        shops={shops}
                        factors={appFactors}
                        initialData={editingAppReview ? {
                          shopId: editingAppReview.shop_id,
                          ratings: (editingAppReview.ratings || []).reduce((acc, r) => {
                            acc[r.factor_id] = r.score
                            return acc
                          }, {} as Record<string, number>),
                          comments: editingAppReview.comments
                        } : undefined}
                        onSave={handleSaveAppReview}
                        onCancel={handleCancelForm}
                        saving={savingApp}
                      />
                    </motion.div>
                  )}

                  {appReviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading app reviews...</p>
                    </div>
                  ) : appReviews.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No app reviews yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Add App Review" to get started!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {appReviews.map(review => (
                        <AppReviewCard
                          key={review.id}
                          review={review}
                          onEdit={() => handleEditAppReview(review)}
                          onDelete={() => deleteAppReview(review.id)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </TabsContent>

          {/* Browse All Tab */}
          <TabsContent value="browse-all">
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Browse All Reviews</h2>
                <p className="text-muted-foreground">
                  Coming in Phase 3 - Browse and filter all community reviews
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Get Recommendations Tab */}
          <TabsContent value="recommendations">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Get Personalized Recommendations</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Tell us what you play and drive, and we'll recommend the best setup shops based on community reviews and ratings.
                </p>
              </div>
              <RecommendationWizard games={games} carClasses={carClasses} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
