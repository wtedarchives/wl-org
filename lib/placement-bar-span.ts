import {
  getPlacementBarCssToken,
  isSpannablePlacementBarToken,
} from "@/lib/placement-bar-color"
import {
  pairPlacementBarTokens,
  tableRowEntrySet,
  type SetlistTableRowItem,
} from "@/lib/song-pairs"

export type PlacementBarSpanRole = "start" | "middle" | "end"

function spannableKeyForRow(row: SetlistTableRowItem): string | null {
  const tokens =
    row.type === "single" ?
      [getPlacementBarCssToken(row.entry.entry_placement)]
    : pairPlacementBarTokens(row.entries)
  if (tokens.length !== 1) return null
  const token = tokens[0]!
  if (!isSpannablePlacementBarToken(token)) return null
  return `${tableRowEntrySet(row)}::${token}`
}

/**
 * Consecutive same-set closer or encore bars join into one capsule.
 * Solo bars stay inset; runs of 2+ get start / middle / end.
 */
export function computePlacementBarSpanRoles(
  rows: SetlistTableRowItem[],
): Array<PlacementBarSpanRole | null> {
  const keys = rows.map(spannableKeyForRow)
  const roles: Array<PlacementBarSpanRole | null> = rows.map(() => null)

  let i = 0
  while (i < keys.length) {
    const key = keys[i]
    if (!key) {
      i++
      continue
    }
    let end = i + 1
    while (end < keys.length && keys[end] === key) end++
    if (end - i >= 2) {
      roles[i] = "start"
      for (let k = i + 1; k < end - 1; k++) roles[k] = "middle"
      roles[end - 1] = "end"
    }
    i = end
  }

  return roles
}

export function placementBarSpanClassName(
  role: PlacementBarSpanRole | null | undefined,
): string | undefined {
  if (role === "start") return "bar--span-start"
  if (role === "middle") return "bar--span-middle"
  if (role === "end") return "bar--span-end"
  return undefined
}
