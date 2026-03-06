"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SetlistStarRatingProps {
  averageRating: number
  reviewCount?: number
  onClick?: () => void
  disabled?: boolean
}

export function SetlistStarRating({
  averageRating,
  reviewCount,
  onClick,
  disabled,
}: SetlistStarRatingProps) {
  const rating = averageRating ?? 0
  const hasRating = rating > 0
  const ratingNumberText = hasRating ? `(${rating.toFixed(2)})` : null
  const reviewCountText =
    reviewCount != null && reviewCount > 0
      ? `(${reviewCount} ${reviewCount === 1 ? "review" : "reviews"})`
      : null

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

  const content = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {stars}
        {ratingNumberText != null && (
          <span className="text-xs tabular-nums">{ratingNumberText}</span>
        )}
      </div>
      {reviewCountText != null && (
        <div className="flex w-full justify-center">
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {reviewCountText}
          </span>
        </div>
      )}
    </div>
  )

  if (onClick && !disabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex h-auto flex-col items-center gap-0 px-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClick}
        aria-label={hasRating ? `Rating: ${rating} out of 5. Click to rate.` : "Click to rate this show"}
      >
        {content}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0 px-1.5 py-0.5">
      {content}
    </div>
  )
}
