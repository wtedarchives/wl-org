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
  /**
   * FK to shows.show_id. Drives tier-2 artwork in `wted_radio_ids_catalog`
   * (show -> lowest-release_order release -> release_artwork). Optional because
   * most read paths don't select it.
   */
  show_id?: string | null
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

/**
 * Result of `dpro-admin` action `wted_radio_ids_studio_crawl` — one bounded
 * range of Radio.co Studio pages. The admin panel loops until `done`.
 */
export type StudioCrawlChunkResult = {
  /** Rows actually inserted (ON CONFLICT DO NOTHING, so repeats insert 0). */
  inserted: number
  /** Existing rows given Radio.co custom artwork. */
  artwork_updated: number
  /**
   * Existing rows whose artwork was cleared because Radio.co has no custom art
   * for them — including the legacy release-artwork URLs the old backfill wrote.
   * Cleared rows fall through to tier-2 in `wted_radio_ids_catalog`.
   */
  artwork_cleared: number
  fetched: number
  total_pages: number
  total_items: number
  next_page: number | null
  done: boolean
}

/**
 * Result of `dpro-admin` action `wted_radio_ids_sync` — the reconcile pass that
 * sets `requestable` from the public feed and resolves PENDING rows.
 *
 * `abortedReason` is set when the safety guard tripped, in which case NOTHING
 * was written and every counter is zero.
 */
export type ReconcileWtedRadioIdsResult = {
  madeRequestable: number
  madeUnrequestable: number
  resolvedToNew: number
  resolvedToSkipped: number
  /** Previously-skipped tracks that became requestable and need show mapping. */
  requeuedToNew: number
  updatedToRemoved: WtedRadioIdRow[]
  updatedTitles: WtedRadioIdRow[]
  abortedReason?: string
}

/** Server-side implementation: `supabase/functions/_shared/wted-radio-ids-sync.ts` via `dpro-admin` action `wted_radio_ids_sync`. */
