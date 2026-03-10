"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { useSidebar } from "@/components/ui/sidebar"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useVenueData } from "@/hooks/use-venue-data"
import { useShowRatings } from "@/hooks/use-show-ratings"
import { VenueHeader } from "@/components/dpro/venue/venue-header"
import { VenueShowsTable } from "@/components/dpro/venue/venue-shows-table"
import { VenueSongSpreadCard } from "@/components/dpro/venue/venue-song-spread-card"
import { VenueSingleMarkerMapWrapper } from "@/components/dpro/venue/venue-single-marker-map-wrapper"

export default function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: venueId } = use(params)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { openMobile } = useSidebar()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const {
    venue,
    shows,
    songSpreadData,
    loading,
    progress,
    error,
  } = useVenueData(venueId)

  const { showRatings } = useShowRatings(shows)

  const venueName = venue?.venue ?? "Venue"

  useEffect(() => {
    if (!venue) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      { label: "Setlist Archive", href: "/dpro" },
      { label: "Venues", href: "/dpro/venues" },
      { label: venueName, href: "" },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [venue, venueName, setSetlistBreadcrumbs])

  useEffect(() => {
    if (venue) {
      document.title = `${venueName} – Wysteria Lane`
      return () => {
        document.title = ""
      }
    }
  }, [venue, venueName])

  if (!venueId) notFound()

  if (loading) {
    return (
      <LoadingPageCard
        message={venue ? `Loading ${venue.venue}…` : undefined}
        page="venue"
        progress={progress}
      />
    )
  }

  if (error || (!loading && !venue)) {
    notFound()
  }

  if (!venue) return null

  const lat = parseFloat(venue.venue_latitude ?? "")
  const lng = parseFloat(venue.venue_longitude ?? "")
  const hasMap = !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0

  const otherContent =
    shows.length === 0 ? (
      <div className="rounded-lg border border-border/60 bg-card/80 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No shows were played at this venue.
        </p>
      </div>
    ) : (
      <>
        <VenueShowsTable shows={shows} showRatings={showRatings} />
        <VenueSongSpreadCard songSpreadData={songSpreadData} />
      </>
    )

  const pageContent = (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="mb-1 w-full">
        <VenueHeader
          venueName={venueName}
          venueLocation={venue.venue_location}
        />
      </div>
      {hasMap ? (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-4 lg:flex-1 lg:min-w-0 order-2 lg:order-1">
            {otherContent}
          </div>
          <div
            className={`relative lg:w-[50%] xl:w-[45%] shrink-0 order-1 lg:order-2 ${
              isSearchOpen || openMobile ? "hidden" : ""
            }`}
          >
            <VenueSingleMarkerMapWrapper
              venueName={venueName}
              venueLocation={venue.venue_location}
              venueAddress={venue.venue_address}
              latitude={lat}
              longitude={lng}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {otherContent}
        </div>
      )}
    </div>
  )

  return pageContent
}
