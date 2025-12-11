import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  disabled?: boolean
  className?: string
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  showValue = false,
  disabled = false,
  className
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const isInteractive = !!onChange && !disabled
  const displayValue = hoverValue ?? value
  const starSize = sizeMap[size]

  const handleClick = (rating: number) => {
    if (isInteractive) {
      onChange?.(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (isInteractive) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverValue(null)
    }
  }

  const renderStar = (rating: number) => {
    const isFilled = rating <= displayValue

    const starElement = (
      <Star
        size={starSize}
        className={cn(
          "transition-colors",
          isFilled
            ? "fill-primary text-primary"
            : "fill-transparent text-muted-foreground"
        )}
      />
    )

    if (isInteractive) {
      return (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          onMouseEnter={() => handleMouseEnter(rating)}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
          className={cn(
            "transition-all",
            "cursor-pointer hover:scale-110",
            disabled && "cursor-not-allowed opacity-50"
          )}
          aria-label={`Rate ${rating} out of 5`}
        >
          {starElement}
        </button>
      )
    }

    return (
      <div key={rating} className="transition-all">
        {starElement}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(renderStar)}
      </div>
      {showValue && (
        <span className={cn(
          "font-medium tabular-nums text-muted-foreground",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
      )}
    </div>
  )
}
