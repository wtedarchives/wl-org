/**
 * Shared ?id= and ?tab= parsing for public profile (`/user`).
 */
export function resolveArchiveUserSearchParams(searchParams: {
  getAll: (name: string) => string[]
}): {
  profileUserId: string | null
  tabRaw: string
  invalidParams: boolean
} {
  const ids = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(ids).size > 1) {
    return { profileUserId: null, tabRaw: "", invalidParams: true }
  }
  const tabs = searchParams
    .getAll("tab")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(tabs).size > 1) {
    return { profileUserId: null, tabRaw: "", invalidParams: true }
  }
  const profileUserId = ids[0] ?? null
  const tabRaw = tabs[0] ?? ""
  return { profileUserId, tabRaw, invalidParams: false }
}
