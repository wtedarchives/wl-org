import { supabase } from "@/lib/supabase"
import {
  excludeRecordingSessionShows,
  isRecordingSessionShow,
} from "@/lib/show-recording-session-filter"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

export type AttendedGooseCanonShowRow = {
  show_id: string
  show_date: string
  show_group: string
  show_canonid: string | number
  show_detail: string | null
  show_venue_location: string | null
}

export type AttendedGooseCanonNav = {
  position: number
  total: number
  prevShowId: string | null
  nextShowId: string | null
}

export function isAttendedGooseCanonShow(
  show:
    | {
        show_group?: string | null
        show_canonid?: string | number | null
        show_detail?: string | null
      }
    | null
    | undefined,
): boolean {
  if (!show) return false
  if (show.show_group !== "Goose" || !show.show_canonid) return false
  return !isRecordingSessionShow(show)
}

export function sortAttendedGooseCanonShowsByDate<
  T extends { show_date: string },
>(shows: T[]): T[] {
  return [...shows].sort((a, b) => {
    const aDate = a.show_date
    const bDate = b.show_date
    if (!aDate || !bDate) return 0
    return new Date(aDate).getTime() - new Date(bDate).getTime()
  })
}

export function buildAttendedGooseCanonNav(
  shows: { show_id: string }[],
  currentShowId: string,
): AttendedGooseCanonNav | null {
  const index = shows.findIndex((row) => row.show_id === currentShowId)
  if (index < 0) return null
  return {
    position: index + 1,
    total: shows.length,
    prevShowId: index > 0 ? shows[index - 1]!.show_id : null,
    nextShowId:
      index < shows.length - 1 ? shows[index + 1]!.show_id : null,
  }
}

async function fetchAllAttendedShowIds(userId: string): Promise<string[]> {
  const client = supabase
  if (!client) return []

  const ids: string[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("user_attended_shows")
      .select("show_id")
      .eq("user_id", userId)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error
    if (data && data.length > 0) {
      ids.push(...data.map((row) => row.show_id as string))
      page++
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }
  return ids
}

async function fetchAttendedGooseCanonShowRows(
  showIds: string[],
): Promise<AttendedGooseCanonShowRow[]> {
  const client = supabase
  if (!client || showIds.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    chunks.push(showIds.slice(i, i + CHUNK_SIZE))
  }

  const out: AttendedGooseCanonShowRow[] = []
  for (const chunk of chunks) {
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("shows")
        .select("show_id, show_date, show_group, show_canonid, show_detail, show_venue_location")
        .in("show_id", chunk)
        .eq("show_group", "Goose")
        .not("show_canonid", "is", null)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data && data.length > 0) {
        out.push(...(data as AttendedGooseCanonShowRow[]))
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
  }

  return excludeRecordingSessionShows(out)
}

export async function fetchUserAttendedGooseCanonShows(
  userId: string,
): Promise<AttendedGooseCanonShowRow[]> {
  const attendedIds = await fetchAllAttendedShowIds(userId)
  if (attendedIds.length === 0) return []
  const rows = await fetchAttendedGooseCanonShowRows(attendedIds)
  return sortAttendedGooseCanonShowsByDate(rows)
}
