/**
 * Default placement label for a set name, matching the admin setlist entry modal
 * (`useSetlistEntryForm` / Basic Info) when set changes.
 *
 * Examples: `"1"` → `"Main Set 1"`, `"Set 2"` → `"Main Set 2"`, `"E1"` → `"Encore 1"`.
 */
export function getDefaultPlacementForSet(
  setName: string | null | undefined,
): string | null {
  if (!setName || setName === "--") return null
  const mainSetMatch = setName.match(/^(?:Set )?(\d)$/)
  if (mainSetMatch) return `Main Set ${mainSetMatch[1]}`
  const encoreMatch = setName.match(/^E(\d)$/)
  if (encoreMatch) return `Encore ${encoreMatch[1]}`
  return null
}
