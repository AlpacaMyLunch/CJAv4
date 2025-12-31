import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { StarRating } from "@/components/ui/StarRating"
import { cn } from "@/lib/utils"
import type { SetupShop, Game, CarClass, RatingFactor } from "@/lib/supabase"

interface ShopReviewFormProps {
  shops: SetupShop[]
  games: Game[]
  carClasses: CarClass[]
  factors: RatingFactor[]
  initialData?: {
    shopId: string
    gameId: string
    carClassId: string
    ratings: Record<string, number>
    comments: string | null
  }
  onSave: (data: {
    shopId: string
    gameId: string
    carClassId: string
    ratings: Record<string, number>
    comments: string | null
  }) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function ShopReviewForm({
  shops,
  games,
  carClasses,
  factors,
  initialData,
  onSave,
  onCancel,
  saving = false
}: ShopReviewFormProps) {
  const [shopId, setShopId] = useState(initialData?.shopId || '')
  const [gameId, setGameId] = useState(initialData?.gameId || '')
  const [carClassId, setCarClassId] = useState(initialData?.carClassId || '')
  const [ratings, setRatings] = useState<Record<string, number>>(initialData?.ratings || {})
  const [comments, setComments] = useState(initialData?.comments || '')

  const isEditMode = !!initialData

  // Filter car classes by selected game
  const filteredCarClasses = React.useMemo(() => {
    if (!gameId) return []
    return carClasses.filter(cc => cc.game_id === gameId)
  }, [gameId, carClasses])

  // Reset car class if game changes
  useEffect(() => {
    if (gameId && carClassId) {
      const isValid = filteredCarClasses.some(cc => cc.id === carClassId)
      if (!isValid) {
        setCarClassId('')
      }
    }
  }, [gameId, carClassId, filteredCarClasses])

  const handleRatingChange = (factorId: string, score: number) => {
    setRatings(prev => ({ ...prev, [factorId]: score }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields are filled
    if (!shopId || !gameId || !carClassId) {
      return
    }

    // Validate all ratings are set
    const allRatingsSet = factors.every(factor => ratings[factor.id] > 0)
    if (!allRatingsSet) {
      return
    }

    await onSave({
      shopId,
      gameId,
      carClassId,
      ratings,
      comments: comments.trim() || null
    })
  }

  const canSubmit = shopId && gameId && carClassId && factors.every(f => ratings[f.id] > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Review' : 'New Review'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Setup Shop
            </label>
            <Select
              value={shopId}
              onValueChange={setShopId}
              disabled={isEditMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Shop cannot be changed when editing
              </p>
            )}
          </div>

          {/* Game Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Game
            </label>
            <Select
              value={gameId}
              onValueChange={setGameId}
              disabled={isEditMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map(game => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Game cannot be changed when editing
              </p>
            )}
          </div>

          {/* Car Class Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Car Class
            </label>
            <Select
              value={carClassId}
              onValueChange={setCarClassId}
              disabled={isEditMode || !gameId}
            >
              <SelectTrigger>
                <SelectValue placeholder={gameId ? "Select a car class" : "Select a game first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredCarClasses.map(carClass => (
                  <SelectItem key={carClass.id} value={carClass.id}>
                    {carClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Car class cannot be changed when editing
              </p>
            )}
          </div>

          {/* Rating Factors */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-card-foreground">
              Ratings
            </label>
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              {factors.map(factor => (
                <div key={factor.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-card-foreground">
                        {factor.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {factor.description}
                      </div>
                    </div>
                    <StarRating
                      value={ratings[factor.id] || 0}
                      onChange={(score) => handleRatingChange(factor.id, score)}
                      size="md"
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Comments (optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your experience with this setup shop..."
              rows={4}
              disabled={saving}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                "resize-none"
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || saving}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Review' : 'Save Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
