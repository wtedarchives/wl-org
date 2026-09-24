/**
 * Colorado run top-10 ballot.
 * GET  — the caller's ballot, if any.
 * POST — submit exactly 10 ranked selections. One ballot per account.
 *
 * Authorization is the Wysteria session JWT (not a Supabase Auth token).
 * Gateway verify_jwt is off; this function verifies WYSTERIA_JWT_SECRET.
 * Writes use the service role. RLS blocks anon/authenticated.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

const PICK_LIMIT = 10

/** Keep in sync with components/vote/colorado-run-setlists.ts song names. */
const ALLOWED_SELECTIONS = new Set([
  "Eminence Front",
  "MEDIA",
  "Rockdale",
  "Silver Rising",
  "Strange Overtones",
  "Spirit of the Dark Horse → (7hunder)",
  "Dragonfly",
  "Thatch",
  "Madhuvan",
  "Fish in the Sea",
  "Red Bird",
  "Wysteria Lane",
  "POP",
  "Bear",
  "SOS → (dawn)",
  "California Magic",
  "Madalena",
  "Hot Love & the Lazy Poet",
  "Seekers on the Ridge, Pt. 1 → Pt. 2",
  "(again) → Good Times // End Times → ((nocturne))",
  "Hot Tea",
  "Dripfield → Good2B",
  "Burn the Witch",
  "Tumble → Can't Get You Out of My Head → Tumble",
  "Give It Time",
  "Iguana Song",
  "Me and My Uncle",
  "Caution",
  "Jeff Engborg",
  "Not Alone",
  "Turned Clouds",
  "Indian River → Interlude II",
  "Jive I → Jive II → Jive Lee",
  "Drive → Hollywood Nights",
  "Into the Myst",
  "Rosewood Heart",
  "The Labyrinth",
  "White Lights → Into the Myst",
  "Trouble",
  "Royal",
  "Yeti",
  "Borne → Savenger → (you are here) → ((savengersspell))",
  "Peach",
  "Jed Stone",
  "Arrow → Undecided → Arrow",
  "Big Modern!",
  "(((postplace))) → So Ready → (s∆tellite)",
  "Arise",
  "Factory Fiction",
  "Echo of a Rose",
  "Atlas → Atlas Dogs",
  "Butter Rum",
  "A Western Sun → Look Out Cleveland → Dustin Hoffman",
  "Creatures",
  "Slow Ready",
  "This Old Sea",
  "Arcadia",
  "Shama Lama Ding Dong → Danger Zone",
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return json({ error: "Unauthorized" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return json({ error: "Server configuration error" }, 500)
  }

  let profileId: string | undefined
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    profileId = typeof payload.profile_id === "string" ? payload.profile_id : undefined
  } catch {
    return json({ error: "Unauthorized" }, 401)
  }
  if (!profileId) return json({ error: "Unauthorized" }, 401)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: existing, error: existingError } = await supabase
    .from("vote_ballots")
    .select("id, vote_picks(rank, selection)")
    .eq("user_id", profileId)
    .maybeSingle()

  if (existingError) return json({ error: "Could not load ballot" }, 500)

  if (req.method === "GET") {
    if (!existing) return json({ submitted: false, selections: [] })
    const picks = Array.isArray(existing.vote_picks) ? existing.vote_picks : []
    const selections = [...picks]
      .sort((a, b) => a.rank - b.rank)
      .map((pick) => pick.selection)
    return json({ submitted: true, selections })
  }

  if (existing) {
    return json({ error: "You have already submitted a ballot." }, 409)
  }

  let body: { selections?: unknown }
  try {
    body = (await req.json()) as { selections?: unknown }
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const selections = body.selections
  if (
    !Array.isArray(selections) ||
    selections.length !== PICK_LIMIT ||
    selections.some((item) => typeof item !== "string" || !ALLOWED_SELECTIONS.has(item)) ||
    new Set(selections).size !== PICK_LIMIT
  ) {
    return json({ error: "Choose 10 different songs from the list." }, 400)
  }

  const { data: ballot, error: ballotError } = await supabase
    .from("vote_ballots")
    .insert({ user_id: profileId })
    .select("id")
    .single()

  if (ballotError || !ballot) {
    if (ballotError?.code === "23505") {
      return json({ error: "You have already submitted a ballot." }, 409)
    }
    return json({ error: "Could not save ballot" }, 500)
  }

  const { error: picksError } = await supabase.from("vote_picks").insert(
    selections.map((selection, index) => ({
      ballot_id: ballot.id,
      rank: index + 1,
      selection,
    })),
  )

  if (picksError) {
    await supabase.from("vote_ballots").delete().eq("id", ballot.id)
    return json({ error: "Could not save ballot" }, 500)
  }

  return json({ submitted: true })
})
