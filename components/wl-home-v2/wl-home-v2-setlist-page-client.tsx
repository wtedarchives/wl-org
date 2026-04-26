"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { notFound } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistJotyModal } from "@/components/wl-home-v2/wl-home-v2-setlist-joty-modal"
import { WlHomeV2SetlistSongModal } from "@/components/wl-home-v2/wl-home-v2-setlist-song-modal"
import { WlHomeV2SetlistPlaceholderView } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view"
import { WlHomeV2SetlistWtedModal } from "@/components/wl-home-v2/wl-home-v2-setlist-wted-modal"
import {
  buildSetlistArchiveBreadcrumbItems,
  useSetlistArchiveDocumentTitle,
} from "@/hooks/use-setlist-archive-page-meta"
import { useMaxShowCanonId } from "@/hooks/use-max-show-canonid"
import { useShowPosition } from "@/hooks/use-setlist-display"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { useSetlistArchiveShowId } from "@/hooks/use-setlist-archive-show-id"
import { useSetlistData, useShowDates, useTours } from "@/hooks/use-setlist-data"
import { useSetlistAdmin } from "@/hooks/use-setlist-admin"
import { useSetlistNavigation } from "@/hooks/use-setlist-navigation"
import { useSetlistReleases } from "@/hooks/use-setlist-releases"
import { useSetlistYearId } from "@/hooks/use-setlist-year-id"
import type { SetlistEntry } from "@/types/setlist"

export function WlHomeV2SetlistPageClient() {
  const { user } = useAuth()
  const { showId, invalidParams } = useSetlistArchiveShowId()
  const { showAdminUi } = useSetlistAdmin(user, showId)
  const { show, setlist, loading } = useSetlistData(showId)
  const { tours } = useTours()
  const { showDates } = useShowDates(show ?? null, showId)
  const showPosition = useShowPosition(show ?? null, showDates)
  const { handleTourSelect, handleShowSelect } = useSetlistNavigation(
    show ?? null,
  )
  const yearId = useSetlistYearId(show?.show_date)
  const { maxCanonId, loading: maxCanonLoading } = useMaxShowCanonId()
  const showPositionInTour = useShowPositionInTour(
    showId,
    show?.show_tour ?? undefined,
  )

  const jotyHeadingId = useId()
  const songModalHeadingId = useId()
  const songModalTourId = useId()
  const wtedModalHeadingId = useId()
  const [jotyModalOpen, setJotyModalOpen] = useState(false)
  const [songModalOpen, setSongModalOpen] = useState(false)
  const [songModalEntry, setSongModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedModalOpen, setWtedModalOpen] = useState(false)
  const [wtedModalEntry, setWtedModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedLoginRequiredOpen, setWtedLoginRequiredOpen] = useState(false)
  const [jotyYear, setJotyYear] = useState<number | null>(null)
  const [jotyHighlightedEntryId, setJotyHighlightedEntryId] = useState<
    string | null
  >(null)
  const [copiedEntryIds, setCopiedEntryIds] = useState<Set<string>>(new Set())

  const { releases, releaseToEntriesMap } = useSetlistReleases(showId)
  const fallbackWtedArtwork = releases[0]?.release_artwork ?? null

  const handleNumberClick = useCallback(async (entryId: string) => {
    try {
      await navigator.clipboard.writeText(entryId)
      setCopiedEntryIds((prev) => new Set(prev).add(entryId))
      setTimeout(() => {
        setCopiedEntryIds((prev) => {
          const next = new Set(prev)
          next.delete(entryId)
          return next
        })
      }, 2000)
    } catch {
      // ignore
    }
  }, [])

  const onJotyBadgeClick = useCallback(
    (entry: SetlistEntry) => {
      const y = show?.show_date?.slice(0, 4)
      setJotyYear(y ? Number(y) : null)
      setJotyHighlightedEntryId(entry.entry_id)
      setJotyModalOpen(true)
    },
    [show?.show_date],
  )

  const onSongClick = useCallback((entry: SetlistEntry) => {
    setSongModalEntry(entry)
    setSongModalOpen(true)
  }, [])

  const onWtedClick = useCallback(
    (entry: SetlistEntry) => {
      if (!user) {
        setWtedLoginRequiredOpen(true)
        return
      }
      setWtedModalEntry(entry)
      setWtedModalOpen(true)
    },
    [user],
  )

  const closeSongModal = useCallback(() => {
    setSongModalOpen(false)
    setSongModalEntry(null)
  }, [])

  const closeWtedModal = useCallback(() => {
    setWtedModalOpen(false)
    setWtedModalEntry(null)
  }, [])

  useEffect(() => {
    if (!songModalOpen && !wtedModalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (songModalOpen) closeSongModal()
      if (wtedModalOpen) closeWtedModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [
    songModalOpen,
    wtedModalOpen,
    closeSongModal,
    closeWtedModal,
  ])

  const wtedModalShow = useMemo(
    () => ({
      show_date: show?.show_date ?? "",
      show_venue_location: show?.show_venue_location ?? null,
      show_group: show?.show_group ?? null,
    }),
    [show?.show_date, show?.show_venue_location, show?.show_group],
  )

  useSetlistArchiveDocumentTitle(show, { titleSuffix: "WTED.org" })

  const breadcrumbs = useMemo(
    () =>
      show && yearId ?
        buildSetlistArchiveBreadcrumbItems(
          WL_V2_ARCHIVES_BREADCRUMB_ROOT,
          show,
          yearId,
        )
      : null,
    [show, yearId],
  )

  if (invalidParams || !showId) notFound()

  if (loading) {
    return <WlHomeV2PageLoading message="Loading setlist…" />
  }

  if (!show) notFound()

  return (
    <>
      <WlHomeV2SetlistPlaceholderView
        breadcrumbs={breadcrumbs}
        show={show}
        showId={showId}
        setlist={setlist}
        showAdminUi={showAdminUi}
        copiedEntryIds={showAdminUi ? copiedEntryIds : undefined}
        onNumberClick={showAdminUi ? handleNumberClick : undefined}
        onJotyBadgeClick={onJotyBadgeClick}
        onSongClick={onSongClick}
        onWtedClick={onWtedClick}
        showPositionInTour={showPositionInTour}
        tourShowNav={showPosition}
        onTourShowSelect={handleShowSelect}
        tours={tours}
        showDates={showDates}
        onTourSelect={handleTourSelect}
        maxShowCanonId={maxCanonId}
        maxShowCanonIdLoading={maxCanonLoading}
        releases={releases}
        releaseToEntriesMap={releaseToEntriesMap}
      />
      <WlHomeV2SetlistJotyModal
        open={jotyModalOpen}
        onClose={() => setJotyModalOpen(false)}
        year={jotyYear}
        highlightedEntryId={jotyHighlightedEntryId}
        headingId={jotyHeadingId}
      />
      <WlHomeV2SetlistSongModal
        open={songModalOpen}
        onClose={closeSongModal}
        entry={songModalEntry}
        tourName={show.show_tour}
        headingId={songModalHeadingId}
        tourLineId={songModalTourId}
      />
      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
      />
      <WlHomeV2SetlistWtedModal
        open={wtedModalOpen}
        onClose={closeWtedModal}
        entry={wtedModalEntry}
        setlist={setlist}
        show={wtedModalShow}
        fallbackReleaseArtwork={fallbackWtedArtwork}
        headingId={wtedModalHeadingId}
      />
    </>
  )
}
