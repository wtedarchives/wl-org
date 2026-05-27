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

/** Like {@link stripHtmlToPlainText}, but `<br>` / `<br />` become newlines. */
function stripHtmlToPlainTextPreserveLineBreaks(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ""

  const withBreaks = trimmed.replace(/<br\s*\/?>/gi, "\n")

  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = withBreaks
    return (el.textContent ?? withBreaks).trim()
  }

  return decodeHtmlEntitiesForDisplay(
    withBreaks.replace(/<[^>]*>/g, ""),
  ).trim()
}

function boldItalicPlainText(text: string): string {
  return `**_${text}_**`
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

/** Clipboard body: bold/italic header, setlist, optional callbacks notes. */
export function buildSetlistPlainTextCopy(
  show: Show,
  setlist: SetlistEntry[],
): string {
  const date = formatSetlistDate(show.show_date)
  const group = show.show_group?.trim() ?? ""
  const location = show.show_venue_location?.trim() ?? ""

  const headerLines: string[] = []
  const titleParts: string[] = []
  if (date) titleParts.push(boldItalicPlainText(date))
  if (group) titleParts.push(boldItalicPlainText(group))
  if (titleParts.length > 0) headerLines.push(titleParts.join(" · "))
  if (location) headerLines.push(boldItalicPlainText(location))

  const setlistLines: string[] = []
  for (let i = 0; i < setlist.length; i++) {
    const entry = setlist[i]!
    if (i > 0 && entry.entry_set !== setlist[i - 1]!.entry_set) {
      setlistLines.push("—")
    }
    setlistLines.push(formatSetlistEntryPlainTextLine(entry))
  }

  const parts: string[] = [...headerLines, "", ...setlistLines]

  const callbacks = show.show_callbacks?.trim()
  if (callbacks) {
    const callbacksPlain = stripHtmlToPlainTextPreserveLineBreaks(callbacks)
    if (callbacksPlain) {
      parts.push("", "Notes:", callbacksPlain)
    }
  }

  return parts.join("\n")
}
