"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface SegueDestination {
  song_name: string
  song_id: string
  song_displayname: string | null
  count: number
  category_canonid: number
  category_artwork?: string | null
}

export interface SegueSourceRow {
  song_name: string
  song_id: string
  song_displayname: string | null
  count: number
  category_canonid: number
  category_artwork?: string | null
  destinations: SegueDestination[]
}

interface SegueInstance {
  entry_id: string
  entry_show: string
  entry_set: string
  entry_setnum: number
}

const BATCH = 1000

export function useSeguesData() {
  const [segues, setSegues] = useState<SegueSourceRow[]>([])
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

    async function fetchSegues(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        // 1. Fetch all segue entries (entry_segue contains >)
        let from = 0
        let hasMore = true
        const allEntries: {
          entry_id: string
          entry_song: string
          entry_show: string
          entry_set: string
          entry_setnum: number
          songs?: { song_id: string; song_displayname?: string | null; song_category: string; categories?: { category_canonid: number; category_artwork?: string | null } } | { song_id: string; song_displayname?: string | null; song_category: string; categories?: { category_canonid: number; category_artwork?: string | null } }[]
        }[] = []

        let batchCount = 0
        while (hasMore && !cancelled) {
          batchCount++
          setProgress(Math.min(30, batchCount * 3))
          const { data, error: fetchErr } = await sb
            .from("setlist_entries")
            .select(
              `
              entry_id,
              entry_song,
              entry_show,
              entry_set,
              entry_setnum,
              songs!inner(
                song_id,
                song_displayname,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              shows!inner(
                show_canonid
              )
            `,
            )
            .ilike("entry_segue", "%>%")
            .not("shows.show_canonid", "is", null)
            .eq("shows.show_group", "Goose")
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

        // 2. Group by source song, count, collect instances
        const sourceMap = new Map<
          string,
          {
            count: number
            song_id: string
            song_displayname: string | null
            category_canonid: number
            category_artwork?: string | null
            instances: SegueInstance[]
          }
        >()

        for (const e of allEntries) {
          const songsRel = Array.isArray(e.songs) ? e.songs[0] : e.songs
          if (!songsRel) continue
          const cat = songsRel.categories
          const catVal = Array.isArray(cat) ? cat[0] : cat
          const existing = sourceMap.get(e.entry_song)
          const inst: SegueInstance = {
            entry_id: e.entry_id,
            entry_show: e.entry_show,
            entry_set: e.entry_set ?? "",
            entry_setnum: e.entry_setnum ?? 0,
          }
          if (existing) {
            existing.count++
            existing.instances.push(inst)
          } else {
            sourceMap.set(e.entry_song, {
              count: 1,
              song_id: songsRel.song_id,
              song_displayname: songsRel.song_displayname ?? null,
              category_canonid: catVal?.category_canonid ?? 0,
              category_artwork: catVal?.category_artwork ?? null,
              instances: [inst],
            })
          }
        }

        // 3. Sort and take top 25
        const top25 = Array.from(sourceMap.entries())
          .map(([song_name, v]) => ({
            song_name,
            ...v,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            if (a.category_canonid !== b.category_canonid)
              return a.category_canonid - b.category_canonid
            return a.song_name.localeCompare(b.song_name)
          })
          .slice(0, 25)

        if (cancelled) return
        setProgress(50)

        // 4. Resolve destinations: bulk-fetch setlists for all shows (batch .in() to avoid URL limits)
        const showIds = [...new Set(top25.flatMap((s) => s.instances.map((i) => i.entry_show)))]
        const setlistByShow = new Map<string, any[]>()

        const IN_BATCH = 100
        for (let i = 0; i < showIds.length; i += IN_BATCH) {
          if (cancelled) return
          const chunk = showIds.slice(i, i + IN_BATCH)
          const { data: setEntries } = await sb
            .from("setlist_entries")
            .select(
              `
              entry_show,
              entry_set,
              entry_setnum,
              entry_song,
              songs!inner(
                song_id,
                song_displayname,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              )
            `,
            )
            .in("entry_show", chunk)
            .order("entry_set", { ascending: true })
            .order("entry_setnum", { ascending: true })

          if (setEntries) {
            for (const ent of setEntries as any[]) {
              const key = `${ent.entry_show}|${ent.entry_set ?? ""}`
              if (!setlistByShow.has(key)) setlistByShow.set(key, [])
              setlistByShow.get(key)!.push(ent)
            }
          }

          setProgress(50 + Math.floor((25 * Math.min(i + IN_BATCH, showIds.length)) / showIds.length))
        }

        if (cancelled) return
        setProgress(75)

        // 5. For each source, count (source, dest) pairs
        const results: SegueSourceRow[] = []

        for (const src of top25) {
          const destCounts = new Map<
            string,
            {
              count: number
              song_id: string
              song_displayname: string | null
              category_canonid: number
              category_artwork?: string | null
            }
          >()

          for (const inst of src.instances) {
            const key = `${inst.entry_show}|${inst.entry_set}`
            const setEntries = setlistByShow.get(key)
            if (!setEntries) continue
            const sorted = [...setEntries].sort(
              (a: any, b: any) => (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0),
            )
            const idx = sorted.findIndex(
              (s: any) =>
                s.entry_show === inst.entry_show &&
                s.entry_set === inst.entry_set &&
                s.entry_setnum === inst.entry_setnum,
            )
            if (idx < 0 || idx >= sorted.length - 1) continue
            const next = sorted[idx + 1] as any
            const destSong = next.entry_song
            const songsRel = Array.isArray(next.songs) ? next.songs[0] : next.songs
            const cat = songsRel?.categories
            const catVal = Array.isArray(cat) ? cat?.[0] : cat
            const existing = destCounts.get(destSong)
            if (existing) {
              existing.count++
            } else {
              destCounts.set(destSong, {
                count: 1,
                song_id: songsRel?.song_id ?? "",
                song_displayname: songsRel?.song_displayname ?? null,
                category_canonid: catVal?.category_canonid ?? 0,
                category_artwork: catVal?.category_artwork ?? null,
              })
            }
          }

          const destinations: SegueDestination[] = Array.from(destCounts.entries())
            .map(([song_name, v]) => ({
              song_name,
              ...v,
            }))
            .sort((a, b) => {
              if (b.count !== a.count) return b.count - a.count
              if (a.category_canonid !== b.category_canonid)
                return a.category_canonid - b.category_canonid
              return a.song_name.localeCompare(b.song_name)
            })

          results.push({
            song_name: src.song_name,
            song_id: src.song_id,
            song_displayname: src.song_displayname,
            count: src.count,
            category_canonid: src.category_canonid,
            category_artwork: src.category_artwork,
            destinations,
          })
        }

        if (cancelled) return
        setSegues(results)
        setProgress(100)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load segues",
          )
          setSegues([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSegues(client)
    return () => {
      cancelled = true
    }
  }, [])

  return { segues, loading, error, progress }
}
