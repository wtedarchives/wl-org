"use client"

import { useState, useEffect } from "react"
function getAlaskaDateString(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Anchorage",
  })
}
import { supabase } from "@/lib/supabase"
import type {
  SongData,
  SongPerformance,
  SongStats,
  PlacementStat,
  LastPlayed,
} from "@/types/song"

const SONG_LOAD_STEPS = 5 // song, performances, stats, placement, lastPlayed

/** PostgREST may embed `shows` as one object or a single-element array. */
type SongEmbedShow = {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string
  show_tour: string | null
  show_canonid?: number | null
  show_subvenue_venue?: string | null
  subvenues?: unknown
}

function normalizeSongEmbedShow(
  raw: SongEmbedShow | SongEmbedShow[] | null | undefined,
): SongEmbedShow | undefined {
  if (raw == null) return undefined
  return Array.isArray(raw) ? raw[0] : raw
}

export function useSongData(songId: string | undefined) {
  const [song, setSong] = useState<SongData | null>(null)
  const [performances, setPerformances] = useState<SongPerformance[]>([])
  const [stats, setStats] = useState<SongStats>({
    groupCounts: [],
    rarity: "",
    totalShows: 0,
    hasRarity: false,
  })
  const [placementStats, setPlacementStats] = useState<PlacementStat[]>([])
  const [lastPlayed, setLastPlayed] = useState<LastPlayed | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadedSteps, setLoadedSteps] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!songId || !supabase) {
      setLoading(false)
      return
    }

    const client = supabase

    async function fetchSongData() {
      setLoading(true)
      setLoadedSteps(0)
      setError(null)
      try {
        const { data: songData, error: songError } = await client
          .from("songs")
          .select(
            `
            song,
            song_displayname,
            song_category,
            song_originalartist,
            song_writer,
            song_coachnotes,
            song_lyrics,
            categories (
              category_type,
              category_artwork
            )
          `,
          )
          .eq("song_id", songId)
          .single()

        if (songError) throw songError
        if (!songData) {
          setSong(null)
          setPerformances([])
          setStats({ groupCounts: [], rarity: "", totalShows: 0, hasRarity: false })
          setPlacementStats([])
          setLastPlayed(null)
          setLoading(false)
          return
        }

        setSong(songData as unknown as SongData)
        setLoadedSteps(1)

        const { data: performanceData, error: performanceError } = await client
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_show,
            entry_length,
            entry_placement,
            entry_coachnotes,
            entry_segue,
            entry_short,
            entry_set,
            entry_setnum,
            shows_since_debut_num,
            joty_results (
              round_achieved
            ),
            shows (
              show_date,
              show_group,
              show_subvenue,
              show_venue_location,
              show_tour,
              show_id,
              show_canonid,
              subvenues:show_subvenue(
                venues:subvenue_venue(
                  venue_id
                )
              )
            ),
            setlist_entry_guests (
              guest_id,
              guests (
                guest_displayname,
                guest_canonid,
                guest_instrument,
                guest_category
              )
            )
          `,
          )
          .eq("entry_song", (songData as { song: string }).song)
          .order("entry_show", { ascending: true })

        if (performanceError) throw performanceError

        const processedPerformances = (performanceData ?? []).map(
          (perf: Record<string, unknown>) => {
            const showsRel = normalizeSongEmbedShow(
              perf.shows as SongEmbedShow | SongEmbedShow[] | undefined,
            )

            const subvenuesVal = showsRel?.subvenues
            const venueId =
              (Array.isArray(subvenuesVal)
                ? subvenuesVal[0]?.venues?.venue_id
                : (subvenuesVal as { venues?: { venue_id: string } } | undefined)
                    ?.venues?.venue_id) ?? null

            return {
              entry_id: perf.entry_id,
              show_id: showsRel?.show_id ?? "",
              show_date: showsRel?.show_date ?? "",
              show_group: showsRel?.show_group ?? "",
              show_subvenue: showsRel?.show_subvenue ?? "",
              show_venue_location: showsRel?.show_venue_location ?? "",
              show_subvenue_venue: showsRel?.show_subvenue_venue ?? null,
              venue_id: venueId,
              show_tour: showsRel?.show_tour ?? null,
              show_canonid: showsRel?.show_canonid ?? null,
              entry_length: (perf.entry_length as string | null) ?? null,
              entry_placement: (perf.entry_placement as string) ?? "",
              entry_coachnotes: (perf.entry_coachnotes as string | null) ?? null,
              entry_segue: (perf.entry_segue as string | null) ?? null,
              entry_short: (perf.entry_short as string | null) ?? null,
              entry_set: (perf.entry_set as string) ?? "",
              entry_setnum: perf.entry_setnum ?? 0,
              entry_song: (songData as { song: string }).song,
              joty_round:
                (
                  perf.joty_results as { round_achieved: string | null } | undefined
                )?.round_achieved ?? null,
              shows_since_debut_num:
                (perf.shows_since_debut_num as number | null) ?? null,
              guests:
                (
                  perf.setlist_entry_guests as Array<{
                    guest_id: string
                    guests: {
                      guest_displayname: string
                      guest_canonid: number
                      guest_instrument: string
                      guest_category?: string | null
                    }
                  }>
                )?.map((g) => ({
                  guest_id: g.guest_id,
                  guest_display_name: g.guests.guest_displayname,
                  guest_canonid: g.guests.guest_canonid,
                  guest_instrument: g.guests.guest_instrument,
                  guest_category: g.guests.guest_category ?? null,
                })) ?? [],
            }
          },
        ) as SongPerformance[]

        setPerformances(processedPerformances)
        setLoadedSteps(2)

        const newStats = await calculateStats(processedPerformances)
        setStats(newStats)
        setLoadedSteps(3)

        await fetchPlacementStats((songData as { song: string }).song)
        setLoadedSteps(4)
        await fetchLastPlayed((songData as { song: string }).song)
        setLoadedSteps(SONG_LOAD_STEPS)
      } catch (err) {
        console.error("Error fetching song data:", err)
        setError(err instanceof Error ? err.message : "Failed to load song")
        setSong(null)
        setPerformances([])
      } finally {
        setLoading(false)
      }
    }

    async function calculateStats(
      perfs: SongPerformance[],
    ): Promise<SongStats> {
      const uniqueShowsMap = new Map<string, Set<string>>()
      const uniqueShowIds = new Set(perfs.map((p) => p.show_id))

      perfs.forEach((perf) => {
        if (!uniqueShowsMap.has(perf.show_group)) {
          uniqueShowsMap.set(perf.show_group, new Set())
        }
        uniqueShowsMap.get(perf.show_group)?.add(perf.show_id)
      })

      const groupCounts = Array.from(uniqueShowsMap)
        .map(([group, shows]) => ({ group, count: shows.size }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return a.group.localeCompare(b.group)
        })

      const { data: showsWithCanonIds, error: showsError } = await client
        .from("shows")
        .select("show_canonid")
        .in("show_id", Array.from(uniqueShowIds))
        .not("show_canonid", "is", null)

      if (
        showsError ||
        !showsWithCanonIds ||
        showsWithCanonIds.length === 0
      ) {
        return {
          groupCounts,
          rarity: "",
          totalShows: uniqueShowIds.size,
          hasRarity: false,
        }
      }

      const minCanonId = Math.min(
        ...showsWithCanonIds.map((s) => s.show_canonid as number),
      )

      const alaskaDate = getAlaskaDateString()

      const { data: mostRecentShow, error: maxError } = await client
        .from("shows")
        .select("show_canonid, show_date")
        .not("show_canonid", "is", null)
        .lte("show_date", alaskaDate)
        .order("show_date", { ascending: false })
        .order("show_canonid", { ascending: false })
        .order("show_group", { ascending: true })
        .limit(1)
        .single()

      if (maxError || !mostRecentShow) {
        return {
          groupCounts,
          rarity: "",
          totalShows: uniqueShowIds.size,
          hasRarity: false,
        }
      }

      const maxCanonId = mostRecentShow.show_canonid as number
      const showRange = maxCanonId - minCanonId + 1
      const uniqueShowCount = showsWithCanonIds.length
      const rarityPercentage = (uniqueShowCount / showRange) * 100

      return {
        groupCounts,
        rarity: `${rarityPercentage.toFixed(2)}%`,
        totalShows: uniqueShowIds.size,
        hasRarity: true,
      }
    }

    async function fetchPlacementStats(songName: string) {
      try {
        const { data: placementOrders, error: placementError } = await client
          .from("placements")
          .select("placements, placement_order")

        if (placementError) throw placementError

        const placementOrderMap: Record<string, number> = {}
        if (placementOrders) {
          placementOrders.forEach((p: { placements: string; placement_order: number | null }) => {
            if (p.placement_order !== null) {
              placementOrderMap[p.placements] = p.placement_order
            }
          })
        }

        const { data: canonPerformances, error } = await client
          .from("setlist_entries")
          .select(
            `
            entry_placement,
            shows!inner (
              show_canonid
            )
          `,
          )
          .eq("entry_song", songName)
          .not("shows.show_canonid", "is", null)

        if (error) throw error

        if (!canonPerformances || canonPerformances.length === 0) {
          setPlacementStats([])
          return
        }

        const placementCounts: Record<string, number> = {}
        canonPerformances.forEach((perf: { entry_placement: string }) => {
          const placement = perf.entry_placement
          placementCounts[placement] = (placementCounts[placement] || 0) + 1
        })

        const totalPerformances = canonPerformances.length
        const stats = Object.entries(placementCounts)
          .map(([placement, count]) => ({
            placement,
            count,
            percentage: (count / totalPerformances) * 100,
            order: placementOrderMap[placement],
          }))
          .sort((a, b) => b.count - a.count)

        setPlacementStats(stats)
      } catch (err) {
        console.error("Error fetching placement stats:", err)
        setPlacementStats([])
      }
    }

    async function fetchLastPlayed(songName: string) {
      try {
        const alaskaDate = getAlaskaDateString()

        const { data: mostRecentShow, error: recentError } = await client
          .from("shows")
          .select("show_canonid, show_date")
          .not("show_canonid", "is", null)
          .lte("show_date", alaskaDate)
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: false })
          .order("show_group", { ascending: true })
          .limit(1)
          .single()

        if (recentError || !mostRecentShow) {
          setLastPlayed(null)
          return
        }

        const { data: lastPerformance, error: lastError } = await client
          .from("setlist_entries")
          .select(
            `
            entry_show,
            shows!inner (
              show_id,
              show_date,
              show_canonid
            )
          `,
          )
          .eq("entry_song", songName)
          .not("shows.show_canonid", "is", null)
          .order("shows(show_canonid)", { ascending: false })
          .limit(1)
          .single()

        if (lastError || !lastPerformance) {
          setLastPlayed(null)
          return
        }

        const showsRaw = lastPerformance.shows as
          | { show_id: string; show_date: string; show_canonid: number }
          | { show_id: string; show_date: string; show_canonid: number }[]
        const showsRel = Array.isArray(showsRaw) ? showsRaw[0] : showsRaw
        if (!showsRel) {
          setLastPlayed(null)
          return
        }
        const showsAgo =
          (mostRecentShow.show_canonid as number) - showsRel.show_canonid + 1

        setLastPlayed({
          show_date: showsRel.show_date,
          show_canonid: showsRel.show_canonid,
          showsAgo,
          show_id: showsRel.show_id,
        })
      } catch (err) {
        console.error("Error fetching last played:", err)
        setLastPlayed(null)
      }
    }

    fetchSongData()
  }, [songId])

  const progress =
    loading && SONG_LOAD_STEPS > 0
      ? (loadedSteps / SONG_LOAD_STEPS) * 100
      : undefined

  return {
    song,
    songName: song?.song ?? null,
    performances,
    stats,
    placementStats,
    lastPlayed,
    loading,
    error,
    progress,
  }
}
