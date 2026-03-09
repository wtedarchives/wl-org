"use client"

import { useState, useCallback, useEffect } from "react"
import type { MapVenue, MapShow } from "./use-venue-map-data"

export interface UseVenueMapFiltersReturn {
  selectedGroup: string
  selectedTour: string
  tourPath: Array<[number, number]>
  tourVenueOrder: Record<string, number>
  tourStartEndVenues: { start?: string; end?: string }
  isFilterModalOpen: boolean
  hasActiveFilters: boolean
  isGroupDropdownDisabled: boolean
  setIsFilterModalOpen: (open: boolean) => void
  handleTourChange: (value: string) => void
  handleGroupChange: (value: string) => void
  handleClearFilters: () => void
}

export function useVenueMapFilters(
  allVenues: MapVenue[],
  allShows: Record<string, MapShow[]>,
  setMapVenues: React.Dispatch<React.SetStateAction<MapVenue[]>>,
  setVenueShows: React.Dispatch<React.SetStateAction<Record<string, MapShow[]>>>,
): UseVenueMapFiltersReturn {
  const [selectedGroup, setSelectedGroup] = useState("Show All")
  const [selectedTour, setSelectedTour] = useState("Show All")
  const [tourPath, setTourPath] = useState<Array<[number, number]>>([])
  const [tourVenueOrder, setTourVenueOrder] = useState<Record<string, number>>(
    {},
  )
  const [tourStartEndVenues, setTourStartEndVenues] = useState<{
    start?: string
    end?: string
  }>({})
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const generateTourPath = useCallback(
    (
      tourName: string,
      allVenuesData: MapVenue[],
      allShowsData: Record<string, MapShow[]>,
    ) => {
      if (tourName === "Show All") {
        setTourPath([])
        setTourStartEndVenues({})
        setTourVenueOrder({})
        return
      }

      type TourShowWithCoords = MapShow & {
        venue_latitude: number
        venue_longitude: number
        venue_name: string
      }
      const tourShows: TourShowWithCoords[] = []

      Object.entries(allShowsData).forEach(([venueName, shows]) => {
        const venue = allVenuesData.find((v) => v.venue === venueName)
        if (venue) {
          const tourShowsForVenue = shows.filter(
            (show) => show.show_tour === tourName,
          )
          tourShowsForVenue.forEach((show) => {
            tourShows.push({
              ...show,
              venue_latitude: parseFloat(venue.venue_latitude),
              venue_longitude: parseFloat(venue.venue_longitude),
              venue_name: venueName,
            })
          })
        }
      })

      tourShows.sort((a, b) => {
        const canonIdA = a.show_canonid ?? -1
        const canonIdB = b.show_canonid ?? -1
        if (canonIdA !== canonIdB) return canonIdA - canonIdB
        const dateA = new Date(a.show_date).getTime()
        const dateB = new Date(b.show_date).getTime()
        if (dateA !== dateB) return dateA - dateB
        return a.show_group.localeCompare(b.show_group)
      })

      const pathCoordinates: Array<[number, number]> = tourShows.map(
        (show) => [show.venue_latitude, show.venue_longitude],
      )

      const venueOrderMap: Record<string, number> = {}
      const seenVenues = new Set<string>()
      let venueIndex = 1
      tourShows.forEach((show) => {
        if (!seenVenues.has(show.venue_name)) {
          venueOrderMap[show.venue_name] = venueIndex
          seenVenues.add(show.venue_name)
          venueIndex++
        }
      })

      const uniqueVenueNames = Array.from(seenVenues)
      const startEndVenues: { start?: string; end?: string } = {}
      if (uniqueVenueNames.length > 0) {
        startEndVenues.start = uniqueVenueNames[0]
        if (uniqueVenueNames.length > 1) {
          startEndVenues.end = uniqueVenueNames[uniqueVenueNames.length - 1]
        }
      }

      setTourPath(pathCoordinates)
      setTourStartEndVenues(startEndVenues)
      setTourVenueOrder(venueOrderMap)
    },
    [],
  )

  const applyFilters = useCallback(
    (
      tourName: string,
      groupName: string,
      allVenuesData: MapVenue[],
      allShowsData: Record<string, MapShow[]>,
    ) => {
      let filteredShows: Record<string, MapShow[]> = {}
      const venuesWithFilteredShows = new Set<string>()

      if (tourName !== "Show All") {
        Object.entries(allShowsData).forEach(([venueName, shows]) => {
          const tourShows = shows.filter(
            (show) => show.show_tour === tourName,
          )
          if (tourShows.length > 0) {
            filteredShows[venueName] = tourShows
            venuesWithFilteredShows.add(venueName)
          }
        })
      } else if (groupName !== "Show All") {
        Object.entries(allShowsData).forEach(([venueName, shows]) => {
          const groupShows = shows.filter(
            (show) => show.show_group === groupName,
          )
          if (groupShows.length > 0) {
            filteredShows[venueName] = groupShows
            venuesWithFilteredShows.add(venueName)
          }
        })
      } else {
        filteredShows = allShowsData
        Object.keys(allShowsData).forEach((v) => venuesWithFilteredShows.add(v))
      }

      const filteredVenues = allVenuesData.filter((venue) =>
        venuesWithFilteredShows.has(venue.venue),
      )

      setMapVenues(filteredVenues)
      setVenueShows(filteredShows)
      generateTourPath(tourName, allVenuesData, allShowsData)
    },
    [generateTourPath, setMapVenues, setVenueShows],
  )

  useEffect(() => {
    if (allVenues.length > 0 && Object.keys(allShows).length > 0) {
      applyFilters(selectedTour, selectedGroup, allVenues, allShows)
    }
  }, [allVenues, allShows])

  const handleTourChange = (tourName: string) => {
    setSelectedTour(tourName)
    if (tourName === "Show All") {
      setTourPath([])
      setTourStartEndVenues({})
      setTourVenueOrder({})
      setSelectedGroup("Show All")
    }
    if (tourName !== "Show All") {
      setSelectedGroup("Show All")
    }
    applyFilters(tourName, "Show All", allVenues, allShows)
  }

  const handleGroupChange = (groupName: string) => {
    setSelectedGroup(groupName)
    applyFilters(selectedTour, groupName, allVenues, allShows)
  }

  const handleClearFilters = () => {
    setSelectedTour("Show All")
    setSelectedGroup("Show All")
    setTourPath([])
    setTourStartEndVenues({})
    setTourVenueOrder({})
    applyFilters("Show All", "Show All", allVenues, allShows)
  }

  const hasActiveFilters =
    selectedTour !== "Show All" || selectedGroup !== "Show All"
  const isGroupDropdownDisabled = selectedTour !== "Show All"

  return {
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
  }
}
