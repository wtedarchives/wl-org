"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { getSetlistGameTourArchiveUrl } from "@/lib/setlist-game-archive-url"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useSetlistGameTourDetails } from "@/hooks/use-setlist-game-tour-details"
import { TourHeader } from "@/components/dpro/setlistgame/tour-header"
import { TourShowsTable } from "@/components/dpro/setlistgame/tour-shows-table"
import { TourStandingsTable } from "@/components/dpro/setlistgame/tour-standings-table"

export function SetlistGameTourView({ tourId }: { tourId: string }) {
  const { user } = useAuth()
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
    setSetlistBreadcrumbs([
      WTED_ARCHIVES_BREADCRUMB_ROOT,
      { label: "Setlist Game", href: "/archive/setlistgame" },
      {
        label: tourInfo.tour,
        href: getSetlistGameTourArchiveUrl(tourId),
      },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [tourInfo, setSetlistBreadcrumbs, tourId])

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <LoadingPageCard
          message={tourInfo ? `Loading ${tourInfo.tour}…` : "Loading tour…"}
          page="setlist"
        />
      </div>
    )
  }

  if (!tourInfo) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Tour not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
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
          currentUserId={user?.id}
        />
      </div>
    </div>
  )
}
