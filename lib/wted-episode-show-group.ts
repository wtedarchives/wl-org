import type { WtedEpisodeTableRow } from "@/types/wted-episode"

/** Normalized key for grouping and hover (empty = no group on the show). */
export function wtedEpisodeShowGroupKey(
  showGroup: string | null | undefined,
): string {
  return (showGroup ?? "").trim()
}

/** True when rows reference more than one distinct `show_group` value. */
export function wtedEpisodeHasMultipleShowGroups(
  rows: WtedEpisodeTableRow[],
): boolean {
  const keys = new Set<string>()
  for (const row of rows) {
    keys.add(wtedEpisodeShowGroupKey(row.showGroup))
    if (keys.size > 1) return true
  }
  return false
}
