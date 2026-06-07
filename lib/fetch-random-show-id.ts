import { isRecordingSessionShow } from "@/lib/show-recording-session-filter"
import { supabase } from "@/lib/supabase"

const CANONICAL_SHOW_FILTER =
  "show_iscanon.eq.true,show_canonid.not.is.null" as const

const MAX_ATTEMPTS = 10

/**
 * Picks a random canonical Goose `shows.show_id`, excluding recording sessions.
 */
export async function fetchRandomShowId(): Promise<string | null> {
  const client = supabase
  if (!client) return null

  const { count, error: countErr } = await client
    .from("shows")
    .select("show_id", { count: "exact", head: true })
    .eq("show_group", "Goose")
    .or(CANONICAL_SHOW_FILTER)

  if (countErr || !count || count < 1) return null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const offset = Math.floor(Math.random() * count)
    const { data, error } = await client
      .from("shows")
      .select("show_id, show_detail")
      .eq("show_group", "Goose")
      .or(CANONICAL_SHOW_FILTER)
      .order("show_id", { ascending: true })
      .range(offset, offset)
      .maybeSingle()

    if (error) continue
    if (data?.show_id && !isRecordingSessionShow(data)) {
      return data.show_id
    }
  }

  return null
}
