"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import {
  useSetlistBreadcrumb,
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import {
  getSetlistGameArchiveIndexUrl,
  getSetlistGameTourArchiveUrl,
} from "@/lib/setlist-game-archive-url"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistGameShell } from "@/components/wl-home-v2/wl-home-v2-setlistgame-shell"
import { useSetlistGameTourDetails } from "@/hooks/use-setlist-game-tour-details"
import { TourHeader } from "@/components/dpro/setlistgame/tour-header"
import { TourShowsTable } from "@/components/dpro/setlistgame/tour-shows-table"
import { TourStandingsTable } from "@/components/dpro/setlistgame/tour-standings-table"
import { useSetlistGameArchiveUrlShell } from "@/components/dpro/setlistgame/setlist-game-archive-url-shell-context"

export function SetlistGameTourView({
  tourId,
  variant = "default",
}: {
  tourId: string
  variant?: "default" | "wlHomeV2"
}) {
  const v2 = variant === "wlHomeV2"
  const urlShell = useSetlistGameArchiveUrlShell()
  const { session } = useAuth()
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const {
    loading,
    tourInfo,
    gameShows,
    standings,
    tourStats,
  } = useSetlistGameTourDetails(tourId ?? undefined)

  useEffect(() => {
    if (tourInfo) {
      document.title = `Setlist Game (${tourInfo.tour}) – WysteriaLane.org`
    }
    return () => {
      document.title = ""
    }
  }, [tourInfo])

  useEffect(() => {
    if (!tourInfo) {
      setSetlistBreadcrumbs(null)
      return
    }
    const archiveRoot =
      urlShell === "legacy" ?
        WTED_ARCHIVES_BREADCRUMB_ROOT
      : WL_V2_ARCHIVES_BREADCRUMB_ROOT
    setSetlistBreadcrumbs([
      archiveRoot,
      { label: "Setlist Game", href: getSetlistGameArchiveIndexUrl(urlShell) },
      {
        label: tourInfo.tour,
        href: getSetlistGameTourArchiveUrl(tourId, urlShell),
      },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [tourInfo, setSetlistBreadcrumbs, tourId, urlShell])

  if (loading) {
    return v2 ?
        <WlHomeV2PageLoading
          message={
            tourInfo ? `Loading ${tourInfo.tour} data…` : "Loading tour…"
          }
        />
      : <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
          <LoadingPageCard
            message={tourInfo ? `Loading ${tourInfo.tour}…` : "Loading tour…"}
            page="setlist"
          />
        </div>
  }

  if (!tourInfo) {
    const notFoundInner = (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Tour not found.</p>
      </div>
    )
    return v2 ?
        <WlHomeV2SetlistGameShell>{notFoundInner}</WlHomeV2SetlistGameShell>
      : <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
          {notFoundInner}
        </div>
  }

  const body = (
    <div className="space-y-4">
      <TourHeader
        tourName={tourInfo.tour}
        totalShows={tourStats.totalShows}
        totalPlayers={tourStats.totalPlayers}
        tourWinners={tourStats.tourWinners}
      />
      <TourShowsTable gameShows={gameShows} />
      <TourStandingsTable
        standings={standings}
        currentUserId={session?.profileId}
      />
    </div>
  )

  return v2 ?
      <WlHomeV2SetlistGameShell>{body}</WlHomeV2SetlistGameShell>
    : <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        {body}
      </div>
}
