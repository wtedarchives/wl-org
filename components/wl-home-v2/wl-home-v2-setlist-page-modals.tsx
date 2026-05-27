"use client"

import { WlHomeV2SetlistJotyModal } from "@/components/wl-home-v2/wl-home-v2-setlist-joty-modal"
import { WlHomeV2SetlistRatingModal } from "@/components/wl-home-v2/wl-home-v2-setlist-rating-modal"
import { WlHomeV2SetlistScanModal } from "@/components/wl-home-v2/wl-home-v2-setlist-scan-modal"
import { WlHomeV2SetlistShareExportModal } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-modal"
import { WlHomeV2SetlistSongModal } from "@/components/wl-home-v2/wl-home-v2-setlist-song-modal"
import { WlHomeV2SetlistWtedModal } from "@/components/wl-home-v2/wl-home-v2-setlist-wted-modal"
import type { useWlHomeV2SetlistPageClient } from "@/hooks/use-wl-home-v2-setlist-page-client"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import type { SetlistEntry, Show } from "@/types/setlist"

type SetlistPageClientState = ReturnType<typeof useWlHomeV2SetlistPageClient>

export function WlHomeV2SetlistPageModals({
  show,
  setlist,
  showChanges,
  state,
}: {
  show: Show
  setlist: SetlistEntry[]
  showChanges: ShowChangeRow[]
  state: SetlistPageClientState
}) {
  return (
    <>
      <WlHomeV2SetlistShareExportModal
        open={state.shareExportOpen}
        onOpenChange={state.setShareExportOpen}
        backgroundSrc={state.shareExportBg}
        show={show}
        setlist={setlist}
        showPositionInTour={state.showPositionInTour}
        canUploadShareImage={state.showAdminUi}
      />
      <WlHomeV2SetlistRatingModal
        open={state.ratingModalOpen}
        onClose={() => state.setRatingModalOpen(false)}
        headingId={state.ratingModalHeadingId}
        showDate={show.show_date ?? ""}
        showVenueLocation={show.show_venue_location ?? ""}
        averageRating={state.averageRating}
        reviewCount={state.reviewCount}
        userRating={state.userRating}
        userReview={state.userReview}
        reviews={state.reviews}
        isLoadingReviews={state.isLoadingReviews}
        reviewsError={state.reviewsError}
        onSubmit={state.submitRating}
        submitting={state.submitting}
        onFetchReviews={state.fetchReviews}
        validateReview={state.validateReview}
      />
      <WlHomeV2SetlistJotyModal
        open={state.jotyModalOpen}
        onClose={() => state.setJotyModalOpen(false)}
        year={state.jotyYear}
        highlightedEntryId={state.jotyHighlightedEntryId}
        headingId={state.jotyHeadingId}
      />
      <WlHomeV2SetlistSongModal
        open={state.songModalOpen}
        onClose={state.closeSongModal}
        entry={state.activeSongModalEntry}
        entries={
          state.songModalMode === "multi-section" ?
            state.songModalEntries
          : undefined
        }
        pairAltName={state.songModalPairAltName}
        tourName={show.show_tour}
        headingId={state.songModalHeadingId}
        tourLineId={state.songModalTourId}
      />
      <WlHomeV2SetlistWtedModal
        open={state.wtedModalOpen}
        onClose={state.closeWtedModal}
        entry={state.wtedModalEntry}
        wtedEntryOptions={state.wtedModalEntryOptions}
        setlist={setlist}
        show={state.wtedModalShow}
        fallbackReleaseArtwork={state.fallbackWtedArtwork}
        headingId={state.wtedModalHeadingId}
      />
      <WlHomeV2SetlistScanModal
        open={state.setlistScanModalOpen}
        onClose={() => state.setSetlistScanModalOpen(false)}
        headingId={state.scanHeadingId}
        setlistUrl={state.setlistUrl ?? ""}
        show={show}
        setlist={setlist}
        changes={showChanges}
      />
    </>
  )
}
