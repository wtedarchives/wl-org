"use client"

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { notFound, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { DisplaySetlistTable } from "@/components/dpro/setlist/display-setlist-table"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { useDiscographyReleaseData } from "@/hooks/use-discography-release-data"
import { useDiscographyLinkedSetlist } from "@/hooks/use-discography-linked-setlist"
import { useDiscographyLinkedReleases } from "@/hooks/use-discography-linked-releases"
import { useGuestGroups } from "@/hooks/use-setlist-display"
import { Card, CardContent } from "@/components/ui/card"
import { SetlistShowNotes } from "@/components/dpro/setlist/setlist-show-notes"
import { Separator } from "@/components/ui/separator"
import type { SetlistEntry } from "@/types/setlist"
import { formatLengthAsHmmss, totalSetlistLength } from "@/lib/setlist-utils"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { cn } from "@/lib/utils"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"

import "@/components/archive-songs/songs-archive-verbatim.css"

/** Same main-column photo + green wash as WL v2 setlist (`WlHomeV2SetlistPlaceholderView`). */
const DISCOGRAPHY_V2_MAIN_TILE_STYLE = {
  "--tile-bg": "url('/newbg3.jpeg')",
} as CSSProperties

const WL_V2_DISCOGRAPHY_PAGE_CLASS =
  "wl-home-v2-years-page songs-archive-verbatim wl-home-v2-songs-archive-page wl-home-v2-discography-release-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col"

const EMPTY_WTED_SHOW = {
  show_date: "",
  show_venue_location: null as string | null,
  show_group: null as string | null,
}

function formatReleaseDate(iso: string | null): string | null {
  if (!iso) return null
  const parts = iso.split("-").map(Number)
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return iso
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

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

  useEffect(() => {
    setHoveredReleaseId(null)
    setWtedSheetOpen(false)
    setWtedSheetEntry(null)
    setWtedLoginRequiredOpen(false)
  }, [id])

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
    document.title = `${release.displayname} – WysteriaLane.org`
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
    if (wlHomeV2Shell) {
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
                  { label: "…", href: getDiscographyArchiveUrl(id) },
                ]}
                openArchiveHub={openArchiveHub ?? undefined}
                renderLastCrumb={() => "Loading…"}
              />
            }
          />
          <div
            className="wl-home-v2-years-tile wl-home-v2-years-tile--main discography-release-archive__shell flex min-h-0 min-w-0 w-full flex-1 flex-col"
            style={DISCOGRAPHY_V2_MAIN_TILE_STYLE}
          >
            <div className="discography-release-archive__shell-body wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col">
              {loadingFallback ?
                loadingFallback
              : <WlHomeV2PageLoading
                  message={title ? `Loading ${title}…` : "Loading release…"}
                />
              }
            </div>
          </div>
        </div>
      )
    }
    if (loadingFallback) return loadingFallback
    return (
      <LoadingPageCard
        message={title ? `Loading ${title}…` : undefined}
        page="discography"
      />
    )
  }

  if (error || !release) {
    notFound()
  }

  const releaseDateLabel = formatReleaseDate(release.release_date)

  const artworkBlock =
    release.artwork && !releaseArtworkFailed ?
      <div className="w-full shrink-0 md:w-auto md:max-h-[280px] md:shrink-0 md:self-start">
        <img
          src={release.artwork}
          alt={release.displayname}
          decoding="async"
          className="discography-release-archive__artwork mx-auto block h-auto w-full max-w-full object-contain object-center md:mx-0 md:w-auto md:max-h-[280px]"
          onError={() => setReleaseArtworkFailed(true)}
        />
      </div>
    : null

  const headerMeta =
    wlHomeV2Shell ?
      <div className="discography-release-archive__header-meta-region">
        <dl className="discography-release-archive__header-meta">
          <dt>Category</dt>
          <dd>{release.category}</dd>
          {releaseDateLabel ?
            <>
              <dt>Release date</dt>
              <dd>{releaseDateLabel}</dd>
            </>
          : null}
          {discographyLengthDisplay ?
            <>
              <dt>Length</dt>
              <dd>
                <span className="discography-release-archive__length-pill tabular-nums">
                  {discographyLengthDisplay}
                </span>
              </dd>
            </>
          : null}
        </dl>
      </div>
    : null

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
      {wlHomeV2Shell ?
        <section
          className="discography-release-archive__hero flex min-w-0 flex-col gap-3 md:gap-4"
          aria-labelledby="discography-release-archive-title"
        >
          <header className="show-header discography-release-archive__banner">
            <div className="discography-release-archive__banner-rows flex min-w-0 flex-1 flex-col gap-5 md:flex-row md:items-start md:gap-6">
              {artworkBlock}
              <div className="left flex min-w-0 w-full flex-1 flex-col gap-4 md:gap-5">
                <div className="show-header-title-row">
                  <h1
                    id="discography-release-archive-title"
                    className="show-header-heading"
                  >
                    {release.displayname}
                  </h1>
                </div>
                {release.artist ?
                  <p className="discography-release-archive__artist-meta">
                    {release.artist}
                  </p>
                : null}
                {headerMeta}
                <div className="discography-release-archive__coach-notes min-w-0">
                  <SetlistShowNotes notes={release.coach_notes} />
                </div>
              </div>
            </div>
          </header>
        </section>
      : <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {release.artwork && !releaseArtworkFailed ?
              <div className="mx-auto w-full max-w-full shrink-0 sm:mx-0 sm:w-max">
                <img
                  src={release.artwork}
                  alt={release.displayname}
                  className="discography-release-archive__artwork block h-auto w-full max-h-none max-w-none rounded-lg border border-border bg-muted/30 shadow-sm transition-all duration-200 ease-out sm:h-auto sm:w-auto sm:max-h-[min(70vh,520px)] sm:max-w-[min(100vw-2rem,280px)]"
                  onError={() => setReleaseArtworkFailed(true)}
                />
              </div>
            : null}

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight leading-5 text-foreground md:text-2xl">
                  {release.displayname}
                </h1>
                {release.artist ?
                  <p className="mt-1 text-sm text-muted-foreground">
                    {release.artist}
                  </p>
                : null}
              </div>

              <Separator />

              <dl className="grid gap-2 text-sm">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium text-foreground">{release.category}</dd>
                </div>
                {releaseDateLabel ?
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <dt className="text-muted-foreground">Release date</dt>
                    <dd className="font-medium text-foreground">
                      {releaseDateLabel}
                    </dd>
                  </div>
                : null}
                {discographyLengthDisplay ?
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <dt className="text-muted-foreground">Length</dt>
                    <dd className="m-0">
                      <span className="inline-block rounded bg-wl-dark-green px-1.5 py-[1px] text-xs font-medium tabular-nums text-white">
                        {discographyLengthDisplay}
                      </span>
                    </dd>
                  </div>
                : null}
              </dl>
              <SetlistShowNotes notes={release.coach_notes} />
            </div>
          </div>
        </>
      }

      {(linkedSetlistLoading ||
        linkedSetlistError ||
        linkedSetlist.length > 0) &&
        (wlHomeV2Shell ?
          <div className="wl-home-v2-setlist flex min-w-0 flex-col gap-4">
            <section
              className="min-w-0"
              aria-label="Track listing"
            >
              {linkedSetlistLoading ?
                <div className="setlist-card wl-home-v2-setlist-card">
                  <div className="px-4 py-6 text-center text-sm text-white/55">
                    Loading track listing…
                  </div>
                </div>
              : linkedSetlistError ?
                <div className="setlist-card wl-home-v2-setlist-card">
                  <div className="px-4 py-6 text-center text-sm text-white/55">
                    Could not load track listing.
                  </div>
                </div>
              : (
                <div className="setlist-card wl-home-v2-setlist-card">
                  <div className="wl-home-v2-setlist-table-scroll">
                    <DisplaySetlistTable
                      {...discographyTracksTableProps}
                      wlHomeV2SetlistTableChrome
                    />
                  </div>
                </div>
              )}
            </section>
            {tracksReady && hasDiscographyReleases ?
              <SetlistMediaSection
                visualVariant="wl-home-v2"
                releases={discographyReleases}
                onReleaseHover={setHoveredReleaseId}
              />
            : null}
          </div>
        : <>
          <Separator className="shrink-0" />
          <section
            className="min-w-0 space-y-2"
            aria-labelledby="discography-track-listing-heading"
          >
            <h2
              id="discography-track-listing-heading"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Track listing
            </h2>
            {linkedSetlistLoading ? (
              <Card className="list-card shadow-none ring-0 py-0">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Loading track listing…
                </CardContent>
              </Card>
            ) : linkedSetlistError ? (
              <Card className="list-card shadow-none ring-0 py-0">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Could not load track listing.
                </CardContent>
              </Card>
            ) : (
              <Card className="list-card shadow-none ring-0 py-0">
                <CardContent className="p-0">
                  <DisplaySetlistTable {...discographyTracksTableProps} />
                </CardContent>
              </Card>
            )}
          </section>
          {tracksReady && hasDiscographyReleases ?
            <>
              <Separator className="shrink-0" />
              <SetlistMediaSection
                releases={discographyReleases}
                onReleaseHover={setHoveredReleaseId}
              />
            </>
          : null}
        </>)}

      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
      />
      <SetlistWtedSheet
        open={wtedSheetOpen}
        onOpenChange={setWtedSheetOpen}
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
