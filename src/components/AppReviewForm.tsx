import * as React from "react"
import { useState } from "react"
import { AlertCircle, Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { StarRating } from "@/components/ui/StarRating"
import { cn } from "@/lib/utils"
import type { SetupShop, RatingFactor } from "@/lib/supabase"

interface AppReviewFormProps {
  shops: SetupShop[]
  factors: RatingFactor[]
  initialData?: {
    shopId: string
    ratings: Record<string, number>
    comments: string | null
  }
  onSave: (data: {
    shopId: string
    ratings: Record<string, number>
    comments: string | null
  }) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function AppReviewForm({
  shops,
  factors,
  initialData,
  onSave,
  onCancel,
  saving = false
}: AppReviewFormProps) {
  const [shopId, setShopId] = useState(initialData?.shopId || '')
  const [ratings, setRatings] = useState<Record<string, number>>(initialData?.ratings || {})
  const [comments, setComments] = useState(initialData?.comments || '')

  const isEditMode = !!initialData

  // Filter shops to only those with apps
  const shopsWithApps = React.useMemo(() => {
    return shops.filter(shop => shop.has_app)
  }, [shops])

  // Check if selected shop has an app
  const selectedShop = shops.find(s => s.id === shopId)
  const shopHasApp = selectedShop?.has_app || false

  const handleRatingChange = (factorId: string, score: number) => {
    setRatings(prev => ({ ...prev, [factorId]: score }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields are filled
    if (!shopId) {
      return
    }

    // Validate all ratings are set
    const allRatingsSet = factors.every(factor => ratings[factor.id] > 0)
    if (!allRatingsSet) {
      return
    }

    await onSave({
      shopId,
      ratings,
      comments: comments.trim() || null
    })
  }

  const canSubmit = shopId && shopHasApp && factors.every(f => ratings[f.id] > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          {isEditMode ? 'Edit App Review' : 'New App Review'}
        </CardTitle>
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
                <SelectValue
                  placeholder="Select a shop with an app"
                  selectedValue={shopsWithApps.find(s => s.id === shopId)?.name || ''}
                />
              </SelectTrigger>
              <SelectContent>
                {shopsWithApps.length > 0 ? (
                  shopsWithApps.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No shops with apps available
                  </div>
                )}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Shop cannot be changed when editing
              </p>
            )}
            {shopId && !shopHasApp && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm text-destructive">
                  <p className="font-medium">This shop doesn't have an app</p>
                  <p className="text-xs mt-1">Please select a different shop or create a setup review instead.</p>
                </div>
              </div>
            )}
          </div>

          {/* Rating Factors */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-card-foreground">
              App Ratings
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
              placeholder="Share your experience with this app..."
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
