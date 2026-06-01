const COMMUNITY_ORIGIN = "https://community.wysterialane.org"
const SETLIST_ARCHIVE_ORIGIN = "https://dripfield.pro"

/** Format `shows.show_date` as MM.DD.YY (UTC date-only). */
export function formatShowDateMmDdYy(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return dateString.trim()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

export function getSetlistShowDiscourseUrl(showId: string): string {
  return `${SETLIST_ARCHIVE_ORIGIN}/setlist/${encodeURIComponent(showId.trim())}`
}

export const SETLIST_DISCOURSE_SHOW_EVENT_LINES = {
  onstage: "(band onstage)",
  set_break: "(set break)",
  encore_break: "(encore break)",
  end_show: "(end of show)",
} as const

export type SetlistDiscourseShowEvent =
  keyof typeof SETLIST_DISCOURSE_SHOW_EVENT_LINES

export function isSetlistDiscourseShowEvent(
  value: string,
): value is SetlistDiscourseShowEvent {
  return value in SETLIST_DISCOURSE_SHOW_EVENT_LINES
}

/** Discourse markdown: linked show date + venue, then event parenthetical on line 2. */
export function buildSetlistShowEventDiscourseMessage(
  showId: string,
  showDate: string,
  venueLocation: string | null | undefined,
  event: SetlistDiscourseShowEvent,
): string {
  const date = formatShowDateMmDdYy(showDate)
  const location = (venueLocation ?? "").trim() || "Unknown"
  const linkText = `**${date}** (${location})`
  const url = getSetlistShowDiscourseUrl(showId)
  return `[${linkText}](${url})\n${SETLIST_DISCOURSE_SHOW_EVENT_LINES[event]}`
}

/** POST to Discourse chat using BRAINS_API_KEY / BRAINS_USERNAME secrets. */
export async function postBrainsDiscourseChatMessage(
  channelId: number,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string; detail?: unknown }> {
  const apiKey = Deno.env.get("BRAINS_API_KEY")?.trim()
  const apiUsername = Deno.env.get("BRAINS_USERNAME")?.trim()
  if (!apiKey || !apiUsername) {
    return {
      ok: false,
      error: "Missing BRAINS_API_KEY or BRAINS_USERNAME server configuration.",
    }
  }

  const discourseRes = await fetch(`${COMMUNITY_ORIGIN}/chat/${channelId}`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Api-Username": apiUsername,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message }),
  })

  const text = await discourseRes.text()
  let detail: unknown = null
  if (text) {
    try {
      detail = JSON.parse(text)
    } catch {
      detail = { raw: text.slice(0, 500) }
    }
  }

  if (!discourseRes.ok) {
    return {
      ok: false,
      error: `Discourse returned ${discourseRes.status}`,
      detail,
    }
  }

  return { ok: true }
}

/** Show-event announcements — verified channel for wted-brains test chat. */
export const BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID = 3
