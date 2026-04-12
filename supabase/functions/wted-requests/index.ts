import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const THIRTY_MINUTES_MS = 30 * 60 * 1000

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const authHeader = req.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(token)
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const since = new Date(Date.now() - THIRTY_MINUTES_MS).toISOString()

  const { data: requests, error: reqError } = await client
    .from("wted_requests")
    .select("id, radio_id, requested_at")
    .eq("user_id", user.id)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError || !requests || requests.length === 0) {
    return new Response(
      JSON.stringify({ requests: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const radioIds = [...new Set(requests.map((r) => String(r.radio_id)))]

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
    return new Response(
      JSON.stringify({ error: "Failed to fetch entry data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
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

  const showIds = [...new Set(
    (entryRows as EntryRow[]).map((e) => e.entry_show),
  )]

  const { data: shows, error: showsError } = await supabase
    .from("shows")
    .select("show_id, show_date, show_venue_location, show_group")
    .in("show_id", showIds)

  if (showsError || !shows) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch show data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const showMap = new Map(shows.map((s) => [s.show_id, s]))

  const { data: rsData, error: rsError } = await supabase
    .from("releases_shows")
    .select("show_id, release_id, release_order")
    .in("show_id", showIds)
    .order("release_order", { ascending: true })

  if (rsError || !rsData) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch release data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
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
    return new Response(
      JSON.stringify({ error: "Failed to fetch artwork" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const releaseMap = new Map(
    (releases as { release_id: string; release_artwork: string | null }[]).map(
      (r) => [r.release_id, r.release_artwork]
    )
  )

  const enriched = requests.map((r) => {
    const rid = String(r.radio_id)
    const list = byRadio.get(rid) ?? []
    const first = list[0]
    const show = first ? showMap.get(first.entry_show) : null
    const releaseId = first ? showToRelease.get(first.entry_show) : null
    const artwork = releaseId ? releaseMap.get(releaseId) ?? null : null

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

  return new Response(
    JSON.stringify({ requests: enriched }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
