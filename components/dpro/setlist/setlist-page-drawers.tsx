"use client"

import { SetlistRatingDrawer } from "./setlist-rating-drawer"
import { SetlistLoginRequiredDialog } from "./setlist-login-required-dialog"
import { SetlistWtedLoginRequiredDialog } from "./setlist-wted-login-required-dialog"
import { SetlistScanDrawer } from "./setlist-scan-drawer"
import { SetlistSongPerformancesSheet } from "./setlist-song-performances-sheet"
import { SetlistJotyDrawer } from "./setlist-joty-drawer"
import { SetlistWtedSheet } from "./setlist-wted-sheet"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import type { ReviewEntry } from "@/hooks/use-setlist-rating"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import type { Show, SetlistEntry } from "@/types/setlist"

interface SetlistPageDrawersProps {
  show: Show
  setlist: SetlistEntry[]
  changes: ShowChangeRow[]
  setlistUrl: string | null
  ratingDrawerOpen: boolean
  setRatingDrawerOpen: (open: boolean) => void
  loginRequiredOpen: boolean
  setLoginRequiredOpen: (open: boolean) => void
  wtedLoginRequiredOpen: boolean
  setWtedLoginRequiredOpen: (open: boolean) => void
  songSheetOpen: boolean
  setSongSheetOpen: (open: boolean) => void
  songSheetEntry: SetlistEntry | null
  setSongSheetEntry: (entry: SetlistEntry | null) => void
  jotyDrawerOpen: boolean
  setJotyDrawerOpen: (open: boolean) => void
  jotyDrawerYear: number | null
  jotyDrawerHighlightedEntryId: string | null
  wtedSheetOpen: boolean
  setWtedSheetOpen: (open: boolean) => void
  wtedSheetEntry: SetlistEntry | null
  setWtedSheetEntry: (entry: SetlistEntry | null) => void
  setlistScanDrawerOpen: boolean
  setSetlistScanDrawerOpen: (open: boolean) => void
  averageRating: number | null
  reviewCount: number
  userRating: number | null
  userReview: string | null
  reviews: ReviewEntry[]
  isLoadingReviews: boolean
  reviewsError: string | null
  submitRating: (rating: number, review?: string) => Promise<void>
  submitting: boolean
  fetchReviews: () => void
  validateReview: (review: string) => string | null
  releases: ShowRelease[]
}

export function SetlistPageDrawers({
  show,
  setlist,
  changes,
  setlistUrl,
  ratingDrawerOpen,
  setRatingDrawerOpen,
  loginRequiredOpen,
  setLoginRequiredOpen,
  wtedLoginRequiredOpen,
  setWtedLoginRequiredOpen,
  songSheetOpen,
  setSongSheetOpen,
  songSheetEntry,
  setSongSheetEntry,
  jotyDrawerOpen,
  setJotyDrawerOpen,
  jotyDrawerYear,
  jotyDrawerHighlightedEntryId,
  wtedSheetOpen,
  setWtedSheetOpen,
  wtedSheetEntry,
  setWtedSheetEntry,
  setlistScanDrawerOpen,
  setSetlistScanDrawerOpen,
  averageRating,
  reviewCount,
  userRating,
  userReview,
  reviews,
  isLoadingReviews,
  reviewsError,
  submitRating,
  submitting,
  fetchReviews,
  validateReview,
  releases,
}: SetlistPageDrawersProps) {
  return (
    <>
      <SetlistRatingDrawer
        open={ratingDrawerOpen}
        onOpenChange={setRatingDrawerOpen}
        showDate={show?.show_date ?? ""}
        showVenueLocation={show?.show_venue_location ?? ""}
        averageRating={averageRating ?? 0}
        reviewCount={reviewCount}
        userRating={userRating}
        userReview={userReview}
        reviews={reviews}
        isLoadingReviews={isLoadingReviews}
        reviewsError={reviewsError}
        onSubmit={submitRating}
        submitting={submitting}
        onFetchReviews={fetchReviews}
        validateReview={validateReview}
      />

      <SetlistLoginRequiredDialog
        open={loginRequiredOpen}
        onOpenChange={setLoginRequiredOpen}
      />

      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
      />

      {setlistUrl && (
        <SetlistScanDrawer
          open={setlistScanDrawerOpen}
          onOpenChange={setSetlistScanDrawerOpen}
          setlistUrl={setlistUrl}
          show={show}
          setlist={setlist}
          changes={changes}
        />
      )}

      <SetlistSongPerformancesSheet
        open={songSheetOpen}
        onOpenChange={setSongSheetOpen}
        entry={songSheetEntry}
        tourName={show.show_tour}
      />

      <SetlistJotyDrawer
        open={jotyDrawerOpen}
        onOpenChange={setJotyDrawerOpen}
        year={jotyDrawerYear}
        highlightedEntryId={jotyDrawerHighlightedEntryId}
      />

      <SetlistWtedSheet
        open={wtedSheetOpen}
        onOpenChange={setWtedSheetOpen}
        entry={wtedSheetEntry}
        show={{
          show_date: show.show_date,
          show_venue_location: show.show_venue_location,
          show_group: show.show_group,
        }}
        releaseArtwork={releases[0]?.release_artwork ?? null}
      />
    </>
  )
}
