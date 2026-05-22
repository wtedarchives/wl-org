/**
 * Utilities for the Setlist Game (Setlist Game).
 */

/** Format date for display (MM.DD.YY). Re-export for convenience. */
export { formatSetlistDate as formatSetlistGameDate } from "@/lib/setlist-utils"

/** Get text color class for over/under picks based on value. */
export function getOverUnderTextColor(
  averageOverUnder: number | undefined,
  showScored: boolean,
  wlV2 = false,
): string {
  if (!showScored || averageOverUnder === undefined) {
    return wlV2 ?
        "setlist-game-over-under-value--muted"
      : "text-muted-foreground"
  }
  if (averageOverUnder > 0) {
    return wlV2 ?
        "setlist-game-over-under-value--positive"
      : "text-green-600 dark:text-green-400"
  }
  if (averageOverUnder < 0) {
    return wlV2 ?
        "setlist-game-over-under-value--negative"
      : "text-destructive"
  }
  return wlV2 ?
      "setlist-game-over-under-value--muted"
    : "text-muted-foreground"
}

/** Format over/under value with appropriate sign. */
export function formatOverUnderValue(
  averageOverUnder: number | undefined,
  showScored: boolean
): string {
  if (!showScored || averageOverUnder === undefined) return ""
  return (averageOverUnder > 0 ? "+" : "") + averageOverUnder.toFixed(2)
}
