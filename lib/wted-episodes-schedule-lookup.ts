import { supabase } from "@/lib/supabase"

/**
 * Radio.co album-art URLs embed the playlist id: `.../playlist.{radio_id}.{revision}.{stamp}.{ext}`.
 * Used when `playlist.name` ↔ `wted_episodes.episode` anon lookup misses (e.g. RLS on `skipped` rows).
 */
export function extractRadioCoPlaylistIdFromArtworkUrl(url: string): string | null {
  const u = url.trim()
  if (!u) return null
  const m = u.match(/\/playlist\.(\d+)\./)
  return m?.[1] ?? null
}

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

/**
 * Same row shape as {@link fetchWtedEpisodeScheduleLookupsByNames}, keyed by `radio_id` string.
 * Omits `REMOVED` only.
 */
export async function fetchWtedEpisodeScheduleLookupsByRadioIds(
  radioIds: string[],
): Promise<Map<string, WtedEpisodeScheduleLookup>> {
  const map = new Map<string, WtedEpisodeScheduleLookup>()
  if (!supabase) return map

  const unique = [
    ...new Set(
      radioIds
        .map((id) => id.trim())
        .filter((id) => id.length > 0 && /^\d+$/.test(id)),
    ),
  ]
  if (unique.length === 0) return map

  for (let i = 0; i < unique.length; i += IN_CHUNK) {
    const chunk = unique.slice(i, i + IN_CHUNK)
    const { data, error } = await supabase
      .from("wted_episodes")
      .select("episode, show, display_name, artwork, host, status, radio_id")
      .in("radio_id", chunk)

    if (error) {
      continue
    }

    for (const row of data ?? []) {
      const rid =
        row.radio_id === null || row.radio_id === undefined ?
          ""
        : String(row.radio_id).trim()
      if (!rid || map.has(rid)) continue
      if (row.status === "REMOVED") continue
      map.set(rid, {
        show: row.show,
        display_name: row.display_name,
        artwork: row.artwork,
        host: row.host,
      })
    }
  }

  return map
}
