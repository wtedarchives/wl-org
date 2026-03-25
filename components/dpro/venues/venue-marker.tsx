"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { Marker, Popup, useMap } from "react-leaflet"
import { createNumberedIcon } from "@/lib/map-icons"
import type { MapVenue, MapShow } from "@/hooks/use-venue-map-data"

interface VenueMarkerProps {
  venue: MapVenue
  shows: MapShow[]
  selectedTour: string
  tourVenueOrder: Record<string, number>
  tourStartEndVenues: { start?: string; end?: string }
  onVenueClick?: (venueId: string) => void
}

function formatDate(dateString: string): string {
  return dateString
    .split("-")
    .slice(1)
    .concat(dateString.substring(2, 4))
    .join(".")
}

function PopupShowLink({ show }: { show: MapShow }) {
  const map = useMap()
  return (
    <Link
      href={getSetlistArchiveUrl(show.show_id)}
      className="text-muted-foreground text-xs block cursor-pointer hover:underline"
      onClick={(e) => {
        e.stopPropagation()
        map.closePopup()
      }}
    >
      <span className="font-medium">
        {formatDate(show.show_date)}
      </span>{" "}
      ({show.show_group})
    </Link>
  )
}

export function VenueMarker({
  venue,
  shows,
  selectedTour,
  tourVenueOrder,
  tourStartEndVenues,
  onVenueClick,
}: VenueMarkerProps) {
  const getTourStopDisplay = (venueName: string) => {
    if (selectedTour === "Show All" || !tourVenueOrder[venueName]) {
      return null
    }
    const isStart = tourStartEndVenues.start === venueName
    const isEnd = tourStartEndVenues.end === venueName
    if (isStart) {
      return { text: "(Tour Start)", color: "#16a34a" }
    }
    if (isEnd) {
      return { text: "(Tour End)", color: "#dc2626" }
    }
    return {
      text: `(Stop #${tourVenueOrder[venueName]})`,
      color: "#8e6c7a",
    }
  }

  const getMarkerIcon = (venueName: string) => {
    if (
      selectedTour !== "Show All" &&
      tourVenueOrder[venueName]
    ) {
      const venueNumber = tourVenueOrder[venueName]
      const isStart = tourStartEndVenues.start === venueName
      const isEnd = tourStartEndVenues.end === venueName
      return createNumberedIcon(venueNumber, isStart, isEnd)
    }
    return undefined
  }

  const customIcon = getMarkerIcon(venue.venue)
  const tourStopDisplay = getTourStopDisplay(venue.venue)

  const markerProps: {
    position: [number, number]
    icon?: ReturnType<typeof createNumberedIcon>
  } = {
    position: [
      parseFloat(venue.venue_latitude),
      parseFloat(venue.venue_longitude),
    ],
  }
  if (customIcon) {
    markerProps.icon = customIcon
  }

  return (
    <Marker key={`${venue.venue_id}-${selectedTour}`} {...markerProps}>
      <Popup maxWidth={300}>
        <div className="text-base min-w-48 font-medium">
          <div className="block">
            {onVenueClick ? (
              <button
                type="button"
                className="text-muted-foreground text-sm font-medium cursor-pointer hover:underline"
                onClick={() => onVenueClick(venue.venue_id)}
              >
                {venue.venue}
              </button>
            ) : (
              <Link
                href={`/archive/venue/${venue.venue_id}`}
                className="text-muted-foreground text-sm font-medium hover:underline"
              >
                {venue.venue}
              </Link>
            )}
            {tourStopDisplay && (
              <span
                className="ml-2 text-sm font-medium"
                style={{ color: tourStopDisplay.color }}
              >
                {tourStopDisplay.text}
              </span>
            )}
          </div>
          <span className="text-muted-foreground text-xs block mb-2">
            {venue.venue_location}
          </span>
          {shows.length > 0 ? (
            <div className="mt-2">
              <div className="max-h-32 overflow-y-auto">
                {[...shows]
                  .sort(
                    (a, b) =>
                      new Date(a.show_date).getTime() -
                      new Date(b.show_date).getTime(),
                  )
                  .map((show) => (
                    <PopupShowLink key={show.show_id} show={show} />
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs mt-2">
              No shows recorded
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
