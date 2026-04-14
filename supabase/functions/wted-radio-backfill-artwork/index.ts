import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import {
  computeReleaseArtworkOnly,
  fetchRadioCoLargeUrlByRadioId,
  normalizedArtworkUrl,
} from "../_shared/wted-radio-artwork-backfill-logic.ts"

const WTED_RADIO_IDS_PAGE_SIZE = 1000
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

/** `null` = no cap (entire table, one invocation). */
function parseMaxRows(raw: unknown): number | null {
  if (raw === undefined || raw === null) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
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

  const authHeader = req.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token)
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from("user_roles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (adminErr || !adminRow?.is_admin) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  let body: { max_rows?: unknown } = {}
  try {
    if (req.headers.get("content-length") !== "0") {
      body = await req.json()
    }
  } catch {
    body = {}
  }

  const maxRows = parseMaxRows(body.max_rows)

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

  let dbFrom = 0
  let dbExhausted = false
  let examined = 0
  let updated = 0
  const updateErrors: string[] = []

  while (!dbExhausted) {
    if (maxRows !== null && examined >= maxRows) {
      break
    }

    const { data, error } = await supabase
      .from("wted_radio_ids")
      .select("uuid, radio_id, artwork")
      .order("radio_id", { ascending: true })
      .range(dbFrom, dbFrom + WTED_RADIO_IDS_PAGE_SIZE - 1)

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

    const tasks: CatalogRow[] = []
    for (const row of chunk) {
      if (maxRows !== null && examined + tasks.length >= maxRows) {
        break
      }
      const rid = String(row.radio_id ?? "").trim()
      const curN = normalizedArtworkUrl(row.artwork)
      const apiN = apiMap.has(rid) ?
          normalizedArtworkUrl(apiMap.get(rid))
        : null

      // Radio.co gave a non-empty large_url → always evaluate (match = no DB write).
      // Otherwise only rows with empty artwork get release-chain backfill.
      const needsWork = Boolean(apiN) || curN === null
      if (!needsWork) continue
      tasks.push(row)
    }

    if (tasks.length > 0) {
      const computed = await runPool(
        tasks,
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

      examined += tasks.length
    }

    dbFrom += WTED_RADIO_IDS_PAGE_SIZE
    if (chunk.length < WTED_RADIO_IDS_PAGE_SIZE) {
      dbExhausted = true
    }

    if (maxRows !== null && examined >= maxRows) {
      break
    }
  }

  const cappedByLimit = maxRows !== null && !dbExhausted && examined >= maxRows

  return new Response(
    JSON.stringify({
      ok: true,
      radio_co_large_url_sync: true,
      empty_artwork_release_backfill: true,
      max_rows: maxRows,
      unlimited: maxRows === null,
      examined,
      updated,
      db_exhausted: dbExhausted,
      capped_by_limit: cappedByLimit,
      errors: updateErrors.slice(0, 20),
      error_count: updateErrors.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})
