/**
 * Mirrors `lib/wted-radio-ids-sync.ts` for Deno Edge Functions — keep logic in sync.
 *
 * Two Radio.co sources, deliberately kept separate:
 *
 *   PUBLIC feed  — 6,435 tracks. The ONLY source of truth for `requestable`.
 *                  Unauthenticated, single request, no pagination.
 *   STUDIO API   — 8,808 tracks. Full station inventory: a strict superset that
 *                  also carries commentary, intros, set breaks, bumpers and
 *                  station IDs. Authenticated, 177 pages of 50, page size fixed.
 *
 * The Studio crawl decides what EXISTS; the public feed decides what can be
 * REQUESTED. Studio-only tracks are needed for wted_user_playlist_items but must
 * never surface in the request modal, which filters on `requestable = true`.
 *
 * The work splits into two independently resumable halves so neither can blow
 * the edge-function wall clock:
 *
 *   1. crawlStudioTracksChunk + insertStudioTracks — paged, idempotent inserts.
 *      Safe to run in any order, any number of times, over any page range.
 *   2. reconcileWtedRadioIds — one cheap public-feed fetch, then sets
 *      `requestable`, resolves PENDING rows to NEW, and marks REMOVED.
 *
 * Only (2) needs a complete picture, and it gets that from the DB plus one small
 * request — never from the crawl. That is what makes chunking safe.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { RADIO_CO_STUDIO_API_V1 } from "./radio-co-session.ts"

export const WTED_RADIO_CO_STATION_ID = "s3c11c85d6"

export const WTED_RADIO_CO_TRACKS_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests/tracks" as const

export const WTED_RADIO_CO_STUDIO_TRACKS_URL =
  `${RADIO_CO_STUDIO_API_V1}/stations/${WTED_RADIO_CO_STATION_ID}/tracks` as const

export const WTED_RADIO_IDS_PAGE_SIZE = 1000
export const WTED_RADIO_IDS_WRITE_BATCH = 500

/** Studio's page size is fixed server-side; `per_page`/`limit` are NOT supported. */
export const WTED_RADIO_CO_STUDIO_PAGE_SIZE = 50
/** Measured safe: 10 concurrent got connection-reset, 6 completed 177 pages clean. */
export const WTED_RADIO_CO_STUDIO_CONCURRENCY = 6
/** Default pages per invocation. The client shrinks this if it hits HTTP 546. */
export const WTED_RADIO_CO_STUDIO_CHUNK_PAGES = 60

/**
 * Transient status for a freshly-inserted Studio track, before the public feed
 * has classified it. Never shown in the admin panel (which reads NEW/REMOVED)
 * and never requestable, so an interrupted crawl leaves rows invisible rather
 * than wrong. `reconcileWtedRadioIds` converts every PENDING row to NEW and
 * sets `requestable` from the public feed. Using a distinct value — rather
 * than inserting as NEW directly — is what lets reconcile tell "just arrived"
 * from "admin already dispositioned this as skipped", so we never resurrect a
 * skipped row into the NEW queue. `skipped` is an admin decision, never an
 * automatic default for studio-only tracks (live recordings, bumpers, IDs).
 */
export const WTED_RADIO_ID_STATUS_PENDING = "PENDING"

/**
 * Abort the reconcile if more than this share of currently-requestable rows
 * would flip to non-requestable in a single run.
 *
 * The public feed has no pagination and no envelope we can length-check, so a
 * truncated-but-valid-looking response is indistinguishable from a genuine mass
 * removal. Since `requestable` gates a live, public request list, failing loudly
 * beats silently emptying it. Override with `allowLargeRemoval` once a human has
 * confirmed the drop is real.
 */
export const WTED_RADIO_IDS_MAX_REMOVAL_RATIO = 0.1

export type WtedRadioIdRow = {
  uuid: string
  radio_id: string
  track_artist: string | null
  track_title: string | null
  status: string | null
  artwork: string | null
  requestable: boolean | null
}

export const WTED_RADIO_IDS_SELECT =
  "uuid, radio_id, track_artist, track_title, status, artwork, requestable" as const

