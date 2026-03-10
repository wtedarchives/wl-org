"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface UnfinishedRow {
  song_name: string
  song_displayname: string | null
  song_id: string
  count: number
  category_canonid: number
  category_artwork?: string | null
}

export interface SandwichSong {
  song_name: string
  song_id: string
  song_displayname: string | null
}

export interface SandwichRow {
  songs: SandwichSong[]
  count: number
  category_canonid: number
  sort_string: string
}

export function useUnfinishedReprisedData() {
  const [unfinished, setUnfinished] = useState<UnfinishedRow[]>([])
  const [sandwiches, setSandwiches] = useState<SandwichRow[]>([])
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
        const BATCH = 1000

        // Container 1: Most Common Unfinished
        const fetchUnfinished = async (): Promise<UnfinishedRow[]> => {
          let from = 0
          let hasMore = true
          let batchCount = 0
          const all: any[] = []
          while (hasMore && !cancelled) {
            batchCount++
            if (cancelled) return []
            setProgress(Math.min(45, batchCount * 3))
            const { data, error: fetchErr } = await sb
              .from("setlist_entries")
              .select(
                `
                entry_song,
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
                  show_group,
                  show_canonid
                )
              `,
              )
              .eq("entry_short", "unfinished")
              .eq("shows.show_group", "Goose")
              .not("shows.show_canonid", "is", null)
              .range(from, from + BATCH - 1)
            if (fetchErr) throw fetchErr
            if (cancelled) return []
            if (data?.length) {
              all.push(...data)
              hasMore = data.length === BATCH
              from += BATCH
            } else {
              hasMore = false
            }
          }
          const counts = all.reduce(
            (acc: Record<string, UnfinishedRow>, e: any) => {
              const song = e.entry_song
              const songsRel = Array.isArray(e.songs) ? e.songs[0] : e.songs
              if (!songsRel) return acc
              const cat = songsRel.categories
              const catVal = Array.isArray(cat) ? cat[0] : cat
              if (!acc[song]) {
                acc[song] = {
                  song_name: song,
                  song_displayname: songsRel.song_displayname ?? null,
                  song_id: songsRel.song_id,
                  count: 1,
                  category_canonid: catVal?.category_canonid ?? 0,
                  category_artwork: catVal?.category_artwork ?? null,
                }
              } else {
                acc[song].count++
              }
              return acc
            },
            {},
          )
          return Object.values(counts)
            .sort((a, b) => {
              if (b.count !== a.count) return b.count - a.count
              if (a.category_canonid !== b.category_canonid)
                return a.category_canonid - b.category_canonid
              return a.song_name.localeCompare(b.song_name)
            })
            .slice(0, 25)
        }

        // Container 2: Most Common Reprises (sandwiches) - need all entries per set
        const fetchSandwiches = async (): Promise<SandwichRow[]> => {
          let from = 0
          let hasMore = true
          let batchCount = 0
          const all: any[] = []
          while (hasMore && !cancelled) {
            batchCount++
            if (cancelled) return []
            setProgress(Math.min(90, 45 + batchCount * 2))
            const { data, error: fetchErr } = await sb
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
                songs!inner(
                  song_id,
                  song_displayname,
                  song_category,
                  categories!inner(
                    category_canonid
                  )
                ),
                shows!inner(
                  show_group,
                  show_canonid
                )
              `,
              )
              .eq("shows.show_group", "Goose")
              .not("shows.show_canonid", "is", null)
              .range(from, from + BATCH - 1)
            if (fetchErr) throw fetchErr
            if (cancelled) return []
            if (data?.length) {
              all.push(...data)
              hasMore = data.length === BATCH
              from += BATCH
            } else {
              hasMore = false
            }
          }

          // Group by show + set
          const byShowSet = new Map<string, any[]>()
          for (const e of all) {
            const key = `${e.entry_show}|${e.entry_set ?? ""}`
            if (!byShowSet.has(key)) byShowSet.set(key, [])
            byShowSet.get(key)!.push(e)
          }

          const sandwichCounts = new Map<
            string,
            { songs: SandwichSong[]; count: number; category_canonid: number }
          >()

          for (const setEntries of byShowSet.values()) {
            const sorted = [...setEntries].sort(
              (a, b) => (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0),
            )
            const bySong = new Map<
              string,
              { unfinished: number[]; reprise: number[] }
            >()
            for (let i = 0; i < sorted.length; i++) {
              const e = sorted[i]
              const short = (e.entry_short ?? "").toLowerCase()
              const song = e.entry_song
              if (!bySong.has(song)) bySong.set(song, { unfinished: [], reprise: [] })
              const arr = bySong.get(song)!
              if (short === "unfinished") arr.unfinished.push(i)
              else if (short === "reprise") arr.reprise.push(i)
            }
            for (const [songName, { unfinished: uIdxs, reprise: rIdxs }] of bySong) {
              if (uIdxs.length === 0 || rIdxs.length === 0) continue
              const firstUnfinished = Math.min(...uIdxs)
              const lastReprise = Math.max(...rIdxs)
              if (lastReprise <= firstUnfinished) continue
              const slice = sorted.slice(firstUnfinished, lastReprise + 1)
              const songs: SandwichSong[] = slice.map((s: any) => {
                const songsRel = Array.isArray(s.songs) ? s.songs[0] : s.songs
                return {
                  song_name: s.entry_song,
                  song_id: songsRel?.song_id ?? "",
                  song_displayname: songsRel?.song_displayname ?? null,
                }
              })
              const key = songs.map((s) => s.song_id).join("|")
              const firstSong = slice[0]
              const songsRel = Array.isArray(firstSong.songs)
                ? firstSong.songs[0]
                : firstSong.songs
              const cat = songsRel?.categories
              const catVal = Array.isArray(cat) ? cat[0] : cat
              const category_canonid = catVal?.category_canonid ?? 0
              if (!sandwichCounts.has(key)) {
                sandwichCounts.set(key, {
                  songs,
                  count: 1,
                  category_canonid,
                })
              } else {
                sandwichCounts.get(key)!.count++
              }
            }
          }

          return Array.from(sandwichCounts.entries())
            .filter(([, v]) => v.count > 1)
            .map(([, v]) => ({
              ...v,
              sort_string: v.songs.map((s) => s.song_name).join(" "),
            }))
            .sort((a, b) => {
              if (b.count !== a.count) return b.count - a.count
              if (a.category_canonid !== b.category_canonid)
                return a.category_canonid - b.category_canonid
              return a.sort_string.localeCompare(b.sort_string)
            })
            .slice(0, 25)
        }

        const [unf, sand] = await Promise.all([
          fetchUnfinished(),
          fetchSandwiches(),
        ])
        if (cancelled) return
        setUnfinished(unf ?? [])
        setSandwiches(sand ?? [])
        setProgress(100)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load data")
        setUnfinished([])
        setSandwiches([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData(client)
    return () => {
      cancelled = true
    }
  }, [])

  return { unfinished, sandwiches, loading, error, progress }
}
