"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface ShowRelease {
  release_id: string
  release_displayname: string | null
  release_artwork: string | null
  release_link: string | null
  release_service: string | null
  release_order: number | null
}

/** Map release_id -> set of entry_ids that appear on that release (from setlist_entry_media) */
export type ReleaseToEntriesMap = Record<string, Set<string>>

export function useSetlistReleases(showId: string | undefined) {
  const [releases, setReleases] = useState<ShowRelease[]>([])
  const [releaseToEntriesMap, setReleaseToEntriesMap] = useState<ReleaseToEntriesMap>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!showId || !supabase) {
      setReleases([])
      setReleaseToEntriesMap({})
      return
    }
    const client = supabase
    setLoading(true)
    ;(async () => {
      const { data: rsData, error: rsError } = await client
        .from("releases_shows")
        .select(
          "release_id, release_order, releases(release_id, release_displayname, release_artwork, release_link, release_service)"
        )
        .eq("show_id", showId)
        .order("release_order", { ascending: true })

      if (rsError || !rsData) {
        setReleases([])
        setLoading(false)
        return
      }

      type Row = {
        release_id: string
        release_order: number | null
        releases:
          | {
              release_id: string
              release_displayname: string | null
              release_artwork: string | null
              release_link: string | null
              release_service: string | null
            }
          | {
              release_id: string
              release_displayname: string | null
              release_artwork: string | null
              release_link: string | null
              release_service: string | null
            }[]
          | null
      }
      const releaseList: ShowRelease[] = (rsData as Row[])
        .map((r) => {
          const rel = Array.isArray(r.releases) ? r.releases[0] : r.releases
          return rel
            ? {
                release_id: rel.release_id,
                release_displayname: rel.release_displayname,
                release_artwork: rel.release_artwork,
                release_link: rel.release_link,
                release_service: rel.release_service,
                release_order: r.release_order,
              }
            : null
        })
        .filter((r): r is ShowRelease => r != null)

      setReleases(releaseList)

      const releaseIds = releaseList.map((r) => r.release_id)
      if (releaseIds.length === 0) {
        setReleaseToEntriesMap({})
        setLoading(false)
        return
      }

      const { data: semData, error: semError } = await client
        .from("setlist_entry_media")
        .select("setlist_entry_id, release_id")
        .in("release_id", releaseIds)

      const entryToRelease = new Map<string, Set<string>>()
      if (!semError && semData) {
        for (const row of semData as { setlist_entry_id: string; release_id: string }[]) {
          if (!entryToRelease.has(row.setlist_entry_id)) {
            entryToRelease.set(row.setlist_entry_id, new Set())
          }
          entryToRelease.get(row.setlist_entry_id)!.add(row.release_id)
        }
      }
      const revMap: ReleaseToEntriesMap = {}
      for (const rid of releaseIds) revMap[rid] = new Set<string>()
      entryToRelease.forEach((releaseIdsSet, entryId) => {
        releaseIdsSet.forEach((rid) => {
          revMap[rid].add(entryId)
        })
      })
      setReleaseToEntriesMap(revMap)
      setLoading(false)
    })()
  }, [showId])

  const hasReleases = releases.length > 0
  return { releases, releaseToEntriesMap, hasReleases, loading }
}
