import { supabase } from "@/lib/supabase"

/** Subset of `wted_episodes` joined to Radio.co `playlist.name` (= `episode`). */
export type WtedEpisodeScheduleLookup = {
  show: string
  display_name: string | null
  artwork: string | null
  /** JSONB array of `{ name, handle }` — see `parseWtedEpisodeHosts`. */
  host: unknown
}

const IN_CHUNK = 120

/**
 * Load `wted_episodes` rows keyed by `episode` (exact match on playlist name).
 * Omits `REMOVED` only. `skipped` is still used so Radio.co schedule rows can resolve
 * to show / display_name / artwork even when an episode is hidden from Program Director.
 */
export async function fetchWtedEpisodeScheduleLookupsByNames(
  episodeNames: string[],
): Promise<Map<string, WtedEpisodeScheduleLookup>> {
  const map = new Map<string, WtedEpisodeScheduleLookup>()
  if (!supabase) return map

  const unique = [
    ...new Set(
      episodeNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    ),
  ]
  if (unique.length === 0) return map

  for (let i = 0; i < unique.length; i += IN_CHUNK) {
    const chunk = unique.slice(i, i + IN_CHUNK)
    const { data, error } = await supabase
      .from("wted_episodes")
      .select("episode, show, display_name, artwork, host, status")
      .in("episode", chunk)

    if (error) {
      console.warn("wted_episodes schedule lookup", error)
      continue
    }

    for (const row of data ?? []) {
      const ep = row.episode?.trim()
      if (!ep || map.has(ep)) continue
      if (row.status === "REMOVED") continue
      map.set(ep, {
        show: row.show,
        display_name: row.display_name,
        artwork: row.artwork,
        host: row.host,
      })
    }
  }

  return map
}
