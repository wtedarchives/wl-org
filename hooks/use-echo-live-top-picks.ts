"use client"

import { useEffect, useState } from "react"

import type { EchoLiveBar } from "@/components/echo/echo-live-data"
import { supabase } from "@/lib/supabase"

const TOP_N = 5
const ID_CHUNK = 100
const ROW_BATCH = 1000

type PickRow = {
  submission_id: string
  song: string
  set: string
  setnum: number
  placement: string | null
}

type SongStatRow = {
  song: string
  count: number
  categoryId: number
  displayName: string | null
  songId: string
}

export type EchoLiveTopPicks = {
  loading: boolean
  topSongs: EchoLiveBar[]
  topOpeners: EchoLiveBar[]
  topClosers: EchoLiveBar[]
}

const EMPTY: EchoLiveTopPicks = {
  loading: true,
  topSongs: [],
  topOpeners: [],
  topClosers: [],
}

function compareEchoSetKey(a: string, b: string): number {
  const aEncore = /^E/i.test(a)
  const bEncore = /^E/i.test(b)
  if (aEncore !== bEncore) return aEncore ? 1 : -1
  return (
    Number.parseInt(a.replace(/^E/i, ""), 10) -
    Number.parseInt(b.replace(/^E/i, ""), 10)
  )
}

function countSongs(rows: Array<{ song: string }>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    if (!row.song) continue
    counts[row.song] = (counts[row.song] ?? 0) + 1
  }
  return counts
}

function closerSongs(picks: PickRow[]): Record<string, number> {
  const lastBySubmission = new Map<string, PickRow>()
  for (const pick of picks) {
    const prev = lastBySubmission.get(pick.submission_id)
    if (
      !prev ||
      compareEchoSetKey(pick.set, prev.set) > 0 ||
      (pick.set === prev.set && pick.setnum > prev.setnum)
    ) {
      lastBySubmission.set(pick.submission_id, pick)
    }
  }
  return countSongs([...lastBySubmission.values()])
}

function sortSongStats(stats: SongStatRow[]): SongStatRow[] {
  return [...stats].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    if (a.categoryId !== b.categoryId) return a.categoryId - b.categoryId
    return a.song.localeCompare(b.song)
  })
}

function buildStats(counts: Record<string, number>): SongStatRow[] {
  return Object.entries(counts).map(([song, count]) => ({
    song,
    count,
    categoryId: 0,
    displayName: null,
    songId: "",
  }))
}

async function fetchSongMetadata(songNames: string[]): Promise<
  Record<
    string,
    { songId: string; displayName: string | null; categoryId: number }
  >
> {
  const meta: Record<
    string,
    { songId: string; displayName: string | null; categoryId: number }
  > = {}

  if (!supabase || songNames.length === 0) return meta

  const { data, error } = await supabase
    .from("songs")
    .select(
      "song, song_id, song_displayname, song_category, categories:song_category(category_canonid)",
    )
    .in("song", songNames)

  if (error) {
    console.error("Error fetching Echo live song metadata:", error.message)
    return meta
  }

  for (const row of data ?? []) {
    const cat = row.categories as { category_canonid?: number } | null
    meta[row.song] = {
      songId: row.song_id ?? "",
      displayName: row.song_displayname ?? null,
      categoryId: cat?.category_canonid ?? 0,
    }
  }

  return meta
}

function rankTopSongs(
  counts: Record<string, number>,
  meta: Record<
    string,
    { songId: string; displayName: string | null; categoryId: number }
  >,
): EchoLiveBar[] {
  const stats = buildStats(counts).map((row) => ({
    ...row,
    categoryId: meta[row.song]?.categoryId ?? 0,
    displayName: meta[row.song]?.displayName ?? null,
    songId: meta[row.song]?.songId ?? "",
  }))
  const ranked = sortSongStats(stats).slice(0, TOP_N)
  const max = ranked[0]?.count || 1
  return ranked.map((row) => ({
    song: row.song,
    count: row.count,
    width: `${Math.round((row.count / max) * 100)}%`,
    songId: row.songId || undefined,
    displayName: row.displayName,
  }))
}

async function fetchPicks(submissionIds: string[]): Promise<PickRow[]> {
  if (!supabase) return []
  const picks: PickRow[] = []
  for (let i = 0; i < submissionIds.length; i += ID_CHUNK) {
    const chunk = submissionIds.slice(i, i + ID_CHUNK)
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from("setlist_game_picks")
        .select("submission_id, song, set, setnum, placement")
        .in("submission_id", chunk)
        .range(from, from + ROW_BATCH - 1)
      if (error) {
        console.error("Error fetching Echo live top picks:", error.message)
        break
      }
      const rows = (data ?? []) as PickRow[]
      picks.push(...rows)
      if (rows.length < ROW_BATCH) break
      from += ROW_BATCH
    }
  }
  return picks
}

export function useEchoLiveTopPicks(showId: string | null): EchoLiveTopPicks {
  const [state, setState] = useState<EchoLiveTopPicks>(EMPTY)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!showId || !supabase) {
        setState({
          loading: false,
          topSongs: [],
          topOpeners: [],
          topClosers: [],
        })
        return
      }

      setState((prev) => ({ ...prev, loading: true }))

      const { data: submissions, error: subError } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("show_id", showId)

      if (subError) {
        console.error("Error fetching Echo live submissions:", subError.message)
      }

      const submissionIds = (submissions ?? []).map((row) => row.submission_id)
      if (submissionIds.length === 0) {
        if (!cancelled) {
          setState({
            loading: false,
            topSongs: [],
            topOpeners: [],
            topClosers: [],
          })
        }
        return
      }

      const picks = await fetchPicks(submissionIds)
      if (cancelled) return

      const songCounts = countSongs(picks)
      const openerCounts = countSongs(
        picks.filter((pick) => pick.placement === "Set 1 Opener"),
      )
      const closerCounts = closerSongs(picks)

      const songNames = [
        ...new Set([
          ...Object.keys(songCounts),
          ...Object.keys(openerCounts),
          ...Object.keys(closerCounts),
        ]),
      ]
      const meta = await fetchSongMetadata(songNames)
      if (cancelled) return

      setState({
        loading: false,
        topSongs: rankTopSongs(songCounts, meta),
        topOpeners: rankTopSongs(openerCounts, meta),
        topClosers: rankTopSongs(closerCounts, meta),
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [showId])

  return state
}
