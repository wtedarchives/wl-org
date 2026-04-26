"use client"

import { useState, useEffect } from "react"
import { CircleNotch, Star } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { ReviewEntry } from "@/hooks/use-setlist-rating"
import { SetlistRatingStarsRow } from "@/components/dpro/setlist/setlist-rating-card"
import { cn } from "@/lib/utils"

export type SetlistRatingPanelVisualVariant = "default" | "wl-home-v2"

export interface SetlistRatingPanelProps {
  /** When true, syncs local form state and refetches reviews (same as drawer `open`). */
  active: boolean
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
  className?: string
  /** Match WL Home v2 “Request a Song” modal inner panel (catalog surface + dividers). */
  visualVariant?: SetlistRatingPanelVisualVariant
}

const P = "wl-home-v2-setlist-rating-panel"

export function SetlistRatingPanel({
  active,
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
  className,
  visualVariant = "default",
}: SetlistRatingPanelProps) {
  const v2 = visualVariant === "wl-home-v2"
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    if (active) {
      setRating(userRating ?? 0)
      setReview(userReview ?? "")
      setHoverRating(0)
      setIsEditingReview(false)
      setReviewError(null)
      onFetchReviews()
    }
  }, [active, userRating, userReview, onFetchReviews])

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

  const reviewLabel = userReview ? "Edit Review" : "Write a Review"

  const sectionBorder = v2 ? undefined : "border-border/50"
  const sectionPad = v2 ? undefined : "px-4 py-3"

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", v2 && P, className)}
    >
      <div
        className={cn(
          !v2 &&
            "flex shrink-0 flex-wrap items-center justify-center gap-2 border-b " +
              sectionBorder +
              " " +
              sectionPad,
          v2 && `${P}__section ${P}__section--summary`,
        )}
      >
        {v2 ?
          <SetlistRatingStarsRow
            rating={averageRating}
            rowClassName={`${P}__summary-stars`}
            emptyClassName="wl-home-v2-setlist-rating-star-empty"
            fillClassName="wl-home-v2-setlist-rating-star-fill"
          />
        : <SetlistRatingStarsRow rating={averageRating} />}
        {averageRating > 0 && (
          <span className={cn(!v2 && "text-sm font-medium tabular-nums", v2 && P + "__avg")}>
            {averageRating.toFixed(2)}
          </span>
        )}
        {reviewCount > 0 && (
          <span className={cn(!v2 && "text-sm text-muted-foreground", v2 && P + "__count")}>
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      <div
        className={cn(
          !v2 && "shrink-0 space-y-3 border-b bg-muted/30 " + sectionBorder + " " + sectionPad,
          v2 && `${P}__section ${P}__section--controls`,
        )}
      >
        <div
          className={cn(
            !v2 &&
              "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
            v2 && P + "__controls-row",
          )}
        >
          <div
            className={cn(
              !v2 &&
                "flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-start",
              v2 && P + "__rate-wrap",
            )}
          >
            <span className={cn(!v2 && "text-sm text-muted-foreground", v2 && P + "__hint")}>
              {hasRating ? "Your rating:" : "Rate this show:"}
            </span>
            <div className={cn("flex items-center", v2 ? P + "__stars-inline" : "gap-1")}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={submitting}
                  className={cn(
                    "rounded p-0.5 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    v2 ? P + "__rate-btn"
                    : "focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  onMouseEnter={() => !submitting && setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={async () => {
                    setRating(value)
                    await onSubmit(value, review)
                  }}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    className={cn(
                      v2 ?
                        P +
                          "__rate-icon " +
                          (value <= displayRating ?
                            P + "__rate-icon--on"
                          : P + "__rate-icon--off")
                      : "size-6 transition-colors",
                      !v2 &&
                        (value <= displayRating ?
                          "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground/30"),
                    )}
                    weight={value <= displayRating ? "fill" : "regular"}
                  />
                </button>
              ))}
            </div>
            {hasRating && (
              <span
                className={cn(!v2 && "text-xs text-muted-foreground", v2 && P + "__hint-muted")}
              >
                ({rating} {rating === 1 ? "star" : "stars"})
              </span>
            )}
          </div>
          {v2 ?
            <button
              type="button"
              className={P + "__outline-btn"}
              onClick={() => setIsEditingReview((x) => !x)}
            >
              {reviewLabel}
            </button>
          : <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsEditingReview((x) => !x)}
            >
              {reviewLabel}
            </Button>
          }
        </div>

        {isEditingReview && (
          <div
            className={cn(
              !v2 && "animate-in fade-in slide-in-from-top-2 space-y-2 duration-200",
              v2 && `${P}__edit ${P}__edit-fields`,
            )}
          >
            <Label
              htmlFor="setlist-rating-review"
              className={cn(!v2 && "text-xs", v2 && P + "__field-label")}
            >
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
              className={cn(!v2 && "min-h-[80px] resize-none text-sm", v2 && P + "__textarea")}
              rows={3}
            />
            {reviewError && (
              <p className={cn(!v2 && "text-xs text-destructive", v2 && P + "__field-error")}>
                {reviewError}
              </p>
            )}
            <div className={cn("flex flex-wrap gap-2", v2 && P + "__actions")}>
              {v2 ?
                <>
                  <button
                    type="button"
                    className={P + "__primary-btn"}
                    onClick={() => void handleSaveReview()}
                    disabled={submitting || !hasRating}
                  >
                    {submitting ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    className={P + "__text-btn"}
                    onClick={() => {
                      setIsEditingReview(false)
                      setReview(userReview ?? "")
                      setReviewError(null)
                    }}
                  >
                    Cancel
                  </button>
                </>
              : <>
                  <Button
                    size="sm"
                    onClick={() => void handleSaveReview()}
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
                </>
              }
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          !v2 && "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          v2 && P + "__scroll",
        )}
      >
        <div className={cn("space-y-0", !v2 && "px-4 py-3", v2 && P + "__list")}>
          {reviewsError && (
            <div
              className={cn(
                "flex items-center justify-center text-center",
                !v2 &&
                  "rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive",
                v2 && P + "__error-banner",
              )}
            >
              {reviewsError}
            </div>
          )}
          {isLoadingReviews && (
            <div
              className={cn(
                !v2 && "flex items-center justify-center gap-2 py-8",
                v2 && P + "__loading",
              )}
            >
              <CircleNotch
                className={cn(!v2 && "size-5 animate-spin text-muted-foreground", v2 && P + "__loading-icon")}
                aria-hidden
              />
              <span
                className={cn(!v2 && "text-sm text-muted-foreground", v2 && P + "__loading-text")}
              >
                Loading reviews…
              </span>
            </div>
          )}
          {!isLoadingReviews && !reviewsError && reviews.length === 0 && (
            <p className={cn(!v2 && "py-6 text-center text-sm text-muted-foreground", v2 && P + "__empty")}>
              No written reviews yet for this show.
            </p>
          )}
          {!isLoadingReviews &&
            !reviewsError &&
            reviews.length > 0 &&
            reviews.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-1",
                  !v2 && "border-b border-border/40 py-1 last:border-b-0",
                  v2 && P + "__review",
                )}
              >
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2",
                    v2 && P + "__review-head",
                  )}
                >
                  {v2 ?
                    <SetlistRatingStarsRow
                      rating={r.rating}
                      sizeClassName="size-3.5"
                      rowClassName={`${P}__review-stars`}
                      emptyClassName="wl-home-v2-setlist-rating-star-empty"
                      fillClassName="wl-home-v2-setlist-rating-star-fill"
                    />
                  : <SetlistRatingStarsRow rating={r.rating} sizeClassName="size-3.5" />}
                  <span className={cn(!v2 && "text-sm font-medium", v2 && P + "__review-user")}>
                    {r.username}
                  </span>
                </div>
                {r.review && (
                  <p className={cn(!v2 && "text-xs text-muted-foreground", v2 && P + "__review-body")}>
                    {r.review}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>

      {!hasRating && (
        <div className={cn("shrink-0", !v2 && "border-t p-4 " + sectionBorder, v2 && P + "__footer")}>
          {v2 ?
            <button
              type="button"
              className={P + "__submit-wide"}
              onClick={() => void handleSaveRating()}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Submit rating"}
            </button>
          : <Button className="w-full" onClick={() => void handleSaveRating()} disabled={submitting}>
              {submitting ? "Saving…" : "Submit rating"}
            </Button>
          }
        </div>
      )}
    </div>
  )
}
