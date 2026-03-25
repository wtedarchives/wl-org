"use client"

import { use, useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
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
import { Separator } from "@/components/ui/separator"
import type { SetlistEntry } from "@/types/setlist"

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

export default function DiscographyReleasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
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
    if (!release) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      { label: "Setlist Archive", href: "/archive" },
      { label: "Discography", href: "/archive/discography" },
      { label: release.displayname, href: "" },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [release, setSetlistBreadcrumbs])

  useEffect(() => {
    if (release) {
      document.title = `${release.displayname} – WysteriaLane.org`
      return () => {
        document.title = ""
      }
    }
  }, [release])

  if (!id) notFound()

  if (loading) {
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

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {release.artwork ? (
          <div className="mx-auto w-max max-w-full shrink-0 sm:mx-0">
            <img
              src={release.artwork}
              alt={release.displayname}
              className="block h-auto max-h-[min(70vh,520px)] w-auto max-w-[min(100vw-2rem,280px)] rounded-lg border border-border bg-muted/30 shadow-sm transition-all duration-200 ease-out"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {release.displayname}
            </h1>
            {release.artist ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {release.artist}
              </p>
            ) : null}
          </div>

          <Separator />

          <dl className="grid gap-2 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium text-foreground">{release.category}</dd>
            </div>
            {releaseDateLabel ? (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-muted-foreground">Release date</dt>
                <dd className="font-medium text-foreground">
                  {releaseDateLabel}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {(linkedSetlistLoading ||
        linkedSetlistError ||
        linkedSetlist.length > 0) && (
        <>
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
              <Card className="border-border/60 bg-card/80 py-0">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Loading track listing…
                </CardContent>
              </Card>
            ) : linkedSetlistError ? (
              <Card className="border-border/60 bg-card/80 py-0">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Could not load track listing.
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-card/80 py-0">
                <CardContent className="p-0">
                  <DisplaySetlistTable
                    setlist={linkedSetlist}
                    guestGroups={guestGroups}
                    showCanonColumns={false}
                    showWtedColumn={linkedSetlist.some((e) => !!e.radio_id)}
                    rowKeys={linkedRowKeys}
                    numberColumnValues={linkedDiscographyOrders}
                    suppressPlacementBars
                    showDiscographySourceColumn
                    discographySourceLabels={linkedDiscographySourceLabels}
                    hoveredReleaseId={hoveredReleaseId}
                    releaseToEntriesMap={discographyReleaseToEntriesMap}
                    onSongClick={(entry) =>
                      router.push(`/archive/song/${entry.song_id}`)
                    }
                    onWtedClick={(entry) => {
                      if (!user) {
                        setWtedLoginRequiredOpen(true)
                        return
                      }
                      setWtedSheetEntry(entry)
                      setWtedSheetOpen(true)
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </section>
          {tracksReady && hasDiscographyReleases ? (
            <>
              <Separator className="shrink-0" />
              <SetlistMediaSection
                releases={discographyReleases}
                onReleaseHover={setHoveredReleaseId}
              />
            </>
          ) : null}
        </>
      )}

      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
      />
      <SetlistWtedSheet
        open={wtedSheetOpen}
        onOpenChange={setWtedSheetOpen}
        entry={wtedSheetEntry}
        show={
          wtedSheetEntry
            ? (linkedShowContextById[wtedSheetEntry.entry_show] ??
              EMPTY_WTED_SHOW)
            : EMPTY_WTED_SHOW
        }
        fallbackReleaseArtwork={
          discographyReleases[0]?.release_artwork ?? null
        }
      />
    </div>
  )
}
