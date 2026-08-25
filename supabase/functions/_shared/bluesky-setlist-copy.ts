import {
  formatShowDateMmDdYy,
  getSetlistShowAbsoluteUrl,
  SETLIST_DISCOURSE_SHOW_EVENT_LINES,
  type SetlistDiscourseShowEvent,
} from "./discourse-brains-chat.ts"
import { BLUESKY_MAX_GRAPHEMES, countGraphemes, fitGraphemes } from "./bluesky.ts"

/** Show context for the thread's root post. */
export type BlueskyRootShowInfo = {
  showId: string
  showDate: string
  showGroup: string | null | undefined
  showSubvenue: string | null | undefined
  showVenueLocation: string | null | undefined
  showDetail: string | null | undefined
  showTour: string | null | undefined
  /** Position within `show_tour`, mirroring the setlist page's tour counter. */
  tourPosition: { position: number; total: number } | null
}

const clean = (value: string | null | undefined): string => (value ?? "").trim()

/**
 * Root post — opens the show's thread.
 *
 *     MM.DD.YY – Show Group (Live Setlist)
 *     Subvenue – Venue Location
 *     Show detail                          ← only when present
 *     Tour Name – Show 3 of 21             ← only when a tour is set
 *     https://wtedradio.com/archive/setlist?id=…
 *
 * The URL is kept whole and the detail line is the first thing dropped when the
 * 300-grapheme cap bites.
 */
export function buildBlueskyRootPostText(info: BlueskyRootShowInfo): string {
  const url = getSetlistShowAbsoluteUrl(info.showId)
  const date = formatShowDateMmDdYy(info.showDate)
  const group = clean(info.showGroup)
  const subvenue = clean(info.showSubvenue)
  const location = clean(info.showVenueLocation) || "Unknown"
  const detail = clean(info.showDetail)
  const tour = clean(info.showTour)

  const headline = `${group ? `${date} – ${group}` : date} (Live Setlist)`
  const venueLine = subvenue ? `${subvenue} – ${location}` : location

  const counter =
    info.tourPosition ?
      `Show ${info.tourPosition.position} of ${info.tourPosition.total}`
    : ""
  const tourLine =
    tour && counter ? `${tour} – ${counter}`
    : tour ? tour
    : counter

  // Newline between the head block and the URL costs one grapheme.
  const budget = BLUESKY_MAX_GRAPHEMES - countGraphemes(url) - 1
  const lines = [headline, venueLine, detail, tourLine].filter(Boolean)
  let head = lines.join("\n")
  if (countGraphemes(head) > budget && detail) {
    head = [headline, venueLine, tourLine].filter(Boolean).join("\n")
  }

  return `${fitGraphemes(head, budget)}\n${url}`
}

/**
 * Song reply.
 *
 *     Royal
 *     (5 show gap)      ← formatSetlistShowGap(), omitted when null
 *     Coach notes       ← only when present
 *
 * The name and the gap are the post's substance, so the notes are what the
 * 300-grapheme cap takes first.
 */
export function buildBlueskySongPostText(
  songDisplayName: string | null | undefined,
  entrySong: string | null | undefined,
  coachNotes: string | null | undefined,
  showGap?: string | null,
): string {
  const name = clean(songDisplayName) || clean(entrySong) || "—"
  const gap = clean(showGap)
  const notes = clean(coachNotes)

  const head = fitGraphemes(
    gap ? `${name}\n${gap}` : name,
    BLUESKY_MAX_GRAPHEMES,
  )
  if (!notes) return head

  const budget = BLUESKY_MAX_GRAPHEMES - countGraphemes(head) - 1
  const fittedNotes = budget > 0 ? fitGraphemes(notes, budget) : ""
  return fittedNotes ? `${head}\n${fittedNotes}` : head
}

/**
 * Show-event reply. `onstage` is bare; the break and end-of-show markers carry
 * the setlist URL so the thread stays navigable from any of them.
 */
export function buildBlueskyShowEventPostText(
  showId: string,
  event: SetlistDiscourseShowEvent,
): string {
  const line = SETLIST_DISCOURSE_SHOW_EVENT_LINES[event]
  if (event === "onstage") return line
  return `${line}\n${getSetlistShowAbsoluteUrl(showId)}`
}

/** Link-card title/description for shows with no poster to embed. */
export function buildBlueskyExternalCardMeta(info: BlueskyRootShowInfo): {
  title: string
  description: string
} {
  const date = formatShowDateMmDdYy(info.showDate)
  const group = clean(info.showGroup)
  const subvenue = clean(info.showSubvenue)
  const location = clean(info.showVenueLocation) || "Unknown"
  return {
    title: group ? `${date} – ${group}` : date,
    description: subvenue ? `${subvenue} – ${location}` : location,
  }
}
