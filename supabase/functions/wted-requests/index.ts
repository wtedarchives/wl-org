import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const THIRTY_MINUTES_MS = 30 * 60 * 1000

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
    .select("id, entry_id, requested_at")
    .eq("user_id", user.id)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError || !requests || requests.length === 0) {
    return new Response(
      JSON.stringify({ requests: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const entryIds = requests.map((r) => r.entry_id)

  const { data: entries, error: entriesError } = await supabase
    .from("setlist_entries")
    .select(
      `
      entry_id,
      entry_song,
      entry_short,
      entry_show,
      radio_id
    `
    )
    .in("entry_id", entryIds)

  if (entriesError || !entries) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch entry data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const entryMap = new Map(entries.map((e) => [e.entry_id, e]))
  const showIds = [...new Set(entries.map((e) => e.entry_show))]

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
    const entry = entryMap.get(r.entry_id)
    const show = entry ? showMap.get(entry.entry_show) : null
    const releaseId = entry ? showToRelease.get(entry.entry_show) : null
    const artwork = releaseId ? releaseMap.get(releaseId) ?? null : null

    return {
      id: r.id,
      entry_id: r.entry_id,
      requested_at: r.requested_at,
      entry_song: entry?.entry_song ?? "",
      entry_short: entry?.entry_short ?? null,
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
