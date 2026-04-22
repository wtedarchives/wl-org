export const WTED_RADIO_CO_STATION_ID = "s3c11c85d6" as const

export const WTED_RADIO_STATUS_URL = `https://public.radio.co/stations/${WTED_RADIO_CO_STATION_ID}/status`

/** Match Radio.co cache (max-age≈3s); align with {@link WtedRecentlyPlayedCard}. */
export const WTED_RADIO_STATUS_POLL_MS = 15_000

export type RadioCoStatusTitleEntry = { title?: string }

export type RadioCoStatusResponse = {
  current_track?: RadioCoStatusTitleEntry | null
  history?: RadioCoStatusTitleEntry[]
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
