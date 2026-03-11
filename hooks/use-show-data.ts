"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type {
  AdminShowData,
  GroupData,
  TourData,
  SubvenueDisplayData,
  YearData,
  SongData,
} from "@/types/admin"

const PAGE_SIZE = 1000

export function useShowData() {
  const [allShows, setAllShows] = useState<AdminShowData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [groups, setGroups] = useState<GroupData[]>([])
  const [tours, setTours] = useState<TourData[]>([])
  const [subvenues, setSubvenues] = useState<SubvenueDisplayData[]>([])
  const [years, setYears] = useState<YearData[]>([])
  const [songs, setSongs] = useState<SongData[]>([])
  const mountedRef = useRef(false)

  const fetchAllShows = async () => {
    if (!supabase) return
    try {
      setLoading(true)
      setLoadingProgress(5)
      let allShowsData: AdminShowData[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from("shows")
          .select("*")
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (error) throw error
        if (data && data.length > 0) {
          allShowsData = [...allShowsData, ...data]
          page++
          setLoadingProgress(Math.min(95, 5 + page * 15))
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setAllShows(allShowsData || [])
      setLoadingProgress(100)
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 300)
    } catch {
      setLoadingProgress(100)
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 300)
    }
  }

  const fetchReferenceData = async () => {
    if (!supabase) return
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("group")
        .order("group", { ascending: true })
      if (!groupsError) setGroups(groupsData || [])

      const { data: toursData, error: toursError } = await supabase
        .from("tours")
        .select("tour, tour_canonid")
        .order("tour_canonid", { ascending: true })
      if (!toursError) setTours(toursData || [])

      const { data: subvenuesData, error: subvenuesError } = await supabase
        .from("subvenues")
        .select("subvenue, subvenue_venue_location")
        .order("subvenue", { ascending: true })
      if (!subvenuesError)
        setSubvenues((subvenuesData || []) as SubvenueDisplayData[])

      const { data: yearsData, error: yearsError } = await supabase
        .from("years")
        .select("year")
        .order("year", { ascending: true })
      if (!yearsError) setYears(yearsData || [])

      let allSongsData: SongData[] = []
      let songPage = 0
      let hasMoreSongs = true
      while (hasMoreSongs) {
        const { data: songsData, error: songsError } = await supabase
          .from("songs")
          .select("song, song_id")
          .order("song", { ascending: true })
          .range(songPage * PAGE_SIZE, (songPage + 1) * PAGE_SIZE - 1)
        if (!songsError && songsData && songsData.length > 0) {
          allSongsData = [...allSongsData, ...songsData]
          songPage++
          hasMoreSongs = songsData.length === PAGE_SIZE
        } else {
          hasMoreSongs = false
        }
      }
      setSongs(allSongsData || [])
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      fetchAllShows()
      fetchReferenceData()
      mountedRef.current = true
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchAllShows()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  return {
    allShows,
    loading,
    loadingProgress,
    groups,
    tours,
    subvenues,
    years,
    songs,
    fetchAllShows,
  }
}
