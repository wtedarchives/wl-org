/**
 * Visual set organizers for wted-brains, plus the placement options that belong
 * to each set.
 *
 * Set keys match `sets.set`. Brains only offers Set 1–3 and Encore 1–2 as
 * organizers; existing rows in other sets still display if they are already on
 * the show.
 */

export const BRAINS_SET_DROPPABLE_PREFIX = "brains-set:" as const

/** Sets a brains caller may add as organizers: Set 1–3 and Encore 1–2. */
export const BRAINS_ALL_SETS = ["1", "2", "3", "E1", "E2"] as const

/** The only categories a setlister may assign to a newly created song. */
export const BRAINS_NEW_SONG_CATEGORIES = [
  { label: "Goose Original", value: "Unreleased / Miscellaneous" },
  { label: "Cover Songs", value: "Cover Songs" },
] as const

export type BrainsNewSongCategoryValue =
  (typeof BRAINS_NEW_SONG_CATEGORIES)[number]["value"]

export function brainsSetDroppableId(set: string): string {
  return `${BRAINS_SET_DROPPABLE_PREFIX}${set}`
}

export function parseBrainsSetDroppableId(id: string): string | null {
  if (!id.startsWith(BRAINS_SET_DROPPABLE_PREFIX)) return null
  const set = id.slice(BRAINS_SET_DROPPABLE_PREFIX.length)
  return set === "" ? null : set
}

export function isEncoreSet(set: string): boolean {
  return /^E\d+$/.test(set)
}

/** `1` → "Set 1", `E1` → "Encore 1". */
export function formatBrainsSetLabel(set: string): string {
  if (isEncoreSet(set)) return `Encore ${set.slice(1)}`
  if (/^\d+$/.test(set)) return `Set ${set}`
  return set
}

function setRank(set: string): number {
  if (/^\d+$/.test(set)) return Number(set)
  if (isEncoreSet(set)) return 100 + Number(set.slice(1))
  return 1000
}

export function compareBrainsSets(a: string, b: string): number {
  const diff = setRank(a) - setRank(b)
  return diff !== 0 ? diff : a < b ? -1 : a > b ? 1 : 0
}

export function sortBrainsSetKeys(sets: Iterable<string>): string[] {
  return [...new Set(sets)].sort(compareBrainsSets)
}

/**
 * Placement labels that are valid for a song sitting in `set`.
 *
 * Unknown labels in `allPlacements` are ignored so a stale client cannot offer
 * a value the archive no longer has.
 */
export function placementsForSet(
  set: string,
  allPlacements: readonly string[],
): string[] {
  const allowed = new Set(allPlacements)
  if (isEncoreSet(set)) {
    const label = `Encore ${set.slice(1)}`
    return allowed.has(label) ? [label] : []
  }
  return [`Set ${set} Opener`, `Main Set ${set}`, `Set ${set} Closer`].filter(
    (label) => allowed.has(label),
  )
}

/**
 * Placement for a newly added song, or a song that just changed sets.
 *
 * First song in a main set → opener. Everything else in that set → Main Set N.
 * Encores have no opener/closer rows, so they always get Encore N.
 */
export function defaultPlacementForNewSong(
  set: string,
  isFirstInSet: boolean,
): string {
  if (isEncoreSet(set)) return `Encore ${set.slice(1)}`
  if (isFirstInSet) return `Set ${set} Opener`
  return `Main Set ${set}`
}
