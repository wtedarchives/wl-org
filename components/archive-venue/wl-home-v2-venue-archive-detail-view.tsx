"use client"

import { notFound } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import "@/components/archive-song/song-archive-detail-verbatim.css"
import { WlHomeV2VenuesArchiveSearchModal } from "@/components/archive-venues/wl-home-v2-venues-archive-search-modal"
import { venuesArchiveSearchHits } from "@/components/archive-venues/venues-archive-search-helpers"
import { SongsArchiveSearchGlyph } from "@/components/archive-song/wl-home-v2-song-archive-search-glyph"
import { VenueShowsTable } from "@/components/dpro/venue/venue-shows-table"
import { VenueSongSpreadCard } from "@/components/dpro/venue/venue-song-spread-card"
import { VenueSingleMarkerMapWrapper } from "@/components/dpro/venue/venue-single-marker-map-wrapper"
import { WL_V2_ARCHIVES_BREADCRUMB_ROOT } from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { useShowRatings } from "@/hooks/use-show-ratings"
import { useVenueData } from "@/hooks/use-venue-data"
import { useVenuesData } from "@/hooks/use-venues-data"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

export function WlHomeV2VenueArchiveDetailView({
  venueKey,
}: {
  venueKey: string
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const [venuesSearchOpen, setVenuesSearchOpen] = useState(false)
  const [venuesSearchQuery, setVenuesSearchQuery] = useState("")
  const venuesSearchInputRef = useRef<HTMLInputElement>(null)

  const { venues } = useVenuesData("subvenue", "asc")

  const {
    venue,
    shows,
    songSpreadData,
    loading,
    error,
  } = useVenueData(venueKey)

  const { showRatings } = useShowRatings(shows)

  const venueName = venue?.venue ?? "Venue"

  const venuesSearchHits = useMemo(
    () => venuesArchiveSearchHits(venues, venuesSearchQuery),
    [venues, venuesSearchQuery],
  )

  const closeVenuesSearch = useCallback(() => {
    setVenuesSearchOpen(false)
    setVenuesSearchQuery("")
  }, [])

  const openVenuesSearch = useCallback(() => {
    setVenuesSearchOpen(true)
    setVenuesSearchQuery("")
  }, [])

  useWlHomeV2ScrollLock(venuesSearchOpen)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && venuesSearchOpen) {
        setVenuesSearchOpen(false)
        setVenuesSearchQuery("")
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setVenuesSearchOpen(true)
        setVenuesSearchQuery("")
        setTimeout(() => venuesSearchInputRef.current?.focus(), 40)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [venuesSearchOpen])

  useEffect(() => {
    if (!venuesSearchOpen) return
    setTimeout(() => venuesSearchInputRef.current?.focus(), 40)
  }, [venuesSearchOpen])

  useEffect(() => {
    if (!venue) return
    document.title = `${venue.venue} — WTEDRadio.com`
    return () => {
      document.title = "WTEDRadio.com"
    }
  }, [venue])

  if (loading) {
    return (
      <WlHomeV2PageLoading
        message={venue ? `Loading ${venue.venue}…` : "Loading venue…"}
      />
    )
  }

  if (error || !venue) {
    notFound()
  }

  const lat = parseFloat(venue.venue_latitude ?? "")
  const lng = parseFloat(venue.venue_longitude ?? "")
  const hasMap =
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat !== 0 &&
    lng !== 0

  const breadcrumbs = [
    WL_V2_ARCHIVES_BREADCRUMB_ROOT,
    { label: "Venues", href: "/archive/venues" },
    {
      label: venueName,
      href: getVenueArchiveUrl(venue.venue_id),
    },
  ]

  const spreadVisible = songSpreadData.length > 0

  const mainColumn =
    shows.length === 0 ? (
      <div className="card perf-card">
        <div className="card-body">
          <p
            className="m-0 text-sm"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            No shows were played at this venue.
          </p>
        </div>
      </div>
    ) : (
      <div className="flex min-h-0 flex-col gap-4 lg:min-h-[360px]">
        <VenueShowsTable shows={shows} showRatings={showRatings} wlHomeV2 />
        {spreadVisible ?
          <div className="wl-home-v2-setlist flex min-h-0 min-w-0 max-h-[min(420px,50vh)] flex-col">
            <div className="side-card wl-home-v2-setlist-song-spread-side-card wl-home-v2-tour-stats-song-spread flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[rgb(44,46,45)]">
              <div className="sc-label">Song Spread</div>
              <VenueSongSpreadCard
                wlHomeV2
                songSpreadData={songSpreadData}
              />
            </div>
          </div>
        : null}
      </div>
    )

  return (
    <div className="song-archive-detail-vx wl-home-v2-song-archive-page venue-archive-detail wl-home-v2-venue-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        className="wl-home-v2-archive-crumbs-shell--inline-selectors"
        selectorsAriaLabel="Search venues"
        selectors={
          <button
            type="button"
            className="song-archive-detail-vx__crumbs-search-btn"
            title="Search venues"
            aria-label="Search venues"
            onClick={openVenuesSearch}
          >
            <SongsArchiveSearchGlyph />
            <span>Search</span>
          </button>
        }
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={breadcrumbs}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />

      <WlHomeV2VenuesArchiveSearchModal
        open={venuesSearchOpen}
        onClose={closeVenuesSearch}
        searchQuery={venuesSearchQuery}
        setSearchQuery={setVenuesSearchQuery}
        searchHits={venuesSearchHits}
        searchInputRef={venuesSearchInputRef}
      />

      <div className="song-archive-detail-vx__main song-archive-detail-vx__main--no-side">
        <div className="col-main">
          <div className="song-header">
            <div className="left">
              <div>
                <h1>
                  {venueName}
                  {venue.venue_location ?
                    <span className="alt-name">{venue.venue_location}</span>
                  : null}
                </h1>
              </div>
            </div>
          </div>

          {hasMap ?
            <div className="flex min-h-0 flex-col gap-4 lg:flex-row lg:gap-5">
              <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1">
                {mainColumn}
              </div>
              <div
                className={
                  "order-1 shrink px-0 sm:px-0 lg:order-2 lg:w-[50%] xl:w-[45%]" +
                  (venuesSearchOpen ? " hidden lg:block" : "")
                }
              >
                <div className="card perf-card venue-archive-map-panel venue-archive-map-shell">
                  <VenueSingleMarkerMapWrapper
                    wlHomeV2
                    venueName={venueName}
                    venueLocation={venue.venue_location}
                    venueAddress={venue.venue_address}
                    latitude={lat}
                    longitude={lng}
                  />
                </div>
              </div>
            </div>
          : <div className="flex min-h-0 flex-col gap-4">{mainColumn}</div>}
        </div>
      </div>
    </div>
  )
}
