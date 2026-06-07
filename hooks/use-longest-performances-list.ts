"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { isRecordingSessionEmbedShow } from "@/lib/show-recording-session-filter"
import { timeToSeconds } from "@/lib/stats/tour-utils"

const EXCLUDED_SHORTS = ["fake", "tease", "reprise", "aborted", "partial"]

export interface LongestPerformanceRow {
  entry_song: string
  song_displayname: string | null
  song_id: string
  category_artwork: string | null
  entry_length: string
  entry_id: string
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string | null
  venue_id: string | null
  show_subvenue_venue: string | null
  entry_coachnotes: string | null
}

export function useLongestPerformancesList(isShortest: boolean) {
  const [rows, setRows] = useState<LongestPerformanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        const BATCH = 2000
        let from = 0
        let hasMore = true
        let batchCount = 0
        const allEntries: any[] = []

        while (hasMore && !cancelled) {
          batchCount++
          if (cancelled) return
          setProgress(Math.min(90, batchCount * 10))
          const { data, error: fetchErr } = await sb
            .from("setlist_entries")
            .select(
              `
              entry_id,
              entry_song,
              entry_short,
              entry_length,
              entry_coachnotes,
              entry_show,
              songs!inner(
                song_id,
                song_displayname,
                categories:song_category(
                  category_artwork
                )
              ),
              shows!inner(
                show_id,
                show_date,
                show_subvenue,
                show_subvenue_venue,
                show_venue_location,
                show_detail,
                subvenues:show_subvenue(
                  venues:subvenue_venue(
                    venue_id
                  )
                )
              )
            `,
            )
            .not("entry_length", "is", null)
            .not("shows.show_canonid", "is", null)
            .range(from, from + BATCH - 1)

          if (fetchErr) throw fetchErr
          if (cancelled) return
          if (data && data.length > 0) {
            allEntries.push(...data)
            hasMore = data.length === BATCH
            from += BATCH
          } else {
            hasMore = false
          }
        }

        if (cancelled) return

        const filtered = allEntries.filter((e) => {
          const short = (e.entry_short ?? "").toLowerCase().trim()
          if (short && EXCLUDED_SHORTS.includes(short)) return false
          return !isRecordingSessionEmbedShow(e.shows)
        })

        const bySong = new Map<
          string,
          {
            entry: any
            seconds: number
          }
        >()

        for (const e of filtered) {
          const song = e.entry_song
          const seconds = timeToSeconds(e.entry_length)
          const existing = bySong.get(song)
          const keep =
            !existing ||
            (isShortest ? seconds < existing.seconds : seconds > existing.seconds)
          if (keep) {
            bySong.set(song, { entry: e, seconds })
          }
        }

        const mapped = Array.from(bySong.values())
          .map(({ entry }) => {
            const songsRel = Array.isArray(entry.songs) ? entry.songs[0] : entry.songs
            const show = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows
            const sub = Array.isArray(show?.subvenues) ? show?.subvenues[0] : show?.subvenues
            const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
            const cat = songsRel?.categories
            const catVal = Array.isArray(cat) ? cat[0] : cat
            return {
              entry_song: entry.entry_song,
              song_displayname: songsRel?.song_displayname ?? null,
              song_id: songsRel?.song_id ?? "",
              category_artwork: catVal?.category_artwork ?? null,
              entry_length: entry.entry_length,
              entry_id: entry.entry_id,
              show_id: show?.show_id ?? entry.entry_show,
              show_date: show?.show_date ?? "",
              show_subvenue: show?.show_subvenue ?? "",
              show_venue_location: show?.show_venue_location ?? null,
              venue_id: ven?.venue_id ?? show?.show_subvenue_venue ?? null,
              show_subvenue_venue: show?.show_subvenue_venue ?? null,
              entry_coachnotes: entry.entry_coachnotes ?? null,
            }
          })
          .sort((a, b) => a.entry_song.localeCompare(b.entry_song))

        if (cancelled) return
        setRows(mapped)
        setProgress(100)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load performances")
        setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData(client)
    return () => {
      cancelled = true
    }
  }, [isShortest])

  return { rows, loading, error, progress }
}
