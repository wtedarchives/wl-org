import { supabase } from "@/lib/supabase"
import {
  fetchAttendedGooseCanonShowRows,
  isAttendedGooseCanonShow,
  sortAttendedGooseCanonShowsByDate,
} from "@/lib/user-attended-goose-canon-nav"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 100

export type SetlistAttendeeEntry = {
  userId: string
  username: string
  /** 1-based chronological Goose canon show number; null when not applicable. */
  position: number | null
}

type ShowEligibility = {
  show_group?: string | null
  show_canonid?: string | number | null
  show_detail?: string | null
}

async function fetchAttendeeUserIdsForShow(showId: string): Promise<string[]> {
  const client = supabase
  if (!client) return []

  const userIds: string[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("user_attended_shows")
      .select("user_id")
      .eq("show_id", showId)
      .order("id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error
    if (data && data.length > 0) {
      userIds.push(...data.map((row) => row.user_id as string))
      page++
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }
  return [...new Set(userIds)]
}

async function fetchUsernamesById(
  userIds: string[],
): Promise<Map<string, string>> {
  const client = supabase
  const map = new Map<string, string>()
  if (!client || userIds.length === 0) return map

  for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
    const chunk = userIds.slice(i, i + CHUNK_SIZE)
    const { data, error } = await client
      .from("profiles")
      .select("id, username")
      .in("id", chunk)
    if (error) throw error
    for (const row of data ?? []) {
      const id = row.id as string
      const username = (row.username as string | null)?.trim()
      map.set(id, username || "Anonymous")
    }
  }
  return map
}

async function fetchAttendedShowIdsByUser(
  userIds: string[],
): Promise<Map<string, string[]>> {
  const client = supabase
  const byUser = new Map<string, string[]>()
  if (!client || userIds.length === 0) return byUser

  for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
    const chunk = userIds.slice(i, i + CHUNK_SIZE)
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("user_attended_shows")
        .select("user_id, show_id")
        .in("user_id", chunk)
        .order("id", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data && data.length > 0) {
        for (const row of data) {
          const userId = row.user_id as string
          const showId = row.show_id as string
          const list = byUser.get(userId)
          if (list) list.push(showId)
          else byUser.set(userId, [showId])
        }
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
  }
  return byUser
}

function buildCanonPositionByUser(
  showId: string,
  userIds: string[],
  attendedByUser: Map<string, string[]>,
  canonByShowId: Map<string, { show_id: string; show_date: string }>,
): Map<string, number> {
  const positions = new Map<string, number>()
  for (const userId of userIds) {
    const attendedIds = attendedByUser.get(userId) ?? []
    const canonShows = sortAttendedGooseCanonShowsByDate(
      attendedIds
        .map((id) => canonByShowId.get(id))
        .filter((row): row is { show_id: string; show_date: string } =>
          Boolean(row),
        ),
    )
    const index = canonShows.findIndex((row) => row.show_id === showId)
    if (index >= 0) positions.set(userId, index + 1)
  }
  return positions
}

/**
 * Attendees for a setlist show: usernames plus each user's chronological
 * Goose-canon show number for this show (same rules as "Your #th Goose Show").
 */
export async function fetchSetlistAttendees(
  showId: string,
  show: ShowEligibility | null | undefined,
): Promise<SetlistAttendeeEntry[]> {
  const userIds = await fetchAttendeeUserIdsForShow(showId)
  if (userIds.length === 0) return []

  const usernameById = await fetchUsernamesById(userIds)
  const eligible = isAttendedGooseCanonShow(show)

  let positionByUser = new Map<string, number>()
  if (eligible) {
    const attendedByUser = await fetchAttendedShowIdsByUser(userIds)
    const allShowIds = [
      ...new Set(
        [...attendedByUser.values()].flatMap((ids) => ids),
      ),
    ]
    const canonRows = await fetchAttendedGooseCanonShowRows(allShowIds)
    const canonByShowId = new Map(
      canonRows.map((row) => [
        row.show_id,
        { show_id: row.show_id, show_date: row.show_date },
      ]),
    )
    positionByUser = buildCanonPositionByUser(
      showId,
      userIds,
      attendedByUser,
      canonByShowId,
    )
  }

  const entries: SetlistAttendeeEntry[] = userIds.map((userId) => ({
    userId,
    username: usernameById.get(userId) ?? "Anonymous",
    position: positionByUser.get(userId) ?? null,
  }))

  entries.sort((a, b) => {
    const byName = a.username.localeCompare(b.username, undefined, {
      sensitivity: "base",
    })
    if (byName !== 0) return byName
    return a.userId.localeCompare(b.userId)
  })

  return entries
}
