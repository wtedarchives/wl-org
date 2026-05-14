/**
 * Resolves badge artwork: `/public` file (`badge-autumn.png` → `/badge-autumn.png`)
 * or absolute URL (`end_image` / postimg) unchanged.
 */
export function looseEndBadgePublicPath(
  endLocalFile: string | null | undefined
): string | null {
  const raw = endLocalFile?.trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return raw.startsWith("/") ? raw : `/${raw}`
}

export function isLooseEndBadgeRemoteUrl(src: string | null | undefined): boolean {
  if (!src) return false
  return /^https?:\/\//i.test(src.trim())
}
