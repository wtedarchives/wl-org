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
  /** `wted_episode_entries.episode` references this (Radio.co playlist id). */
  radio_id: string | null
  hasEntries: boolean
}

export interface ProgramDirectorShow {
  show: string
  order: number | null
  /** From `wted_shows.description`; shown in Program Director info dialog when set. */
  description: string | null
  episodes: ProgramDirectorEpisode[]
}

const PAGE = 1000

/** Distinct `wted_episode_entries.episode` values (= `wted_episodes.radio_id`). */
async function fetchRadioIdsWithEpisodeEntries(): Promise<Set<string>> {
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
        fetchRadioIdsWithEpisodeEntries(),
        supabase
          .from("wted_shows")
          .select("show, order, description")
          .order("order", { ascending: true }),
      ])
      if (showsRes.error) throw showsRes.error
      const showsData = showsRes.data ?? []

      const episodesRes = await supabase
        .from("wted_episodes")
        .select(
          "uuid, episode, display_name, order, show, artwork, status, radio_id",
        )

      if (episodesRes.error) throw episodesRes.error

      const byShow = new Map<string, ProgramDirectorEpisode[]>()
      for (const row of episodesRes.data ?? []) {
        if (row.status === "skipped") continue
        const list = byShow.get(row.show) ?? []
        const rid =
          row.radio_id != null && String(row.radio_id).trim() !== "" ?
            String(row.radio_id)
          : null
        list.push({
          uuid: row.uuid,
          episode: row.episode,
          display_name: row.display_name,
          order: row.order,
          artwork: row.artwork,
          radio_id: rid,
          hasEntries: rid != null && withEntries.has(rid),
        })
        byShow.set(row.show, list)
      }

      const rows = showsData.map((s) => {
        const episodes = byShow.get(s.show) ?? []
        const sorted = [...episodes].sort(
          compareWtedEpisodesByOrderThenDisplayName,
        )
        return {
          show: s.show,
          order: s.order,
          description:
            s.description != null && String(s.description).trim() !== "" ?
              String(s.description).trim()
            : null,
          episodes: sorted,
        }
      })

      rows.sort((a, b) => {
        const byCount = b.episodes.length - a.episodes.length
        if (byCount !== 0) return byCount
        const ao = a.order ?? Number.POSITIVE_INFINITY
        const bo = b.order ?? Number.POSITIVE_INFINITY
        return ao - bo
      })

      setShows(rows)
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
