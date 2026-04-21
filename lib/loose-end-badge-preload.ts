import { looseEndBadgePublicPath } from "@/lib/loose-end-badge-path"
import type { GroupedLooseEnds, LooseEndRow } from "@/types/loose-ends"

/** Fire-and-forget decode into the image cache while other work continues (client only). */
export function preloadLooseEndBadgeArtwork(
  endLocalFiles: (string | null | undefined)[],
): void {
  if (typeof window === "undefined") return
  const urls = new Set<string>()
  for (const f of endLocalFiles) {
    const path = looseEndBadgePublicPath(f)
    if (path) urls.add(path)
  }
  for (const url of urls) {
    const img = new Image()
    img.src = url
  }
}

export function preloadLooseEndBadgeArtworkFromRows(rows: LooseEndRow[]): void {
  preloadLooseEndBadgeArtwork(rows.map((r) => r.end_local_file))
}

export function preloadLooseEndBadgeArtworkFromGrouped(
  grouped: GroupedLooseEnds,
  categoryOrder: string[],
): void {
  const files: (string | null | undefined)[] = []
  for (const cat of categoryOrder) {
    for (const le of grouped[cat] ?? []) {
      files.push(le.end_local_file)
    }
  }
  preloadLooseEndBadgeArtwork(files)
}
