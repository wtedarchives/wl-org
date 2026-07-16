/**
 * Mirrors `lib/wted-radio-ids-sync.ts` for Deno Edge Functions — keep logic in sync.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

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
  artwork: string | null
}

export type RadioCoApiTrack = {
  id: number
  artist: string
  title: string
  artwork?: {
    url?: string | null
    large_url?: string | null
  } | null
}

export function artworkLargeUrlFromTrack(t: RadioCoApiTrack): string | null {
  const raw = t.artwork?.large_url
  if (raw == null || typeof raw !== "string") return null
  const trimmed = raw.trim()
  return trimmed === "" ? null : trimmed
}

function normalizedDbArtwork(value: string | null | undefined): string | null {
  if (value == null || typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
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
  client: SupabaseClient,
): Promise<WtedRadioIdRow[]> {
  const acc: WtedRadioIdRow[] = []
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("wted_radio_ids")
      .select("uuid, radio_id, track_artist, track_title, status, artwork")
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

export const WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY = 25

export type SyncWtedRadioIdsResult = {
  inserted: WtedRadioIdRow[]
  updatedToRemoved: WtedRadioIdRow[]
  updatedArtwork: WtedRadioIdRow[]
  updatedTitles: WtedRadioIdRow[]
}

export async function syncWtedRadioIds(
  client: SupabaseClient,
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
      artwork: artworkLargeUrlFromTrack(t),
    }))

  const toUpdateArtwork: { uuid: string; artwork: string }[] = []
  for (const t of tracks) {
    const row = dbByRadioId.get(String(t.id))
    if (!row) continue
    const apiArt = artworkLargeUrlFromTrack(t)
    if (apiArt === null) continue
    if (normalizedDbArtwork(row.artwork) === apiArt) continue
    toUpdateArtwork.push({ uuid: row.uuid, artwork: apiArt })
  }

  // Refresh title/artist for existing ids when radio.co's values have changed.
  // (The sync previously set these only at insert time, so a later title change
  // on radio.co — e.g. a date/venue getting appended — was never written back.)
  const toUpdateInfo: { uuid: string; track_title: string; track_artist: string }[] = []
  for (const t of tracks) {
    const row = dbByRadioId.get(String(t.id))
    if (!row) continue
    if (row.track_title === t.title && row.track_artist === t.artist) continue
    toUpdateInfo.push({ uuid: row.uuid, track_title: t.title, track_artist: t.artist })
  }

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
      .select("uuid, radio_id, track_artist, track_title, status, artwork")
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
      .select("uuid, radio_id, track_artist, track_title, status, artwork")
    if (error) throw error
    if (data) updatedRows.push(...(data as WtedRadioIdRow[]))
  }

  const updatedArtwork: WtedRadioIdRow[] = []
  for (
    let i = 0;
    i < toUpdateArtwork.length;
    i += WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY
  ) {
    const slice = toUpdateArtwork.slice(
      i,
      i + WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY,
    )
    const results = await Promise.all(
      slice.map(async ({ uuid, artwork }) => {
        const { data, error } = await client
          .from("wted_radio_ids")
          .update({ artwork })
          .eq("uuid", uuid)
          .select("uuid, radio_id, track_artist, track_title, status, artwork")
        if (error) throw error
        const row = data?.[0] as WtedRadioIdRow | undefined
        return row ?? null
      }),
    )
    for (const r of results) {
      if (r) updatedArtwork.push(r)
    }
  }

  const updatedTitles: WtedRadioIdRow[] = []
  for (
    let i = 0;
    i < toUpdateInfo.length;
    i += WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY
  ) {
    const slice = toUpdateInfo.slice(i, i + WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY)
    const results = await Promise.all(
      slice.map(async ({ uuid, track_title, track_artist }) => {
        const { data, error } = await client
          .from("wted_radio_ids")
          .update({ track_title, track_artist })
          .eq("uuid", uuid)
          .select("uuid, radio_id, track_artist, track_title, status, artwork")
        if (error) throw error
        return (data?.[0] as WtedRadioIdRow | undefined) ?? null
      }),
    )
    for (const r of results) {
      if (r) updatedTitles.push(r)
    }
  }

  return {
    inserted: insertedRows,
    updatedToRemoved: updatedRows,
    updatedArtwork,
    updatedTitles,
  }
}
