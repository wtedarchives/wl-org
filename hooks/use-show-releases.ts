"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ReleaseShow } from "@/types/admin"

const PAGE_SIZE = 1000

export function useShowReleases() {
  const [showReleases, setShowReleases] = useState<ReleaseShow[]>([])
  const [loadingReleases, setLoadingReleases] = useState(false)

  const fetchShowReleases = async (showId: string) => {
    if (!supabase) return
    try {
      setLoadingReleases(true)
      let allReleasesData: ReleaseShow[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from("releases_shows")
          .select(
            `
            release_id,
            release_order,
            releases (
              release_displayname,
              release_service
            )
          `
          )
          .eq("show_id", showId)
          .order("release_order", { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (error) throw error
        if (data && data.length > 0) {
          const normalized = (data as Array<{
            release_id: string
            release_order: number
            releases: { release_displayname: string; release_service: string | null } | Array<{ release_displayname: string; release_service: string | null }>
          }>).map((row) => ({
            release_id: row.release_id,
            release_order: row.release_order,
            releases: Array.isArray(row.releases) ? row.releases[0] ?? { release_displayname: "", release_service: null } : row.releases,
          })) as ReleaseShow[]
          allReleasesData = [...allReleasesData, ...normalized]
          page++
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      setShowReleases((allReleasesData || []) as ReleaseShow[])
    } catch {
      setShowReleases([])
    } finally {
      setLoadingReleases(false)
    }
  }

  return { showReleases, loadingReleases, fetchShowReleases }
}
