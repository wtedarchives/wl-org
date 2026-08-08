import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 100

export type ShowBuddyEntry = {
  userId: string
  username: string
  sharedShowCount: number
}

async function fetchUserAttendedShowIds(userId: string): Promise<string[]> {
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
      .order("id", { ascending: true })
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
  return [...new Set(ids)]
}

async function fetchCoAttendeeUserIds(
  showIds: string[],
  excludeUserId: string,
): Promise<Map<string, number>> {
  const client = supabase
  const counts = new Map<string, number>()
  if (!client || showIds.length === 0) return counts

  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    const chunk = showIds.slice(i, i + CHUNK_SIZE)
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("user_attended_shows")
        .select("user_id")
        .in("show_id", chunk)
        .neq("user_id", excludeUserId)
        .order("id", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data && data.length > 0) {
        for (const row of data) {
          const otherId = row.user_id as string
          counts.set(otherId, (counts.get(otherId) ?? 0) + 1)
        }
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
  }
  return counts
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

/**
 * Users who share attended shows with `userId`, sorted by shared count desc.
 */
export async function fetchShowBuddies(
  userId: string,
): Promise<ShowBuddyEntry[]> {
  const showIds = await fetchUserAttendedShowIds(userId)
  if (showIds.length === 0) return []

  const sharedCounts = await fetchCoAttendeeUserIds(showIds, userId)
  if (sharedCounts.size === 0) return []

  const buddyIds = [...sharedCounts.keys()]
  const usernameById = await fetchUsernamesById(buddyIds)

  const entries: ShowBuddyEntry[] = buddyIds.map((id) => ({
    userId: id,
    username: usernameById.get(id) ?? "Anonymous",
    sharedShowCount: sharedCounts.get(id) ?? 0,
  }))

  entries.sort((a, b) => {
    if (a.sharedShowCount !== b.sharedShowCount) {
      return b.sharedShowCount - a.sharedShowCount
    }
    return a.username.localeCompare(b.username, undefined, {
      sensitivity: "base",
    })
  })

  return entries
}
