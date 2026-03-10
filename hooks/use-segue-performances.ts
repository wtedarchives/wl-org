"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { totalSetlistLength } from "@/lib/setlist-utils"

export interface SeguePerformance {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string | null
  venue_id: string | null
  show_subvenue_venue: string | null
  combined_length: string
}

export function useSeguePerformances(
  open: boolean,
  sourceSong: string | null,
  destSong: string | null,
) {
  const [performances, setPerformances] = useState<SeguePerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !sourceSong || !destSong) {
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

    let cancelled = false

    async function fetchPerformances(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        // Find all entries where source song has a segue (entry_segue contains >)
        const BATCH = 1000
        let from = 0
        let hasMore = true
        const allEntries: any[] = []

        while (hasMore && !cancelled) {
          const { data, error: fetchErr } = await sb
            .from("setlist_entries")
            .select(
              `
              entry_show,
              entry_set,
              entry_setnum,
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
            .eq("entry_song", sourceSong)
            .ilike("entry_segue", "%>%")
            .not("shows.show_canonid", "is", null)
            .eq("shows.show_group", "Goose")
            .order("entry_show", { ascending: true })
            .order("entry_set", { ascending: true })
            .order("entry_setnum", { ascending: true })
            .range(from, from + BATCH - 1)

          if (fetchErr) throw fetchErr
          if (cancelled) return
          if (data?.length) {
            allEntries.push(...(data as any[]))
            hasMore = data.length === BATCH
            from += BATCH
          } else {
            hasMore = false
          }
        }

        if (cancelled) return

        // Dedupe by (entry_show, entry_set) - we need to check each instance
        const showSetMap = new Map<
          string,
          { show: any; entry_show: string; entry_set: string; entry_setnum: number }[]
        >()
        for (const e of allEntries) {
          const show = Array.isArray(e.shows) ? e.shows[0] : e.shows
          const key = `${e.entry_show}|${e.entry_set ?? ""}`
          if (!showSetMap.has(key)) {
            showSetMap.set(key, [])
          }
          showSetMap.get(key)!.push({
            show,
            entry_show: e.entry_show,
            entry_set: e.entry_set ?? "",
            entry_setnum: e.entry_setnum ?? 0,
          })
        }

        const results: SeguePerformance[] = []

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
              entry_length,
              songs!inner(song_id)
            `,
            )
            .in("entry_show", chunk)
            .order("entry_set", { ascending: true })
            .order("entry_setnum", { ascending: true })

          if (bulkEntries) {
            for (const ent of bulkEntries as any[]) {
              const key = `${ent.entry_show}|${ent.entry_set ?? ""}`
              if (!setlistByKey.has(key)) setlistByKey.set(key, [])
              setlistByKey.get(key)!.push(ent)
            }
          }
        }

        for (const [key, instances] of showSetMap) {
          if (cancelled) return

          const sorted = (setlistByKey.get(key) ?? []).sort(
            (a: any, b: any) => (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0),
          )

          for (const inst of instances) {
            const idx = sorted.findIndex(
              (s: any) => s.entry_setnum === inst.entry_setnum,
            )
            if (idx < 0 || idx >= sorted.length - 1) continue
            const next = sorted[idx + 1] as any
            if (next.entry_song !== destSong) continue

            const slice = [sorted[idx], next]
            const combinedLength = totalSetlistLength(
              slice.map((s: any) => ({ entry_length: s.entry_length })),
            )
            const show = inst.show
            const sub = Array.isArray(show?.subvenues)
              ? show?.subvenues[0]
              : show?.subvenues
            const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
            results.push({
              show_id: show?.show_id ?? inst.entry_show,
              show_date: show?.show_date ?? "",
              show_subvenue: show?.show_subvenue ?? "",
              show_venue_location: show?.show_venue_location ?? null,
              venue_id: ven?.venue_id ?? show?.show_subvenue_venue ?? null,
              show_subvenue_venue: show?.show_subvenue_venue ?? null,
              combined_length: combinedLength,
            })
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
  }, [open, sourceSong, destSong])

  return { performances, loading, error }
}
