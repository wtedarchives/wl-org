import { WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW } from "@/lib/wted-episodes-radio-sync"
import type { WtedEpisodeHostEntry } from "@/lib/wted-episode-host"

export type SaveNewPlaylistEpisodePayload = {
  episode: string
  display_name: string | null
  show: string
  order: number | null
  artwork: string | null
  /** JSONB array of { name, handle }; `null` clears hosts. */
  host: WtedEpisodeHostEntry[] | null
  status: string | null
}

export function parseOrderInput(raw: string): number | null {
  const t = raw.trim()
  if (t === "") return null
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) ? n : null
}

export function mergeShowOptions(
  loaded: string[],
  currentShow: string | null | undefined,
): string[] {
  const set = new Set(loaded)
  if (currentShow && currentShow.trim()) set.add(currentShow.trim())
  set.add(WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW)
  return [...set].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  )
}

export function hostsToPayloadRows(hosts: WtedEpisodeHostEntry[]) {
  const rows = hosts
    .map((h) => ({
      name: h.name.trim(),
      handle: h.handle.trim(),
    }))
    .filter((h) => h.name.length > 0 || h.handle.length > 0)
  return rows.length > 0 ? rows : null
}
