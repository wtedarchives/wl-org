import type { WtedRadioIdRow } from "@/lib/wted-radio-ids-sync"

/** Radio.co history/status title: `{track_artist} - {track_title}`. */
export function formatWtedRadioTrackDisplayTitle(
  row: Pick<WtedRadioIdRow, "track_artist" | "track_title">,
): string | null {
  const title = row.track_title?.trim()
  if (!title) return null
  const artist = row.track_artist?.trim()
  return artist ? `${artist} - ${title}` : title
}

/**
 * Parse a combined Radio.co history title into artist + catalog title.
 * Splits on the first `" - "` so titles like `Atlas Dogs - 2023/04/19 …` stay intact.
 */
export function parseRadioCoHistoryTrackTitle(
  combined: string,
): { artist: string; title: string } | null {
  const trimmed = combined.trim()
  const sep = trimmed.indexOf(" - ")
  if (sep <= 0) return null

  const artist = trimmed.slice(0, sep).trim()
  const title = trimmed.slice(sep + 3).trim()
  if (!artist || !title) return null

  return { artist, title }
}

/**
 * iOS `ParsedTrackTitle`: song line + venue/date (or artist) line for now-playing UI.
 *
 *   "Goose - Madhuvan - 2022/06/15 Red Hat Amphitheater, Raleigh, NC"
 *     → primary "Madhuvan", secondary "2022/06/15 Red Hat Amphitheater, Raleigh, NC"
 */
export function parseRadioNowPlayingTitle(raw: string): {
  primary: string
  secondary: string | null
} {
  const title = raw.trim()
  const dateMatch =
    /(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/.exec(
      title,
    )

  if (dateMatch && dateMatch.index != null) {
    const head = title
      .slice(0, dateMatch.index)
      .replace(/[\s\-–—·]+$/u, "")
      .trim()
    const context = title.slice(dateMatch.index).trim()
    const dash = head.indexOf(" - ")
    const song = dash >= 0 ? head.slice(dash + 3).trim() : head
    return {
      primary: song || title,
      secondary: context || null,
    }
  }

  const parts = title
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return { primary: title, secondary: null }
  if (parts.length === 2) {
    return { primary: parts[1]!, secondary: parts[0]! }
  }
  return {
    primary: parts[1]!,
    secondary: parts.slice(2).join(" · "),
  }
}

/** "3:24" / "1:02:03" — same clock as the iOS radio bar. */
export function formatRadioTrackClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${m}:${String(s).padStart(2, "0")}`
}
