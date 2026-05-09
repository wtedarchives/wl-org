"use client"

import dynamic from "next/dynamic"

const VenueSingleMarkerMap = dynamic(
  () =>
    import("./venue-single-marker-map").then((mod) => ({
      default: mod.VenueSingleMarkerMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
)

interface VenueSingleMarkerMapWrapperProps {
  venueName: string
  venueLocation: string | null
  venueAddress: string | null
  latitude: number
  longitude: number
  wlHomeV2?: boolean
}

export function VenueSingleMarkerMapWrapper({
  venueName,
  venueLocation,
  venueAddress,
  latitude,
  longitude,
  wlHomeV2 = false,
}: VenueSingleMarkerMapWrapperProps) {
  return (
    <VenueSingleMarkerMap
      venueName={venueName}
      venueLocation={venueLocation}
      venueAddress={venueAddress}
      latitude={latitude}
      longitude={longitude}
      wlHomeV2={wlHomeV2}
    />
  )
}
