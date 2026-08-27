/**
 * Calls the Netlify share-card renderer from a Supabase edge function.
 *
 * Rendering lives on Netlify because Supabase Edge caps a request at ~2s of CPU,
 * which held the real card to roughly 0.5M pixels — about 562px wide for a long
 * setlist, well short of Instagram's 1080. See `./render.ts` for the measured
 * numbers and the Deno renderer that remains as a fallback.
 *
 * The renderer is deliberately stateless: this module fetches the data and
 * builds the view model here, where the service key already lives, and posts
 * the result. Netlify therefore needs no database credentials of its own.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

import type { ShareExportTourPosition } from "./show-details.ts"
import { loadShowPosterDataUri } from "./show-poster.ts"
import {
  buildCardViewModel,
  computeTourPosition,
  type SetlistEntryRow,
  type ShowRow,
} from "./view-model.ts"

export type ShareImageFormat = "card" | "instagram"

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

/** Rendering is not on the critical path — never throw into the posting flow. */
export type ShareImageResult =
  | { ok: true; jpegBase64: string; bytes: number }
  | { ok: false; error: string }

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * Renders a show's share card and returns it as base64 JPEG.
 *
 * Returns a failure result rather than throwing: a missing image must not lose
 * the Discourse, push, Bluesky or Instagram post it was meant to accompany.
 */
export async function renderSetlistShareImage(
  db: SupabaseClient,
  showId: string,
  format: ShareImageFormat = "card",
  options: { showEntryCoachNotes?: boolean } = {},
): Promise<ShareImageResult> {
  const endpoint = Deno.env.get("SHARE_IMAGE_RENDERER_URL")
  const secret = Deno.env.get("SHARE_IMAGE_SECRET")
  if (!endpoint || !secret) {
    return { ok: false, error: "Share image renderer is not configured" }
  }

  try {
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

    if (showRes.error) return { ok: false, error: showRes.error.message }
    if (!showRes.data) return { ok: false, error: `No show found for ${showId}` }
    if (entriesRes.error) return { ok: false, error: entriesRes.error.message }

    const show = showRes.data as unknown as ShowRow & { show_tour?: string | null }
    const setlist = (entriesRes.data ?? []) as unknown as SetlistEntryRow[]
    if (setlist.length === 0) {
      return { ok: false, error: `Setlist is empty for ${showId}` }
    }

    // Tour position is decorative; losing it must not lose the image.
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

    /*
     * Rarity and average gap belong on the end-of-show Instagram image only.
     * The per-song Bluesky card shows the show's poster in that slot instead.
     */
    const includeStats = format === "instagram"
    const posterSrc = includeStats ? null : await loadShowPosterDataUri(db, showId)

    const viewModel = buildCardViewModel(show, setlist, {
      tourPosition,
      showEntryCoachNotes: options.showEntryCoachNotes ?? true,
      includeStats,
      posterSrc,
    })

    const url = new URL(endpoint)
    url.searchParams.set("format", format)

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-share-image-secret": secret,
      },
      body: JSON.stringify({ showId, viewModel }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return { ok: false, error: `Renderer returned ${res.status}: ${detail.slice(0, 200)}` }
    }

    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.length === 0) return { ok: false, error: "Renderer returned an empty image" }

    return { ok: true, jpegBase64: toBase64(bytes), bytes: bytes.length }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
