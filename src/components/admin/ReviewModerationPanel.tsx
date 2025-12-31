import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/utils/date'

export type ReviewForModeration = {
  id: string
  type: 'shop' | 'app'
  shop_name: string
  user_name: string
  created_at: string
  game_name?: string
  car_class_name?: string
}

interface ReviewModerationPanelProps {
  reviews: ReviewForModeration[]
  onDelete: (review: ReviewForModeration) => Promise<void>
}

export function ReviewModerationPanel({ reviews, onDelete }: ReviewModerationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Moderation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews to moderate</p>
          ) : (
            reviews.map(review => (
              <div key={`${review.type}-${review.id}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.shop_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                      {review.type === 'shop' ? 'Setup' : 'App'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    By {review.user_name} · {formatDate(review.created_at)}
                    {review.game_name && ` · ${review.game_name}`}
                    {review.car_class_name && ` · ${review.car_class_name}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(review)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
