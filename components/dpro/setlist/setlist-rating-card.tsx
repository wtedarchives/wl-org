"use client"

import { Star } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface SetlistRatingCardProps {
  averageRating: number
  reviewCount?: number
  onClick?: () => void
}

const CARD_PADDING = "p-2"
const CARD_MIN_HEIGHT = "min-h-[64px]"

function RatingContent({
  averageRating,
  reviewCount,
}: {
  averageRating: number
  reviewCount?: number
}) {
  const rating = averageRating ?? 0
  const hasRating = rating > 0
  const ratingNumberText = hasRating ? rating.toFixed(2) : null
  const reviewCountText =
    reviewCount != null && reviewCount > 0
      ? `(${reviewCount} ${reviewCount === 1 ? "review" : "reviews"})`
      : null

  return (
    <div className="flex flex-col items-center justify-center">
      <SetlistRatingStarsRow rating={rating} />
      {ratingNumberText != null && (
        <span className="text-xs font-medium pt-1 tabular-nums">{ratingNumberText}</span>
      )}
      {reviewCountText != null && (
        <span className="text-[10px] leading-2.5 tabular-nums text-muted-foreground">
          {reviewCountText}
        </span>
      )}
    </div>
  )
}

/** Star row for setlist archive + WL Home v2 (shared fill math). */
export function SetlistRatingStarsRow({
  rating,
  sizeClassName = "size-4",
  emptyClassName = "text-muted-foreground/30",
  fillClassName = "text-yellow-500",
  rowClassName,
}: {
  rating: number
  sizeClassName?: string
  emptyClassName?: string
  fillClassName?: string
  /** Optional wrapper (e.g. v2 panel color scope). */
  rowClassName?: string
}) {
  const hasRating = rating > 0
  return (
    <div className={cn("flex items-center justify-center gap-0.5", rowClassName)}>
      {[1, 2, 3, 4, 5].map((starNumber) => {
        const fillPercentage = hasRating
          ? Math.min(Math.max(rating - starNumber + 1, 0), 1)
          : 0
        return (
          <div key={starNumber} className={cn("relative shrink-0", sizeClassName)}>
            <Star
              className={cn(sizeClassName, emptyClassName)}
              weight="regular"
              aria-hidden
            />
            {fillPercentage > 0 && (
              <div
                className="pointer-events-none absolute left-0 top-0 h-full overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star
                  className={cn(sizeClassName, fillClassName)}
                  weight="fill"
                  aria-hidden
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SetlistRatingCard({
  averageRating,
  reviewCount,
  onClick,
}: SetlistRatingCardProps) {
  const rating = averageRating ?? 0
  const hasRating = rating > 0
  const ariaLabel = hasRating
    ? `Rating: ${rating.toFixed(2)} out of 5. Click to rate.`
    : "Click to rate this show"

  const content = (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center",
        CARD_PADDING,
        CARD_MIN_HEIGHT
      )}
    >
      <RatingContent averageRating={averageRating} reviewCount={reviewCount} />
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          "w-full rounded-lg border border-border/60 bg-card/80 text-left",
          "transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="w-full rounded-lg border border-border/60 bg-card/80">
      {content}
    </div>
  )
}
