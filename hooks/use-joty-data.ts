"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface JotyResultRow {
  entry_id: string
  entry_song: string
  entry_short: string | null
  song_id: string | null
  /** Canonical song name (songs.song) */
  song: string
  /** Display name (songs.song_displayname) */
  song_displayname: string | null
  show_id: string | null
  show_date: string | null
  show_venue_location: string | null
  show_subvenue: string | null
  round_achieved: string
}

export interface JotyRoundWithResults {
  round_abbr: string
  round_name: string
  priority: number
  results: JotyResultRow[]
}

export function useJotyData(open: boolean, year: number | null) {
  const [rounds, setRounds] = useState<JotyRoundWithResults[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || year == null || !supabase) {
      setRounds([])
      return
    }
    const client = supabase
    setLoading(true)
    ;(async () => {
      try {
        const [roundsRes, resultsRes] = await Promise.all([
          client
            .from("joty_rounds")
            .select("joty_round_abbr, joty_round, joty_round_priority")
            .order("joty_round_priority", { ascending: true }),
          client
            .from("joty_results")
            .select(
              `
              entry_id,
              round_achieved,
              setlist_entries(
                entry_song,
                entry_short,
                songs(song_id, song, song_displayname),
                shows(show_id, show_date, show_venue_location, show_subvenue)
              )
            `
            )
            .eq("year", year),
        ])

        const roundsData = (roundsRes.data ?? []) as Array<{
          joty_round_abbr: string
          joty_round: string
          joty_round_priority: number
        }>
        const resultsData = (resultsRes.data ?? []) as unknown as Array<{
          entry_id: string
          round_achieved: string
          setlist_entries: {
            entry_song: string
            entry_short: string | null
            songs:
              | { song_id: string; song: string; song_displayname: string | null }
              | { song_id: string; song: string; song_displayname: string | null }[]
              | null
            shows: {
              show_id: string
              show_date: string
              show_venue_location: string | null
              show_subvenue: string | null
            } | Array<{
              show_id: string
              show_date: string
              show_venue_location: string | null
              show_subvenue: string | null
            }> | null
          } | null
        }>

        const rowsByRound = new Map<string, JotyResultRow[]>()
        for (const r of resultsData) {
          const se = r.setlist_entries
          if (!se) continue
          const songsVal = se.songs
          const songRow = Array.isArray(songsVal) ? songsVal[0] ?? null : songsVal
          const songId = songRow?.song_id ?? null
          const song = songRow?.song ?? se.entry_song
          const songDisplayname = songRow?.song_displayname ?? null
          const showsVal = se.shows
          const show = Array.isArray(showsVal) ? showsVal[0] ?? null : showsVal
          const row: JotyResultRow = {
            entry_id: r.entry_id,
            entry_song: se.entry_song,
            entry_short: se.entry_short ?? null,
            song_id: songId,
            song,
            song_displayname: songDisplayname,
            show_id: show?.show_id ?? null,
            show_date: show?.show_date ?? null,
            show_venue_location: show?.show_venue_location ?? null,
            show_subvenue: show?.show_subvenue ?? null,
            round_achieved: r.round_achieved,
          }
          const list = rowsByRound.get(r.round_achieved) ?? []
          list.push(row)
          rowsByRound.set(r.round_achieved, list)
        }

        for (const list of rowsByRound.values()) {
          list.sort((a, b) => {
            const dA = a.show_date ?? ""
            const dB = b.show_date ?? ""
            if (dA !== dB) return dA.localeCompare(dB)
            return (a.entry_song ?? "").localeCompare(b.entry_song ?? "")
          })
        }

        const roundsWithResults: JotyRoundWithResults[] = roundsData
          .filter((round) => (rowsByRound.get(round.joty_round_abbr)?.length ?? 0) > 0)
          .map((round) => ({
            round_abbr: round.joty_round_abbr,
            round_name: round.joty_round,
            priority: round.joty_round_priority,
            results: rowsByRound.get(round.joty_round_abbr) ?? [],
          }))
        setRounds(roundsWithResults)
      } catch {
        setRounds([])
      } finally {
        setLoading(false)
      }
    })()
  }, [open, year])

  return { rounds, loading }
}
