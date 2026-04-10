import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export const WTED_EPISODES_RADIO_PAGE_SIZE = 1000
export const WTED_EPISODES_RADIO_WRITE_BATCH = 500

export type WtedEpisodeRadioSyncRow = {
  uuid: string
  radio_id: string
  episode: string
  artwork: string | null
  status: string | null
  display_name: string | null
  show: string
  order: number | null
  host: string | null
  host_displayname: string | null
}

export type RadioCoStudioPlaylist = {
  id: number
  name: string
  artwork?: { large_url?: string | null } | null
  metadata?: { artist?: string; title?: string } | null
}

/** `wted_shows.show` for rows inserted by playlist sync (must exist in `wted_shows`). */
export const WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW = "Unsorted" as const

export const WTED_EPISODE_RADIO_SYNC_SELECT =
  "uuid, radio_id, episode, artwork, status, display_name, show, order, host, host_displayname" as const

export async function fetchRadioCoPlaylists(
  accessToken: string,
): Promise<RadioCoStudioPlaylist[]> {
  const base = getSupabaseFunctionsUrl()
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const res = await fetch(`${base}/radio-co-playlists`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(anon ? { apikey: anon } : {}),
    },
  })
  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    message?: string
    detail?: string
    missing_env?: string[]
    hint?: string
    playlists?: RadioCoStudioPlaylist[]
  }
  if (!res.ok) {
    const msg = json.error ?? `Edge function returned ${res.status}`
    const detail = json.detail ? ` ${json.detail}` : ""
    const missing =
      json.missing_env?.length ?
        ` Missing: ${json.missing_env.join(", ")}.`
      : ""
    const hint = json.hint ? ` ${json.hint}` : ""
    const inner = json.message ? ` (${json.message})` : ""
    throw new Error(`${msg}${inner}${detail}${missing}${hint}`.trim())
  }
  if (!Array.isArray(json.playlists)) {
    throw new Error("Invalid response: missing playlists array")
  }
  return json.playlists
}

export async function fetchAllWtedEpisodesWithRadioId(
  client: SupabaseClient,
): Promise<WtedEpisodeRadioSyncRow[]> {
  const acc: WtedEpisodeRadioSyncRow[] = []
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("wted_episodes")
      .select(WTED_EPISODE_RADIO_SYNC_SELECT)
      .not("radio_id", "is", null)
      .order("radio_id", { ascending: true })
      .range(from, from + WTED_EPISODES_RADIO_PAGE_SIZE - 1)
    if (error) throw error
    const chunk = (data ?? []) as WtedEpisodeRadioSyncRow[]
    acc.push(...chunk)
    if (chunk.length < WTED_EPISODES_RADIO_PAGE_SIZE) break
    from += WTED_EPISODES_RADIO_PAGE_SIZE
  }
  return acc
}

export type SyncWtedEpisodesRadioResult = {
  inserted: WtedEpisodeRadioSyncRow[]
  updatedToRemoved: WtedEpisodeRadioSyncRow[]
}

export async function syncWtedEpisodesRadio(
  client: SupabaseClient,
  accessToken: string,
): Promise<SyncWtedEpisodesRadioResult> {
  const playlists = await fetchRadioCoPlaylists(accessToken)
  const apiIdSet = new Set(playlists.map((p) => String(p.id)))
  const allDb = await fetchAllWtedEpisodesWithRadioId(client)
  const dbByRadioId = new Map(allDb.map((r) => [r.radio_id, r]))
  const toInsert = playlists
    .filter((p) => !dbByRadioId.has(String(p.id)))
    .map((p) => {
      const largeUrl = p.artwork?.large_url ?? null
      return {
        radio_id: String(p.id),
        episode: p.name,
        artwork: largeUrl && largeUrl.length > 0 ? largeUrl : null,
        status: "NEW" as const,
        show: WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW,
      }
    })

  const toRemoveUuids = allDb
    .filter(
      (r) =>
        !apiIdSet.has(r.radio_id) &&
        r.status !== "REMOVED" &&
        r.status !== "skipped",
    )
    .map((r) => r.uuid)

  const insertedRows: WtedEpisodeRadioSyncRow[] = []
  for (let i = 0; i < toInsert.length; i += WTED_EPISODES_RADIO_WRITE_BATCH) {
    const batch = toInsert.slice(i, i + WTED_EPISODES_RADIO_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_episodes")
      .insert(batch)
      .select(WTED_EPISODE_RADIO_SYNC_SELECT)
    if (error) throw error
    if (data) insertedRows.push(...(data as WtedEpisodeRadioSyncRow[]))
  }

  const updatedRows: WtedEpisodeRadioSyncRow[] = []
  for (let i = 0; i < toRemoveUuids.length; i += WTED_EPISODES_RADIO_WRITE_BATCH) {
    const uuids = toRemoveUuids.slice(i, i + WTED_EPISODES_RADIO_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_episodes")
      .update({ status: "REMOVED" })
      .in("uuid", uuids)
      .select(WTED_EPISODE_RADIO_SYNC_SELECT)
    if (error) throw error
    if (data) updatedRows.push(...(data as WtedEpisodeRadioSyncRow[]))
  }

  return { inserted: insertedRows, updatedToRemoved: updatedRows }
}
