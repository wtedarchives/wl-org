import { supabase } from "@/lib/supabase"
import type { ShowStat } from "@/lib/types/stats"
import { timeToSeconds } from "./tour-utils"

const BATCH_SIZE = 100_000

interface ShowWithLength {
  show_id: string
  show_date: string
  show_subvenue?: string
  show_venue_location?: string
  show_tour?: string
  show_rarity?: number
  show_gap?: number
  show_length: string | null
  show_canonid?: number | null
  show_setlistcomplete?: boolean
  venue_id?: string
  tour_id?: string
  show_rarity_formatted: string | null
  show_gap_formatted: string | null
}

interface ShowStatsResult {
  longest: ShowStat[]
  lowestRarity: ShowStat[]
  highestGap: ShowStat[]
  highestAttended: ShowStat[]
  highestRated: ShowStat[]
}

function formatShowDate(dateStr: string): string {
  return dateStr
    .split("-")
    .slice(1)
    .concat(dateStr.substring(2, 4))
    .join(".")
}

function calculateShowLength(entries: { entry_length?: string }[]): string | null {
  let totalSeconds = 0
  entries.forEach((entry) => {
    if (entry.entry_length) {
      const parts = String(entry.entry_length).split(":").map(Number)
      if (parts.length === 3) {
        const [hours, minutes, seconds] = parts
        totalSeconds += hours * 3600 + minutes * 60 + (seconds || 0)
      } else if (parts.length === 2) {
        const [minutes, seconds] = parts
        totalSeconds += (minutes || 0) * 60 + (seconds || 0)
      }
    }
  })
  if (totalSeconds > 0) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }
  return null
}

function extractVenueId(show: Record<string, unknown>): string | undefined {
  const subvenues = show.subvenues
  if (!subvenues) return undefined
  const arr = Array.isArray(subvenues) ? subvenues : [subvenues]
  const sub = arr[0] as Record<string, unknown> | undefined
  if (!sub?.venues) return undefined
  const venues = Array.isArray(sub.venues) ? sub.venues : [sub.venues]
  return (venues[0] as { venue_id?: string })?.venue_id
}

function extractTourId(show: Record<string, unknown>): string | undefined {
  const tours = show.tours
  if (!tours) return undefined
  const arr = Array.isArray(tours) ? tours : [tours]
  return (arr[0] as { tour_id?: string })?.tour_id
}

async function fetchYearShows(
  selectedYear: number | string
): Promise<Record<string, unknown>[]> {
  const client = supabase
  if (!client) return []
  const select = `
    show_id,
    show_date,
    show_subvenue,
    show_venue_location,
    show_tour,
    show_rarity,
    show_gap,
    show_canonid,
    show_setlistcomplete,
    setlist_entries (
      entry_length
    ),
    subvenues:show_subvenue(
      venues:subvenue_venue(
        venue_id
      )
    ),
    tours:show_tour(
      tour_id
    )
  `
  const base = () =>
    client
      .from("shows")
      .select(select)
      .eq("show_group", "Goose")
      .not("show_canonid", "is", null)

  const allShowsData: Record<string, unknown>[] = []
  let from = 0
  let hasMore = true

  if (selectedYear === "all-time") {
    while (hasMore) {
      const { data, error } = await base().range(from, from + BATCH_SIZE - 1)
      if (error) throw error
      allShowsData.push(...(data || []))
      if (!data || data.length < BATCH_SIZE) hasMore = false
      else from += BATCH_SIZE
    }
    return allShowsData
  }

  const year =
    typeof selectedYear === "number"
      ? selectedYear
      : parseInt(String(selectedYear), 10)
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  while (hasMore) {
    const { data, error } = await base()
      .gte("show_date", startDate)
      .lte("show_date", endDate)
      .range(from, from + BATCH_SIZE - 1)
    if (error) throw error
    allShowsData.push(...(data || []))
    if (!data || data.length < BATCH_SIZE) hasMore = false
    else from += BATCH_SIZE
  }
  return allShowsData
}

function processShowsWithLength(
  allShowsData: Record<string, unknown>[]
): ShowWithLength[] {
  return allShowsData.map((show) => {
    const entries = Array.isArray(show.setlist_entries)
      ? show.setlist_entries
      : []
    const show_length = calculateShowLength(
      entries as { entry_length?: string }[]
    )
    const raw = show as {
      show_rarity?: number
      show_gap?: number
      [k: string]: unknown
    }
    return {
      ...show,
      show_length,
      venue_id: extractVenueId(show),
      tour_id: extractTourId(show),
      show_rarity_formatted:
        raw.show_rarity != null
          ? `${Number(raw.show_rarity).toFixed(2)}%`
          : null,
      show_gap_formatted:
        raw.show_gap != null
          ? Number(raw.show_gap).toFixed(2)
          : null,
    } as ShowWithLength
  })
}

