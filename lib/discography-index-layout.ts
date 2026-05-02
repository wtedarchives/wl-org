import { DISCOGRAPHY_PUBLIC_CATEGORIES } from "@/lib/discography-public"
import { DESKTOP_CONTENT_MIN_WIDTH } from "@/hooks/use-mobile"

/**
 * Column count for the discography index, aligned with previous Tailwind grid:
 * `min-[1024px]:2`, 3 cols at {@link DESKTOP_CONTENT_MIN_WIDTH}+, `min-[1440px]:4`, `min-[1860px]:5`.
 */
export function discographyIndexColumnCount(viewportWidth: number): number {
  if (viewportWidth >= 1860) return 5
  if (viewportWidth >= 1440) return 4
  if (viewportWidth >= DESKTOP_CONTENT_MIN_WIDTH) return 3
  if (viewportWidth >= 1024) return 2
  return 1
}

/**
 * Row-major packing: category order is `DISCOGRAPHY_PUBLIC_CATEGORIES` (1…5 left
 * to right on the first row, then wrap). Index `i` lands in column `i % columnCount`.
 */
export function discographyCategoriesByColumn(
  columnCount: number,
): string[][] {
  const n = Math.max(1, columnCount)
  const cols: string[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < DISCOGRAPHY_PUBLIC_CATEGORIES.length; i++) {
    cols[i % n].push(DISCOGRAPHY_PUBLIC_CATEGORIES[i])
  }
  return cols
}
