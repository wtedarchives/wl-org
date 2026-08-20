export const WTED_RADIO_CO_STATION_ID = "s3c11c85d6" as const

export const WTED_RADIO_NAME = "WTED Goose Radio" as const

/** Now Playing page that shares the iOS-style header player (allowlisted testers). */
export const WTED_RADIO_LISTEN_PATH = "/radio/listen" as const

export const WTED_RADIO_STREAM_URL =
  `https://s4.radio.co/${WTED_RADIO_CO_STATION_ID}/listen` as const

export const WTED_RADIO_STATUS_URL = `https://public.radio.co/stations/${WTED_RADIO_CO_STATION_ID}/status`

/** Duration + start for the track on air (v1 status has no playout length). */
export const WTED_RADIO_V2_CURRENT_TRACK_URL =
  `https://public.radio.co/api/v2/${WTED_RADIO_CO_STATION_ID}/track/current`

/** Match Radio.co cache (max-age≈3s); align with {@link WtedRecentlyPlayedCard}. */
export const WTED_RADIO_STATUS_POLL_MS = 15_000

export const WTED_RECENTLY_PLAYED_LIMIT = 20

export const WTED_RADIO_HISTORY_URL = `https://public.radio.co/stations/${WTED_RADIO_CO_STATION_ID}/history`

export const WTED_RADIO_SCHEDULE_URL = `https://public.radio.co/stations/${WTED_RADIO_CO_STATION_ID}/embed/schedule`

export type RadioCoStatusTitleEntry = {
  title?: string
  start_time?: string
  artwork_url?: string
  artwork_url_large?: string
}

export type RadioCoStatusResponse = {
  status?: string
  current_track?: RadioCoStatusTitleEntry | null
  history?: RadioCoStatusTitleEntry[]
}

export type RadioCoV2CurrentTrackResponse = {
  data?: {
    title?: string | null
    start_time?: string | null
    /** On-air length after crossfade trim, milliseconds. Null on live DJ / relays. */
    track_playout_duration?: number | null
  } | null
}

export function isWtedRadioListenPath(pathname: string | null | undefined) {
  return pathname === WTED_RADIO_LISTEN_PATH
}

/**
 * Prefer live `current_track` (true “now playing”), else first `history` item
 * (same ordering as “recently played” on the old homepage).
 */
export function getWtedNowPlayingTitle(data: RadioCoStatusResponse): string | null {
  const current = data.current_track?.title?.trim()
  if (current) return current
  const h0 = data.history?.[0]?.title?.trim()
  return h0 || null
}
