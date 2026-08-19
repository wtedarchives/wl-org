import { getEchoLockCountdown } from "@/lib/echo-of-a-show"
import { supabase } from "@/lib/supabase"

const STORAGE_PREFIX = "echo-reveal:"

function key(userId: string, showId: string): string {
  return `${STORAGE_PREFIX}${userId}:${showId}`
}

export function echoRevealWasSeen(userId: string, showId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(key(userId, showId)) === "1"
  } catch {
    return false
  }
}

export function echoMarkRevealSeen(userId: string, showId: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key(userId, showId), "1")
  } catch {
    // quota / private mode
  }
}

export async function fetchEchoSeasonRank(
  tour: string,
  userId: string,
): Promise<number | null> {
  if (!supabase) return null
  const { data: shows } = await supabase
    .from("shows")
    .select("show_id")
    .eq("show_tour", tour)
    .eq("show_scored", true)
    .eq("show_issetlistgame", true)
  const showIds = (shows ?? []).map((row) => row.show_id as string)
  if (showIds.length === 0) return null
  const { data: subs } = await supabase
    .from("setlist_game_submissions")
    .select("user_id, score")
    .in("show_id", showIds)
  const totals = new Map<string, number>()
  for (const row of subs ?? []) {
    const id = row.user_id as string
    totals.set(id, (totals.get(id) ?? 0) + (row.score ?? 0))
  }
  const you = totals.get(userId)
  if (you == null) return null
  return [...totals.values()].filter((total) => total > you).length + 1
}

export async function fetchEchoNextOpenShow(
  tour: string,
  exceptShowId: string,
): Promise<{ show_id: string; show_date: string } | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from("shows")
    .select("show_id, show_date, show_time, show_canonid")
    .eq("show_tour", tour)
    .eq("show_issetlistgame", true)
    .eq("show_scored", false)
    .order("show_canonid", { ascending: true })
  const open = (data ?? []).find(
    (row) =>
      row.show_id !== exceptShowId &&
      !getEchoLockCountdown(row.show_time).isClosed,
  )
  return open ? { show_id: open.show_id, show_date: open.show_date } : null
}