export type RadioCoApiTrack = {
  id: number
  artist: string
  title: string
  artwork?: {
    /**
     * Studio API only — the public requests feed omits this field entirely.
     *   'custom'   art someone uploaded to Radio.co (images.radio.co)
     *   'default'  Radio.co's automatic iTunes match (mzstatic) — NOT curated
     *   'disabled' artwork switched off
     */
    type?: string | null
    url?: string | null
    large_url?: string | null
  } | null
}

/**
 * Tier-1 artwork: ONLY art deliberately uploaded to Radio.co.
 *
 * `type = 'default'` entries carry an automatic iTunes match. Those are worse
 * than the curated release artwork the catalog view resolves in tier 2, so they
 * are deliberately treated as "no artwork" and left to fall through.
 *
 * Returns null when there is no custom art — callers use that to CLEAR a stale
 * value, so the column mirrors Radio.co exactly rather than drifting.
 *
 * Only meaningful on Studio API tracks: the public feed has no `type`, so every
 * track there looks non-custom. Never call this with public-feed data.
 */
export function customArtworkUrlFromTrack(t: RadioCoApiTrack): string | null {
  if (t.artwork?.type !== "custom") return null
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

function nonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

type RadioCoApiResponse = {
  tracks: RadioCoApiTrack[]
}

/** The public requests feed: every track a listener is allowed to request. */
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

// ─── Studio crawl ────────────────────────────────────────────────────────────

type StudioPagination = {
  current_page: number
  total_pages: number
  total_items: number
  per_page: number
  next_page?: number
  prev_page?: number
}

type StudioPageResponse = {
  tracks?: RadioCoApiTrack[]
  meta?: { pagination?: StudioPagination }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await fn(items[index])
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Fetch one Studio page.
 *
 * Studio answers an unrecognised query param with HTTP 200 and `{"tracks":[]}`
 * — no error, no `meta`. Treating that as "the station is empty" would let the
 * reconcile mark the entire catalog REMOVED, so a missing `meta.pagination` is
 * a hard failure here rather than an empty result.
 */
async function fetchStudioPage(
  cookie: string,
  page: number,
  attempt = 0,
): Promise<{ tracks: RadioCoApiTrack[]; pagination: StudioPagination }> {
  const url =
    `${WTED_RADIO_CO_STUDIO_TRACKS_URL}?order=desc&order_by=id&page=${page}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: { Cookie: cookie, Accept: "application/json, text/plain, */*" },
    })
  } catch (e) {
    // Cloudflare resets connections under load; back off and retry.
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt))
      return fetchStudioPage(cookie, page, attempt + 1)
    }
    throw new Error(
      `Radio.co Studio page ${page} failed: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (res.status === 429 || res.status >= 500) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt))
      return fetchStudioPage(cookie, page, attempt + 1)
    }
  }
  if (!res.ok) {
    throw new Error(
      `Radio.co Studio returned ${res.status} for page ${page}: ${(await res.text()).slice(0, 200)}`,
    )
  }

  const json = (await res.json()) as StudioPageResponse
  const pagination = json.meta?.pagination
  if (!pagination || typeof pagination.total_items !== "number") {
    throw new Error(
      `Radio.co Studio page ${page} returned no meta.pagination — refusing to treat as empty`,
    )
  }
  if (!Array.isArray(json.tracks)) {
    throw new Error(`Radio.co Studio page ${page} returned no tracks array`)
  }
  return { tracks: json.tracks, pagination }
}

export type StudioCrawlChunk = {
  tracks: RadioCoApiTrack[]
  totalPages: number
  totalItems: number
  /** Next page to request, or null when the crawl is complete. */
  nextPage: number | null
}

/**
 * Crawl a bounded range of Studio pages. Bounded rather than exhaustive so one
 * invocation can never exceed the wall clock; the caller loops until nextPage
 * is null.
 */
