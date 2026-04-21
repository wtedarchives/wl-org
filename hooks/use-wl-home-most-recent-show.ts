"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

/** Same “past shows” cutoff as {@link useShowsData} (local calendar tomorrow). */
function localTomorrowDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export type WlHomeMostRecentSetlistEntry = {
  entry_song: string
  entry_set: string | null
  entry_setnum: number
  entry_short: string | null
  song_id: string | null
  song_displayname: string | null
}

export type WlHomeMostRecentShow = {
  show_id: string
  show_date: string
  show_detail: string | null
  show_venue_location: string
  /** Subvenue name (e.g. room / hall), if any. */
  show_subvenue: string | null
}

const CANONICAL_SHOW_FILTER =
  "show_iscanon.eq.true,show_canonid.not.is.null" as const

const PAGE_SIZE = 40

/**
 * Latest past show that is canonical (iscanon or canon id) and has at least one
 * setlist row — same ordering as the old homepage’s most-recent query, with those filters.
 */
export function useWlHomeMostRecentShow() {
  const [show, setShow] = useState<WlHomeMostRecentShow | null>(null)
  const [setlist, setSetlist] = useState<WlHomeMostRecentSetlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setShow(null)
      setSetlist([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function run() {
      const client = supabase
      if (!client) return

      setLoading(true)
      try {
        const tomorrow = localTomorrowDateString()
        let offset = 0
        let picked: WlHomeMostRecentShow | null = null

        while (!cancelled) {
          const { data: shows, error: showErr } = await client
            .from("shows")
            .select(
              `
              show_id,
              show_date,
              show_detail,
              show_canonid,
              show_iscanon,
              show_venue_location,
              show_subvenue
            `,
            )
            .lt("show_date", tomorrow)
            .or(CANONICAL_SHOW_FILTER)
            .order("show_date", { ascending: false })
            .order("show_canonid", { ascending: true, nullsFirst: true })
            .order("show_group", { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1)

          if (showErr) throw showErr
          if (!shows?.length) break

          const ids = shows.map((s) => s.show_id)
          const { data: entryRows, error: entErr } = await client
            .from("setlist_entries")
            .select("entry_show")
            .in("entry_show", ids)

          if (entErr) throw entErr
          const withSetlist = new Set(
            (entryRows ?? []).map((e) => e.entry_show as string),
          )

          const row = shows.find((s) => withSetlist.has(s.show_id))
          if (row) {
            const sub =
              typeof row.show_subvenue === "string" ?
                row.show_subvenue.trim()
              : ""
            picked = {
              show_id: row.show_id,
              show_date: row.show_date,
              show_detail: row.show_detail,
              show_venue_location: row.show_venue_location,
              show_subvenue: sub || null,
            }
            break
          }

          if (shows.length < PAGE_SIZE) break
          offset += PAGE_SIZE
        }

        if (cancelled) return

        if (!picked) {
          setShow(null)
          setSetlist([])
          return
        }

        setShow(picked)

        const { data: list, error: listErr } = await client
          .from("setlist_entries")
          .select(
            `
            entry_song,
            entry_set,
            entry_setnum,
            entry_short,
            songs:entry_song(song_id,song_displayname)
          `,
          )
          .eq("entry_show", picked.show_id)
          .order("entry_set", { ascending: true })
          .order("entry_setnum", { ascending: true })

        if (listErr) throw listErr

        const normalized: WlHomeMostRecentSetlistEntry[] = (list ?? []).map(
          (row: {
            entry_song: string
            entry_set: string | null
            entry_setnum: number
            entry_short: string | null
            songs:
              | { song_id?: string; song_displayname?: string | null }
              | { song_id?: string; song_displayname?: string | null }[]
              | null
          }) => {
            const songRel = row.songs
            const songRow = Array.isArray(songRel) ? songRel[0] : songRel
            return {
              entry_song: row.entry_song,
              entry_set: row.entry_set,
              entry_setnum: row.entry_setnum,
              entry_short: row.entry_short,
              song_id: songRow?.song_id ?? null,
              song_displayname: songRow?.song_displayname ?? null,
            }
          },
        )

        setSetlist(normalized)
      } catch {
        if (!cancelled) {
          setShow(null)
          setSetlist([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return { show, setlist, loading }
}

export function formatWlHomeTileShowDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).replace(/\//g, ".")
}

/** CSS classes `.song.s-set1` / `.s-set2` / `.s-enc` on the archive tile. */
export function wlHomeSetlistPillClass(entrySet: string | null): string {
  const s = String(entrySet ?? "")
  if (s.startsWith("E")) return "song s-enc"
  if (s === "1") return "song s-set1"
  return "song s-set2"
}
