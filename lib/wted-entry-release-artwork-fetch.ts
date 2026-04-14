import type { SupabaseClient } from "@supabase/supabase-js"

import type { WtedRadioIdRow } from "@/lib/wted-radio-ids-sync"
import { resolveWtedRequestFromRadioId } from "@/lib/wted-resolve-radio-request-context"

const RELEASE_IN_CHUNK = 200
const PAGE_SIZE = 1000

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

type RsRow = {
  release_id: string
  release_order: number | null
}

async function fetchReleasesOnShow(
  client: SupabaseClient,
  showId: string,
  releaseIds: string[],
): Promise<RsRow[]> {
  if (releaseIds.length === 0) return []
  const out: RsRow[] = []
  for (const rChunk of chunk(releaseIds, RELEASE_IN_CHUNK)) {
    let page = 0
    let more = true
    while (more) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await client
        .from("releases_shows")
        .select("release_id, release_order")
        .eq("show_id", showId)
        .in("release_id", rChunk)
        .range(from, to)
      if (error) throw error
      const rows = (data ?? []) as RsRow[]
      out.push(...rows)
      more = rows.length === PAGE_SIZE
      page++
    }
  }
  return out
}

function mergeByReleaseIdMinOrder(rows: RsRow[]): RsRow[] {
  const m = new Map<string, RsRow>()
  for (const r of rows) {
    const prev = m.get(r.release_id)
    const o = r.release_order ?? Number.POSITIVE_INFINITY
    const po = prev?.release_order ?? Number.POSITIVE_INFINITY
    if (!prev || o < po) m.set(r.release_id, r)
  }
  return [...m.values()]
}

function pickLowestOrderAmongReleases(rows: RsRow[]): RsRow | null {
  const merged = mergeByReleaseIdMinOrder(rows)
  if (merged.length === 0) return null
  const scored = merged.map((r) => ({
    row: r,
    order: r.release_order ?? Number.POSITIVE_INFINITY,
  }))
  scored.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.row.release_id.localeCompare(b.row.release_id)
  })
  return scored[0]!.row
}

function normalizedArtworkUrl(value: unknown): string | null {
  if (value == null || typeof value !== "string") return null
  const t = value.trim()
  return t === "" ? null : t
}

/**
 * Same resolution as `useWtedEntryReleaseArtwork` / the WTED request drawer:
 * `wted_radio_ids.artwork` by `radio_id`, else `setlist_entry_media` → `releases_shows` → `releases.release_artwork`,
 * else `fallbackReleaseArtwork`.
 */
export async function fetchWtedEntryReleaseArtwork(
  client: SupabaseClient,
  entryId: string,
  entryShow: string,
  radioId: string | null | undefined,
  fallbackReleaseArtwork: string | null,
): Promise<string | null> {
  const fb = normalizedArtworkUrl(fallbackReleaseArtwork)
  try {
    if (radioId) {
      const { data: radioRow, error: radioErr } = await client
        .from("wted_radio_ids")
        .select("artwork")
        .eq("radio_id", String(radioId))
        .maybeSingle()
      if (radioErr) throw radioErr
      const fromRadio = normalizedArtworkUrl(
        (radioRow as { artwork?: string | null } | null)?.artwork,
      )
      if (fromRadio) return fromRadio
    }

    const { data: semRows, error: semErr } = await client
      .from("setlist_entry_media")
      .select("release_id")
      .eq("setlist_entry_id", entryId)

    if (semErr) throw semErr
    const releaseIds = [
      ...new Set(
        (semRows ?? []).map((r: { release_id: string }) => r.release_id),
      ),
    ]

    if (releaseIds.length === 0) return fb

    const onShow = await fetchReleasesOnShow(client, entryShow, releaseIds)

    const winner = pickLowestOrderAmongReleases(onShow)
    if (!winner) return fb

    const { data: rel, error: rErr } = await client
      .from("releases")
      .select("release_artwork")
      .eq("release_id", winner.release_id)
      .maybeSingle()

    if (rErr) throw rErr
    const art =
      (rel as { release_artwork: string | null } | null)?.release_artwork ??
      null
    return normalizedArtworkUrl(art) ?? fb
  } catch {
    return fb
  }
}

/**
 * Catalog list: prefer `row.artwork` from `wted_radio_ids`; if missing, resolve a setlist
 * anchor for this `radio_id` and use the same artwork chain as the drawer.
 */
export async function fetchWtedCatalogRowDisplayArtwork(
  client: SupabaseClient,
  row: WtedRadioIdRow,
): Promise<string | null> {
  const direct = normalizedArtworkUrl(row.artwork)
  if (direct) return direct

  const resolved = await resolveWtedRequestFromRadioId(client, row.radio_id, null)
  if (!resolved) return null

  return fetchWtedEntryReleaseArtwork(
    client,
    resolved.entry.entry_id,
    resolved.entry.entry_show,
    resolved.entry.radio_id,
    null,
  )
}
