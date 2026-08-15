"use client"

import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

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
  /** "tease", "partial", "reprise", … */
  shorts: string[]
  songs: BrainsSongOption[]
  /** Foreign key target for the required `songs.song_originalartist`. */
  artists: BrainsArtistOption[]
  loading: boolean
  /** Re-read after adding a song or artist so it becomes selectable. */
  refresh: () => void
}

/**
 * Reference data for the brains entry form.
 *
 * Loaded once with the anon key rather than through the Edge Function: reads are
 * public, and only writes need authorization.
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
      const [sets, placements, shorts, songs, artists] = await Promise.all([
        client.from("sets").select("set"),
        client.from("placements").select("placements"),
        client.from("song_shorts").select("song_shorts"),
        client
          .from("songs")
          .select(
            "song_id, song, song_displayname, song_originalartist, song_category",
          )
          .order("song"),
        client.from("artists").select("artist_id, artist").order("artist"),
      ])
      if (cancelled) return

      setState({
        sets: (sets.data ?? [])
          .map((r) => r.set as string)
          .filter(Boolean)
          .sort(),
        placements: (placements.data ?? [])
          .map((r) => r.placements as string)
          .filter(Boolean),
        shorts: (shorts.data ?? [])
          .map((r) => r.song_shorts as string)
          .filter(Boolean),
        songs: (songs.data ?? []) as unknown as BrainsSongOption[],
        artists: (artists.data ?? []) as unknown as BrainsArtistOption[],
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
    shorts: state?.shorts ?? [],
    songs: state?.songs ?? [],
    artists: state?.artists ?? [],
    loading: state === null,
    refresh,
  }
}