interface ShowRatingData {
  averageRating: number
  reviewCount: number
}

async function fetchAttendeeCounts(
  showIds: string[]
): Promise<Record<string, number>> {
  const client = supabase
  if (!client) return Object.fromEntries(showIds.map((id) => [id, 0]))
  const out: Record<string, number> = {}
  showIds.forEach((id) => {
    out[id] = 0
  })
  if (showIds.length === 0) return out
  const CHUNK_SIZE = 500
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    const chunk = showIds.slice(i, i + CHUNK_SIZE)
    let attendeeFrom = 0
    let attendeeHasMore = true
    while (attendeeHasMore) {
      const { data, error } = await client
        .from("user_attended_shows")
        .select("show_id")
        .in("show_id", chunk)
        .range(attendeeFrom, attendeeFrom + BATCH_SIZE - 1)
      if (error) {
        attendeeHasMore = false
        continue
      }
      if (data?.length) {
        data.forEach((r: { show_id?: string }) => {
          if (r?.show_id) out[r.show_id] = (out[r.show_id] || 0) + 1
        })
      }
      if (!data || data.length < BATCH_SIZE) attendeeHasMore = false
      else attendeeFrom += BATCH_SIZE
    }
  }
  return out
}

async function fetchShowRatings(
  showIds: string[]
): Promise<Record<string, ShowRatingData>> {
  const client = supabase
  if (!client) {
    return Object.fromEntries(
      showIds.map((id) => [id, { averageRating: 0, reviewCount: 0 }])
    )
  }
  const out: Record<string, ShowRatingData> = {}
  showIds.forEach((id) => {
    out[id] = { averageRating: 0, reviewCount: 0 }
  })
  if (showIds.length === 0) return out
  const CHUNK_SIZE = 500
  const allRatings: { show_id: string; rating: number }[] = []
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    const chunk = showIds.slice(i, i + CHUNK_SIZE)
    let from = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("show_ratings")
        .select("show_id, rating")
        .in("show_id", chunk)
        .range(from, from + BATCH_SIZE - 1)
      if (error) {
        hasMore = false
        continue
      }
      if (data?.length) allRatings.push(...(data as { show_id: string; rating: number }[]))
      if (!data || data.length < BATCH_SIZE) hasMore = false
      else from += BATCH_SIZE
    }
  }
  showIds.forEach((id) => {
    const ratings = allRatings.filter((r) => r?.show_id === id)
    if (ratings.length > 0) {
      const avg =
        ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length
      out[id] = {
        averageRating: Math.round(avg * 100) / 100,
        reviewCount: ratings.length,
      }
    }
  })
  return out
}

async function fetchShowLengthRanks(): Promise<Record<string, number>> {
  const client = supabase
  if (!client) return {}
  const allCanonicalShows: { show_id: string; show_length: string | null }[] = []
  let from = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("shows")
      .select("show_id, show_length")
      .not("show_canonid", "is", null)
      .not("show_length", "is", null)
      .range(from, from + BATCH_SIZE - 1)
    if (error) throw error
    if (data) allCanonicalShows.push(...(data as { show_id: string; show_length: string | null }[]))
    if (!data || data.length < BATCH_SIZE) hasMore = false
    else from += BATCH_SIZE
  }
  const withSeconds = allCanonicalShows
    .map((s) => ({
      show_id: s.show_id,
      total_seconds: timeToSeconds(s.show_length),
    }))
    .filter((s) => s.total_seconds >= 0)
    .sort((a, b) => b.total_seconds - a.total_seconds)
  const ranks: Record<string, number> = {}
  withSeconds.slice(0, 25).forEach((s, i) => {
    ranks[s.show_id] = i + 1
  })
  return ranks
}

function generateShowStat(
  show: ShowWithLength,
  value: string,
  sortValue: number,
  showLengthRank?: number | null
): ShowStat & { _canonid?: number | null } {
  return {
    show_id: show.show_id,
    show_date: formatShowDate(show.show_date),
    show_subvenue: show.show_subvenue,
    show_venue_location: show.show_venue_location,
    show_tour: show.show_tour,
    value,
    venue_id: show.venue_id,
    tour_id: show.tour_id,
    show_length_rank: showLengthRank ?? null,
    _canonid: show.show_canonid ?? null,
  }
}

