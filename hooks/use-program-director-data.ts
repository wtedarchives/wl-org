"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { compareWtedEpisodesByOrderThenDisplayName } from "@/lib/wted-episode-display-name"

export interface ProgramDirectorEpisode {
  uuid: string
  episode: string
  display_name: string | null
  order: number | null
  artwork: string | null
  hasEntries: boolean
}

export interface ProgramDirectorShow {
  show: string
  order: number | null
  episodes: ProgramDirectorEpisode[]
}

const PAGE = 1000

async function fetchEpisodeUuidsWithEntries(): Promise<Set<string>> {
  const ids = new Set<string>()
  if (!supabase) return ids
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from("wted_episode_entries")
      .select("episode")
      .range(from, from + PAGE - 1)
    if (error) {
      console.error("program director: episode entries", error)
      break
    }
    if (!data?.length) break
    for (const row of data) {
      if (row.episode) ids.add(row.episode)
    }
    if (data.length < PAGE) break
    from += PAGE
  }
  return ids
}

export function useProgramDirectorData() {
  const [shows, setShows] = useState<ProgramDirectorShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      setError(true)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const [withEntries, showsRes] = await Promise.all([
        fetchEpisodeUuidsWithEntries(),
        supabase
          .from("wted_shows")
          .select("show, order")
          .order("order", { ascending: true }),
      ])
      if (showsRes.error) throw showsRes.error
      const showsData = showsRes.data ?? []

      const episodesRes = await supabase
        .from("wted_episodes")
        .select("uuid, episode, display_name, order, show, artwork, status")

      if (episodesRes.error) throw episodesRes.error

      const byShow = new Map<string, ProgramDirectorEpisode[]>()
      for (const row of episodesRes.data ?? []) {
        if (row.status === "skipped") continue
        const list = byShow.get(row.show) ?? []
        list.push({
          uuid: row.uuid,
          episode: row.episode,
          display_name: row.display_name,
          order: row.order,
          artwork: row.artwork,
          hasEntries: withEntries.has(row.uuid),
        })
        byShow.set(row.show, list)
      }

      setShows(
        showsData.map((s) => {
          const episodes = byShow.get(s.show) ?? []
          const sorted = [...episodes].sort(
            compareWtedEpisodesByOrderThenDisplayName,
          )
          return {
            show: s.show,
            order: s.order,
            episodes: sorted,
          }
        }),
      )
    } catch (e) {
      console.error("program director: load", e)
      setError(true)
      setShows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { shows, loading, error, reload: load }
}
