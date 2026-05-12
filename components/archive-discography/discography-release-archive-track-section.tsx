"use client"

import { DisplaySetlistTable } from "@/components/dpro/setlist/display-setlist-table"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { DisplaySetlistTableProps } from "@/components/dpro/setlist/display-setlist-table.props"
import type { ShowRelease } from "@/hooks/use-setlist-releases"

export function DiscographyReleaseArchiveTrackSection({
  wlHomeV2Shell,
  linkedSetlistLoading,
  linkedSetlistError,
  linkedSetlistLength,
  discographyTracksTableProps,
  tracksReady,
  hasDiscographyReleases,
  discographyReleases,
  onReleaseHover,
}: {
  wlHomeV2Shell: boolean
  linkedSetlistLoading: boolean
  linkedSetlistError: unknown
  linkedSetlistLength: number
  discographyTracksTableProps: DisplaySetlistTableProps
  tracksReady: boolean
  hasDiscographyReleases: boolean
  discographyReleases: ShowRelease[]
  onReleaseHover: (id: string | null) => void
}) {
  if (
    !linkedSetlistLoading &&
    !linkedSetlistError &&
    linkedSetlistLength === 0
  ) {
    return null
  }

  if (wlHomeV2Shell) {
    return (
      <div className="wl-home-v2-setlist flex min-w-0 flex-col gap-4">
        <section className="min-w-0" aria-label="Track listing">
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
            onReleaseHover={onReleaseHover}
          />
        : null}
      </div>
    )
  }

  return (
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
            onReleaseHover={onReleaseHover}
          />
        </>
      : null}
    </>
  )
}
