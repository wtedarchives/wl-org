"use client"

import { Star } from "lucide-react"

export function ListShowRatingStars({ rating }: { rating: number }) {
  if (!rating || rating <= 0) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="size-3 text-muted-foreground/30"
            strokeWidth={1.75}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="relative flex items-center group">
      <div className="flex items-center gap-0.5 transition-opacity group-hover:opacity-10">
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const fillPercentage = Math.min(
            Math.max(rating - starNumber + 1, 0),
            1,
          )
          return (
            <div key={starNumber} className="relative size-3">
              <Star
                className="size-3 text-yellow-400/40"
                strokeWidth={1.75}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star className="size-3 text-yellow-400" fill="currentColor" />
              </div>
            </div>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
        {rating.toFixed(2)}
      </div>
    </div>
  )
}
