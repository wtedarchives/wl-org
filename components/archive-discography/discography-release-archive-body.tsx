"use client"

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { notFound, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { WlHomeV2SetlistWtedModal } from "@/components/wl-home-v2/wl-home-v2-setlist-wted-modal"
import { useDiscographyReleaseData } from "@/hooks/use-discography-release-data"
import { useDiscographyLinkedSetlist } from "@/hooks/use-discography-linked-setlist"
import { useDiscographyLinkedReleases } from "@/hooks/use-discography-linked-releases"
import { useGuestGroups } from "@/hooks/use-setlist-display"
import type { SetlistEntry } from "@/types/setlist"
import { formatLengthAsHmmss, totalSetlistLength } from "@/lib/setlist-utils"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { cn } from "@/lib/utils"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { DiscographyReleaseArchiveHero } from "@/components/archive-discography/discography-release-archive-hero"
import { DiscographyReleaseArchiveLoading } from "@/components/archive-discography/discography-release-archive-loading"
import { DiscographyReleaseArchiveTrackSection } from "@/components/archive-discography/discography-release-archive-track-section"
import {
  DISCOGRAPHY_V2_MAIN_TILE_STYLE,
  EMPTY_WTED_SHOW,
  WL_V2_DISCOGRAPHY_PAGE_CLASS,
} from "@/components/archive-discography/discography-release-archive-body.constants"
import { formatReleaseDate } from "@/components/archive-discography/discography-release-archive-utils"

import "@/components/archive-songs/songs-archive-verbatim.css"

export type DiscographyReleaseArchiveBodyProps = {
  id: string
  /**
   * When set, registers `(main)` sidebar breadcrumbs (`WTED_ARCHIVES_BREADCRUMB_ROOT`).
   * Omit for WL Home v2 pages that render their own crumb shell.
   */
  legacySidebarDiscographyIndexHref?: string
  /** WL Home v2 archive: crumbs + main column tile (setlist-style photo + `wl-home-v2-years-tile-inner` padding). */
  wlHomeV2Shell?: boolean
  /** Wrap loading state for use outside `(main)` (e.g. WL Home v2). */
  loadingFallback?: ReactNode
  rootClassName?: string
}

export function DiscographyReleaseArchiveBody({
  id,
  legacySidebarDiscographyIndexHref,
  wlHomeV2Shell = false,
  loadingFallback,
  rootClassName,
}: DiscographyReleaseArchiveBodyProps) {
  const router = useRouter()
  const { session } = useAuth()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const wtedModalHeadingId = useId()
  const [releaseArtworkFailed, setReleaseArtworkFailed] = useState(false)
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(null)
  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [wtedSheetEntry, setWtedSheetEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedLoginRequiredOpen, setWtedLoginRequiredOpen] = useState(false)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { release, loading, error } = useDiscographyReleaseData(id)
  const {
    setlist: linkedSetlist,
    rowKeys: linkedRowKeys,
    discographyOrders: linkedDiscographyOrders,
    discographySourceLabels: linkedDiscographySourceLabels,
    discographyShowColumnCells: linkedDiscographyShowColumnCells,
    showContextById: linkedShowContextById,
    loading: linkedSetlistLoading,
    error: linkedSetlistError,
  } = useDiscographyLinkedSetlist(id)
  const guestGroups = useGuestGroups(linkedSetlist)

  const tracksReady =
    !linkedSetlistLoading &&
    !linkedSetlistError &&
    linkedSetlist.length > 0
  const {
    releases: discographyReleases,
    releaseToEntriesMap: discographyReleaseToEntriesMap,
    hasReleases: hasDiscographyReleases,
  } = useDiscographyLinkedReleases(linkedSetlist, tracksReady)

  const title = release?.displayname ?? ""

  const closeWtedRequestUi = useCallback(() => {
    setWtedSheetOpen(false)
    setWtedSheetEntry(null)
  }, [])

  useEffect(() => {
    setHoveredReleaseId(null)
    closeWtedRequestUi()
    setWtedLoginRequiredOpen(false)
  }, [id, closeWtedRequestUi])

  useEffect(() => {
    if (!wlHomeV2Shell || !wtedSheetOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      closeWtedRequestUi()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [wlHomeV2Shell, wtedSheetOpen, closeWtedRequestUi])

  useEffect(() => {
    setReleaseArtworkFailed(false)
  }, [id, release?.artwork])

  useEffect(() => {
    if (!legacySidebarDiscographyIndexHref) return
    if (!release) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      WTED_ARCHIVES_BREADCRUMB_ROOT,
      {
        label: "Discography",
        href: legacySidebarDiscographyIndexHref,
      },
      { label: release.displayname, href: getDiscographyArchiveUrl(id) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [
    release,
    id,
    legacySidebarDiscographyIndexHref,
    setSetlistBreadcrumbs,
  ])

  useEffect(() => {
    if (!release) return
    const previousTitle = document.title
    document.title = `${release.displayname} – WTEDRadio.com`
    return () => {
      document.title = previousTitle
    }
  }, [release])

  const discographyLengthDisplay = useMemo(() => {
    if (linkedSetlistLoading || !linkedSetlist.length) return null
    const sum = totalSetlistLength(linkedSetlist)
    if (!sum) return null
    const formatted = formatLengthAsHmmss(sum)
    if (!formatted || formatted === "0:00:00") return null
    return formatted
  }, [linkedSetlist, linkedSetlistLoading])

  if (loading) {
    return (
      <DiscographyReleaseArchiveLoading
        wlHomeV2Shell={wlHomeV2Shell}
        releaseId={id}
        title={title}
        loadingFallback={loadingFallback}
        openArchiveHub={openArchiveHub ?? undefined}
      />
    )
  }

  if (error || !release) {
    notFound()
  }

  const releaseDateLabel = formatReleaseDate(release.release_date)

  const discographyTracksTableProps = {
    setlist: linkedSetlist,
    guestGroups,
    showCanonColumns: false,
    showWtedColumn: linkedSetlist.some((e) => !!e.radio_id),
    rowKeys: linkedRowKeys,
    numberColumnValues: linkedDiscographyOrders,
    suppressPlacementBars: true,
    suppressNumberPlacementColor: false,
    showDiscographySourceColumn: true,
    discographySourceLabels: linkedDiscographySourceLabels,
    discographyShowColumnCells: linkedDiscographyShowColumnCells,
    hoveredReleaseId,
    releaseToEntriesMap: discographyReleaseToEntriesMap,
    onSongClick: (entry: SetlistEntry) =>
      router.push(getSongArchiveUrl(entry.song_id)),
    onWtedClick: (entry: SetlistEntry) => {
      if (!session) {
        setWtedLoginRequiredOpen(true)
        return
      }
      setWtedSheetEntry(entry)
      setWtedSheetOpen(true)
    },
  }

  const releaseBody = (
    <>
      <DiscographyReleaseArchiveHero
        release={release}
        wlHomeV2Shell={wlHomeV2Shell}
        releaseArtworkFailed={releaseArtworkFailed}
        onArtworkError={() => setReleaseArtworkFailed(true)}
        releaseDateLabel={releaseDateLabel}
        discographyLengthDisplay={discographyLengthDisplay}
      />

      <DiscographyReleaseArchiveTrackSection
        wlHomeV2Shell={wlHomeV2Shell}
        linkedSetlistLoading={linkedSetlistLoading}
        linkedSetlistError={linkedSetlistError}
        linkedSetlistLength={linkedSetlist.length}
        discographyTracksTableProps={discographyTracksTableProps}
        tracksReady={tracksReady}
        hasDiscographyReleases={hasDiscographyReleases}
        discographyReleases={discographyReleases}
        onReleaseHover={setHoveredReleaseId}
      />

      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
        wlHomeV2={wlHomeV2Shell}
      />
      {wlHomeV2Shell ?
        <WlHomeV2SetlistWtedModal
          open={wtedSheetOpen}
          onClose={closeWtedRequestUi}
          entry={wtedSheetEntry}
          setlist={linkedSetlist}
          show={
            wtedSheetEntry ?
              (linkedShowContextById[wtedSheetEntry.entry_show] ??
                EMPTY_WTED_SHOW)
            : EMPTY_WTED_SHOW
          }
          fallbackReleaseArtwork={
            discographyReleases[0]?.release_artwork ?? null
          }
          headingId={wtedModalHeadingId}
        />
      : <SetlistWtedSheet
          open={wtedSheetOpen}
          onOpenChange={(open) => {
            setWtedSheetOpen(open)
            if (!open) setWtedSheetEntry(null)
          }}
          entry={wtedSheetEntry}
          setlist={linkedSetlist}
          show={
            wtedSheetEntry ?
              (linkedShowContextById[wtedSheetEntry.entry_show] ??
                EMPTY_WTED_SHOW)
            : EMPTY_WTED_SHOW
          }
          fallbackReleaseArtwork={
            discographyReleases[0]?.release_artwork ?? null
          }
        />
      }
    </>
  )

  const inner = wlHomeV2Shell ?
    (
      <div
        className="wl-home-v2-years-tile wl-home-v2-years-tile--main discography-release-archive__shell flex min-h-0 min-w-0 w-full flex-1 flex-col"
        style={DISCOGRAPHY_V2_MAIN_TILE_STYLE}
      >
        <div
          className={cn(
            "discography-release-archive__shell-body wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden",
            rootClassName,
          )}
        >
          {releaseBody}
        </div>
      </div>
    )
  : (
      <div
        className={cn(
          "discography-release-archive__shell flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6",
          rootClassName,
        )}
      >
        {releaseBody}
      </div>
    )

  if (!wlHomeV2Shell) return inner

  return (
    <div className={WL_V2_DISCOGRAPHY_PAGE_CLASS}>
      <WlHomeV2ArchiveCrumbsShell
        variant="rail"
        bottomSpacing={false}
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={[
              WL_V2_ARCHIVES_BREADCRUMB_ROOT,
              { label: "Discography", href: "/archive/discography" },
              {
                label: release.displayname,
                href: getDiscographyArchiveUrl(id),
              },
            ]}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />
      {inner}
    </div>
  )
}
