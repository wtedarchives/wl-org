/**
 * Recent WTED song requests.
 * GET: signed-in user (Wysteria token) or guest (x-wted-guest-authorization).
 * POST: merge this browser's guest rows from the last 60 minutes onto the profile.
 *        Same radio_id already on the account is dropped instead of duplicated.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"
import {
  WTED_REQUEST_WINDOW_MS,
  guestSigningKey,
  verifyGuestToken,
} from "../_shared/wted-guest.ts"

function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function profileIdFromToken(
  token: string,
  secret: Uint8Array,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const profileId = payload.profile_id
    if (typeof profileId !== "string" || profileId === "") return null
    return profileId
  } catch {
    return null
  }
}

type Identity = {
  profileId: string | null
  guestId: string | null
  hadGuestHeader: boolean
}

async function resolveIdentity(req: Request, jwtSecret: string): Promise<Identity | Response> {
  const secretKey = new TextEncoder().encode(jwtSecret)
  const wysteriaHeader = bearerToken(req.headers.get("x-wysteria-authorization"))
  let profileId: string | null = null
  if (wysteriaHeader) {
    profileId = await profileIdFromToken(wysteriaHeader, secretKey)
    if (!profileId) return json({ error: "Unauthorized" }, 401)
  } else {
    const authorization = bearerToken(req.headers.get("authorization"))
    if (authorization) {
      profileId = await profileIdFromToken(authorization, secretKey)
    }
  }

  const presented = bearerToken(req.headers.get("x-wted-guest-authorization"))
  let guestId: string | null = null
  if (presented) {
    guestId = await verifyGuestToken(presented, await guestSigningKey(jwtSecret))
  }

  return { profileId, guestId, hadGuestHeader: presented != null }
}

type SongRow = {
  song_displayname: string | null
  song: string | null
}

type EntryRow = {
  entry_id: string
  entry_song: string
  entry_short: string | null
  entry_set: string
  entry_setnum: number
  entry_show: string
  radio_id: string
  songs: SongRow | SongRow[] | null
}

type RequestRow = {
  id: string
  radio_id: string | null
  requested_at: string
}

function sortEntriesBySet(a: EntryRow, b: EntryRow): number {
  const setCmp = String(a.entry_set).localeCompare(String(b.entry_set), undefined, {
    numeric: true,
  })
  if (setCmp !== 0) return setCmp
  return a.entry_setnum - b.entry_setnum
}

function songFromRow(row: EntryRow): { song: string; song_displayname: string | null } {
  const songs = row.songs
  const single = Array.isArray(songs) ? songs[0] : songs
  return {
    song: single?.song?.trim() ?? row.entry_song,
    song_displayname: single?.song_displayname ?? null,
  }
}

function normalizedArtworkUrl(value: unknown): string | null {
  if (value == null || typeof value !== "string") return null
  const t = value.trim()
  return t === "" ? null : t
}

async function enrichRequests(
  supabase: SupabaseClient,
  requests: RequestRow[],
): Promise<Response> {
  const radioIds = [...new Set(requests.map((r) => String(r.radio_id ?? "")).filter(Boolean))]

  const { data: radioArtRows } = await supabase
    .from("wted_radio_ids")
    .select("radio_id, artwork")
    .in("radio_id", radioIds)

  const radioArtworkByRadioId = new Map<string, string>()
  for (const row of (radioArtRows ?? []) as {
    radio_id: string
    artwork: string | null
  }[]) {
    const art = normalizedArtworkUrl(row.artwork)
    if (art) radioArtworkByRadioId.set(String(row.radio_id), art)
  }

  const { data: entryRows, error: entriesError } = await supabase
    .from("setlist_entries")
    .select(
      `
      entry_id,
      entry_song,
      entry_short,
      entry_set,
      entry_setnum,
      entry_show,
      radio_id,
      songs ( song_displayname, song )
    `,
    )
    .in("radio_id", radioIds)

  if (entriesError || !entryRows) {
    return json({ error: "Failed to fetch entry data" }, 500)
  }

  const byRadio = new Map<string, EntryRow[]>()
  for (const row of entryRows as EntryRow[]) {
    const rid = String(row.radio_id ?? "")
    if (!rid) continue
    const list = byRadio.get(rid) ?? []
    list.push(row)
    byRadio.set(rid, list)
  }

  for (const [, list] of byRadio) {
    list.sort(sortEntriesBySet)
  }

  const showIds = [...new Set((entryRows as EntryRow[]).map((e) => e.entry_show))]

  const { data: shows, error: showsError } = await supabase
    .from("shows")
    .select("show_id, show_date, show_venue_location, show_group")
    .in("show_id", showIds)

  if (showsError || !shows) {
    return json({ error: "Failed to fetch show data" }, 500)
  }

  const showMap = new Map(shows.map((s) => [s.show_id, s]))

  const { data: rsData, error: rsError } = await supabase
    .from("releases_shows")
    .select("show_id, release_id, release_order")
    .in("show_id", showIds)
    .order("release_order", { ascending: true })

  if (rsError || !rsData) {
    return json({ error: "Failed to fetch release data" }, 500)
  }

  const showToRelease = new Map<string, string>()
  for (const row of rsData as { show_id: string; release_id: string }[]) {
    if (!showToRelease.has(row.show_id)) {
      showToRelease.set(row.show_id, row.release_id)
    }
  }

  const releaseIds = [...new Set(showToRelease.values())]
  const { data: releases, error: relError } = await supabase
    .from("releases")
    .select("release_id, release_artwork")
    .in("release_id", releaseIds)

  if (relError || !releases) {
    return json({ error: "Failed to fetch artwork" }, 500)
  }

  const releaseMap = new Map(
    (releases as { release_id: string; release_artwork: string | null }[]).map(
      (r) => [r.release_id, r.release_artwork],
    ),
  )

  const enriched = requests.map((r) => {
    const rid = String(r.radio_id ?? "")
    const list = byRadio.get(rid) ?? []
    const first = list[0]
    const show = first ? showMap.get(first.entry_show) : null
    const releaseId = first ? showToRelease.get(first.entry_show) : null
    const fromRelease = releaseId ? releaseMap.get(releaseId) ?? null : null
    const artwork = radioArtworkByRadioId.get(rid) ?? normalizedArtworkUrl(fromRelease)

    const segments = list.map((row) => {
      const s = songFromRow(row)
      return {
        song: s.song,
        song_displayname: s.song_displayname,
        entry_short: row.entry_short,
      }
    })

    return {
      id: r.id,
      radio_id: rid,
      requested_at: r.requested_at,
      segments,
      show_date: show?.show_date ?? "",
      show_venue_location: show?.show_venue_location ?? null,
      show_group: show?.show_group ?? null,
      release_artwork: artwork ?? null,
    }
  })

  return json({ requests: enriched })
}

async function mergeGuestRows(
  supabase: SupabaseClient,
  profileId: string,
  guestId: string,
): Promise<Response> {
  const since = new Date(Date.now() - WTED_REQUEST_WINDOW_MS).toISOString()

  const { data: guestRows, error: guestError } = await supabase
    .from("wted_requests")
    .select("id, radio_id")
    .eq("guest_id", guestId)
    .gte("requested_at", since)

  if (guestError) return json({ error: "Failed to merge requests" }, 500)

  const rows = guestRows ?? []
  if (rows.length === 0) return json({ success: true })

  const { data: userRows, error: userError } = await supabase
    .from("wted_requests")
    .select("radio_id")
    .eq("user_id", profileId)
    .gte("requested_at", since)

  if (userError) return json({ error: "Failed to merge requests" }, 500)

  const owned = new Set(
    (userRows ?? []).map((r) => (r.radio_id == null ? "" : String(r.radio_id))).filter(Boolean),
  )
  const toDelete: string[] = []
  const toClaim: string[] = []

  for (const row of rows) {
    const rid = row.radio_id == null ? "" : String(row.radio_id)
    if (rid && owned.has(rid)) {
      toDelete.push(row.id)
      continue
    }
    toClaim.push(row.id)
    if (rid) owned.add(rid)
  }

  if (toDelete.length > 0) {
    const { error } = await supabase.from("wted_requests").delete().in("id", toDelete)
    if (error) return json({ error: "Failed to merge requests" }, 500)
  }

  if (toClaim.length > 0) {
    const { error } = await supabase
      .from("wted_requests")
      .update({ user_id: profileId, guest_id: null })
      .in("id", toClaim)
    if (error) return json({ error: "Failed to merge requests" }, 500)
  }

  return json({ success: true })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return json({ error: "Server configuration error" }, 500)
  }

  const identity = await resolveIdentity(req, jwtSecret)
  if (identity instanceof Response) return identity

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (req.method === "POST") {
    if (!identity.profileId) return json({ error: "Unauthorized" }, 401)
    if (!identity.hadGuestHeader) return json({ error: "Missing guest token" }, 400)
    if (!identity.guestId) return json({ error: "Invalid guest token" }, 401)
    return mergeGuestRows(supabase, identity.profileId, identity.guestId)
  }

  if (!identity.profileId && !identity.guestId) {
    return json({ requests: [] })
  }

  const since = new Date(Date.now() - WTED_REQUEST_WINDOW_MS).toISOString()
  const column = identity.profileId ? "user_id" : "guest_id"
  const value = identity.profileId ?? identity.guestId

  const { data: requests, error: reqError } = await supabase
    .from("wted_requests")
    .select("id, radio_id, requested_at")
    .eq(column, value)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError || !requests || requests.length === 0) {
    return json({ requests: [] })
  }

  return enrichRequests(supabase, requests as RequestRow[])
})
