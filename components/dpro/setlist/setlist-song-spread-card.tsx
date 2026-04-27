"use client"

import { useMemo, type CSSProperties } from "react"
import {
  SongSpreadDisplay,
  type CategorySpread,
} from "@/components/dpro/song-spread-display"
import type { SetlistEntry } from "@/types/setlist"
import {
  INDEX_SKIP_SONG_IMPROV_JAM,
  isSongSpreadCoverCategory,
} from "@/components/dpro/setlist/display-setlist-table.constants"

const EXCLUDED_SHORTS = ["aborted", "fake", "reprise", "tease"]

/** Shared with aside visibility (no hook). */
export function computeSetlistSongSpread(
  setlist: SetlistEntry[],
  includeAllEpisodeEntries = false,
): CategorySpread[] {
  const source = includeAllEpisodeEntries
    ? setlist
    : setlist.filter((entry) => {
        if (entry.entry_song === INDEX_SKIP_SONG_IMPROV_JAM) return false
        const short = (entry.entry_short ?? "").toLowerCase().trim()
        return !EXCLUDED_SHORTS.includes(short)
      })

  const counts: Record<string, number> = {}
  const songsByCategory: Record<string, string[]> = {}
  const canonids: Record<string, number> = {}
  const seenSongs = new Set<string>()

  for (const entry of source) {
    const category =
      entry.song_category || entry.songs?.song_category || "undefined"
    const songKey = entry.entry_song

    if (!includeAllEpisodeEntries) {
      if (seenSongs.has(songKey)) continue
      seenSongs.add(songKey)
    }
    counts[category] = (counts[category] ?? 0) + 1

    if (!songsByCategory[category]) {
      songsByCategory[category] = []
      canonids[category] = entry.category_canonid ?? 0
    }
    const rawArtist = entry.songs?.song_originalartist?.trim()
    const artist =
      rawArtist === "[Traditional]" ? "Traditional" : rawArtist
    const showArtist = isSongSpreadCoverCategory(category) && artist
    const displayName =
      entry.songs?.song_displayname?.trim() || songKey
    const label = showArtist ? `${displayName} [${artist}]` : displayName
    songsByCategory[category].push(label)
  }

  return Object.entries(counts)
    .map(([category, count]) => ({
      category,
      count,
      canonid: canonids[category] ?? 0,
      songs: [...(songsByCategory[category] ?? [])].sort((a, b) =>
        a.localeCompare(b),
      ),
    }))
    .sort((a, b) => b.count - a.count || a.canonid - b.canonid)
}

export function isSetlistSongSpreadAsideVisible(setlist: SetlistEntry[]): boolean {
  return computeSetlistSongSpread(setlist, false).length > 0
}

interface SetlistSongSpreadCardProps {
  setlist: SetlistEntry[]
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
  /**
   * WTED episode playlist: count every row (no improv/jam or short-label exclusions,
   * and repeated songs each count toward their category).
   */
  includeAllEpisodeEntries?: boolean
  /** WL Home v2 setlist aside: embed in `years-tile` + `side-card` with v2 song spread styles. */
  visualVariant?: "default" | "wl-home-v2"
}

export function SetlistSongSpreadCard({
  setlist,
  hoveredCategory = null,
  onCategoryHover,
  includeAllEpisodeEntries = false,
  visualVariant = "default",
}: SetlistSongSpreadCardProps) {
  const spread = useMemo(
    () => computeSetlistSongSpread(setlist, includeAllEpisodeEntries),
    [setlist, includeAllEpisodeEntries],
  )

  if (spread.length === 0) return null

  const display = (
    <SongSpreadDisplay
      spread={spread}
      hoveredCategory={hoveredCategory}
      onCategoryHover={onCategoryHover}
      variant={
        visualVariant === "wl-home-v2" ? "wl-home-v2-setlist" : "card"
      }
    />
  )

  if (visualVariant === "wl-home-v2") {
    return (
      <section
        className="wl-home-v2-years-tile"
        style={
          {
            "--tile-bg": "url('/newbg4.jpeg')",
          } as CSSProperties
        }
      >
        <div className="wl-home-v2-years-tile-inner">
          <div className="side-card wl-home-v2-setlist-song-spread-side-card">
            <div className="sc-label">Song Spread</div>
            {display}
          </div>
        </div>
      </section>
    )
  }

  return display
}
