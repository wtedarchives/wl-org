"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { VenueData } from "@/types/admin"

const PAGE_SIZE = 1000

export function useAdminVenueData() {
  const [allVenues, setAllVenues] = useState<VenueData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const mountedRef = useRef(false)

  const fetchAllVenues = async () => {
    if (!supabase) return
    try {
      setLoading(true)
      setLoadingProgress(5)
      let allVenuesData: VenueData[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from("venues")
          .select("*")
          .order("venue", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error) throw error
        if (data && data.length > 0) {
          allVenuesData = [...allVenuesData, ...data]
          page++
          setLoadingProgress(Math.min(95, 5 + page * 15))
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setAllVenues(allVenuesData || [])
      setLoadingProgress(100)
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 300)
    } catch (error) {
      console.error("Error fetching venues:", error)
      setLoadingProgress(100)
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 300)
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      fetchAllVenues()
      mountedRef.current = true
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchAllVenues()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  return {
    allVenues,
    loading,
    loadingProgress,
    fetchAllVenues,
  }
}
