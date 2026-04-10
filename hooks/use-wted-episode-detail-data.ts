"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"
import { mapSupabaseSetlistRowToEntry } from "@/lib/map-supabase-setlist-entry-row"
import { WTED_EPISODE_SETLIST_ENTRY_SELECT } from "@/lib/wted-episode-setlist-select"
import { compareWtedEpisodesByOrderThenDisplayName } from "@/lib/wted-episode-display-name"

export interface WtedEpisodeMeta {
  uuid: string
  episode: string
  display_name: string | null
  order: number | null
  show: string
  artwork: string | null
  host: string | null
  host_displayname: string | null
  /** Public notes / blurb for the episode page (wted_episodes.description). */
  description: string | null
}

export interface WtedEpisodeShowLabel {
  show: string
  order: number | null
}

export interface WtedEpisodeSibling {
  uuid: string
  episode: string
  display_name: string | null
  order: number | null
}

const CHUNK = 500

function parseShowJoin(raw: Record<string, unknown>): {
  showId: string | null
  showDate: string | null
  venueLocation: string | null
  showGroup: string | null
  venueId: string | null
} {
  const shows = raw.shows as
    | {
        show_id: string
        show_date: string
        show_venue_location: string | null
        show_group: string | null
        subvenues?: { venues?: { venue_id: string } | null } | null
      }
    | null
    | undefined
  if (!shows) {
    return {
      showId: null,
      showDate: null,
      venueLocation: null,
      showGroup: null,
      venueId: null,
    }
  }
  return {
    showId: shows.show_id ?? null,
    showDate: shows.show_date ?? null,
    venueLocation: shows.show_venue_location ?? null,
    showGroup: shows.show_group ?? null,
    venueId: shows.subvenues?.venues?.venue_id ?? null,
  }
}

/** Radio IDs that have at least one `wted_episode_entries` row (episode column = radio_id). */
async function entryIdsWithListingsForShow(
  showName: string,
): Promise<Set<string>> {
  const withListings = new Set<string>()
  if (!supabase) return withListings
  const { data: eps, error: epsErr } = await supabase
    .from("wted_episodes")
    .select("status, radio_id")
    .eq("show", showName)
  if (epsErr || !eps?.length) return withListings
  const radioIds = eps
    .filter((e) => e.status !== "skipped")
    .map((e) => e.radio_id)
    .filter((r): r is string => Boolean(r && String(r).trim() !== ""))
  if (radioIds.length === 0) return withListings
  const { data: rows, error: entErr } = await supabase
    .from("wted_episode_entries")
    .select("episode")
    .in("episode", radioIds)
  if (entErr || !rows) return withListings
  for (const r of rows) {
    if (r.episode) withListings.add(r.episode)
  }
  return withListings
}

