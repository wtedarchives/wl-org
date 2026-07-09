export type ArchivePrefetchKind = "setlist" | "song" | "tour"

export interface ArchivePrefetchTarget {
  kind: ArchivePrefetchKind
  id: string
}

const PATH_KIND: Record<string, ArchivePrefetchKind> = {
  "/archive/setlist": "setlist",
  "/archive/song": "song",
  "/archive/tours": "tour",
}

/** Parse `/archive/{setlist|song|tours}?id=` hrefs for hover prefetch. */
export function parseArchivePrefetchTarget(
  href: string,
): ArchivePrefetchTarget | null {
  if (!href.startsWith("/archive/")) return null

  try {
    const url = new URL(href, "https://local.invalid")
    const id = url.searchParams.get("id")?.trim()
    if (!id) return null

    const kind = PATH_KIND[url.pathname]
    if (!kind) return null

    return { kind, id }
  } catch {
    return null
  }
}
