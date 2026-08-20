import { supabase } from "@/lib/supabase"
import { parseRadioCoArtworkUrl } from "@/lib/wted-recently-played"
import { parseRadioCoHistoryTrackTitle } from "@/lib/wted-radio-track-display-title"

/**
 * `shows.show_id` for the track on air, when `wted_radio_ids.show_id` is set.
 *
 * Radio.co's public now-playing feed often omits a numeric track id (playlist
 * artwork has no track stem). Prefer `radio_id` from a track-shaped artwork
 * URL; otherwise match artist + title from the combined status title.
 */
export async function fetchShowIdForRadioCoTrack(args: {
  artworkUrl: string | null
  combinedTitle: string | null
}): Promise<string | null> {
  if (!supabase) return null

  const ref = parseRadioCoArtworkUrl(args.artworkUrl)
  if (ref?.kind === "track") {
    const { data, error } = await supabase
      .from("wted_radio_ids")
      .select("show_id")
      .eq("radio_id", ref.id)
      .limit(1)
    if (error) return null
    const showId = data?.[0]?.show_id
    return typeof showId === "string" && showId ? showId : null
  }

  const title = args.combinedTitle?.trim()
  if (!title) return null

  const parsed = parseRadioCoHistoryTrackTitle(title)
  let query = supabase.from("wted_radio_ids").select("show_id")
  if (parsed) {
    query = query
      .eq("track_artist", parsed.artist)
      .eq("track_title", parsed.title)
  } else {
    query = query.eq("track_title", title)
  }

  const { data, error } = await query.limit(1)
  if (error) return null
  const showId = data?.[0]?.show_id
  return typeof showId === "string" && showId ? showId : null
}
