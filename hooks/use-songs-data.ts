"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { SongDataFull } from "@/types/admin"

export function useSongsData() {
  const [allSongs, setAllSongs] = useState<SongDataFull[]>([])
  const [categories, setCategories] = useState<{ category: string }[]>([])
  const [artists, setArtists] = useState<{ artist: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(false)

  const fetchAllSongs = async () => {
    if (!supabase) return
    setIsLoading(true)
    try {
      const { count, error: countError } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
      if (countError) throw countError

      const batchSize = 1000
      const totalBatches = Math.ceil((count || 0) / batchSize)
      let allData: SongDataFull[] = []

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize
        const end = Math.min(start + batchSize - 1, (count || 0) - 1)
        const { data, error } = await supabase
          .from("songs")
          .select(
            "song, song_id, song_category, song_originalartist, song_categoryorder, song_coachnotes"
          )
          .order("song", { ascending: true })
          .range(start, end)
        if (error) throw error
        if (data) allData = [...allData, ...data]
      }
      setAllSongs(allData.length > 0 ? allData : [])
    } catch (error) {
      console.error("Error fetching songs:", error)
      setAllSongs([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("category")
        .order("category", { ascending: true })
      if (!error) setCategories(data || [])
    } catch {
      // silent
    }
  }

  const fetchArtists = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("artist")
        .order("artist", { ascending: true })
      if (!error) setArtists(data || [])
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      fetchAllSongs()
      fetchCategories()
      fetchArtists()
      mountedRef.current = true
    }
  }, [])

  return {
    allSongs,
    categories,
    artists,
    isLoading,
    refetchSongs: fetchAllSongs,
  }
}
