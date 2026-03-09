"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface MapVenue {
  venue: string
  venue_location: string
  venue_id: string
  venue_latitude: string
  venue_longitude: string
}

export interface MapShow {
  show_id: string
  show_date: string
  show_group: string
  show_tour: string
  show_canonid?: number
}

export interface UseVenueMapDataReturn {
  allVenues: MapVenue[]
  allShows: Record<string, MapShow[]>
  groups: { group: string }[]
  tours: { tour: string; tour_venuemap: boolean }[]
  loading: boolean
}

export function useVenueMapData(): UseVenueMapDataReturn {
  const [allVenues, setAllVenues] = useState<MapVenue[]>([])
  const [allShows, setAllShows] = useState<Record<string, MapShow[]>>({})
  const [groups, setGroups] = useState<{ group: string }[]>([])
  const [tours, setTours] = useState<{ tour: string; tour_venuemap: boolean }[]>(
    [],
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMapData() {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("group")
          .order("group", { ascending: true })

        if (!groupsError) {
          setGroups(groupsData ?? [])
        }

        const { data: toursData, error: toursError } = await supabase
          .from("tours")
          .select("tour, tour_venuemap")
          .eq("tour_venuemap", true)
          .order("tour_canonid", { ascending: true })

        if (!toursError) {
          setTours(toursData ?? [])
        }

        let allShowsData: Array<{
          show_id: string
          show_date: string
          show_group: string
          show_tour: string
          show_canonid?: number
          subvenues?:
            | { subvenue_venue: string }
            | Array<{ subvenue_venue: string }>
        }> = []
        let from = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          const { data: showsBatch, error: batchError } = await supabase
            .from("shows")
            .select(
              `
              show_id,
              show_date,
              show_group,
              show_tour,
              show_canonid,
              subvenues!inner (
                subvenue_venue
              )
            `,
            )
            .order("show_date", { ascending: false })
            .range(from, from + pageSize - 1)

          if (batchError) break
          if (showsBatch && showsBatch.length > 0) {
            allShowsData = [...allShowsData, ...showsBatch]
            hasMore = showsBatch.length === pageSize
            from += pageSize
          } else {
            hasMore = false
          }
        }

        if (allShowsData.length === 0) {
          setLoading(false)
          return
        }

        const uniqueVenueNames = [
          ...new Set(
            allShowsData.map((show) => {
              const sub = show.subvenues
              return Array.isArray(sub) ? sub[0]?.subvenue_venue : sub?.subvenue_venue
            }),
          ),
        ].filter(Boolean) as string[]

        const { data: allVenuesData, error: allVenuesError } = await supabase
          .from("venues")
          .select(
            "venue, venue_location, venue_id, venue_latitude, venue_longitude",
          )

        if (allVenuesError || !allVenuesData) {
          setLoading(false)
          return
        }

        const uniqueVenueNamesSet = new Set(uniqueVenueNames)
        const allVenuesWithCoords = allVenuesData.filter((venue) =>
          uniqueVenueNamesSet.has(venue.venue),
        )

        const venuesWithCoords = allVenuesWithCoords.filter((venue) => {
          const hasLat =
            venue.venue_latitude &&
            venue.venue_latitude !== "" &&
            venue.venue_latitude !== "NULL"
          const hasLng =
            venue.venue_longitude &&
            venue.venue_longitude !== "" &&
            venue.venue_longitude !== "NULL"
          return hasLat && hasLng
        })

        const validVenues = venuesWithCoords.filter((venue) => {
          const lat = parseFloat(venue.venue_latitude)
          const lng = parseFloat(venue.venue_longitude)
          return (
            !Number.isNaN(lat) &&
            !Number.isNaN(lng) &&
            lat !== 0 &&
            lng !== 0
          )
        })

        if (validVenues.length === 0) {
          setLoading(false)
          return
        }

        const showsByVenue: Record<string, MapShow[]> = {}
        const validVenueNames = new Set(validVenues.map((v) => v.venue))

        allShowsData.forEach((show) => {
          const sub = show.subvenues
          const venueName = Array.isArray(sub)
            ? sub[0]?.subvenue_venue
            : sub?.subvenue_venue
          if (venueName && validVenueNames.has(venueName)) {
            if (!showsByVenue[venueName]) {
              showsByVenue[venueName] = []
            }
            showsByVenue[venueName].push({
              show_id: show.show_id,
              show_date: show.show_date,
              show_group: show.show_group,
              show_tour: show.show_tour,
              show_canonid: show.show_canonid,
            })
          }
        })

        setAllVenues(validVenues)
        setAllShows(showsByVenue)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    fetchMapData()
  }, [])

  return {
    allVenues,
    allShows,
    groups,
    tours,
    loading,
  }
}
