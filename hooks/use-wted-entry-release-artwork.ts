"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SetlistEntry } from "@/types/setlist"

const RELEASE_IN_CHUNK = 200
const PAGE_SIZE = 1000

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

type RsRow = {
  release_id: string
  release_order: number | null
}

/** `releases_shows` rows for this show and these releases (paginated). */
async function fetchReleasesOnShow(
  showId: string,
  releaseIds: string[],
): Promise<RsRow[]> {
  if (!supabase || releaseIds.length === 0) return []
  const client = supabase
  const out: RsRow[] = []
  for (const rChunk of chunk(releaseIds, RELEASE_IN_CHUNK)) {
    let page = 0
    let more = true
    while (more) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await client
        .from("releases_shows")
        .select("release_id, release_order")
        .eq("show_id", showId)
        .in("release_id", rChunk)
        .range(from, to)
      if (error) throw error
      const rows = (data ?? []) as RsRow[]
      out.push(...rows)
      more = rows.length === PAGE_SIZE
      page++
    }
  }
  return out
}

/** One row per `release_id` with minimum `release_order` if the DB returns duplicates. */
function mergeByReleaseIdMinOrder(rows: RsRow[]): RsRow[] {
  const m = new Map<string, RsRow>()
  for (const r of rows) {
    const prev = m.get(r.release_id)
    const o = r.release_order ?? Number.POSITIVE_INFINITY
    const po = prev?.release_order ?? Number.POSITIVE_INFINITY
    if (!prev || o < po) m.set(r.release_id, r)
  }
  return [...m.values()]
}

function pickLowestOrderAmongReleases(rows: RsRow[]): RsRow | null {
  const merged = mergeByReleaseIdMinOrder(rows)
  if (merged.length === 0) return null
  const scored = merged.map((r) => ({
    row: r,
    order: r.release_order ?? Number.POSITIVE_INFINITY,
  }))
  scored.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.row.release_id.localeCompare(b.row.release_id)
  })
  return scored[0]!.row
}

/**
 * Pending-slot artwork: on the **setlist entry's show** (`entry_show`),
 * among releases tied via `setlist_entry_media`, pick the row in
 * `releases_shows` with the lowest `release_order`, then use that release's
 * artwork. Falls back when nothing matches.
 */
export function useWtedEntryReleaseArtwork(
  entry: SetlistEntry | null,
  drawerOpen: boolean,
  fallbackReleaseArtwork: string | null,
) {
  const [releaseArtwork, setReleaseArtwork] = useState<string | null>(null)
  const [artworkLoading, setArtworkLoading] = useState(false)

  useEffect(() => {
    if (!drawerOpen || !entry?.entry_id || !entry.entry_show || !supabase) {
      setReleaseArtwork(null)
      setArtworkLoading(false)
      return
    }

    const entryId = entry.entry_id
    const showId = entry.entry_show
    let cancelled = false
    setArtworkLoading(true)
    setReleaseArtwork(null)

    ;(async () => {
      try {
        const { data: semRows, error: semErr } = await supabase
          .from("setlist_entry_media")
          .select("release_id")
          .eq("setlist_entry_id", entryId)

        if (semErr) throw semErr
        const releaseIds = [
          ...new Set(
            (semRows ?? []).map((r: { release_id: string }) => r.release_id),
          ),
        ]

        if (releaseIds.length === 0) {
          if (!cancelled) {
            setReleaseArtwork(fallbackReleaseArtwork)
            setArtworkLoading(false)
          }
          return
        }

        const onShow = await fetchReleasesOnShow(showId, releaseIds)
        if (cancelled) return

        const winner = pickLowestOrderAmongReleases(onShow)
        if (!winner) {
          if (!cancelled) {
            setReleaseArtwork(fallbackReleaseArtwork)
            setArtworkLoading(false)
          }
          return
        }

        const { data: rel, error: rErr } = await supabase
          .from("releases")
          .select("release_artwork")
          .eq("release_id", winner.release_id)
          .maybeSingle()

        if (rErr) throw rErr
        const art =
          (rel as { release_artwork: string | null } | null)?.release_artwork ??
          null
        if (!cancelled) {
          setReleaseArtwork(art ?? fallbackReleaseArtwork)
          setArtworkLoading(false)
        }
      } catch {
        if (!cancelled) {
          setReleaseArtwork(fallbackReleaseArtwork)
          setArtworkLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [drawerOpen, entry?.entry_id, entry?.entry_show, fallbackReleaseArtwork])

  return { releaseArtwork, artworkLoading }
}
