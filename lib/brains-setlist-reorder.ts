/**
 * Drag-to-reorder maths for the brains setlist.
 *
 * Adapted from `lib/admin-radio-episode-setlist-entries-dnd.ts`, which solves the
 * same problem for the Radio episode table (set-scoped blocks, renumber after a
 * drop). The differences: this writes `entry_set` / `entry_setnum` on
 * `setlist_entries` rather than the episode draft fields, and it saves on drop
 * instead of accumulating a dirty draft — unsaved reordering in a browser tab at a
 * concert is a liability.
 *
 * Pure functions: no React, no network, so the renumbering can be reasoned about
 * on its own.
 */

import { arrayMove } from "@dnd-kit/sortable"

import { getDefaultPlacementForSet } from "@/lib/setlist-default-placement"

export interface BrainsReorderRow {
  entry_id: string
  entry_set: string
  entry_setnum: number
  entry_placement?: string | null
}

/**
 * Display order: set ascending, then position within the set.
 *
 * A plain text sort on `entry_set` is already correct — the `sets` table holds
 * `1`–`8` and `E1`–`E3`, and digits sort before letters, so main sets precede
 * encores without a lookup table. This matches how `use-admin-setlist` and the
 * public show page both order entries.
 */
export function sortBrainsEntries<T extends BrainsReorderRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.entry_set !== b.entry_set) return a.entry_set < b.entry_set ? -1 : 1
    return a.entry_setnum - b.entry_setnum
  })
}

/** Renumber each set 1..n following list order. */
function renumberWithinSets<T extends BrainsReorderRow>(ordered: T[]): T[] {
  const counters = new Map<string, number>()
  return ordered.map((row) => {
    const next = (counters.get(row.entry_set) ?? 0) + 1
    counters.set(row.entry_set, next)
    return next === row.entry_setnum ? row : { ...row, entry_setnum: next }
  })
}

export interface BrainsDragResult<T extends BrainsReorderRow> {
  /** The full list in its new order, with setnums renumbered. */
  next: T[]
  /**
   * Only the rows whose set or setnum actually moved. A drag near the bottom of a
   * set renumbers just that tail, so the write stays small.
   */
  changed: BrainsReorderRow[]
}

/**
 * Move `activeId` to where `overId` sits and renumber.
 *
 * A row dropped among a different set adopts that set, which is how cross-set
 * dragging reassigns set, number AND placement in one gesture.
 *
 * Placement follows via `getDefaultPlacementForSet` — the same helper the entry
 * modal uses when a set is changed by hand, so a dragged row and a hand-edited row
 * agree. When that helper cannot name a default (an unrecognised set), the existing
 * placement is kept rather than blanked; the SQL side coalesces for the same reason.
 */
export function applyBrainsDrag<T extends BrainsReorderRow>(
  ordered: T[],
  activeId: string,
  overId: string,
): BrainsDragResult<T> {
  const from = ordered.findIndex((r) => r.entry_id === activeId)
  const to = ordered.findIndex((r) => r.entry_id === overId)
  if (from < 0 || to < 0 || from === to) return { next: ordered, changed: [] }

  const targetSet = ordered[to].entry_set
  const moved = ordered.map((r) => {
    if (r.entry_id !== activeId || r.entry_set === targetSet) return r
    const derived = getDefaultPlacementForSet(targetSet)
    return {
      ...r,
      entry_set: targetSet,
      entry_placement: derived ?? r.entry_placement ?? null,
    }
  })

  const next = renumberWithinSets(arrayMove(moved, from, to))

  const before = new Map(
    ordered.map((r) => [r.entry_id, r] as const),
  )
  const changed: BrainsReorderRow[] = []
  for (const row of next) {
    const prev = before.get(row.entry_id)
    const placementMoved =
      (prev?.entry_placement ?? null) !== (row.entry_placement ?? null)
    if (
      !prev ||
      prev.entry_set !== row.entry_set ||
      prev.entry_setnum !== row.entry_setnum ||
      placementMoved
    ) {
      changed.push({
        entry_id: row.entry_id,
        entry_set: row.entry_set,
        entry_setnum: row.entry_setnum,
        // Only sent when it actually moved, so a plain within-set renumber does
        // not rewrite placements it has no opinion about.
        entry_placement: placementMoved ? (row.entry_placement ?? null) : null,
      })
    }
  }

  return { next, changed }
}

/**
 * The set and number a newly added entry should default to: the end of whichever
 * set the setlist currently finishes in, or Set 1 for an empty show.
 *
 * This is why the entry form never asks for a set number in the normal case —
 * appending during a live show should take zero decisions.
 */
export function nextBrainsSlot(
  ordered: BrainsReorderRow[],
  preferredSet?: string | null,
): { entry_set: string; entry_setnum: number } {
  const set =
    preferredSet?.trim() ||
    (ordered.length > 0 ? ordered[ordered.length - 1].entry_set : "1")
  const highest = ordered
    .filter((r) => r.entry_set === set)
    .reduce((max, r) => Math.max(max, r.entry_setnum), 0)
  return { entry_set: set, entry_setnum: highest + 1 }
}
