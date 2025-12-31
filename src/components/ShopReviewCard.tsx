import { Edit, Trash2, Calendar, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/StarRating"
import type { ShopReviewWithDetails } from "@/hooks/useShopReviews"
import { formatDate } from "@/utils/date"

interface ShopReviewCardProps {
  review: ShopReviewWithDetails
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

export function ShopReviewCard({
  review,
  onEdit,
  onDelete,
  showActions = true
}: ShopReviewCardProps) {
  // Sort ratings by display_order - defensive check for ratings array
  const ratings = review.ratings || []
  const sortedRatings = [...ratings].sort(
    (a, b) => a.factor.display_order - b.factor.display_order
  )

  return (
    <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-xl text-card-foreground leading-tight mb-2">
            {review.shop.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {review.game.name}
            </Badge>
            <Badge variant="outline">
              {review.car_class.name}
            </Badge>
          </div>
        </div>

        {showActions && (onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                aria-label="Edit review"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete review"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ratings Grid */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3 mb-4">
        {sortedRatings.map((rating) => (
          <div key={rating.id} className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {rating.factor.name}
            </span>
            <StarRating value={rating.score} size="sm" />
          </div>
        ))}
      </div>

      {/* Comments */}
      {review.comments && (
        <div className="bg-muted/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-card-foreground">{review.comments}</p>
          </div>
        </div>
      )}

      {/* Updated Date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>
          Updated {formatDate(review.updated_at)}
        </span>
      </div>
    </div>
  )
}
