/** Maps `looseends.end_local_file` (e.g. `badge-autumn.png`) to a `/public` URL. */
export function looseEndBadgePublicPath(
  endLocalFile: string | null | undefined
): string | null {
  const raw = endLocalFile?.trim()
  if (!raw) return null
  return raw.startsWith("/") ? raw : `/${raw}`
}
