export function tilesColumnCountForViewportWidth(width: number): number {
  if (width > 1986) return 5
  if (width > 1589) return 4
  if (width > 1191) return 3
  if (width > 794) return 2
  return 1
}

/** Inner song columns for Cover Songs / Miscellaneous Covers (`>` thresholds → 2…8 cols). */
export function coversSongGridColumnCountForViewport(width: number): number {
  if (width > 1780) return 8
  if (width > 1520) return 7
  if (width > 1270) return 6
  if (width > 1020) return 5
  if (width > 770) return 4
  if (width > 510) return 3
  if (width > 270) return 2
  return 1
}

/**
 * Partition songs into balanced vertical columns (↑ then →), so CSS can render
 * them as stacked flex cols without syncing row heights across the row.
 */
export function distributeSongsCoverEightColumns<T>(
  items: readonly T[],
  responsiveColumnBudget: number,
): readonly (readonly T[])[] {
  const n = items.length
  if (n === 0) return []

  const C = Math.min(responsiveColumnBudget, n)
  const base = Math.floor(n / C)
  const rem = n % C
  let off = 0
  const out: T[][] = []
  for (let col = 0; col < C; col++) {
    const h = base + (col < rem ? 1 : 0)
    out.push(items.slice(off, off + h))
    off += h
  }
  return out
}

/** Empty cells in last row only (aligned with `.songs-archive-category-tiles-grid` breakpoints). */
export function trailingEmptySlotsInCategoryGrid(
  itemCount: number,
  columnCount: number,
): number {
  if (columnCount <= 0) return 0
  const r = itemCount % columnCount
  return r === 0 ? 0 : columnCount - r
}

/**
 * Dom order row-major (`grid-auto-flow: row`) so visuals read column-first ↓→
 * like   1 6 11   vs default   1 2 3
 *        2 7 …            4 5 6
 */
export function orderCategoriesColumnMajor<T>(
  items: readonly T[],
  columnCount: number,
): T[] {
  const n = items.length
  if (n <= 1 || columnCount <= 1) return [...items]
  const C = columnCount
  const base = Math.floor(n / C)
  const rem = n % C
  const heights = Array.from({ length: C }, (_, col) =>
    base + (col < rem ? 1 : 0),
  )
  const R = Math.max(...heights)
  const prefixByCol = new Array(C + 1).fill(0)
  for (let col = 0; col < C; col++) {
    prefixByCol[col + 1] = prefixByCol[col] + heights[col]
  }
  const out: T[] = []
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < C; col++) {
      if (row >= heights[col]) continue
      out.push(items[prefixByCol[col] + row])
    }
  }
  return out
}

/** Balance items into `columnCount` vertical stacks (1–5 from `tilesColumnCountForViewportWidth`). */
export function balanceFlowSectionIntoColumns<T>(
  items: readonly T[],
  columnCount: number,
): T[][] {
  const C = Math.max(1, columnCount)
  const cols: T[][] = Array.from({ length: C }, () => [])
  const n = items.length
  if (n === 0) return cols

  const base = Math.floor(n / C)
  const rem = n % C
  let idx = 0
  for (let col = 0; col < C; col++) {
    const h = base + (col < rem ? 1 : 0)
    for (let j = 0; j < h && idx < n; j++) {
      cols[col].push(items[idx]!)
      idx += 1
    }
  }
  return cols
}

export function partitionSongsIntoLeftRightColumns<T>(
  items: readonly T[],
): readonly [readonly T[], readonly T[]] {
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}
