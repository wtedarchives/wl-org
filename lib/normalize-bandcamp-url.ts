/**
 * Ensures a Bandcamp release URL is absolute and fetchable.
 * DB values are sometimes stored as paths like `/artist.bandcamp.com/album/slug`.
 */
export function normalizeBandcampUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  let s = raw.trim()

  if (s.startsWith("//")) {
    s = `https:${s}`
  } else if (s.startsWith("/") && s.includes("bandcamp.com")) {
    s = `https://${s.replace(/^\/+/, "")}`
  } else if (!/^https?:\/\//i.test(s) && s.includes("bandcamp.com")) {
    s = `https://${s.replace(/^\/+/, "")}`
  }

  try {
    const u = new URL(s)
    if (!u.hostname.includes("bandcamp.com")) return null
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.toString()
  } catch {
    return null
  }
}