export async function crawlStudioTracksChunk(
  cookie: string,
  startPage = 1,
  pageCount = WTED_RADIO_CO_STUDIO_CHUNK_PAGES,
): Promise<StudioCrawlChunk> {
  if (startPage < 1) throw new Error("startPage must be >= 1")
  if (pageCount < 1) throw new Error("pageCount must be >= 1")

  const first = await fetchStudioPage(cookie, startPage)
  const { total_pages: totalPages, total_items: totalItems } = first.pagination

  const lastPage = Math.min(startPage + pageCount - 1, totalPages)
  const remaining: number[] = []
  for (let p = startPage + 1; p <= lastPage; p++) remaining.push(p)

  const pages = await mapWithConcurrency(
    remaining,
    WTED_RADIO_CO_STUDIO_CONCURRENCY,
    (p) => fetchStudioPage(cookie, p),
  )

  const tracks = [...first.tracks]
  for (const page of pages) tracks.push(...page.tracks)

  return {
    tracks,
    totalPages,
    totalItems,
    nextPage: lastPage < totalPages ? lastPage + 1 : null,
  }
}

/**
 * Insert Studio tracks that aren't in the catalog yet.
 *
 * `radio_id` is the primary key, so ON CONFLICT DO NOTHING makes this idempotent
 * — chunks may overlap, repeat or arrive out of order without duplicating rows
 * or clobbering admin dispositions on existing ones.
 *
 * Everything lands non-requestable and PENDING. `reconcileWtedRadioIds` is the
 * only thing that ever grants `requestable`, so a partial crawl can't leak a
 * bumper into the request modal.
 */
