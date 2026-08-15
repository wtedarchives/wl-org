/**
 * Drag-to-reorder maths for the brains setlist.
 *
 * Visual sets are separate droppables. A drop onto another row, or onto an empty
 * set, writes `entry_set` / `entry_setnum` (and placement when the set changes).
 * Saves happen on drop rather than as a dirty draft — unsaved reordering in a
 * browser tab at a concert is a liability.
 *
 * Pure functions: no React, no network.
 */

import { arrayMove } from "@dnd-kit/sortable"

import {
  defaultPlacementForNewSong,
  parseBrainsSetDroppableId,
  sortBrainsSetKeys,
} from "@/lib/brains-sets"

export interface BrainsReorderRow {
  entry_id: string
  entry_set: string
  entry_setnum: number
  entry_placement?: string | null
}

/**
 * Display order: set ascending, then position within the set.
 *
 * A plain text sort on `entry_set` is already correct for `1`–`8` / `E1`–`E3`
 * (digits before letters). `sortBrainsSetKeys` is used when reconstructing after
 * a move so empty visual sets are not required to have rows.
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

function diffChanged<T extends BrainsReorderRow>(
  beforeRows: T[],
  next: T[],
): BrainsReorderRow[] {
  const before = new Map(beforeRows.map((r) => [r.entry_id, r] as const))
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
  return changed
}

function flattenBySet<T extends BrainsReorderRow>(
  rows: T[],
  destSet: string,
  destRows: T[],
): T[] {
  const bySet = new Map<string, T[]>()
  for (const row of rows) {
    if (row.entry_set === destSet) continue
    const list = bySet.get(row.entry_set)
    if (list) list.push(row)
    else bySet.set(row.entry_set, [row])
  }
  bySet.set(destSet, destRows)
  const keys = sortBrainsSetKeys(bySet.keys())
  return keys.flatMap((key) => bySet.get(key) ?? [])
}

/**
 * Move `activeId` into `destSet` at `destIndexInSet` (index in that set after
 * the active row has been removed), then renumber.
 *
 * Crossing sets restamps placement: first song in a main set becomes the opener,
 * otherwise Main Set N / Encore N. Within-set moves keep the existing placement.
 */
export function applyBrainsMove<T extends BrainsReorderRow>(
  ordered: T[],
  activeId: string,
  destSet: string,
  destIndexInSet: number,
): BrainsDragResult<T> {
  const from = ordered.findIndex((r) => r.entry_id === activeId)
  if (from < 0) return { next: ordered, changed: [] }
  const active = ordered[from]

  const without = ordered.filter((r) => r.entry_id !== activeId)
  const destItems = without.filter((r) => r.entry_set === destSet)
  const clamped = Math.max(0, Math.min(destIndexInSet, destItems.length))

  const setChanged = active.entry_set !== destSet
  const moved: T = setChanged
    ? {
        ...active,
        entry_set: destSet,
        entry_placement: defaultPlacementForNewSong(destSet, clamped === 0),
      }
    : { ...active, entry_set: destSet }

  const destRows = [
    ...destItems.slice(0, clamped),
    moved,
    ...destItems.slice(clamped),
  ]
  const next = renumberWithinSets(flattenBySet(without, destSet, destRows))
  return { next, changed: diffChanged(ordered, next) }
}

/**
 * Translate a dnd-kit `over` id into a destination for `applyBrainsMove`.
 *
 * `overId` is either an entry id or a `brains-set:{key}` droppable (empty set,
 * or the set body itself). Dropping on a set body appends.
 */
export function destFromDragOver(
  ordered: BrainsReorderRow[],
  activeId: string,
  overId: string,
): { set: string; indexInSet: number } | null {
  const asSet = parseBrainsSetDroppableId(overId)
  if (asSet) {
    const count = ordered.filter(
      (r) => r.entry_set === asSet && r.entry_id !== activeId,
    ).length
    return { set: asSet, indexInSet: count }
  }

  const overRow = ordered.find((r) => r.entry_id === overId)
  if (!overRow) return null

  const destItems = ordered.filter((r) => r.entry_set === overRow.entry_set)
  const overIndex = destItems.findIndex((r) => r.entry_id === overId)
  if (overIndex < 0) return null

  return { set: overRow.entry_set, indexInSet: overIndex }
}

/**
 * Same-set drops use arrayMove on the including list so the index matches what
 * dnd-kit reports (the `over` item's index before the active row is removed).
 */
export function applyBrainsDrag<T extends BrainsReorderRow>(
  ordered: T[],
  activeId: string,
  overId: string,
): BrainsDragResult<T> {
  const dest = destFromDragOver(ordered, activeId, overId)
  if (!dest) return { next: ordered, changed: [] }

  const active = ordered.find((r) => r.entry_id === activeId)
  if (!active) return { next: ordered, changed: [] }

  if (active.entry_set === dest.set && !parseBrainsSetDroppableId(overId)) {
    const destItems = ordered.filter((r) => r.entry_set === dest.set)
    const fromIndex = destItems.findIndex((r) => r.entry_id === activeId)
    const overIndex = destItems.findIndex((r) => r.entry_id === overId)
    if (fromIndex < 0 || overIndex < 0 || fromIndex === overIndex) {
      return { next: ordered, changed: [] }
    }
    const movedDest = arrayMove(destItems, fromIndex, overIndex)
    const withoutDest = ordered.filter((r) => r.entry_set !== dest.set)
    const next = renumberWithinSets(
      flattenBySet(withoutDest, dest.set, movedDest),
    )
    return { next, changed: diffChanged(ordered, next) }
  }

  return applyBrainsMove(ordered, activeId, dest.set, dest.indexInSet)
}

/**
 * The set and number a newly added entry should default to: the end of the
 * chosen set, or Set 1 for an empty show.
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
