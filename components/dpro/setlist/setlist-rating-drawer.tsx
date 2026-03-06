"use client"

import { useState, useEffect } from "react"
import { Star, X, Loader2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { ReviewEntry } from "@/hooks/use-setlist-rating"
import { cn } from "@/lib/utils"

interface SetlistRatingDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  showDate: string
  showVenueLocation: string
  averageRating: number
  reviewCount: number
  userRating: number | null
  userReview: string | null
  reviews: ReviewEntry[]
  isLoadingReviews: boolean
  reviewsError: string | null
  onSubmit: (rating: number, review: string) => Promise<void>
  submitting: boolean
  onFetchReviews: () => void
  validateReview: (text: string) => string | null
}

function StarRow({
  rating,
  size = "default",
}: {
  rating: number
  size?: "default" | "sm"
}) {
  const sizeClass = size === "sm" ? "size-3.5" : "size-4"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starNumber) => {
        const fillPercentage =
          rating > 0 ? Math.min(Math.max(rating - starNumber + 1, 0), 1) : 0
        return (
          <div key={starNumber} className={cn("relative", sizeClass)}>
            <Star
              className={cn(sizeClass, "text-muted-foreground/30")}
              strokeWidth={1.75}
            />
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star
                  className={cn(sizeClass, "text-yellow-500")}
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
}

export function SetlistRatingDrawer({
  open,
  onOpenChange,
  showDate,
  showVenueLocation,
  averageRating,
  reviewCount,
  userRating,
  userReview,
  reviews,
  isLoadingReviews,
  reviewsError,
  onSubmit,
  submitting,
  onFetchReviews,
  validateReview,
}: SetlistRatingDrawerProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRating(userRating ?? 0)
      setReview(userReview ?? "")
      setHoverRating(0)
      setIsEditingReview(false)
      setReviewError(null)
      onFetchReviews()
    }
  }, [open, userRating, userReview, onFetchReviews])

  const displayRating = hoverRating || rating
  const hasRating = rating > 0

  const handleSaveRating = async () => {
    const r = rating || 1
    await onSubmit(r, review)
    setIsEditingReview(false)
  }

  const handleSaveReview = async () => {
    if (!hasRating) {
      setReviewError("Please rate the show before writing a review.")
      return
    }
    const err = validateReview(review)
    if (err) {
      setReviewError(err)
      return
    }
    setReviewError(null)
    await onSubmit(rating, review)
    setIsEditingReview(false)
  }

  const formattedDate = formatSetlistDate(showDate)
  const title = formattedDate || "Show Reviews"
  const reviewLabel = userReview ? "Edit Review" : "Write a Review"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] max-w-[800px] mx-auto flex flex-col">
        <div className="min-h-0 flex flex-col overflow-hidden">
          {/* Header */}
          <DrawerHeader className="relative flex flex-col items-center justify-center border-b border-border/50 py-3 text-center">
            <DrawerTitle className="text-base font-semibold">
              {title}
            </DrawerTitle>
            {showVenueLocation && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {showVenueLocation}
              </p>
            )}
          </DrawerHeader>

          {/* Aggregate */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-border/50 px-4 py-3">
            <StarRow rating={averageRating} />
            {averageRating > 0 && (
              <span className="text-sm font-medium tabular-nums">
                {averageRating.toFixed(2)}
              </span>
            )}
            {reviewCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>

          {/* User section */}
          <div className="space-y-3 border-b border-border/50 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {hasRating ? "Your rating:" : "Rate this show:"}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={cn(
                          "size-6 transition-colors",
                          value <= displayRating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground/30"
                        )}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                {hasRating && (
                  <span className="text-xs text-muted-foreground">
                    ({rating} {rating === 1 ? "star" : "stars"})
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsEditingReview((v) => !v)}
              >
                {reviewLabel}
              </Button>
            </div>

            {isEditingReview && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="setlist-rating-review" className="text-xs">
                  Review (optional)
                </Label>
                <Textarea
                  id="setlist-rating-review"
                  placeholder="Share your thoughts..."
                  value={review}
                  onChange={(e) => {
                    setReview(e.target.value)
                    setReviewError(null)
                  }}
                  className="min-h-[80px] resize-none text-sm"
                  rows={3}
                />
                {reviewError && (
                  <p className="text-xs text-destructive">{reviewError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveReview}
                    disabled={submitting || !hasRating}
                  >
                    {submitting ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingReview(false)
                      setReview(userReview ?? "")
                      setReviewError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Reviews list */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[40vh]">
              <div className="space-y-0 px-4 py-3">
                {reviewsError && (
                  <div className="flex items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {reviewsError}
                  </div>
                )}
                {isLoadingReviews && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading reviews…
                    </span>
                  </div>
                )}
                {!isLoadingReviews && !reviewsError && reviews.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No written reviews yet for this show.
                  </p>
                )}
                {!isLoadingReviews &&
                  !reviewsError &&
                  reviews.length > 0 &&
                  reviews.map((r, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 border-b border-border/40 py-1 last:border-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StarRow rating={r.rating} size="sm" />
                        <span className="text-sm font-medium">{r.username}</span>
                      </div>
                      {r.review && (
                        <p className="text-xs text-muted-foreground">
                          {r.review}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Submit rating when no rating yet */}
          {!hasRating && (
            <div className="border-t border-border/50 p-4">
              <Button
                className="w-full"
                onClick={handleSaveRating}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Submit rating"}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
