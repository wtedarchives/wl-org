"use client"

import Image from "next/image"
import Link from "next/link"
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
import { VenueMap } from "@/components/dpro/venues/venue-map"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  useVenuesData,
  type VenueSortDirection,
  type VenueSortField,
} from "@/hooks/use-venues-data"
import { useVenueMapData } from "@/hooks/use-venue-map-data"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { isSupabaseConfigured } from "@/lib/supabase"

const VENUES_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Venues", href: "/archive/venues" },
]

export function WlHomeV2VenuesArchiveView() {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const [sortField, setSortField] = useState<VenueSortField>("subvenue")
  const [sortDirection, setSortDirection] =
    useState<VenueSortDirection>("asc")
  const [venuesSearchOpen, setVenuesSearchOpen] = useState(false)
  const [venuesSearchQuery, setVenuesSearchQuery] = useState("")
  const venuesSearchInputRef = useRef<HTMLInputElement>(null)
  const [mapChunkReady, setMapChunkReady] = useState(false)

  const { venues, loading: venuesLoading, error: venuesError } =
    useVenuesData(sortField, sortDirection)
  const { loading: mapLoading, ...mapData } = useVenueMapData()

  useEffect(() => {
    import("@/components/dpro/venues/venue-map-inner").then(() =>
      setMapChunkReady(true),
    )
  }, [])

  const loading = venuesLoading || mapLoading || !mapChunkReady

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

  const handleSort = useCallback(
    (field: VenueSortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
    },
    [sortField],
  )

  if ((!isSupabaseConfigured() || venuesError) && !loading) {
    return (
      <div className="song-archive-detail-vx wl-home-v2-song-archive-page wl-home-v2-venues-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
        <WlHomeV2ArchiveCrumbsShell
          variant="page-gutter"
          trail={
            <WlHomeV2ArchiveCrumbsTrail
              items={VENUES_BREADCRUMBS}
              openArchiveHub={openArchiveHub ?? undefined}
            />
          }
        />
        <div className="song-archive-detail-vx__main song-archive-detail-vx__main--no-side flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="col-main flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="widget-panel mt-4 py-10 text-center">
              <p className="text-sm text-white/65">
                Trouble loading venues. Please reload the page.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="song-archive-detail-vx wl-home-v2-song-archive-page wl-home-v2-venues-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
        <WlHomeV2ArchiveCrumbsShell
          variant="page-gutter"
          trail={
            <WlHomeV2ArchiveCrumbsTrail
              items={VENUES_BREADCRUMBS}
              openArchiveHub={openArchiveHub ?? undefined}
            />
          }
        />
        <div className="song-archive-detail-vx__main song-archive-detail-vx__main--no-side flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="col-main flex min-h-0 min-w-0 flex-1 flex-col">
            <WlHomeV2PageLoading message="Loading venues…" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="song-archive-detail-vx wl-home-v2-song-archive-page wl-home-v2-venues-archive-page box-border flex min-h-0 min-w-0 w-full flex-none flex-col overflow-visible rounded-b-none px-4 py-5 sm:px-5 lg:flex-1 lg:overflow-hidden lg:px-[18px] lg:py-6">
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
            items={VENUES_BREADCRUMBS}
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

      <div className="song-archive-detail-vx__main song-archive-detail-vx__main--no-side flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="col-main flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="venues-archive-split-row">
            <div className="order-2 flex min-h-0 min-w-0 flex-none flex-col lg:order-1 lg:flex-1">
          {venues.length === 0 ?
            <div className="card perf-card venues-archive-list-panel">
              <div className="card-body">
                <p className="venues-archive-empty-msg">No venues found.</p>
              </div>
            </div>
          : <div className="card perf-card venues-archive-list-panel flex min-h-0 min-w-0 flex-none flex-col lg:flex-1">
              <div className="perf-table-wrap venues-archive-table-scroll">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          sortField === "subvenue" ? "active" : ""
                        }
                        onClick={() => handleSort("subvenue")}
                      >
                        Venue
                      </th>
                      <th
                        className={
                          sortField === "subvenue_venue_location" ?
                            "active"
                          : ""
                        }
                        onClick={() =>
                          handleSort("subvenue_venue_location")
                        }
                      >
                        Location
                      </th>
                      <th
                        className={
                          "perf-table-th--center " +
                          (sortField === "goose_show_count" ? "active" : "")
                        }
                        onClick={() => handleSort("goose_show_count")}
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          <Image
                            src="/Goose2.png"
                            alt="Goose shows"
                            width={32}
                            height={32}
                            className="h-8 w-8 shrink-0 object-contain"
                          />
                        </span>
                      </th>
                      <th
                        className={
                          "perf-table-th--center " +
                          (sortField === "other_show_count" ? "active" : "")
                        }
                        onClick={() => handleSort("other_show_count")}
                      >
                        Other
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue) => (
                      <tr key={`${venue.subvenue}-${venue.venue_id}`}>
                        <td className="font-medium">
                          <Link href={getVenueArchiveUrl(venue.venue_id)}>
                            {venue.subvenue}
                          </Link>
                        </td>
                        <td className="dim">{venue.subvenue_venue_location}</td>
                        <td className="perf-table-td--center">
                          {venue.goose_show_count}
                        </td>
                        <td className="perf-table-td--center">
                          {venue.other_show_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>

        <div
          className={
            "order-1 shrink px-0 sm:px-0 lg:order-2 lg:w-[50%] xl:w-[45%]" +
            (venuesSearchOpen ? " hidden lg:block" : "")
          }
        >
          <VenueMap mapData={mapData} wlHomeV2 />
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
