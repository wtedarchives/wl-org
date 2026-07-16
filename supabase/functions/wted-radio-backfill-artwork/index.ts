import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"
import {
  computeReleaseArtworkOnly,
  fetchRadioCoLargeUrlByRadioId,
  normalizedArtworkUrl,
} from "../_shared/wted-radio-artwork-backfill-logic.ts"

const DEFAULT_PAGE_SIZE = 100
const DEFAULT_FLUSH_EVERY = 25
/** Keep modest to reduce memory (546 WORKER_LIMIT on large batches). */
const COMPUTE_CONCURRENCY = 3
const UPDATE_CONCURRENCY = 8

type CatalogRow = {
  uuid: string
  radio_id: string
  artwork: string | null
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  async function worker() {
    for (;;) {
      const i = nextIndex++
      if (i >= items.length) break
      results[i] = await fn(items[i]!, i)
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

/** `null` = no cap (read the entire table in one invocation). */
function parseMaxRows(raw: unknown): number | null {
  if (raw === undefined || raw === null) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

function parseClampedInt(
  raw: unknown,
  defaultVal: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw === null) return defaultVal
  const n = Number(raw)
  if (!Number.isFinite(n)) return defaultVal
  return Math.max(min, Math.min(max, Math.floor(n)))
}

/**
 * With `verify_jwt = true`, the gateway expects a Supabase JWT in `Authorization`.
 * Wysteria admin tokens must be sent in `x-wysteria-authorization` (see `lib/dpro-admin-edge.ts`).
 * If absent, fall back to `Authorization` (e.g. `verify_jwt = false` or tooling).
 */
function getWysteriaJwt(req: Request): string | null {
  const fromHeader = req.headers.get("x-wysteria-authorization")
  if (fromHeader?.startsWith("Bearer ")) return fromHeader.slice(7).trim() || null
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null
  return null
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  const token = getWysteriaJwt(req)
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!jwtSecret) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  let jwtPayload: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    jwtPayload = payload as Record<string, unknown>
  } catch {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  if (!jwtPayload.is_admin) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  let body: {
    max_rows?: unknown
    page_size?: unknown
    flush_every?: unknown
    revalidate_existing?: unknown
    start_after_uuid?: unknown
  } = {}
  try {
    if (req.headers.get("content-length") !== "0") {
      body = await req.json()
    }
  } catch {
    body = {}
  }

  const maxRows = parseMaxRows(body.max_rows)
  const pageSize = parseClampedInt(body.page_size, DEFAULT_PAGE_SIZE, 10, 1000)
  const flushEvery = parseClampedInt(
    body.flush_every,
    DEFAULT_FLUSH_EVERY,
    1,
    500,
  )
  // Opt-in full re-verify: recompute EVERY row (not just empty ones) so rows
  // whose `releases.release_artwork` changed in the DB get corrected. Heavier
  // (each release-sourced row runs the setlist→release chain), so it is far
  // more likely to hit 546 on a full catalog — pair with `max_rows` + the
  // `start_after_uuid` cursor so the client can sweep the table in chunks.
  const revalidateExisting = body.revalidate_existing === true

  // Resume cursor: process only rows whose `uuid` sorts after this value.
  // `uuid` (the primary key) is used instead of `radio_id` so the cursor is
  // guaranteed unique and cannot skip rows at a page boundary. `null` starts
  // from the beginning of the table.
  const startAfterUuid =
    typeof body.start_after_uuid === "string" &&
    body.start_after_uuid.trim() !== ""
      ? body.start_after_uuid.trim()
      : null

  let apiMap: Map<string, string | null>
  try {
    apiMap = await fetchRadioCoLargeUrlByRadioId()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Radio.co fetch failed"
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  let dbExhausted = false
  let read = 0
  let examined = 0
  let updated = 0
  let lastUuid: string | null = startAfterUuid
  const updateErrors: string[] = []

  // Pure keyset pagination on `uuid`: every page reads the next `thisPage` rows
  // *after* `lastUuid` (never an absolute offset), so advancing the cursor is
  // the only forward mechanism — within and across invocations alike. `maxRows`
  // caps the number of rows READ this invocation (not just the ones that needed
  // work), so a caller can bound worker time and resume via `start_after_uuid`.
  // Each read row is fully processed (no partial-page skipping), so `lastUuid`
  // is always a safe resume point.
  while (!dbExhausted) {
    if (maxRows !== null && read >= maxRows) break

    const remaining = maxRows !== null ? maxRows - read : pageSize
    const thisPage = Math.max(1, Math.min(pageSize, remaining))

    let query = supabase
      .from("wted_radio_ids")
      .select("uuid, radio_id, artwork")
      .order("uuid", { ascending: true })
    if (lastUuid !== null) query = query.gt("uuid", lastUuid)

    const { data, error } = await query.range(0, thisPage - 1)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const chunk = (data ?? []) as CatalogRow[]
    if (chunk.length === 0) {
      dbExhausted = true
      break
    }

    read += chunk.length

    const tasks: CatalogRow[] = []
    for (const row of chunk) {
      const rid = String(row.radio_id ?? "").trim()
      const curN = normalizedArtworkUrl(row.artwork)
      const apiN = apiMap.has(rid) ?
          normalizedArtworkUrl(apiMap.get(rid))
        : null

      // Radio.co gave a non-empty large_url → always evaluate (match = no DB write).
      // Otherwise only rows with empty artwork get release-chain backfill,
      // unless `revalidate_existing` forces every row to be re-derived so
      // stale release-artwork URLs on already-filled rows get corrected.
      const needsWork = revalidateExisting || Boolean(apiN) || curN === null
      if (!needsWork) continue
      tasks.push(row)
    }

    for (let ti = 0; ti < tasks.length; ti += flushEvery) {
      const slice = tasks.slice(ti, ti + flushEvery)

      const computed = await runPool(
        slice,
        COMPUTE_CONCURRENCY,
        async (row) => {
          const rid = String(row.radio_id ?? "").trim()
          const apiN = apiMap.has(rid) ?
              normalizedArtworkUrl(apiMap.get(rid))
            : null
          const next = apiN ?
              apiN
            : await computeReleaseArtworkOnly(supabase, rid)
          return { row, next }
        },
      )

      const toUpdate: { uuid: string; radio_id: string; nextN: string | null }[] =
        []
      for (const { row, next } of computed) {
        const curN = normalizedArtworkUrl(row.artwork)
        const nextN = normalizedArtworkUrl(next)
        if (curN === nextN) continue
        toUpdate.push({ uuid: row.uuid, radio_id: row.radio_id, nextN })
      }

      const updateResults = await runPool(
        toUpdate,
        UPDATE_CONCURRENCY,
        async ({ uuid, radio_id, nextN }) => {
          const { error: upErr } = await supabase
            .from("wted_radio_ids")
            .update({ artwork: nextN })
            .eq("uuid", uuid)
          if (upErr) return { ok: false as const, radio_id, msg: upErr.message }
          return { ok: true as const }
        },
      )

      for (const r of updateResults) {
        if (r.ok) updated++
        else updateErrors.push(`${r.radio_id}: ${r.msg}`)
      }
    }

    examined += chunk.length
    lastUuid = chunk[chunk.length - 1]!.uuid

    if (chunk.length < thisPage) {
      dbExhausted = true
    }
  }

  const cappedByLimit = maxRows !== null && !dbExhausted && read >= maxRows
  const nextCursor = dbExhausted ? null : lastUuid

  return new Response(
    JSON.stringify({
      ok: true,
      radio_co_large_url_sync: true,
      empty_artwork_release_backfill: true,
      revalidate_existing: revalidateExisting,
      max_rows: maxRows,
      page_size: pageSize,
      flush_every: flushEvery,
      unlimited: maxRows === null,
      examined,
      updated,
      db_exhausted: dbExhausted,
      done: dbExhausted,
      next_cursor: nextCursor,
      capped_by_limit: cappedByLimit,
      errors: updateErrors.slice(0, 20),
      error_count: updateErrors.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})
