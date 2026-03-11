"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { SubvenueData, VenueDataBasic } from "@/types/admin"

const PAGE_SIZE = 1000

export function useSubvenueData() {
  const [allSubvenues, setAllSubvenues] = useState<SubvenueData[]>([])
  const [allVenues, setAllVenues] = useState<VenueDataBasic[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const mountedRef = useRef(false)

  const fetchAllSubvenues = async () => {
    if (!supabase) return
    try {
      setLoading(true)
      setLoadingProgress(5)
      let allSubvenuesData: SubvenueData[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from("subvenues")
          .select("*")
          .order("subvenue", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error) throw error
        if (data && data.length > 0) {
          allSubvenuesData = [...allSubvenuesData, ...data]
          page++
          setLoadingProgress(Math.min(95, 5 + page * 15))
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setAllSubvenues(allSubvenuesData || [])
      setLoadingProgress(100)
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 300)
    } catch (error) {
      console.error("Error fetching subvenues:", error)
      setLoadingProgress(100)
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 300)
    }
  }

  const fetchAllVenues = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("venue, venue_location")
        .order("venue", { ascending: true })
      if (!error) setAllVenues(data || [])
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      fetchAllSubvenues()
      fetchAllVenues()
      mountedRef.current = true
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAllSubvenues()
        fetchAllVenues()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  return {
    allSubvenues,
    allVenues,
    loading,
    loadingProgress,
    fetchAllSubvenues,
    fetchAllVenues,
  }
}
