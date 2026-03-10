"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { totalSetlistLength } from "@/lib/setlist-utils"
import type { SandwichRow } from "./use-unfinished-reprised-data"

export interface SandwichPerformance {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string | null
  venue_id: string | null
  show_subvenue_venue: string | null
  combined_length: string
}

export function useSandwichPerformances(
  open: boolean,
  sandwich: SandwichRow | null,
) {
  const [performances, setPerformances] = useState<SandwichPerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !sandwich || sandwich.songs.length === 0) {
      setPerformances([])
      setLoading(false)
      setError(null)
      return
    }

    const client = supabase
    if (!client) {
      setPerformances([])
      return
    }

    const s = sandwich
    let cancelled = false
    const firstSong = s.songs[0].song_name
    const sandwichSongIds = s.songs.map((sng) => sng.song_id)

    async function fetchPerformances(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        // Find all setlist_entries where first song is unfinished
        const { data: unfinishedEntries, error: fetchErr } = await sb
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_show,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_length,
            songs!inner(song_id),
            shows!inner(
              show_id,
              show_date,
              show_subvenue,
              show_subvenue_venue,
              show_venue_location,
              show_group,
              show_canonid,
              subvenues:show_subvenue(
                venues:subvenue_venue(venue_id)
              )
            )
          `,
          )
          .eq("entry_song", firstSong)
          .eq("entry_short", "unfinished")
          .eq("shows.show_group", "Goose")
          .not("shows.show_canonid", "is", null)

        if (cancelled) return
        if (fetchErr) throw fetchErr

        const showSetMap = new Map<
          string,
          { show: any; entry_show: string; entry_set: string }
        >()
        for (const e of unfinishedEntries ?? []) {
          const show = Array.isArray(e.shows) ? e.shows[0] : e.shows
          const key = `${e.entry_show}|${e.entry_set ?? ""}`
          if (!showSetMap.has(key)) {
            showSetMap.set(key, {
              show,
              entry_show: e.entry_show,
              entry_set: e.entry_set ?? "",
            })
          }
        }

        const results: SandwichPerformance[] = []

        // Bulk-fetch setlists for all shows
        const showIds = [...new Set([...showSetMap.keys()].map((k) => k.split("|")[0]))]
        const setlistByKey = new Map<string, any[]>()
        const IN_BATCH = 100

        for (let i = 0; i < showIds.length; i += IN_BATCH) {
          if (cancelled) return
          const chunk = showIds.slice(i, i + IN_BATCH)
          const { data: bulkEntries } = await sb
            .from("setlist_entries")
            .select(
              `
              entry_show,
              entry_set,
              entry_setnum,
              entry_song,
              entry_short,
              entry_length,
              songs!inner(song_id)
            `,
            )
            .in("entry_show", chunk)
            .order("entry_set", { ascending: true })
            .order("entry_setnum", { ascending: true })

          if (bulkEntries) {
            for (const ent of bulkEntries as any[]) {
              const k = `${ent.entry_show}|${ent.entry_set ?? ""}`
              if (!setlistByKey.has(k)) setlistByKey.set(k, [])
              setlistByKey.get(k)!.push(ent)
            }
          }
        }

        for (const [key, { show, entry_show, entry_set }] of showSetMap) {
          if (cancelled) return

          const sorted = (setlistByKey.get(key) ?? []).sort(
            (a: any, b: any) => (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0),
          )

          for (let i = 0; i <= sorted.length - s.songs.length; i++) {
            const slice = sorted.slice(i, i + s.songs.length)
            const sliceIds = slice.map((s: any) => {
              const songsRel = Array.isArray(s.songs) ? s.songs[0] : s.songs
              return songsRel?.song_id ?? ""
            })
            if (
              sliceIds.join("|") !== sandwichSongIds.join("|") ||
              (slice[0] as any).entry_short?.toLowerCase() !== "unfinished" ||
              (slice[slice.length - 1] as any).entry_short?.toLowerCase() !==
                "reprise"
            ) {
              continue
            }
            const combinedLength = totalSetlistLength(
              slice.map((s: any) => ({ entry_length: s.entry_length })),
            )
            const sub = Array.isArray(show?.subvenues)
              ? show?.subvenues[0]
              : show?.subvenues
            const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
            results.push({
              show_id: show?.show_id ?? entry_show,
              show_date: show?.show_date ?? "",
              show_subvenue: show?.show_subvenue ?? "",
              show_venue_location: show?.show_venue_location ?? null,
              venue_id: ven?.venue_id ?? show?.show_subvenue_venue ?? null,
              show_subvenue_venue: show?.show_subvenue_venue ?? null,
              combined_length: combinedLength,
            })
            break
          }
        }

        if (cancelled) return
        results.sort((a, b) => a.show_date.localeCompare(b.show_date))
        setPerformances(results)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load performances",
          )
          setPerformances([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPerformances(client)
    return () => {
      cancelled = true
    }
  }, [open, sandwich])

  return { performances, loading, error }
}
