/** Resolves canonical setlist `id` / legacy `show_id` from archive setlist page search params. */
export function resolveSetlistShowIdFromSearchParams(searchParams: {
  get: (key: string) => string | null
  getAll: (key: string) => string[]
}): { showId: string; invalidParams: boolean } {
  const idList = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(idList).size > 1) {
    return { showId: "", invalidParams: true }
  }
  const fromId = idList[0] ?? ""
  const legacyShowId = searchParams.get("show_id")?.trim() ?? ""
  if (fromId && legacyShowId && fromId !== legacyShowId) {
    return { showId: "", invalidParams: true }
  }
  return {
    showId: fromId || legacyShowId,
    invalidParams: false,
  }
}
