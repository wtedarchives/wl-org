"use client"

import { useEffect, useId } from "react"

import { SetlistRatingPanel } from "@/components/dpro/setlist/setlist-rating-panel"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import type { ReviewEntry } from "@/hooks/use-setlist-rating"
import { formatSetlistDate } from "@/lib/setlist-utils"

type WlHomeV2SetlistRatingModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
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

/**
 * WL Home v2: same rating/review flow as {@link SetlistRatingDrawer}, in the
 * centered `modal-backdrop` + `modal--wted-request` shell (Request a Song–style).
 */
export function WlHomeV2SetlistRatingModal({
  open,
  onClose,
  headingId,
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
}: WlHomeV2SetlistRatingModalProps) {
  const subtextId = useId()
  useWlHomeV2ScrollLock(open)

  const formattedDate = formatSetlistDate(showDate)
  const title = formattedDate || "Show reviews"

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-setlist-rating-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-rating"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={showVenueLocation ? subtextId : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{title}</h3>
              {showVenueLocation ?
                <p id={subtextId} className="modal-request-sub">
                  {showVenueLocation}
                </p>
              : null}
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body modal-setlist-rating-body">
            <SetlistRatingPanel
              active={open}
              averageRating={averageRating}
              reviewCount={reviewCount}
              userRating={userRating}
              userReview={userReview}
              reviews={reviews}
              isLoadingReviews={isLoadingReviews}
              reviewsError={reviewsError}
              onSubmit={onSubmit}
              submitting={submitting}
              onFetchReviews={onFetchReviews}
              validateReview={validateReview}
              visualVariant="wl-home-v2"
            />
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
