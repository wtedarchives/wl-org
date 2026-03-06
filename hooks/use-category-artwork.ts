"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useCategoryArtwork(categoryName: string | null) {
  const [artwork, setArtwork] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!categoryName || !supabase) {
      setArtwork(null)
      setLoaded(true)
      return
    }
    const client = supabase
    async function fetchArtwork() {
      try {
        const { data, error } = await client
          .from("categories")
          .select("category_artwork")
          .eq("category", categoryName)
          .maybeSingle()
        if (error) throw error
        const url = (data as { category_artwork: string } | null)?.category_artwork ?? null
        setArtwork(url && url.trim() ? url : null)
      } catch {
        setArtwork(null)
      } finally {
        setLoaded(true)
      }
    }
    fetchArtwork()
  }, [categoryName])

  return { artwork, loaded }
}
