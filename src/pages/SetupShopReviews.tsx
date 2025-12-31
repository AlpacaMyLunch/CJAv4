import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Plus, Settings, Smartphone, User } from 'lucide-react'
import { useSetupShopData } from '@/hooks/useSetupShopData'
import { useShopReviews } from '@/hooks/useShopReviews'
import { useAppReviews } from '@/hooks/useAppReviews'
import { Button } from '@/components/ui/button'
import { ShopReviewCard } from '@/components/ShopReviewCard'
import { AppReviewCard } from '@/components/AppReviewCard'
import { ShopReviewForm } from '@/components/ShopReviewForm'
import { AppReviewForm } from '@/components/AppReviewForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { RequireAuth } from '@/components/RequireAuth'

export function SetupShopReviews() {
  const { shops, games, carClasses, setupFactors, appFactors, loading: dataLoading } = useSetupShopData()
  const { reviews: shopReviews, loading: shopReviewsLoading, saving: savingShop, saveReview: saveShopReview, deleteReview: deleteShopReview } = useShopReviews()
  const { reviews: appReviews, loading: appReviewsLoading, saving: savingApp, saveReview: saveAppReview, deleteReview: deleteAppReview } = useAppReviews()

  const [showShopForm, setShowShopForm] = useState(false)
  const [showAppForm, setShowAppForm] = useState(false)
  const [editingShopReview, setEditingShopReview] = useState<typeof shopReviews[0] | null>(null)
  const [editingAppReview, setEditingAppReview] = useState<typeof appReviews[0] | null>(null)

  const loading = dataLoading

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
          <LoadingSpinner message="Loading..." center />
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

        {/* My Reviews */}
        <RequireAuth
          loadingMessage="Loading..."
          title="Sign In to Review"
          description="Sign in with Discord to create and manage your setup shop reviews"
          icon={User}
          showSignInButton={true}
          signInButtonText="Sign In with Discord"
          useCard={true}
        >
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
                      <LoadingSpinner size="sm" message="Loading reviews..." center />
                    </div>
                  ) : shopReviews.length === 0 ? (
                    <EmptyState
                      icon={Settings}
                      title="No setup reviews yet."
                      description='Click "Add Setup Review" to get started!'
                      card
                    />
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
                      <LoadingSpinner size="sm" message="Loading app reviews..." center />
                    </div>
                  ) : appReviews.length === 0 ? (
                    <EmptyState
                      icon={Smartphone}
                      title="No app reviews yet."
                      description='Click "Add App Review" to get started!'
                      card
                    />
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
        </RequireAuth>
      </div>
    </div>
  )
}
