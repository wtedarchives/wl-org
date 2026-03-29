/**
 * Utilities for the Setlist Game (Setlist Game).
 */

/** Format date for display (MM.DD.YY). Re-export for convenience. */
export { formatSetlistDate as formatSetlistGameDate } from "@/lib/setlist-utils"

/** Get text color class for over/under picks based on value. */
export function getOverUnderTextColor(
  averageOverUnder: number | undefined,
  showScored: boolean
): string {
  if (!showScored || averageOverUnder === undefined) return "text-muted-foreground"
  if (averageOverUnder > 0) return "text-destructive"
  if (averageOverUnder < 0) return "text-green-600"
  return "text-muted-foreground"
}

/** Format over/under value with appropriate sign. */
export function formatOverUnderValue(
  averageOverUnder: number | undefined,
  showScored: boolean
): string {
  if (!showScored || averageOverUnder === undefined) return ""
  return (averageOverUnder > 0 ? "+" : "") + averageOverUnder.toFixed(2)
}
