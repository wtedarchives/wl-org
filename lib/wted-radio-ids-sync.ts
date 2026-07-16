import type { SupabaseClient } from "@supabase/supabase-js"

export const WTED_RADIO_CO_TRACKS_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests/tracks" as const

export const WTED_RADIO_IDS_PAGE_SIZE = 1000

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

/** Non-empty `artwork.large_url` from API, or null → caller should not change DB `artwork`. */
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

/** Image URL from `wted_radio_ids.artwork`, or null when unset/blank (use a local fallback in UI). */
export function wtedRadioIdsRowArtworkUrl(row: WtedRadioIdRow): string | null {
  return normalizedDbArtwork(row.artwork)
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

export type SyncWtedRadioIdsResult = {
  inserted: WtedRadioIdRow[]
  updatedToRemoved: WtedRadioIdRow[]
  updatedArtwork: WtedRadioIdRow[]
  updatedTitles: WtedRadioIdRow[]
}

/** Server-side implementation: `supabase/functions/_shared/wted-radio-ids-sync.ts` via `dpro-admin` action `wted_radio_ids_sync`. */
