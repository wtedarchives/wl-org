"use client"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { ReviewEntry } from "@/hooks/use-setlist-rating"
import { SetlistRatingPanel } from "./setlist-rating-panel"

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
  const formattedDate = formatSetlistDate(showDate)
  const title = formattedDate || "Show Reviews"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[85vh] min-h-0 max-w-[800px] flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DrawerHeader className="relative flex shrink-0 flex-col items-center justify-center border-b border-border/50 py-3 text-center">
            <DrawerTitle className="text-base font-semibold">{title}</DrawerTitle>
            {showVenueLocation && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {showVenueLocation}
              </p>
            )}
          </DrawerHeader>

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
            className="min-h-0 flex-1"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
