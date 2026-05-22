"use client"

import { SongsArchiveListSearchModal } from "@/components/archive-songs/wl-home-v2-songs-archive-list-modals"
import { SetlistJotyDrawer } from "@/components/dpro/setlist/setlist-joty-drawer"
import { WlHomeV2SetlistWtedModal } from "@/components/wl-home-v2/wl-home-v2-setlist-wted-modal"
import type { SongsArchiveSong } from "@/hooks/use-songs-archive-data"
import type { SetlistEntry } from "@/types/setlist"
import type { Dispatch, RefObject, SetStateAction } from "react"

import type { SongArchivePerformanceWtedPayload } from "@/components/archive-song/song-archive-detail-performances-types"

export function WlHomeV2SongArchiveDetailModals({
  searchOpen,
  closeSearch,
  searchQuery,
  setSearchQuery,
  searchHits,
  searchInputRef,
  songPerfWtedModalOpen,
  closePerfTableWtedModal,
  songPerfWtedModal,
  perfTableWtedAnchorSetlist,
  songPerfWtedModalHeadingId,
  jotyOpen,
  setJotyOpen,
  jotyYear,
  jotyEntryId,
}: {
  searchOpen: boolean
  closeSearch: () => void
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  searchHits: SongsArchiveSong[]
  searchInputRef: RefObject<HTMLInputElement | null>
  songPerfWtedModalOpen: boolean
  closePerfTableWtedModal: () => void
  songPerfWtedModal: SongArchivePerformanceWtedPayload | null
  perfTableWtedAnchorSetlist: SetlistEntry[]
  songPerfWtedModalHeadingId: string
  jotyOpen: boolean
  setJotyOpen: (open: boolean) => void
  jotyYear: number | null
  jotyEntryId: string | null
}) {
  return (
    <>
      <SongsArchiveListSearchModal
        open={searchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchHits={searchHits}
        searchInputRef={searchInputRef}
      />
      <WlHomeV2SetlistWtedModal
        open={songPerfWtedModalOpen}
        onClose={closePerfTableWtedModal}
        entry={songPerfWtedModal?.entry ?? null}
        setlist={
          perfTableWtedAnchorSetlist.length > 0 ?
            perfTableWtedAnchorSetlist
          : songPerfWtedModal ?
            [songPerfWtedModal.entry]
          : []
        }
        show={
          songPerfWtedModal?.show ?? {
            show_date: "",
            show_venue_location: null,
            show_group: null,
          }
        }
        fallbackReleaseArtwork={null}
        headingId={songPerfWtedModalHeadingId}
      />
      <SetlistJotyDrawer
        open={jotyOpen}
        onOpenChange={setJotyOpen}
        year={jotyYear}
        highlightedEntryId={jotyEntryId}
      />
    </>
  )
}
