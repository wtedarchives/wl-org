import { supabase } from "@/lib/supabase"

export const USER_SEARCH_MIN_QUERY_LENGTH = 2

const RESULT_LIMIT = 8

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type UserSearchResult = {
  id: string
  username: string
}

/** True when the raw input is already a user UUID and needs no lookup. */
export function isUserUuid(raw: string): boolean {
  return UUID_PATTERN.test(raw.trim())
}

function escapeIlike(q: string): string {
  return q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

/**
 * Case-insensitive `profiles.username` search. Exact matches sort first, then
 * prefix matches, then the rest — alphabetically within each group.
 */
export async function searchProfilesByUsername(
  raw: string,
  limit: number = RESULT_LIMIT,
): Promise<UserSearchResult[]> {
  const client = supabase
  const q = raw.trim()
  if (!client || q.length < USER_SEARCH_MIN_QUERY_LENGTH) return []

  const { data, error } = await client
    .from("profiles")
    .select("id, username")
    .ilike("username", `%${escapeIlike(q)}%`)
    .limit(limit * 4)

  if (error) throw error

  const lower = q.toLowerCase()
  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      username: ((row.username as string | null) ?? "").trim(),
    }))
    .filter((row) => row.username.length > 0)
    .sort((a, b) => {
      const rank = (name: string) => {
        const n = name.toLowerCase()
        if (n === lower) return 0
        if (n.startsWith(lower)) return 1
        return 2
      }
      const byRank = rank(a.username) - rank(b.username)
      if (byRank !== 0) return byRank
      return a.username.localeCompare(b.username, undefined, {
        sensitivity: "base",
      })
    })
    .slice(0, limit)
}
