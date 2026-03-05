"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SetlistStarRatingProps {
  averageRating: number
  onClick?: () => void
  disabled?: boolean
}

export function SetlistStarRating({
  averageRating,
  onClick,
  disabled,
}: SetlistStarRatingProps) {
  const rating = averageRating ?? 0
  const hasRating = rating > 0

  const stars = (
    <div className="relative flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starNumber) => {
        const fillPercentage = hasRating
          ? Math.min(Math.max(rating - starNumber + 1, 0), 1)
          : 0
        return (
          <div key={starNumber} className="relative size-4">
            <Star
              className="size-4 text-muted-foreground/30"
              strokeWidth={1.75}
            />
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star
                  className="size-4 text-yellow-500"
                  strokeWidth={1.75}
                  fill="currentColor"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  if (onClick && !disabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClick}
        aria-label={hasRating ? `Rating: ${rating} out of 5. Click to rate.` : "Click to rate this show"}
      >
        {stars}
        {hasRating && (
          <span className="tabular-nums">({rating.toFixed(1)})</span>
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5">
      {stars}
      {hasRating && (
        <span className="text-xs tabular-nums text-muted-foreground">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}
