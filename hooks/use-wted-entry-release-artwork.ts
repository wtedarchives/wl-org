"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { fetchWtedEntryReleaseArtwork } from "@/lib/wted-entry-release-artwork-fetch"
import type { SetlistEntry } from "@/types/setlist"

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

  /** Single primitive dep so useEffect dependency array length stays fixed (avoids "deps changed size" under fast refresh). */
  const artworkFetchKey = useMemo(() => {
    if (!drawerOpen || !entry?.entry_id || !entry.entry_show) return null
    return JSON.stringify([
      entry.entry_id,
      entry.entry_show,
      entry.radio_id ?? null,
      fallbackReleaseArtwork ?? null,
    ] as const)
  }, [
    drawerOpen,
    entry?.entry_id,
    entry?.entry_show,
    entry?.radio_id,
    fallbackReleaseArtwork,
  ])

  useEffect(() => {
    if (!artworkFetchKey || !supabase) {
      setReleaseArtwork(null)
      setArtworkLoading(false)
      return
    }

    const [entryId, showId, radioId, _fb] = JSON.parse(artworkFetchKey) as [
      string,
      string,
      string | null,
      string | null,
    ]

    let cancelled = false
    setArtworkLoading(true)
    setReleaseArtwork(null)

    void (async () => {
      const art = await fetchWtedEntryReleaseArtwork(
        supabase,
        entryId,
        showId,
        radioId,
        _fb,
      )
      if (!cancelled) {
        setReleaseArtwork(art)
        setArtworkLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [artworkFetchKey])

  return { releaseArtwork, artworkLoading }
}
