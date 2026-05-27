import { formatSetlistDate } from "@/lib/setlist-utils"
import { decodeHtmlEntitiesForDisplay } from "@/lib/decode-html-entities"
import type { SetlistEntry, Show } from "@/types/setlist"

/** Strip HTML tags and decode entities for plain-text coach notes. */
export function stripHtmlToPlainText(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ""

  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = trimmed
    return (el.textContent ?? trimmed).trim()
  }

  return decodeHtmlEntitiesForDisplay(
    trimmed.replace(/<[^>]*>/g, ""),
  ).trim()
}

function entrySongDisplayName(entry: SetlistEntry): string {
  return entry.songs?.song_displayname?.trim() || entry.entry_song.trim()
}

export function formatSetlistEntryPlainTextLine(entry: SetlistEntry): string {
  const song = entrySongDisplayName(entry)
  let line = `**${song}**`

  const short = entry.entry_short?.trim()
  if (short) line += ` [${short}]`

  if (entry.entry_segue?.trim()) line += " →"

  const notes = entry.entry_coachnotes?.trim()
  if (notes) line += ` (${stripHtmlToPlainText(notes)})`

  return line
}

/** Clipboard body: bold show header, em dash, then one song per line (sets also separated by em dash). */
export function buildSetlistPlainTextCopy(
  show: Show,
  setlist: SetlistEntry[],
): string {
  const date = formatSetlistDate(show.show_date)
  const group = show.show_group?.trim() ?? ""
  const location = show.show_venue_location?.trim() ?? ""

  const headerLines: string[] = []
  const titleParts: string[] = []
  if (date) titleParts.push(`**${date}**`)
  if (group) titleParts.push(`**${group}**`)
  if (titleParts.length > 0) headerLines.push(titleParts.join(" · "))
  if (location) headerLines.push(`**${location}**`)

  const setlistLines: string[] = []
  for (let i = 0; i < setlist.length; i++) {
    const entry = setlist[i]!
    if (i > 0 && entry.entry_set !== setlist[i - 1]!.entry_set) {
      setlistLines.push("—")
    }
    setlistLines.push(formatSetlistEntryPlainTextLine(entry))
  }

  return [...headerLines, "—", ...setlistLines].join("\n")
}
