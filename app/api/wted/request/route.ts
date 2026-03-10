import { NextRequest, NextResponse } from "next/server"

import { supabase } from "@/lib/supabase"
import { createSupabaseClientWithAuth } from "@/lib/supabase-server"

const RADIO_CO_REQUEST_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests"
const THIRTY_MINUTES_MS = 30 * 60 * 1000
const MAX_REQUESTS = 3

const WTED_ERROR_MESSAGES: Record<number, string> = {
  403: "Requests for WTED Goose Radio have been disabled.",
  404: "Requested track not found. Submit a bug report for us to investigate.",
  409:
    "You have already requested this track. Stay tuned to WTED Goose Radio to hear it!",
  429:
    "WTED Radio has reached its request limit for this period. Please try again later.",
}

export async function POST(request: NextRequest) {
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

  let body: { entry_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const entryId = body?.entry_id
  if (!entryId || typeof entryId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid entry_id" },
      { status: 400 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  const { data: entry, error: entryError } = await supabase
    .from("setlist_entries")
    .select("entry_id, radio_id, entry_show")
    .eq("entry_id", entryId)
    .single()

  if (entryError || !entry) {
    return NextResponse.json(
      { error: "Entry not found" },
      { status: 404 }
    )
  }

  const trackId = entry.radio_id
  if (!trackId) {
    return NextResponse.json(
      { error: "This track is not available for request" },
      { status: 400 }
    )
  }

  const trackIdNum = parseInt(String(trackId), 10)
  if (Number.isNaN(trackIdNum)) {
    return NextResponse.json(
      { error: "Invalid track ID" },
      { status: 400 }
    )
  }

  const since = new Date(Date.now() - THIRTY_MINUTES_MS).toISOString()

  const { data: recentRequests, error: reqError } = await client
    .from("wted_requests")
    .select("entry_id, requested_at")
    .eq("user_id", user.id)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError) {
    return NextResponse.json(
      { error: "Failed to check request limit" },
      { status: 500 }
    )
  }

  const requests = recentRequests ?? []

  if (requests.length >= MAX_REQUESTS) {
    const oldest = requests[0]
    const oldestTime = new Date(oldest.requested_at).getTime()
    const nextAvailable = new Date(oldestTime + THIRTY_MINUTES_MS)
    return NextResponse.json(
      {
        error: "You have reached the limit for requesting songs at this time, please check back later!",
        nextAvailableAt: nextAvailable.toISOString(),
      },
      { status: 429 }
    )
  }

  const entryIds = requests.map((r) => r.entry_id)
  const { data: existingEntries } = await supabase
    .from("setlist_entries")
    .select("entry_id, radio_id")
    .in("entry_id", [...entryIds, entryId])

  const requestedRadioIds = new Set(
    (existingEntries ?? [])
      .filter((e) => entryIds.includes(e.entry_id))
      .map((e) => String(e.radio_id ?? ""))
      .filter(Boolean)
  )

  if (requestedRadioIds.has(String(trackId))) {
    return NextResponse.json(
      {
        error:
          "You have already requested this track. Stay tuned to WTED Goose Radio to hear it!",
      },
      { status: 409 }
    )
  }

  const radioResponse = await fetch(RADIO_CO_REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_id: trackIdNum }),
  })

  if (!radioResponse.ok) {
    const status = radioResponse.status
    let message = WTED_ERROR_MESSAGES[status]

    if (!message) {
      try {
        const data = await radioResponse.json()
        const apiMessage = data?.errors?.[0]?.message
        if (apiMessage) message = apiMessage
      } catch {
        // ignore
      }
    }
    if (!message) {
      message = "Unable to submit request. Please try again later."
    }

    return NextResponse.json({ error: message }, { status: status })
  }

  const { error: insertError } = await client.from("wted_requests").insert({
    user_id: user.id,
    entry_id: entryId,
    requested_at: new Date().toISOString(),
  })

  if (insertError) {
    return NextResponse.json(
      { error: "Request submitted but failed to save. Please try again later." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
