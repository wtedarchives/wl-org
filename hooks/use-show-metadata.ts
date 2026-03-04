"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

interface MetaShow {
  show_id: string
}

export function useShowMetadata(shows: MetaShow[], currentYear: string) {
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(
    new Set(),
  )
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(
    new Set(),
  )

  useEffect(() => {
    if (!supabase || !currentYear || shows.length === 0) return
    const client = supabase
    async function fetchShowsWithSetlists() {
      try {
        const { data, error } = await client
          .from("show_setlists")
          .select("show_id")
          .in(
            "show_id",
            shows.map((s) => s.show_id),
          )
        if (error) throw error
        const setlistSet = new Set((data ?? []).map((item) => item.show_id))
        setShowsWithSetlists(setlistSet)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching shows with setlists:", err)
      }
    }
    fetchShowsWithSetlists()
  }, [shows, currentYear])

  useEffect(() => {
    if (!supabase || !currentYear || shows.length === 0) return
    const client = supabase
    async function fetchShowsWithReleases() {
      try {
        const showIds = shows.map((s) => s.show_id)
        const { count, error: countError } = await client
          .from("releases_shows")
          .select("*", { count: "exact", head: true })
          .in("show_id", showIds)
        if (countError) throw countError
        const batchSize = 1000
        const totalBatches = Math.ceil((count ?? 0) / batchSize)
        let allReleaseShows: { show_id: string }[] = []
        for (let i = 0; i < totalBatches; i += 1) {
          const start = i * batchSize
          const end = Math.min(start + batchSize - 1, (count ?? 0) - 1)
          const { data, error } = await client
            .from("releases_shows")
            .select("show_id")
            .in("show_id", showIds)
            .range(start, end)
          if (error) throw error
          if (data) {
            allReleaseShows = allReleaseShows.concat(
              data as { show_id: string }[],
            )
          }
        }
        const releaseSet = new Set(allReleaseShows.map((item) => item.show_id))
        setShowsWithReleases(releaseSet)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching shows with releases:", err)
      }
    }
    fetchShowsWithReleases()
  }, [shows, currentYear])

  return { showsWithSetlists, showsWithReleases }
}

