import type { SupabaseClient } from "@supabase/supabase-js"

export const WTED_RADIO_CO_TRACKS_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests/tracks" as const

export const WTED_RADIO_IDS_PAGE_SIZE = 1000
export const WTED_RADIO_IDS_WRITE_BATCH = 500

export type WtedRadioIdRow = {
  uuid: string
  radio_id: string
  track_artist: string | null
  track_title: string | null
  status: string | null
}

export type RadioCoApiTrack = {
  id: number
  artist: string
  title: string
}

type RadioCoApiResponse = {
  tracks: RadioCoApiTrack[]
}

export async function fetchRadioCoRequestTracks(): Promise<RadioCoApiTrack[]> {
  const res = await fetch(WTED_RADIO_CO_TRACKS_URL, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`Radio.co returned ${res.status}`)
  }
  const json = (await res.json()) as RadioCoApiResponse
  if (!Array.isArray(json.tracks)) {
    throw new Error("Invalid Radio.co response: missing tracks array")
  }
  return json.tracks
}

export async function fetchAllWtedRadioIds(
  client: SupabaseClient
): Promise<WtedRadioIdRow[]> {
  const acc: WtedRadioIdRow[] = []
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("wted_radio_ids")
      .select("uuid, radio_id, track_artist, track_title, status")
      .order("radio_id", { ascending: true })
      .range(from, from + WTED_RADIO_IDS_PAGE_SIZE - 1)
    if (error) throw error
    const chunk = (data ?? []) as WtedRadioIdRow[]
    acc.push(...chunk)
    if (chunk.length < WTED_RADIO_IDS_PAGE_SIZE) break
    from += WTED_RADIO_IDS_PAGE_SIZE
  }
  return acc
}

export type SyncWtedRadioIdsResult = {
  inserted: WtedRadioIdRow[]
  updatedToRemoved: WtedRadioIdRow[]
}

export async function syncWtedRadioIds(
  client: SupabaseClient
): Promise<SyncWtedRadioIdsResult> {
  const tracks = await fetchRadioCoRequestTracks()
  const apiIdSet = new Set(tracks.map((t) => String(t.id)))
  const allDb = await fetchAllWtedRadioIds(client)
  const dbByRadioId = new Map(allDb.map((r) => [r.radio_id, r]))

  const toInsert = tracks
    .filter((t) => !dbByRadioId.has(String(t.id)))
    .map((t) => ({
      radio_id: String(t.id),
      track_artist: t.artist,
      track_title: t.title,
      status: "NEW",
    }))

  const toRemoveUuids = allDb
    .filter(
      (r) =>
        !apiIdSet.has(r.radio_id) &&
        r.status !== "REMOVED" &&
        r.status !== "skipped",
    )
    .map((r) => r.uuid)

  const insertedRows: WtedRadioIdRow[] = []
  for (let i = 0; i < toInsert.length; i += WTED_RADIO_IDS_WRITE_BATCH) {
    const batch = toInsert.slice(i, i + WTED_RADIO_IDS_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_radio_ids")
      .insert(batch)
      .select("uuid, radio_id, track_artist, track_title, status")
    if (error) throw error
    if (data) insertedRows.push(...(data as WtedRadioIdRow[]))
  }

  const updatedRows: WtedRadioIdRow[] = []
  for (let i = 0; i < toRemoveUuids.length; i += WTED_RADIO_IDS_WRITE_BATCH) {
    const uuids = toRemoveUuids.slice(i, i + WTED_RADIO_IDS_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_radio_ids")
      .update({ status: "REMOVED" })
      .in("uuid", uuids)
      .select("uuid, radio_id, track_artist, track_title, status")
    if (error) throw error
    if (data) updatedRows.push(...(data as WtedRadioIdRow[]))
  }

  return { inserted: insertedRows, updatedToRemoved: updatedRows }
}
