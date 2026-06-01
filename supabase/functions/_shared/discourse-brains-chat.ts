const COMMUNITY_ORIGIN = "https://community.wysterialane.org"

/** Format `shows.show_date` as MM.DD.YY (UTC date-only). */
export function formatShowDateMmDdYy(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return dateString.trim()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

export function buildSetlistOnstageDiscourseMessage(
  showDate: string,
  venueLocation: string | null | undefined,
): string {
  const date = formatShowDateMmDdYy(showDate)
  const location = (venueLocation ?? "").trim() || "Unknown"
  return `**${date}** (${location})\n(band onstage)`
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

/** Onstage announcements — verified channel for wted-brains test chat. */
export const BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID = 3
