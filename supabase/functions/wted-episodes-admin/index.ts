import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { getRadioCoSessionCookie, RADIO_CO_STUDIO_API_V1 } from "../_shared/radio-co-session.ts"

// ─── Constants ────────────────────────────────────────────────────────────────

const STATION_ID = "s3c11c85d6"
const STUDIO_PLAYLISTS_URL = `${RADIO_CO_STUDIO_API_V1}/stations/${STATION_ID}/playlists`
const DEFAULT_SHOW = "Unsorted"
const PAGE_SIZE = 1000
const WRITE_BATCH = 500
const SYNC_SELECT = "uuid, radio_id, episode, artwork, status, display_name, show, order, host"

// ─── Types ────────────────────────────────────────────────────────────────────

type EpisodeRow = {
  uuid: string
  radio_id: string
  episode: string
  artwork: string | null
  status: string | null
  display_name: string | null
  show: string
  order: number | null
  host: unknown
}

type Playlist = {
  id: number
  name: string
  artwork?: { large_url?: string | null } | null
}

// ─── JSON error helper ────────────────────────────────────────────────────────

function err(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token || null
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return err("Method not allowed", 405)

  /** Wysteria SSO JWT only — never verify the anon Supabase JWT in `Authorization`. */
  const token = bearerToken(req.headers.get("x-wysteria-authorization"))
  if (!token) return err("Missing Wysteria session", 401)

  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!jwtSecret || !supabaseUrl || !supabaseServiceKey) {
    return err("Server configuration error", 500)
  }

  let jwtPayload: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    jwtPayload = payload as Record<string, unknown>
  } catch {
    return err("Invalid or expired Wysteria session", 401)
  }

  if (!jwtPayload.is_admin) return err("Forbidden", 403)

  const db = createClient(supabaseUrl, supabaseServiceKey)

  // Parse action
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return err("Invalid request body", 400)
  }

  const action = body.action as string | undefined

  // ─── action: load ───────────────────────────────────────────────────────────
  // Returns all NEW and REMOVED rows from wted_episodes.

  if (action === "load") {
    const [newRes, removedRes] = await Promise.all([
      db.from("wted_episodes").select(SYNC_SELECT).eq("status", "NEW").order("radio_id", { ascending: true }),
      db.from("wted_episodes").select(SYNC_SELECT).eq("status", "REMOVED").order("radio_id", { ascending: true }),
    ])
    if (newRes.error) return err("Failed to load NEW episodes", 500, { detail: newRes.error.message })
    if (removedRes.error) return err("Failed to load REMOVED episodes", 500, { detail: removedRes.error.message })
    return ok({ newRows: newRes.data ?? [], removedRows: removedRes.data ?? [] })
  }

  // ─── action: sync ───────────────────────────────────────────────────────────
  // Fetches Radio.co Studio playlists and syncs against wted_episodes.

  if (action === "sync") {
    const radioEmail = Deno.env.get("RADIO_CO_EMAIL")
    const radioPassword = Deno.env.get("RADIO_CO_PASSWORD")
    if (!radioEmail || !radioPassword) return err("Server configuration error — missing Radio.co credentials", 500)

    let radioCookie: string
    try {
      radioCookie = await getRadioCoSessionCookie()
    } catch (e) {
      return err("Failed to authenticate with Radio.co", 502, { message: e instanceof Error ? e.message : String(e) })
    }

    const playlistsRes = await fetch(STUDIO_PLAYLISTS_URL, {
      headers: { Cookie: radioCookie, Accept: "application/json" },
    })
    if (!playlistsRes.ok) {
      return err(`Radio.co returned ${playlistsRes.status}`, 502, { detail: (await playlistsRes.text()).slice(0, 500) })
    }

    const playlistJson = await playlistsRes.json() as { playlists?: Playlist[] }
    const playlists: Playlist[] = Array.isArray(playlistJson.playlists) ? playlistJson.playlists : []
    if (playlists.length === 0) {
      return err(
        "Radio.co Studio returned zero playlists — refusing to mark episodes removed",
        502,
      )
    }
    const apiIdSet = new Set(playlists.map((p) => String(p.id)))

    // Fetch all wted_episodes with radio_id
    const allDb: EpisodeRow[] = []
    let from = 0
    for (;;) {
      const { data, error } = await db
        .from("wted_episodes")
        .select(SYNC_SELECT)
        .not("radio_id", "is", null)
        .order("radio_id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1)
      if (error) return err("Failed to read wted_episodes", 500, { detail: error.message })
      const chunk = (data ?? []) as EpisodeRow[]
      allDb.push(...chunk)
      if (chunk.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    const dbByRadioId = new Map(allDb.map((r) => [r.radio_id, r]))

    const toInsert = playlists
      .filter((p) => !dbByRadioId.has(String(p.id)))
      .map((p) => ({
        radio_id: String(p.id),
        episode: p.name,
        artwork: p.artwork?.large_url ?? null,
        status: "NEW",
        show: DEFAULT_SHOW,
      }))

    const toRemoveUuids = allDb
      .filter((r) => !apiIdSet.has(r.radio_id) && r.status !== "REMOVED" && r.status !== "skipped")
      .map((r) => r.uuid)

    const orphanRows = allDb.filter((r) => !apiIdSet.has(r.radio_id))

    const insertedRows: EpisodeRow[] = []
    for (let i = 0; i < toInsert.length; i += WRITE_BATCH) {
      const { data, error } = await db.from("wted_episodes").insert(toInsert.slice(i, i + WRITE_BATCH)).select(SYNC_SELECT)
      if (error) return err("Failed to insert new episodes", 500, { detail: error.message })
      if (data) insertedRows.push(...(data as EpisodeRow[]))
    }

    const updatedRows: EpisodeRow[] = []
    for (let i = 0; i < toRemoveUuids.length; i += WRITE_BATCH) {
      const { data, error } = await db.from("wted_episodes").update({ status: "REMOVED" }).in("uuid", toRemoveUuids.slice(i, i + WRITE_BATCH)).select(SYNC_SELECT)
      if (error) return err("Failed to update removed episodes", 500, { detail: error.message })
      if (data) updatedRows.push(...(data as EpisodeRow[]))
    }

    return ok({ inserted: insertedRows, updatedToRemoved: updatedRows, orphans: orphanRows })
  }

  // ─── action: update ─────────────────────────────────────────────────────────
  // Updates display fields on a single NEW episode row.

  if (action === "update") {
    const uuid = body.uuid as string | undefined
    const payload = body.payload as Record<string, unknown> | undefined
    if (!uuid || !payload) return err("Missing uuid or payload", 400)

    const { error } = await db
      .from("wted_episodes")
      .update({
        episode: payload.episode,
        display_name: payload.display_name,
        show: payload.show,
        order: payload.order,
        artwork: payload.artwork,
        host: payload.host,
        status: payload.status,
      })
      .eq("uuid", uuid)
      .eq("status", "NEW")

    if (error) return err("Failed to update episode", 500, { detail: error.message })
    return ok({ ok: true })
  }

  // ─── action: skip ───────────────────────────────────────────────────────────
  // Marks a single REMOVED episode as skipped.

  if (action === "skip") {
    const uuid = body.uuid as string | undefined
    if (!uuid) return err("Missing uuid", 400)

    const { error } = await db
      .from("wted_episodes")
      .update({ status: "skipped" })
      .eq("uuid", uuid)
      .eq("status", "REMOVED")

    if (error) return err("Failed to skip episode", 500, { detail: error.message })
    return ok({ ok: true })
  }

  // ─── action: delete ─────────────────────────────────────────────────────────
  // Deletes a wted_episodes row that Sync listed as missing from Studio.
  // Episode setlist entries that pointed at this radio_id are unlinked (SET NULL).

  if (action === "delete") {
    const uuid = body.uuid as string | undefined
    if (!uuid) return err("Missing uuid", 400)

    const { data, error } = await db
      .from("wted_episodes")
      .delete()
      .eq("uuid", uuid)
      .select("uuid")

    if (error) return err("Failed to delete episode", 500, { detail: error.message })
    if (!data?.length) return err("No matching episode.", 404)
    return ok({ ok: true })
  }

  return err(`Unknown action: ${action}`, 400)
})
