"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapContainer, TileLayer, Polyline } from "react-leaflet"
import { useVenueMapFilters } from "@/hooks/use-venue-map-filters"
import { VenueMarker } from "./venue-marker"
import { MapCenterUpdater } from "./map-center-updater"
import { VenueMapMobileHeader } from "./venue-map-mobile-header"
import { VenueMapDesktopHeader } from "./venue-map-desktop-header"
import { VenueMapFilterModal } from "./venue-map-filter-modal"
import type { UseVenueMapDataReturn } from "@/hooks/use-venue-map-data"
import "leaflet/dist/leaflet.css"

interface VenueMapInnerProps {
  onVenueClick?: (venueId: string) => void
  /** Pre-fetched map data from parent */
  mapData: Omit<UseVenueMapDataReturn, "loading">
}

export function VenueMapInner({ onVenueClick, mapData }: VenueMapInnerProps) {
  const router = useRouter()
  const [mapVenues, setMapVenues] = useState<
    import("@/hooks/use-venue-map-data").MapVenue[]
  >([])
  const [venueShows, setVenueShows] = useState<
    Record<string, import("@/hooks/use-venue-map-data").MapShow[]>
  >({})

  const { allVenues, allShows, groups, tours } = mapData

  const {
    selectedGroup,
    selectedTour,
    tourPath,
    tourVenueOrder,
    tourStartEndVenues,
    isFilterModalOpen,
    hasActiveFilters,
    isGroupDropdownDisabled,
    setIsFilterModalOpen,
    handleTourChange,
    handleGroupChange,
    handleClearFilters,
  } = useVenueMapFilters(
    allVenues,
    allShows,
    setMapVenues,
    setVenueShows,
  )

  const handleVenueClick = onVenueClick ?? ((venueId: string) => {
    router.push(`/dpro/venue/${venueId}`)
  })

  if (allVenues.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No venues with location data available for mapping.
        </p>
      </div>
    )
  }

  const centerLat =
    mapVenues.length > 0
      ? mapVenues.reduce(
          (sum, v) => sum + parseFloat(v.venue_latitude),
          0,
        ) / mapVenues.length
      : 39.8283
  const centerLng =
    mapVenues.length > 0
      ? mapVenues.reduce(
          (sum, v) => sum + parseFloat(v.venue_longitude),
          0,
        ) / mapVenues.length
      : -98.5795
  const center: [number, number] = [centerLat, centerLng]

  return (
    <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
      <style>
        {`
          .numbered-marker {
            background: transparent !important;
            border: none !important;
          }
        `}
      </style>
      <VenueMapMobileHeader
        venueCount={mapVenues.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onOpenFilterModal={() => setIsFilterModalOpen(true)}
      />
      <VenueMapDesktopHeader
        venueCount={mapVenues.length}
        hasActiveFilters={hasActiveFilters}
        selectedTour={selectedTour}
        selectedGroup={selectedGroup}
        tours={tours}
        groups={groups}
        isGroupDropdownDisabled={isGroupDropdownDisabled}
        onClearFilters={handleClearFilters}
        onTourChange={handleTourChange}
        onGroupChange={handleGroupChange}
      />
      <VenueMapFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        groups={groups}
        tours={tours}
        selectedGroup={selectedGroup}
        selectedTour={selectedTour}
        onGroupChange={handleGroupChange}
        onTourChange={handleTourChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <MapContainer
        center={center}
        zoom={3}
        style={{ width: "100%" }}
        className="rounded-lg h-[400px] xl:h-[500px]"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <MapCenterUpdater center={center} venues={mapVenues} />
        {tourPath.length > 1 && (
          <Polyline
            positions={tourPath}
            pathOptions={{
              color: "#ff6b35",
              weight: 3,
              opacity: 0.8,
              dashArray: "10, 5",
            }}
          />
        )}
        {mapVenues.map((venue) => (
          <VenueMarker
            key={`${venue.venue_id}-${selectedTour}`}
            venue={venue}
            shows={venueShows[venue.venue] ?? []}
            selectedTour={selectedTour}
            tourVenueOrder={tourVenueOrder}
            tourStartEndVenues={tourStartEndVenues}
            onVenueClick={handleVenueClick}
          />
        ))}
      </MapContainer>
    </div>
  )
}
