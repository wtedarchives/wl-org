import type { ShowRelease } from "@/hooks/use-setlist-releases"

export const SERVICE_COLORS: Record<string, string> = {
  youtube: "#ff0033",
  spotify: "#1ed760",
  bandcamp: "#0fa2d1",
}

/** Lowercase key for grouping + sort; empty/missing → `other`. */
export const OTHER_SERVICE_KEY = "other"

export const KNOWN_SERVICE_LABELS: Record<string, string> = {
  bandcamp: "Bandcamp",
  discogs: "Discogs",
  nugs: "Nugs",
  spotify: "Spotify",
  youtube: "YouTube",
}

export function isEmbeddableService(service: string | null): boolean {
  if (!service?.trim()) return false
  const key = service.toLowerCase().trim()
  return key === "bandcamp" || key === "youtube"
}

export function releaseServiceSortKey(release: ShowRelease): string {
  const k = (release.release_service ?? "").trim().toLowerCase()
  return k || OTHER_SERVICE_KEY
}

export function releaseServiceSectionLabel(sortKey: string): string {
  if (sortKey === OTHER_SERVICE_KEY) return "Other"
  return (
    KNOWN_SERVICE_LABELS[sortKey] ??
    sortKey.replace(/^\w/, (c) => c.toUpperCase())
  )
}

export function groupReleasesByService(
  releases: ShowRelease[],
): Map<string, ShowRelease[]> {
  const map = new Map<string, ShowRelease[]>()
  for (const r of releases) {
    const k = releaseServiceSortKey(r)
    const list = map.get(k)
    if (list) list.push(r)
    else map.set(k, [r])
  }
  for (const [, list] of map) {
    list.sort((a, b) => {
      const oa = a.release_order ?? Number.MAX_SAFE_INTEGER
      const ob = b.release_order ?? Number.MAX_SAFE_INTEGER
      if (oa !== ob) return oa - ob
      return a.release_id.localeCompare(b.release_id)
    })
  }
  return map
}
