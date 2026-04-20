"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"

interface MapCenterUpdaterProps {
  center: [number, number]
  venues: Array<{ venue_latitude: string; venue_longitude: string }>
}

/** Call after the map container was `display:none` (e.g. filter modal) so tiles/layout recover. */
export function MapInvalidateOnVisible({ visible }: { visible: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize()
    })
    return () => window.cancelAnimationFrame(id)
  }, [visible, map])

  return null
}

export function MapCenterUpdater({ center, venues }: MapCenterUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    if (venues.length > 0) {
      const lats = venues.map((v) => parseFloat(v.venue_latitude))
      const lngs = venues.map((v) => parseFloat(v.venue_longitude))
      const latRange = Math.max(...lats) - Math.min(...lats)
      const lngRange = Math.max(...lngs) - Math.min(...lngs)
      const maxRange = Math.max(latRange, lngRange)

      let zoom = 3
      if (maxRange < 0.11) zoom = 12
      else if (maxRange < 2) zoom = 8
      else if (maxRange < 10) zoom = 6
      else if (maxRange < 20) zoom = 5
      else if (maxRange < 45) zoom = 5
      else if (maxRange < 60) zoom = 4
      else zoom = 3

      map.setView(center, zoom, { animate: true })
    }
  }, [map, center, venues])

  return null
}
