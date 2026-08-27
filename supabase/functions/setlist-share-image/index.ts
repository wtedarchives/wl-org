/**
 * Renders the setlist share card server-side and returns it as JPEG.
 *
 * This replaces the browser-side `html-to-image` capture, which produced blank
 * rasters on mobile WebKit: everything drawn through an SVG `foreignObject`
 * came back empty, so Bluesky posts carried an empty image and Instagram posts
 * showed only their background.
 *
 * Sizing is bounded by the Supabase Edge CPU ceiling (~2s, not liftable by
 * plan). See `_shared/setlist-share-card/render.ts` for the measured table;
 * the short version is that output must stay under ~1.2M pixels.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { corsHeaders } from "../_shared/cors.ts"
import {
  brandMark,
  cardBackground,
  pickShareBackgroundStem,
} from "../_shared/setlist-share-card/assets.ts"
import { CARD_WIDTH_PX } from "../_shared/setlist-share-card/card.ts"
import {
  renderSetlistShareCard,
  RenderTooLargeError,
} from "../_shared/setlist-share-card/render.ts"
import {
  buildCardViewModel,
  computeTourPosition,
  type SetlistEntryRow,
  type ShowRow,
} from "../_shared/setlist-share-card/view-model.ts"
import type { ShareExportTourPosition } from "../_shared/setlist-share-card/show-details.ts"

/** 432 x 2.222 ≈ 960 wide, the measured-safe Instagram target. */
const DEFAULT_SCALE = 960 / CARD_WIDTH_PX
const DEFAULT_QUALITY = 85

const ENTRY_SELECT = `
  entry_id,
  entry_set,
  entry_song,
  entry_short,
  entry_segue,
  entry_placement,
  entry_coachnotes,
  songs ( song_displayname )
`

const SHOW_SELECT = `
  show_id,
  show_date,
  show_group,
  show_tour,
  show_subvenue,
  show_venue_location,
  show_coachnotes,
  show_callbacks,
  show_rarity,
  show_gap,
  discography_display
`

function jsonError(message: string, status: number, extra: unknown = {}) {
  return new Response(JSON.stringify({ error: message, ...(extra as object) }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const url = new URL(req.url)
  let showId = url.searchParams.get("show_id")
  if (!showId && req.method === "POST") {
    const body = await req.json().catch(() => null)
    showId = (body as { show_id?: string } | null)?.show_id ?? null
  }
  if (!showId) return jsonError("show_id is required", 400)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return jsonError("Supabase credentials are not configured", 500)
  }
  const db = createClient(supabaseUrl, serviceKey)

  const fetchStart = Date.now()
  const [showRes, entriesRes] = await Promise.all([
    db.from("shows").select(SHOW_SELECT).eq("show_id", showId).maybeSingle(),
    db
      .from("setlist_entries")
      .select(ENTRY_SELECT)
      .eq("entry_show", showId)
      // Set first, then position within the set — the order the card reads in,
      // and what the web capture used. Ordering by setnum first interleaved
      // the sets, and entry_setorder is nullable so it cannot be the key.
      .order("entry_set", { ascending: true })
      .order("entry_setnum", { ascending: true }),
  ])

  if (showRes.error) return jsonError(`Show lookup failed: ${showRes.error.message}`, 500)
  if (!showRes.data) return jsonError(`No show found for ${showId}`, 404)
  if (entriesRes.error) {
    return jsonError(`Setlist lookup failed: ${entriesRes.error.message}`, 500)
  }

  const show = showRes.data as unknown as ShowRow & { show_tour?: string | null }
  const setlist = (entriesRes.data ?? []) as unknown as SetlistEntryRow[]
  if (setlist.length === 0) return jsonError(`Setlist is empty for ${showId}`, 404)

  // Tour position is a nice-to-have; a failure here must not lose the image.
  let tourPosition: ShareExportTourPosition | null = null
  const tourName = show.show_tour?.trim()
  if (tourName) {
    const tourRes = await db
      .from("shows")
      .select("show_id, show_canonid, show_date, show_group")
      .eq("show_tour", tourName)
    if (!tourRes.error && tourRes.data) {
      tourPosition = computeTourPosition(showId, tourRes.data as never)
    }
  }
  const fetchMs = Date.now() - fetchStart

  const stem = pickShareBackgroundStem(showId)
  const backgroundSrc = cardBackground(stem)
  const brandMarkSrc = brandMark()

  const vm = buildCardViewModel(show, setlist, {
    tourPosition,
    showEntryCoachNotes: url.searchParams.get("coach_notes") !== "0",
  })

  const scale = Number(url.searchParams.get("scale") ?? DEFAULT_SCALE)
  const quality = Number(url.searchParams.get("quality") ?? DEFAULT_QUALITY)

  try {
    const out = await renderSetlistShareCard(
      vm,
      { backgroundSrc, brandMarkSrc },
      { scale, quality },
    )

    if (url.searchParams.get("debug") === "1") {
      return new Response(
        JSON.stringify({
          ok: true,
          showId,
          background: stem,
          entries: setlist.length,
          width: out.width,
          height: out.height,
          megapixels: +(out.width * out.height / 1e6).toFixed(3),
          scale: +out.scale.toFixed(3),
          clamped: out.clamped,
          bytes: out.jpeg.length,
          timings: { fetchMs, ...out.timings },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    return new Response(out.jpeg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    if (err instanceof RenderTooLargeError) {
      return jsonError(err.message, 413, {
        width: err.width,
        height: err.height,
        limit: err.limit,
      })
    }
    console.error("setlist share render failed:", err)
    return jsonError(`Render failed: ${String(err)}`, 500)
  }
})
