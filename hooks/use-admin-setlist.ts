"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { ShowData, AdminSetlistEntryData } from "@/types/admin"

const PAGE_SIZE = 1000

export function useAdminSetlist() {
  const [shows, setShows] = useState<ShowData[]>([])
  const [setlistEntries, setSetlistEntries] = useState<AdminSetlistEntryData[]>([])
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const mountedRef = useRef(false)
  const showDataLoadedRef = useRef(false)

  const fetchShows = async () => {
    if (!supabase) return
    try {
      setLoading(true)
      setLoadingProgress(5)
      let allShowsData: ShowData[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from("shows")
          .select(
            "show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid"
          )
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: false, nullsFirst: false })
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
      setShows(allShowsData || [])
      setLoadingProgress(100)
      setTimeout(() => setLoading(false), 300)
    } catch (error) {
      console.error("Error fetching shows:", error)
      setLoadingProgress(100)
      setTimeout(() => setLoading(false), 300)
    }
  }

  const fetchSetlistEntries = async (showId: string) => {
    if (!supabase) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("setlist_entries")
        .select(
          `
          entry_id, 
          entry_set, 
          entry_setnum, 
          entry_setorder,
          entry_song, 
          entry_short, 
          entry_segue, 
          entry_length, 
          entry_placement, 
          entry_coachnotes,
          entry_new,
          entry_show
        `
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })

      if (error) throw error
      setSetlistEntries((data || []) as AdminSetlistEntryData[])
    } catch (error) {
      console.error("Error fetching setlist entries:", error)
      setSetlistEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleShowSelect = (show: ShowData) => {
    setSelectedShow(show)
    fetchSetlistEntries(show.show_id)
    try {
      localStorage.setItem("adminSelectedShowId", show.show_id)
    } catch (e) {
      console.error("Error saving selected show to localStorage:", e)
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      fetchShows()
      mountedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (shows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true
      try {
        const storedShowId = localStorage.getItem("adminSelectedShowId")
        if (storedShowId) {
          const storedShow = shows.find((s) => s.show_id === storedShowId)
          if (storedShow) {
            setSelectedShow(storedShow)
            fetchSetlistEntries(storedShowId)
          }
        }
      } catch (e) {
        console.error("Error restoring selected show from localStorage:", e)
      }
    }
  }, [shows])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && selectedShow) {
        fetchSetlistEntries(selectedShow.show_id)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [selectedShow])

  return {
    shows,
    setlistEntries,
    selectedShow,
    loading,
    loadingProgress,
    handleShowSelect,
    fetchSetlistEntries,
  }
}
