import { supabase } from "@/lib/supabase"

export async function fetchEchoEntryCounts(
  showIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const id of showIds) counts[id] = 0
  if (showIds.length === 0 || !supabase) return counts
  const { data } = await supabase
    .from("setlist_entries")
    .select("entry_show")
    .in("entry_show", showIds)
  for (const row of data ?? []) {
    const id = row.entry_show as string
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

export async function fetchEchoCanonicalSongAverage(
  exceptShowId?: string,
): Promise<number | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("echo_canonical_song_average", {
    except_show: exceptShowId ?? null,
  })
  if (error) return null
  const n = typeof data === "number" ? data : Number(data)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}