export async function insertStudioTracks(
  client: SupabaseClient,
  tracks: RadioCoApiTrack[],
): Promise<{ inserted: number; artworkUpdated: number; artworkCleared: number }> {
  if (tracks.length === 0) {
    return { inserted: 0, artworkUpdated: 0, artworkCleared: 0 }
  }

  // track_artist / track_title are NOT NULL in the live schema.
  const rows = tracks.map((t) => ({
    radio_id: String(t.id),
    track_artist: nonEmpty(t.artist) ?? "Unknown",
    track_title: nonEmpty(t.title) ?? "Untitled",
    status: WTED_RADIO_ID_STATUS_PENDING,
    artwork: customArtworkUrlFromTrack(t),
    requestable: false,
  }))

  let inserted = 0
  for (let i = 0; i < rows.length; i += WTED_RADIO_IDS_WRITE_BATCH) {
    const batch = rows.slice(i, i + WTED_RADIO_IDS_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_radio_ids")
      .upsert(batch, { onConflict: "radio_id", ignoreDuplicates: true })
      .select("radio_id")
    if (error) throw error
    inserted += data?.length ?? 0
  }

  // The crawl is the ONLY place artwork is written, because `artwork.type` only
  // exists on the Studio API — the reconcile pass literally cannot tell curated
  // art from an iTunes auto-match, so it must not touch this column.
  //
  // Existing rows are brought in line with Radio.co in both directions: custom
  // art is stored, and anything else is CLEARED so the catalog view falls
  // through to tier-2 release artwork. Clearing is what retires the legacy
  // release-artwork values the old backfill wrote into this column.
  const desiredByRadioId = new Map(
    tracks.map((t) => [String(t.id), customArtworkUrlFromTrack(t)]),
  )
  const ids = [...desiredByRadioId.keys()]

  const needsUrl = new Map<string, string[]>()
  const needsClear: string[] = []

  for (let i = 0; i < ids.length; i += WTED_RADIO_IDS_WRITE_BATCH) {
    const batch = ids.slice(i, i + WTED_RADIO_IDS_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_radio_ids")
      .select("radio_id, artwork")
      .in("radio_id", batch)
    if (error) throw error
    for (const row of (data ?? []) as { radio_id: string; artwork: string | null }[]) {
      const desired = desiredByRadioId.get(String(row.radio_id)) ?? null
      const current = normalizedDbArtwork(row.artwork)
      if (desired === current) continue
      if (desired === null) needsClear.push(String(row.radio_id))
      else {
        const group = needsUrl.get(desired)
        if (group) group.push(String(row.radio_id))
        else needsUrl.set(desired, [String(row.radio_id)])
      }
    }
  }

  let artworkUpdated = 0
  // Grouped by URL so each distinct image is one statement, not one per row.
  for (const [url, groupIds] of needsUrl) {
    artworkUpdated += await updateIn(client, groupIds, { artwork: url })
  }
  const artworkCleared = await updateIn(client, needsClear, { artwork: null })

  return { inserted, artworkUpdated, artworkCleared }
}

// ─── Reconcile ───────────────────────────────────────────────────────────────

export async function fetchAllWtedRadioIds(
  client: SupabaseClient,
): Promise<WtedRadioIdRow[]> {
  const acc: WtedRadioIdRow[] = []
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("wted_radio_ids")
      .select(WTED_RADIO_IDS_SELECT)
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

export type ReconcileWtedRadioIdsResult = {
  /** Rows granted `requestable` (includes first-time classification). */
  madeRequestable: number
  /** Rows that lost `requestable`. */
  madeUnrequestable: number
  /** PENDING rows resolved into the NEW admin queue. */
  resolvedToNew: number
  /** Always 0 — PENDING rows are never auto-skipped. Kept for the admin banner. */
  resolvedToSkipped: number
  /** Previously-skipped rows that became requestable and need show mapping. */
  requeuedToNew: number
  updatedToRemoved: WtedRadioIdRow[]
  updatedTitles: WtedRadioIdRow[]
  /** Set when the removal guard tripped; nothing was written. */
  abortedReason?: string
}

async function updateIn(
  client: SupabaseClient,
  radioIds: string[],
  patch: Record<string, unknown>,
): Promise<number> {
  let changed = 0
  for (let i = 0; i < radioIds.length; i += WTED_RADIO_IDS_WRITE_BATCH) {
    const batch = radioIds.slice(i, i + WTED_RADIO_IDS_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_radio_ids")
      .update(patch)
      .in("radio_id", batch)
      .select("radio_id")
    if (error) throw error
    changed += data?.length ?? 0
  }
  return changed
}

/**
 * Set `requestable` from the public feed, resolve PENDING rows to NEW, and mark
 * tracks that left the requestable list as REMOVED.
 *
 * Cheap by design — one public-feed request plus a full table read — so it fits
 * comfortably in one invocation regardless of how the Studio crawl was chunked.
 */
export async function reconcileWtedRadioIds(
  client: SupabaseClient,
  options: { allowLargeRemoval?: boolean } = {},
): Promise<ReconcileWtedRadioIdsResult> {
  const publicTracks = await fetchRadioCoRequestTracks()
  if (publicTracks.length === 0) {
    throw new Error(
      "Radio.co public request feed returned zero tracks — refusing to mark the catalog unrequestable",
    )
  }

  const publicById = new Map(publicTracks.map((t) => [String(t.id), t]))
  const allDb = await fetchAllWtedRadioIds(client)

  const toRequestable: string[] = []
  const toUnrequestable: string[] = []
  for (const row of allDb) {
    const shouldBeRequestable = publicById.has(row.radio_id)
    if (shouldBeRequestable === (row.requestable === true)) continue
    if (shouldBeRequestable) toRequestable.push(row.radio_id)
    else toUnrequestable.push(row.radio_id)
  }

  // Guard before ANY write: a truncated public feed looks identical to a real
  // mass removal, and this column gates a live public list.
  const currentlyRequestable = allDb.filter((r) => r.requestable === true).length
  const removalRatio =
    currentlyRequestable === 0 ? 0 : toUnrequestable.length / currentlyRequestable
  if (
    !options.allowLargeRemoval &&
    removalRatio > WTED_RADIO_IDS_MAX_REMOVAL_RATIO
  ) {
    return {
      madeRequestable: 0,
      madeUnrequestable: 0,
      resolvedToNew: 0,
      resolvedToSkipped: 0,
      requeuedToNew: 0,
      updatedToRemoved: [],
      updatedTitles: [],
      abortedReason:
        `Aborted: ${toUnrequestable.length} of ${currentlyRequestable} requestable tracks ` +
        `(${Math.round(removalRatio * 100)}%) would be hidden, over the ` +
        `${Math.round(WTED_RADIO_IDS_MAX_REMOVAL_RATIO * 100)}% safety limit. ` +
        `Radio.co may have returned a partial list. Nothing was changed — re-run with ` +
        `allow_large_removal once you've confirmed the drop is real.`,
    }
  }

  // Rows that were requestable and no longer are enter the admin REMOVED queue,
  // preserving the pre-Studio meaning of REMOVED. Rows already dispositioned
  // (skipped/REMOVED) and never-classified PENDING rows are left alone.
  const removalCandidates = new Set(toUnrequestable)
  const toRemoveIds = allDb
    .filter(
      (r) =>
        removalCandidates.has(r.radio_id) &&
        r.status !== "REMOVED" &&
        r.status !== "skipped" &&
        r.status !== WTED_RADIO_ID_STATUS_PENDING,
    )
    .map((r) => r.radio_id)

  // Every freshly-crawled track goes to NEW for admin review. `requestable` is
  // a separate flag (public feed only) — studio-only live recordings must still
  // appear in the queue so they can be linked to a show. Auto-skipping anything
  // not in the request feed was dumping those into skipped.
  const pendingToNew = allDb
    .filter((r) => r.status === WTED_RADIO_ID_STATUS_PENDING)
    .map((r) => r.radio_id)

  /**
   * A track that BECOMES requestable this run while sitting in `skipped` goes
   * back into the NEW queue: it is now listener-facing but was never linked to a
   * show, so without review it renders with no artwork (no show_id → no tier-2
   * release art) and nothing would ever prompt anyone to map it.
   *
   * Keyed on the false→true TRANSITION, not on the state `requestable && skipped`.
   * A state-based rule would re-queue every admin-skipped requestable track on
   * every single sync, endlessly overriding a deliberate "reviewed, not linking
   * this" decision. Transition-based fires exactly once per change.
   */
  const becomingRequestable = new Set(toRequestable)
  const requeueFromSkipped = allDb
    .filter((r) => becomingRequestable.has(r.radio_id) && r.status === "skipped")
    .map((r) => r.radio_id)

  // Title/artist drift for requestable tracks. Artwork is deliberately NOT
  // touched here: the public feed carries no `artwork.type`, so this pass cannot
  // tell curated custom art from an iTunes auto-match and would keep
  // re-introducing the latter. `insertStudioTracks` owns the artwork column.
  const toUpdateInfo: {
    uuid: string
    track_title: string
    track_artist: string
  }[] = []
  for (const row of allDb) {
    const t = publicById.get(row.radio_id)
    if (!t) continue
    if (row.track_title !== t.title || row.track_artist !== t.artist) {
      toUpdateInfo.push({
        uuid: row.uuid,
        track_title: t.title,
        track_artist: t.artist,
      })
    }
  }

  const madeRequestable = await updateIn(client, toRequestable, {
    requestable: true,
  })
  const madeUnrequestable = await updateIn(client, toUnrequestable, {
    requestable: false,
  })
  const resolvedToNew = await updateIn(client, pendingToNew, { status: "NEW" })
  const requeuedToNew = await updateIn(client, requeueFromSkipped, {
    status: "NEW",
  })

  const updatedRows: WtedRadioIdRow[] = []
  for (let i = 0; i < toRemoveIds.length; i += WTED_RADIO_IDS_WRITE_BATCH) {
    const batch = toRemoveIds.slice(i, i + WTED_RADIO_IDS_WRITE_BATCH)
    const { data, error } = await client
      .from("wted_radio_ids")
      .update({ status: "REMOVED" })
      .in("radio_id", batch)
      .select(WTED_RADIO_IDS_SELECT)
    if (error) throw error
    if (data) updatedRows.push(...(data as WtedRadioIdRow[]))
  }

  const updatedTitles: WtedRadioIdRow[] = []
  for (
    let i = 0;
    i < toUpdateInfo.length;
    i += WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY
  ) {
    const slice = toUpdateInfo.slice(
      i,
      i + WTED_RADIO_IDS_ARTWORK_UPDATE_CONCURRENCY,
    )
    const results = await Promise.all(
      slice.map(async ({ uuid, track_title, track_artist }) => {
        const { data, error } = await client
          .from("wted_radio_ids")
          .update({ track_title, track_artist })
          .eq("uuid", uuid)
          .select(WTED_RADIO_IDS_SELECT)
        if (error) throw error
        return (data?.[0] as WtedRadioIdRow | undefined) ?? null
      }),
    )
    for (const r of results) if (r) updatedTitles.push(r)
  }

  return {
    madeRequestable,
    madeUnrequestable,
    resolvedToNew,
    resolvedToSkipped: 0,
    requeuedToNew,
    updatedToRemoved: updatedRows,
    updatedTitles,
  }
}
