import type { ProgramDirectorCatalogRow } from "@/lib/fetch-program-director-catalog"
import { formatShowDateLongYear } from "@/lib/setlist-utils"

export function normalizeProgramDirectorCatalogSearchQuery(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Keeps rows where every whitespace-separated token appears as a substring of at least one
 * searchable field (song title/display name, tour/group, subvenue, venue location, raw or formatted date).
 */
export function programDirectorCatalogRowMatchesSearch(
  row: ProgramDirectorCatalogRow,
  normalizedQuery: string,
): boolean {
  const q = normalizedQuery
  if (!q) return true

  const formattedDateLc =
    row.showDate ?
      formatShowDateLongYear(row.showDate).toLowerCase()
    : ""

  const hayLower = [
    row.entrySong,
    row.songDisplayName ?? "",
    row.showGroup ?? "",
    row.showSubvenue ?? "",
    row.venueLocation ?? "",
    row.showDate ?? "",
    formattedDateLc,
  ].map((s) => s.toLowerCase())

  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  for (const t of tokens) {
    if (!hayLower.some((h) => h.includes(t))) return false
  }
  return true
}

export function filterProgramDirectorCatalogRows(
  rows: ProgramDirectorCatalogRow[],
  rawQuery: string,
): ProgramDirectorCatalogRow[] {
  const n = normalizeProgramDirectorCatalogSearchQuery(rawQuery)
  if (!n) return rows
  return rows.filter((r) => programDirectorCatalogRowMatchesSearch(r, n))
}
