/**
 * Submit or update setlist game picks using Wysteria SSO JWT (Bearer).
 * PostgREST rejects that JWT when sent directly (wrong signing secret → JWSInvalidSignature).
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET (same as wted-requests).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

type PickPayload = {
  id: string
  song: string
  set: string
  setnum: number
  placement?: string | null
  isBreak?: boolean
}

function isSelectionClosed(showTimeIso: string): boolean {
  const now = new Date()
  const showDateTime = new Date(showTimeIso)
  const oneHourBefore = new Date(showDateTime)
  oneHourBefore.setHours(oneHourBefore.getHours() - 1)
  return now >= oneHourBefore.getTime()
}

function getPlacement(set: string, songs: PickPayload[], currentSong: PickPayload): string {
  const sortedSongs = [...songs].sort((a, b) => a.setnum - b.setnum)
  if (set.startsWith("E")) return `Encore ${set.substring(1)}`
  const songIndex = sortedSongs.findIndex((s) => s.id === currentSong.id)
  if (sortedSongs.length === 1) return `Set ${set} Opener`
  if (songIndex === 0) return `Set ${set} Opener`
  if (songIndex === sortedSongs.length - 1) return `Set ${set} Closer`
  return `Main Set ${set}`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const authHeader = req.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  let payload: Record<string, unknown>
  try {
    const { payload: verified } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    payload = verified as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const profileId = payload.profile_id as string | undefined
  if (!profileId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  let body: {
    show_id?: string
    isEditing?: boolean
    submission_id?: string | null
    picks?: PickPayload[]
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const showId = body.show_id
  const picksRaw = Array.isArray(body.picks) ? body.picks : []
  if (!showId || typeof showId !== "string") {
    return new Response(JSON.stringify({ error: "Missing show_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const songPicks = picksRaw.filter(
    (p): p is PickPayload =>
      p &&
      typeof p === "object" &&
      typeof (p as PickPayload).id === "string" &&
      typeof (p as PickPayload).song === "string" &&
      typeof (p as PickPayload).set === "string" &&
      typeof (p as PickPayload).setnum === "number",
  )
  const realPicks = songPicks.filter((p) => !p.isBreak)
  if (realPicks.length === 0) {
    return new Response(JSON.stringify({ error: "Please add at least one song" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: showRow, error: showErr } = await supabase
    .from("shows")
    .select("show_time, show_scored, show_tour")
    .eq("show_id", showId)
    .maybeSingle()

  if (showErr || !showRow) {
    return new Response(JSON.stringify({ error: "Show not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (showRow.show_scored === true) {
    return new Response(
      JSON.stringify({
        error: "Submission period has closed. You can no longer submit picks for this show.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const showTime = showRow.show_time as string | null
  if (showTime && (isSelectionClosed(showTime))) {
    return new Response(
      JSON.stringify({
        error: "Submission period has closed. You can no longer submit picks for this show.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  const tourId = showRow.show_tour as string
  let submissionId: string | undefined =
    typeof body.submission_id === "string" ? body.submission_id : undefined
  let isEditing = Boolean(body.isEditing && submissionId)

  if (!isEditing) {
    const { data: existingSubmission, error: existingError } = await supabase
      .from("setlist_game_submissions")
      .select("submission_id")
      .eq("user_id", profileId)
      .eq("show_id", showId)
      .maybeSingle()

    if (!existingError && existingSubmission?.submission_id) {
      isEditing = true
      submissionId = existingSubmission.submission_id
    }
  }

  const totalSongs = realPicks.length

  try {
    if (isEditing && submissionId) {
      const { data: owned, error: ownErr } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("submission_id", submissionId)
        .eq("user_id", profileId)
        .maybeSingle()

      if (ownErr || !owned) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const { error: delErr } = await supabase
        .from("setlist_game_picks")
        .delete()
        .eq("submission_id", submissionId)

      if (delErr) throw delErr

      const { error: updErr } = await supabase
        .from("setlist_game_submissions")
        .update({ total_songs_picked: totalSongs })
        .eq("submission_id", submissionId)

      if (updErr) throw updErr
    } else {
      const { data: submissionData, error: submissionError } = await supabase
        .from("setlist_game_submissions")
        .insert([
          {
            user_id: profileId,
            show_id: showId,
            tour_id: tourId,
            submission_status: "open",
            total_songs_picked: totalSongs,
          },
        ])
        .select("submission_id")
        .single()

      if (submissionError) {
        if (submissionError.code === "23505") {
          return new Response(
            JSON.stringify({
              error:
                "You already have picks submitted for this show. Try refreshing the page.",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          )
        }
        throw submissionError
      }

      submissionId = submissionData?.submission_id
    }

    if (!submissionId) {
      throw new Error("Missing submission id")
    }

    const setGroups: Record<string, PickPayload[]> = {}
    realPicks.forEach((pick) => {
      if (!setGroups[pick.set]) setGroups[pick.set] = []
      setGroups[pick.set].push(pick)
    })

    const picksToInsert: Record<string, unknown>[] = []
    for (const setId of Object.keys(setGroups)) {
      const sortedSetSongs = [...setGroups[setId]].sort((a, b) => a.setnum - b.setnum)
      sortedSetSongs.forEach((pick, index) => {
        picksToInsert.push({
          submission_id: submissionId,
          user_id: profileId,
          show_id: showId,
          song: pick.song,
          set: pick.set,
          setnum: index + 1,
          placement: pick.placement || getPlacement(setId, sortedSetSongs, pick),
        })
      })
    }

    const { error: picksError } = await supabase.from("setlist_game_picks").insert(picksToInsert)

    if (picksError) throw picksError
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to submit picks"
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : ""
    if (code === "23505") {
      return new Response(
        JSON.stringify({
          error: "You already have picks for this show. Please refresh the page.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
