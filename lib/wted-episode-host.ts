export type WtedEpisodeHostEntry = {
  name: string
  handle: string
}

/**
 * Normalizes `wted_episodes.host` JSONB (array of { name, handle }) for the episode page.
 * Tolerates legacy string / malformed rows.
 */
export function parseWtedEpisodeHosts(raw: unknown): WtedEpisodeHostEntry[] {
  if (raw == null) return []
  let parsed: unknown = raw
  if (typeof raw === "string") {
    const t = raw.trim()
    if (!t) return []
    try {
      parsed = JSON.parse(t)
    } catch {
      return [{ name: t, handle: "" }]
    }
  }
  if (!Array.isArray(parsed)) return []
  const out: WtedEpisodeHostEntry[] = []
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name.trim() : ""
    const handle = typeof o.handle === "string" ? o.handle.trim() : ""
    if (name || handle) out.push({ name, handle })
  }
  return out
}
