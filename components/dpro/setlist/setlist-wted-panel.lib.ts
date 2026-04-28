export const WTED_REQUEST_RATE_LIMIT_MS = 10_000
export const WTED_REQUEST_WINDOW_MS = 60 * 60 * 1000
export const WTED_MAX_REQUESTS_PER_WINDOW = 4

export type SetlistWtedShowContext = {
  show_date: string
  show_venue_location: string | null
  show_group: string | null
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
