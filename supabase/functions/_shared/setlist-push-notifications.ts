import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  buildSetlistNowPlayingSetSongLine,
  formatShowDateVenueLine,
  getSetlistArchiveAbsoluteUrl,
  type SetlistDiscourseShowEvent,
} from "./discourse-brains-chat.ts"
import { type ApnsBatchResult, type ApnsTokenRow, sendApnsBatch } from "./apns.ts"

export type SetlistPushPayload = {
  title: string
  body: string
  url: string
  showID: string
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
): SetlistPushPayload {
  const songName = (entrySong ?? "").trim() || "—"
  const setSongLine = buildSetlistNowPlayingSetSongLine(entrySet, entrySetnum)
  return {
    title: `♫ Now Playing: ${songName}`,
    body: `${formatShowDateVenueLine(showDate, venueLocation)}\n${setSongLine}`,
    url: getSetlistArchiveAbsoluteUrl(showId),
    showID: showId,
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
  return sendApnsBatch(db, (tokens ?? []) as ApnsTokenRow[], payload)
}
