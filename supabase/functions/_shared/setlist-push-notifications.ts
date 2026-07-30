import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  buildSetlistNowPlayingSetSongLine,
  formatShowDateVenueLine,
  getSetlistArchiveAbsoluteUrl,
  type SetlistDiscourseShowEvent,
} from "./discourse-brains-chat.ts"
import { type ApnsBatchResult, type ApnsTokenRow, sendApnsBatch } from "./apns.ts"
import { type FcmTokenRow, sendFcmBatch } from "./fcm.ts"

export type SetlistPushPayload = {
  title: string
  body: string
  url: string
  showID: string
  type?: string
  mutableContent?: boolean
  imageUrl?: string
}

/** Category artwork for a song: `songs.song` → `songs.song_category` →
 * `categories.category` → `categories.category_artwork`. undefined when the
 * song, its category, or the category's artwork can't be resolved. */
export async function resolveSongCategoryArtwork(
  db: SupabaseClient,
  entrySong: string | null | undefined,
): Promise<string | undefined> {
  const song = (entrySong ?? "").trim()
  if (!song) return undefined
  const { data: songRow } = await db
    .from("songs").select("song_category").eq("song", song).maybeSingle()
  const category = (songRow?.song_category ?? "").trim()
  if (!category) return undefined
  const { data: catRow } = await db
    .from("categories").select("category_artwork").eq("category", category).maybeSingle()
  const art = (catRow?.category_artwork ?? "").trim()
  return art || undefined
}

const SHOW_EVENT_PUSH_TITLES: Record<SetlistDiscourseShowEvent, string> = {
  onstage: "[Band Onstage]",
  set_break: "[Set Break]",
  encore_break: "[Encore Break]",
  end_show: "[End of Show]",
}

export function buildSetlistNowPlayingPushNotification(
  showId: string,
  showDate: string,
  venueLocation: string | null | undefined,
  entrySet: string | null | undefined,
  entrySetnum: number,
  entrySong: string | null | undefined,
  imageUrl?: string,
): SetlistPushPayload {
  const songName = (entrySong ?? "").trim() || "—"
  const setSongLine = buildSetlistNowPlayingSetSongLine(entrySet, entrySetnum)
  return {
    title: `♫ Now Playing: ${songName}`,
    body: `${formatShowDateVenueLine(showDate, venueLocation)}\n${setSongLine}`,
    url: getSetlistArchiveAbsoluteUrl(showId),
    showID: showId,
    type: "liveShow",
    mutableContent: true,
    // Song's category artwork; when absent the app's NSE uses the WL fallback.
    imageUrl,
  }
}

export function buildSetlistShowEventPushNotification(
  showId: string,
  showDate: string,
  venueLocation: string | null | undefined,
  event: SetlistDiscourseShowEvent,
): SetlistPushPayload {
  return {
    title: SHOW_EVENT_PUSH_TITLES[event],
    body: formatShowDateVenueLine(showDate, venueLocation),
    url: getSetlistArchiveAbsoluteUrl(showId),
    showID: showId,
    type: "liveShow",
    // No song → no per-song image; the app's NSE attaches the WL fallback.
    mutableContent: true,
  }
}

export type SendSetlistPushResult = ApnsBatchResult

/** Sends an APNs push to every device opted into live-show notifications. */
export async function sendSetlistPushNotifications(
  db: SupabaseClient,
  payload: SetlistPushPayload,
): Promise<SendSetlistPushResult> {
  const { data: tokens, error } = await db
    .from("apns_tokens")
    .select("device_token, environment")
    .eq("live_shows_enabled", true)
  if (error) {
    console.error("live-show push tokens query:", error)
    return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: error.message }
  }
  const apnsResult = await sendApnsBatch(db, (tokens ?? []) as ApnsTokenRow[], payload)

  // Additively fan out to Android (FCM). Isolated so an FCM failure never
  // affects the APNs result the caller relies on.
  try {
    const { data: fcmTokens, error: fcmError } = await db
      .from("fcm_tokens")
      .select("fcm_token")
      .eq("live_shows_enabled", true)
    if (fcmError) {
      console.error("live-show FCM tokens query:", fcmError)
    } else {
      await sendFcmBatch(db, (fcmTokens ?? []) as FcmTokenRow[], {
        type: "liveShow",
        title: payload.title,
        body: payload.body,
        show_id: payload.showID,
        // Song's category artwork, same image the APNs path attaches via the
        // NSE. Omitted (not undefined — FcmData is Record<string, string>) when
        // there's no per-song image; the Android client falls back to the
        // bundled WL mark, matching the extension.
        ...(payload.imageUrl ? { image_url: payload.imageUrl } : {}),
      })
    }
  } catch (err) {
    console.error("live-show FCM fan-out failed:", err)
  }

  return apnsResult
}
