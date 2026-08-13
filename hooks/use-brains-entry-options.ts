"use client"

import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface BrainsGuestOption {
  guest_id: string
  guest: string
  guest_displayname: string | null
  guest_instrument: string | null
}

export interface BrainsSongOption {
  song_id: string
  song: string
  song_displayname: string | null
  song_originalartist: string | null
  song_category: string | null
}

export interface BrainsArtistOption {
  artist_id: string
  artist: string
}

export interface BrainsEntryOptions {
  /** `1`–`8`, `E1`–`E3`. Foreign key target for `entry_set`. */
  sets: string[]
  /** 27 values, e.g. "Set 1 Opener", "Main Set 2", "Encore 1". */
  placements: string[]
  /** Only `>` exists, so the field renders as a toggle rather than a picker. */
  segues: string[]
  /** "tease", "partial", "reprise", … */
  shorts: string[]
  songs: BrainsSongOption[]
  personnel: BrainsGuestOption[]
  /** Foreign key target for the required `songs.song_originalartist`. */
  artists: BrainsArtistOption[]
  /** Foreign key target for `songs.song_category` — album and release names. */
  categories: string[]
  loading: boolean
  /** Re-read after adding a song, artist or person so it becomes selectable. */
  refresh: () => void
}

/**
 * Reference data for the brains entry form and the dictionary add forms.
 *
 * Loaded once with the anon key rather than through the Edge Function: reads are
 * public, and only writes need authorization. Fetched as a single provider-level
 * hook so the setlist and the add forms share one copy — both need the song and
 * personnel lists, and 1.3k songs is not worth pulling twice.
 */
export function useBrainsEntryOptions(): BrainsEntryOptions {
  const [state, setState] = useState<Omit<
    BrainsEntryOptions,
    "loading" | "refresh"
  > | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let cancelled = false

    async function run() {
      const [sets, placements, segues, shorts, songs, personnel, artists, categories] =
        await Promise.all([
          client.from("sets").select("set"),
          client.from("placements").select("placements"),
          client.from("segues").select("segues"),
          client.from("song_shorts").select("song_shorts"),
          client
            .from("songs")
            .select(
              "song_id, song, song_displayname, song_originalartist, song_category",
            )
            .order("song"),
          client
            .from("guests")
            .select("guest_id, guest, guest_displayname, guest_instrument")
            .order("guest"),
          client.from("artists").select("artist_id, artist").order("artist"),
          client.from("categories").select("category").order("category"),
        ])
      if (cancelled) return

      setState({
        // Text-ascending puts main sets before encores; see sortBrainsEntries.
        sets: (sets.data ?? []).map((r) => r.set as string).filter(Boolean).sort(),
        placements: (placements.data ?? [])
          .map((r) => r.placements as string)
          .filter(Boolean),
        segues: (segues.data ?? []).map((r) => r.segues as string).filter(Boolean),
        shorts: (shorts.data ?? [])
          .map((r) => r.song_shorts as string)
          .filter(Boolean),
        songs: (songs.data ?? []) as unknown as BrainsSongOption[],
        personnel: (personnel.data ?? []) as unknown as BrainsGuestOption[],
        artists: (artists.data ?? []) as unknown as BrainsArtistOption[],
        categories: (categories.data ?? [])
          .map((r) => r.category as string)
          .filter(Boolean),
      })
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return {
    sets: state?.sets ?? [],
    placements: state?.placements ?? [],
    segues: state?.segues ?? [],
    shorts: state?.shorts ?? [],
    songs: state?.songs ?? [],
    personnel: state?.personnel ?? [],
    artists: state?.artists ?? [],
    categories: state?.categories ?? [],
    loading: state === null,
    refresh,
  }
}
