/** Map legacy `/old/archive/...` URLs to routes under `/archive` on the new shell. */
export function archiveV2NavHref(legacyOrPath: string): string {
  if (legacyOrPath.startsWith("/old/archive")) {
    return `/archive${legacyOrPath.slice("/old/archive".length)}`
  }
  return legacyOrPath
}
