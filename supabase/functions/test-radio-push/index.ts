/**
 * TEMPORARY test-only function: sends a "Now Playing on WTED Radio" push
 * (type: "radioProgram" + mutable-content + the program's episode artwork) to
 * every APNs device opted into New Show reminders. Mirrors radio-program-notify's
 * buildSpec but for a chosen episode, bypassing the current-program + cron gates.
 * Pass ?uuid=<wted_episodes.uuid> to pick a program (defaults to Ted Tracks Vol.006).
 * DELETE after verifying on device.
 *
 * Deploy with --no-verify-jwt; call with an empty POST.
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APNS_* (see _shared/apns.ts)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { type ApnsPayload, type ApnsTokenRow, sendApnsBatch } from "../_shared/apns.ts"
import {
  formatEpisodeScheduleTitle,
  formatLinkedShowScheduleTitle,
} from "../_shared/schedule-title.ts"

const TITLE = "Now Playing on WTED Radio"
const DEFAULT_UUID = "0c1356c0-d4e9-4cfb-b20c-00fdd2183d65" // Ted Tracks · Vol. 006

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "config" }), { status: 500 })
  }
  const db = createClient(supabaseUrl, serviceKey)
  const uuid = new URL(req.url).searchParams.get("uuid") || DEFAULT_UUID

  const { data: ep } = await db.from("wted_episodes")
    .select("uuid,episode,display_name,show,show_link,artwork")
    .eq("uuid", uuid).maybeSingle()
  if (!ep) return new Response(JSON.stringify({ error: "episode not found", uuid }), { status: 404 })

  const image = ep.artwork?.trim() || undefined
  const payload: ApnsPayload = {
    title: TITLE,
    body: "",
    type: "radioProgram",
    mutableContent: true,
    imageUrl: image,
  }
  const showLink = ep.show_link?.trim()
  if (showLink) {
    const { data: show } = await db.from("shows")
      .select("show_date,show_group,show_detail,show_venue_location,show_subvenue")
      .eq("show_id", showLink).maybeSingle()
    payload.body = show ? formatLinkedShowScheduleTitle(show) : (ep.display_name ?? ep.episode ?? "")
    payload.showID = showLink
  } else {
    payload.body = formatEpisodeScheduleTitle(ep.show, ep.display_name ?? ep.episode)
    payload.episodeUUID = ep.uuid ?? ""
  }

  const { data: tokensData } = await db.from("apns_tokens")
    .select("device_token, environment").eq("radio_program_enabled", true)
  const tokens = (tokensData ?? []) as ApnsTokenRow[]
  const result = await sendApnsBatch(db, tokens, payload)

  return new Response(
    JSON.stringify({ registeredDevices: tokens.length, body: payload.body, image: image ?? null, result }),
    { headers: { "content-type": "application/json" } },
  )
})
