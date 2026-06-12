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
