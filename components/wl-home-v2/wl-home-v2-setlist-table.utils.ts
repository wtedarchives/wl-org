import { getEncoreLabel } from "@/lib/setlist-utils"

/**
 * Vertical rail label for `entry_set`. Main sets: `S{n}` / `Set n`. Encores:
 * - 1 song: `E1` / `E2` / `E3`
 * - 2 songs: `Encore` / `Encore 2` / `Encore 3`
 * - 3+ songs: `Encore` / `2nd Encore` / `3rd Encore` (`getEncoreLabel`)
 */
export function railLabelForEntrySet(
  entrySet: string | null | undefined,
  runSpan: number,
): string {
  if (!entrySet) return ""
  const single = runSpan === 1
  if (entrySet.startsWith("E")) {
    const s = String(entrySet)
    if (runSpan === 1) {
      if (s === "E1") return "E1"
      if (s === "E2") return "E2"
      if (s === "E3") return "E3"
      return getEncoreLabel(entrySet) || s
    }
    if (runSpan === 2) {
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
