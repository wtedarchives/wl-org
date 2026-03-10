import { NextRequest, NextResponse } from "next/server"

import { supabase } from "@/lib/supabase"
import { createSupabaseClientWithAuth } from "@/lib/supabase-server"

const THIRTY_MINUTES_MS = 30 * 60 * 1000

export interface WtedRequestEnriched {
  id: string
  entry_id: string
  requested_at: string
  entry_song: string
  entry_short: string | null
  show_date: string
  show_venue_location: string | null
  show_group: string | null
  release_artwork: string | null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = createSupabaseClientWithAuth(token)
  if (!client) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const since = new Date(Date.now() - THIRTY_MINUTES_MS).toISOString()

  const { data: requests, error: reqError } = await client
    .from("wted_requests")
    .select("id, entry_id, requested_at")
    .eq("user_id", user.id)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError || !requests || requests.length === 0) {
    return NextResponse.json({ requests: [] })
  }

  const entryIds = requests.map((r) => r.entry_id)

  if (!supabase) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

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
    return NextResponse.json(
      { error: "Failed to fetch entry data" },
      { status: 500 }
    )
  }

  const entryMap = new Map(entries.map((e) => [e.entry_id, e]))
  const showIds = [...new Set(entries.map((e) => e.entry_show))]

  const { data: shows, error: showsError } = await supabase
    .from("shows")
    .select("show_id, show_date, show_venue_location, show_group")
    .in("show_id", showIds)

  if (showsError || !shows) {
    return NextResponse.json(
      { error: "Failed to fetch show data" },
      { status: 500 }
    )
  }

  const showMap = new Map(shows.map((s) => [s.show_id, s]))

  const { data: rsData, error: rsError } = await supabase
    .from("releases_shows")
    .select("show_id, release_id, release_order")
    .in("show_id", showIds)
    .order("release_order", { ascending: true })

  if (rsError || !rsData) {
    return NextResponse.json(
      { error: "Failed to fetch release data" },
      { status: 500 }
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
    return NextResponse.json(
      { error: "Failed to fetch artwork" },
      { status: 500 }
    )
  }

  const releaseMap = new Map(
    (releases as { release_id: string; release_artwork: string | null }[]).map(
      (r) => [r.release_id, r.release_artwork]
    )
  )

  const enriched: WtedRequestEnriched[] = requests.map((r) => {
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

  return NextResponse.json({ requests: enriched })
}
