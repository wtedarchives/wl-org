/**
 * Canonical set-grouping rules for the setlist share card.
 *
 * This module is the single source of truth for how entries group into set
 * runs, what the rail reads, and where set-break / encore dividers fall. It is
 * imported by BOTH runtimes:
 *
 *   - the Next app, via `@/supabase/functions/_shared/setlist-share-card/set-grouping`
 *   - the Deno edge renderer, via a relative `./setlist-share-card/set-grouping.ts`
 *
 * To keep that possible it must stay self-contained: no `@/` aliases, no React,
 * no imports of any kind. `SetGroupingEntry` is the minimal structural shape the
 * rules need, so callers keep their own richer entry types through the generic.
 *
 * The browser card and the posted image are laid out by different engines (DOM
 * tables vs. Satori flexbox), so layout necessarily diverges — but which songs
 * belong to which set must not. That is what lives here.
 */

/** Minimal entry shape these rules read. `SetlistEntry` satisfies it structurally. */
export type SetGroupingEntry = {
  entry_set: string | null | undefined
}

/** Main sets only (numeric set id); encores E1, E2, E3 are not main. */
export function isMainSet(set: string | null | undefined): boolean {
  if (!set) return false
  const s = String(set).trim()
  if (!/^\d+$/.test(s)) return false
  return Number.parseInt(s, 10) >= 1
}

/** Show Set Break bar between two different main sets (e.g. Set 1 → Set 2). */
export function shouldShowSetBreak(
  prevSet: string | null | undefined,
  currSet: string | null | undefined,
): boolean {
  return (
    isMainSet(prevSet) && isMainSet(currSet) && String(prevSet) !== String(currSet)
  )
}

/** Encore bar label from entry_set (E1, E2, E3). Returns "" for unknown. */
export function getEncoreLabel(entrySet: string | null | undefined): string {
  if (!entrySet) return ""
  const s = String(entrySet)
  if (s === "E1") return "Encore"
  if (s === "E2") return "2nd Encore"
  if (s === "E3") return "3rd Encore"
  return ""
}

/** Rail text for a run. Short forms when the run is too short to fit a word. */
export function railLabelForEntrySet(
  entrySet: string | null | undefined,
  runSpan: number,
): string {
  if (!entrySet) return ""
  const single = runSpan === 1
  if (entrySet.startsWith("E")) {
    const s = String(entrySet)
    if (runSpan <= 2) {
      if (s === "E1") return "E1"
      if (s === "E2") return "E2"
      if (s === "E3") return "E3"
      return getEncoreLabel(entrySet) || s
    }
    if (runSpan === 3) {
      if (s === "E1") return "Encore"
      if (s === "E2") return "Encore 2"
      if (s === "E3") return "Encore 3"
      return getEncoreLabel(entrySet) || s
    }
    return getEncoreLabel(entrySet) || s
  }
  if (single) return `S${entrySet}`
  return `Set ${entrySet}`
}

export type ShareExportRow<E extends SetGroupingEntry = SetGroupingEntry> = {
  entry: E
  index: number
  isFirstOfRun: boolean
  isLastOfRun: boolean
  runSpan: number
  /** Table-layout only: `rowSpan` for the rail cell. Unused by the flex renderer. */
  railRowSpan: number
  railLabel: string | null
}

/**
 * Per-entry run metadata, in setlist order.
 *
 * `railRowSpan` exists for the DOM table (`<td rowSpan>`); the Satori renderer
 * ignores it and uses {@link groupShareExportRuns} instead.
 */