export async function fetchShowStatsData(
  selectedYear: number | string
): Promise<ShowStatsResult> {
  const empty: ShowStatsResult = {
    longest: [],
    lowestRarity: [],
    highestGap: [],
    highestAttended: [],
    highestRated: [],
  }
  const client = supabase
  if (!client) return empty
  try {
    const allShowsData = await fetchYearShows(selectedYear)
    const showsWithLength = processShowsWithLength(allShowsData)
    const showIds = showsWithLength.map((s) => s.show_id)

    let attendeeCounts: Record<string, number> = {}
    let showRatings: Record<string, ShowRatingData> = {}
    let showLengthRanks: Record<string, number> = {}
    try {
      ;[attendeeCounts, showRatings, showLengthRanks] = await Promise.all([
        fetchAttendeeCounts(showIds),
        fetchShowRatings(showIds),
        fetchShowLengthRanks(),
      ])
    } catch {
      // degrade gracefully
    }

    const longest = showsWithLength
      .filter((s) => s.show_length)
      .map((s) => ({
        ...generateShowStat(
          s,
          s.show_length!,
          timeToSeconds(s.show_length),
          showLengthRanks[s.show_id]
        ),
        _sortValue: timeToSeconds(s.show_length),
      }))
      .sort((a, b) => {
        if (b._sortValue !== a._sortValue) return b._sortValue - a._sortValue
        const canonidA = (a as { _canonid?: number })._canonid ?? 0
        const canonidB = (b as { _canonid?: number })._canonid ?? 0
        return canonidA - canonidB
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }) => rest as ShowStat)

    const lowestRarity = showsWithLength
      .filter(
        (s) =>
          s.show_rarity != null &&
          s.show_setlistcomplete === true
      )
      .map((s) => ({
        ...generateShowStat(s, s.show_rarity_formatted!, s.show_rarity!),
        _sortValue: s.show_rarity!,
      }))
      .sort((a, b) => {
        if (a._sortValue !== b._sortValue) return a._sortValue - b._sortValue
        const canonidA = (a as { _canonid?: number })._canonid ?? 0
        const canonidB = (b as { _canonid?: number })._canonid ?? 0
        return canonidA - canonidB
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }) => rest as ShowStat)

    const highestGap = showsWithLength
      .filter(
        (s) =>
          s.show_gap != null &&
          s.show_setlistcomplete === true
      )
      .map((s) => ({
        ...generateShowStat(s, s.show_gap_formatted!, s.show_gap!),
        _sortValue: s.show_gap!,
      }))
      .sort((a, b) => {
        if (b._sortValue !== a._sortValue) return b._sortValue - a._sortValue
        const canonidA = (a as { _canonid?: number })._canonid ?? 0
        const canonidB = (b as { _canonid?: number })._canonid ?? 0
        return canonidA - canonidB
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }) => rest as ShowStat)

    const highestAttended = showsWithLength
      .filter((s) => (attendeeCounts[s.show_id] || 0) > 0)
      .map((s) => ({
        ...generateShowStat(
          s,
          String(attendeeCounts[s.show_id]),
          attendeeCounts[s.show_id]
        ),
        _sortValue: attendeeCounts[s.show_id],
      }))
      .sort((a, b) => {
        if (b._sortValue !== a._sortValue) return b._sortValue - a._sortValue
        const canonidA = (a as { _canonid?: number })._canonid ?? 0
        const canonidB = (b as { _canonid?: number })._canonid ?? 0
        return canonidA - canonidB
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }) => rest as ShowStat)

    const highestRated = showsWithLength
      .filter((s) => {
        const r = showRatings[s.show_id]
        return r && r.reviewCount >= 5 && r.averageRating > 0
      })
      .map((s) => {
        const r = showRatings[s.show_id]!
        return {
          ...generateShowStat(s, r.averageRating.toFixed(2), r.averageRating),
          _sortValue: r.averageRating,
        }
      })
      .sort((a, b) => {
        if (b._sortValue !== a._sortValue) return b._sortValue - a._sortValue
        const canonidA = (a as { _canonid?: number })._canonid ?? 0
        const canonidB = (b as { _canonid?: number })._canonid ?? 0
        return canonidA - canonidB
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }) => rest as ShowStat)

    return {
      longest,
      lowestRarity,
      highestGap,
      highestAttended,
      highestRated,
    }
  } catch {
    return empty
  }
}
