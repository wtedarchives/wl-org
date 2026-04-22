"use client"

import { useEffect, useMemo, useState } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { useSidebar } from "@/components/ui/sidebar"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useVenueData } from "@/hooks/use-venue-data"
import { useShowRatings } from "@/hooks/use-show-ratings"
import { VenueHeader } from "@/components/dpro/venue/venue-header"
import { VenueShowsTable } from "@/components/dpro/venue/venue-shows-table"
import { VenueSongSpreadCard } from "@/components/dpro/venue/venue-song-spread-card"
import { VenueSingleMarkerMapWrapper } from "@/components/dpro/venue/venue-single-marker-map-wrapper"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

function resolveVenueKeyFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
): { venueKey: string; invalidParams: boolean } {
  const raw = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(raw).size > 1) {
    return { venueKey: "", invalidParams: true }
  }
  return { venueKey: raw[0] ?? "", invalidParams: false }
}

function VenueIndexRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/old/archive/venues")
  }, [router])
  return (
    <LoadingPageCard message="Redirecting…" page="venue" />
  )
}

function VenueDetailContent({ venueKey }: { venueKey: string }) {
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
  } = useVenueData(venueKey)

  const { showRatings } = useShowRatings(shows)

  const venueName = venue?.venue ?? "Venue"

  useEffect(() => {
    if (!venue) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs([
      WTED_ARCHIVES_BREADCRUMB_ROOT,
      { label: "Venues", href: "/old/archive/venues" },
      { label: venueName, href: getVenueArchiveUrl(venue.venue_id) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [venue, venueName, setSetlistBreadcrumbs])

  useEffect(() => {
    if (venue) {
      document.title = `${venueName} – WysteriaLane.org`
      return () => {
        document.title = ""
      }
    }
  }, [venue, venueName])

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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="mb-1 w-full">
        <VenueHeader
          venueName={venueName}
          venueLocation={venue.venue_location}
          onSearchOpenChange={setIsSearchOpen}
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
}

export default function VenueArchivePageClient() {
  const searchParams = useSearchParams()
  const { venueKey, invalidParams } = useMemo(
    () => resolveVenueKeyFromSearchParams(searchParams),
    [searchParams],
  )

  if (invalidParams) notFound()

  if (!venueKey) {
    return <VenueIndexRedirect />
  }

  return <VenueDetailContent venueKey={venueKey} />
}
