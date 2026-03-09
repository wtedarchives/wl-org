"use client"

import dynamic from "next/dynamic"
import type { UseVenueMapDataReturn } from "@/hooks/use-venue-map-data"

const VenueMapInner = dynamic(
  () =>
    import("./venue-map-inner").then((mod) => ({ default: mod.VenueMapInner })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
)

interface VenueMapProps {
  onVenueClick?: (venueId: string) => void
  /** Pre-fetched map data from parent */
  mapData: Omit<UseVenueMapDataReturn, "loading">
}

export function VenueMap({ onVenueClick, mapData }: VenueMapProps) {
  return <VenueMapInner onVenueClick={onVenueClick} mapData={mapData} />
}