export function buildShareExportRows<E extends SetGroupingEntry>(
  setlist: E[],
  showDiscographySetUi: boolean,
  hasSinglePlacementType: boolean,
): ShareExportRow<E>[] {
  return setlist.map((entry, i) => {
    const isFirstOfRun = i === 0 || setlist[i - 1]!.entry_set !== entry.entry_set
    const isLastOfRun =
      i === setlist.length - 1 || setlist[i + 1]!.entry_set !== entry.entry_set

    let runSpan = 1
    if (isFirstOfRun) {
      for (let j = i + 1; j < setlist.length; j++) {
        if (setlist[j]!.entry_set === entry.entry_set) runSpan++
        else break
      }
    }

    let railRowSpan = runSpan
    if (isFirstOfRun && runSpan > 1) {
      let dividerRowsBetweenSameSet = 0
      for (let j = i + 1; j < i + runSpan; j++) {
        dividerRowsBetweenSameSet += dividersBeforeIndex(
          setlist,
          j,
          showDiscographySetUi,
          hasSinglePlacementType,
        ).length
      }
      railRowSpan = runSpan + dividerRowsBetweenSameSet
    }

    return {
      entry,
      index: i,
      isFirstOfRun,
      isLastOfRun,
      runSpan,
      railRowSpan,
      railLabel: isFirstOfRun ? railLabelForEntrySet(entry.entry_set, runSpan) : null,
    }
  })
}

export type ShareExportDividerVariant = "encore" | "set-break"

/** Which divider bars sit immediately above `setlist[i]`, in render order. */
export function dividersBeforeIndex<E extends SetGroupingEntry>(
  setlist: E[],
  i: number,
  showDiscographySetUi: boolean,
  hasSinglePlacementType: boolean,
): ShareExportDividerVariant[] {
  if (i <= 0) return []
  if (!showDiscographySetUi || hasSinglePlacementType) return []

  const prev = setlist[i - 1]!
  const curr = setlist[i]!
  const out: ShareExportDividerVariant[] = []

  if (
    !!curr.entry_set?.startsWith("E") &&
    (!prev.entry_set?.startsWith("E") || prev.entry_set !== curr.entry_set) &&
    !!getEncoreLabel(curr.entry_set)
  ) {
    out.push("encore")
  }
  if (shouldShowSetBreak(prev.entry_set, curr.entry_set)) {
    out.push("set-break")
  }
  return out
}

export type ShareExportDivider = {
  kind: "divider"
  variant: ShareExportDividerVariant
  key: string
}

export type ShareExportSong<E extends SetGroupingEntry> = {
  kind: "song"
  row: ShareExportRow<E>
}

/** One set run: a rail plus the songs (and any in-run dividers) beside it. */
export type ShareExportRun<E extends SetGroupingEntry> = {
  kind: "run"
  key: string
  railLabel: string
  isEncore: boolean
  items: Array<ShareExportSong<E> | ShareExportDivider>
}

export type ShareExportBlock<E extends SetGroupingEntry> =
  | ShareExportRun<E>
  | ShareExportDivider

/**
 * The same rows, restructured for flexbox.
 *
 * The DOM card spans the rail across rows with `<td rowSpan>`, which Satori has
 * no equivalent for. Here each run becomes a horizontal block — rail beside a
 * stack of songs — and dividers that fall *between* runs are hoisted out to
 * full width, matching where the table renders them.
 */
export function groupShareExportRuns<E extends SetGroupingEntry>(
  setlist: E[],
  rows: ShareExportRow<E>[],
  showDiscographySetUi: boolean,
  hasSinglePlacementType: boolean,
): ShareExportBlock<E>[] {
  const blocks: ShareExportBlock<E>[] = []
  let current: ShareExportRun<E> | null = null

  rows.forEach((row, i) => {
    const dividers = dividersBeforeIndex(
      setlist,
      i,
      showDiscographySetUi,
      hasSinglePlacementType,
    ).map<ShareExportDivider>((variant) => ({
      kind: "divider",
      variant,
      key: `divider-${i}-${variant}`,
    }))

    if (row.isFirstOfRun) {
      // Between runs: the bar spans the full card, outside any rail.
      for (const d of dividers) blocks.push(d)
      current = {
        kind: "run",
        key: `run-${i}`,
        railLabel: row.railLabel ?? String(row.entry.entry_set ?? ""),
        isEncore: !!row.entry.entry_set?.startsWith("E"),
        items: [],
      }
      blocks.push(current)
    } else {
      // Within a run: the bar sits beside the rail, not above it.
      for (const d of dividers) current?.items.push(d)
    }

    current?.items.push({ kind: "song", row })
  })

  return blocks
}
