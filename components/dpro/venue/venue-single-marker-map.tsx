"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "@/lib/map-icons"
import { cn } from "@/lib/utils"

interface VenueSingleMarkerMapProps {
  venueName: string
  venueLocation: string | null
  venueAddress: string | null
  latitude: number
  longitude: number
  /** Match venues map shell — parent supplies `.venue-archive-map-shell` on `/archive/venue`. */
  wlHomeV2?: boolean
}

function hasValidCoords(
  lat: number,
  lng: number,
): boolean {
  return (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat !== 0 &&
    lng !== 0
  )
}

export function VenueSingleMarkerMap({
  venueName,
  venueLocation,
  venueAddress,
  latitude,
  longitude,
  wlHomeV2 = false,
}: VenueSingleMarkerMapProps) {
  if (!hasValidCoords(latitude, longitude)) {
    if (wlHomeV2) {
      return (
        <div className="venues-archive-map-empty">
          <div className="venues-archive-map-shell-empty-msg">
            No location data available for this venue.
          </div>
        </div>
      )
    }
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No location data available for this venue.
        </p>
      </div>
    )
  }

  const center: [number, number] = [latitude, longitude]

  const addressBlock =
    venueAddress ?
      wlHomeV2 ?
        <div className="venues-archive-map-address">{venueAddress}</div>
      : <p className="mt-2 px-2 text-sm text-muted-foreground">{venueAddress}</p>
    : null

  const map = (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: "100%" }}
      className={cn(
        wlHomeV2 ?
          "venues-archive-map-leaflet h-[400px] rounded-lg xl:h-[500px]"
        : "rounded-lg h-[300px] md:h-[400px]",
      )}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
      />
      <Marker position={center}>
        <Popup maxWidth={300}>
          <div className="min-w-48 text-base font-medium">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                {venueName}
              </span>
            </div>
            {venueLocation ?
              <span className="mb-2 block text-xs text-muted-foreground">
                {venueLocation}
              </span>
            : null}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )

  if (wlHomeV2) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {map}
        {addressBlock}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card p-2 shadow-sm">
      {map}
      {addressBlock}
    </div>
  )
}