export function useWtedEpisodeDetailData(episodeId: string | undefined) {
  const [episode, setEpisode] = useState<WtedEpisodeMeta | null>(null)
  const [wtedShow, setWtedShow] = useState<WtedEpisodeShowLabel | null>(null)
  const [rows, setRows] = useState<WtedEpisodeTableRow[]>([])
  const [siblings, setSiblings] = useState<WtedEpisodeSibling[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!episodeId || !supabase) {
      setEpisode(null)
      setWtedShow(null)
      setRows([])
      setSiblings([])
      setNotFound(!episodeId)
      setLoadError(false)
      setLoading(false)
      return
    }

    let cancelled = false
    const client = supabase

    async function run() {
      setLoading(true)
      setNotFound(false)
      setLoadError(false)
      try {
        const { data: epRow, error: epErr } = await client
          .from("wted_episodes")
          .select(
            "uuid, episode, display_name, order, show, artwork, host, host_displayname, description, status, radio_id",
          )
          .eq("uuid", episodeId)
          .maybeSingle()

        if (epErr) throw epErr
        if (!epRow || epRow.status === "skipped") {
          if (!cancelled) {
            setNotFound(true)
            setEpisode(null)
            setWtedShow(null)
            setRows([])
            setSiblings([])
          }
          return
        }

        if (cancelled) return
        setEpisode(epRow as WtedEpisodeMeta)

        const { data: showRow, error: showErr } = await client
          .from("wted_shows")
          .select("show, order")
          .eq("show", epRow.show)
          .maybeSingle()

        if (!cancelled && !showErr && showRow) {
          setWtedShow(showRow as WtedEpisodeShowLabel)
        } else if (!cancelled) {
          setWtedShow({ show: epRow.show, order: null })
        }

        const withListings = await entryIdsWithListingsForShow(epRow.show)
        const { data: sibRows, error: sibErr } = await client
          .from("wted_episodes")
          .select("uuid, episode, display_name, status, order, radio_id")
          .eq("show", epRow.show)

        if (!cancelled && !sibErr && sibRows) {
          const siblingsSorted = sibRows
            .filter(
              (s) =>
                s.status !== "skipped" &&
                s.radio_id &&
                withListings.has(String(s.radio_id)),
            )
            .map((s) => ({
              uuid: s.uuid,
              episode: s.episode,
              display_name: s.display_name,
              order: s.order,
            }))
            .sort(compareWtedEpisodesByOrderThenDisplayName)
          setSiblings(siblingsSorted)
        } else if (!cancelled) {
          setSiblings([])
        }

        const radioKey =
          epRow.radio_id != null && String(epRow.radio_id).trim() !== "" ?
            String(epRow.radio_id)
          : null

        let epEntries: {
          song: string
          set: string | null
          placement: string | null
          order: number | null
        }[] = []
        if (radioKey) {
          const { data, error: eeErr } = await client
            .from("wted_episode_entries")
            .select("song, set, placement, order")
            .eq("episode", radioKey)
            .order("set", { ascending: true })
            .order("order", { ascending: true })
          if (eeErr) throw eeErr
          epEntries = data ?? []
        }

        if (!epEntries?.length) {
          if (!cancelled) setRows([])
          return
        }

        const entryIds = epEntries.map((e) => e.song).filter(Boolean)
        const enrichedById = new Map<
          string,
          {
            setlistEntry: SetlistEntry
            showId: string | null
            showDate: string | null
            venueLocation: string | null
            showGroup: string | null
            venueId: string | null
          }
        >()

        for (let i = 0; i < entryIds.length; i += CHUNK) {
          const chunk = entryIds.slice(i, i + CHUNK)
          const { data: slRows, error: slErr } = await client
            .from("setlist_entries")
            .select(WTED_EPISODE_SETLIST_ENTRY_SELECT)
            .in("entry_id", chunk)

          if (slErr) throw slErr
          for (const raw of (slRows ?? []) as unknown[]) {
            const rec = raw as Record<string, unknown>
            const showMeta = parseShowJoin(rec)
            const setlistEntry = mapSupabaseSetlistRowToEntry(rec)
            const songsRaw = rec.songs as
              | {
                  categories?: { category_artwork?: string | null } | null
                }
              | null
              | undefined
            const art = songsRaw?.categories?.category_artwork
            if (
              art != null &&
              art !== "" &&
              setlistEntry.songs?.categories
            ) {
              setlistEntry.songs.categories.category_artwork = art
            }
            enrichedById.set(setlistEntry.entry_id, {
              setlistEntry,
              ...showMeta,
            })
          }
        }

        const built: WtedEpisodeTableRow[] = []
        for (const ee of epEntries) {
          const en = enrichedById.get(ee.song)
          if (!en) continue
          built.push({
            refId: ee.song,
            wtedSet: ee.set,
            wtedPlacement: ee.placement,
            setlistEntry: en.setlistEntry,
            showId: en.showId,
            showDate: en.showDate,
            venueLocation: en.venueLocation,
            showGroup: en.showGroup,
            venueId: en.venueId,
          })
        }

        if (!cancelled) setRows(built)
      } catch (e) {
        console.error("wted episode detail", e)
        if (!cancelled) {
          setEpisode(null)
          setWtedShow(null)
          setRows([])
          setSiblings([])
          setLoadError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [episodeId])

  return { episode, wtedShow, rows, siblings, loading, notFound, loadError }
}
