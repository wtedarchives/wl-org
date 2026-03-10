"use client"

import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "@/lib/map-icons"

interface VenueSingleMarkerMapProps {
  venueName: string
  venueLocation: string | null
  venueAddress: string | null
  latitude: number
  longitude: number
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
}: VenueSingleMarkerMapProps) {
  if (!hasValidCoords(latitude, longitude)) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No location data available for this venue.
        </p>
      </div>
    )
  }

  const center: [number, number] = [latitude, longitude]

  return (
    <div className="rounded-lg border border-border bg-card p-2 shadow-sm overflow-hidden">
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: "100%" }}
        className="rounded-lg h-[300px] md:h-[400px]"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <Marker position={center}>
          <Tooltip permanent direction="top" offset={[0, -20]}>
            <div className="text-base min-w-48 font-medium">
              <div className="font-medium">{venueName}</div>
              {venueLocation && (
                <span className="text-muted-foreground text-xs block mt-1">
                  {venueLocation}
                </span>
              )}
            </div>
          </Tooltip>
        </Marker>
      </MapContainer>
      {venueAddress && (
        <p className="mt-2 px-2 text-sm text-muted-foreground">
          {venueAddress}
        </p>
      )}
    </div>
  )
}
