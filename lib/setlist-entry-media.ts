import {
  compareServiceSectionKeys,
  hasKnownServiceIcon,
  OTHER_SERVICE_KEY,
  releaseServiceSortKey,
} from "@/components/dpro/setlist/setlist-media-section.model"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import { normalizeBandcampUrl } from "@/lib/normalize-bandcamp-url"
import type { BandcampEntryTrack, SetlistEntry } from "@/types/setlist"

export function isFullShowRelease(release: ShowRelease): boolean {
  return (release.release_displayname ?? "").trim().toLowerCase() === "full show"
}

export function compareReleasesForEntryMedia(
  a: ShowRelease,
  b: ShowRelease,
): number {
  const aFull = isFullShowRelease(a) ? 1 : 0
  const bFull = isFullShowRelease(b) ? 1 : 0
  if (aFull !== bFull) return aFull - bFull
  const orderDiff =
    (a.release_order ?? Number.POSITIVE_INFINITY) -
    (b.release_order ?? Number.POSITIVE_INFINITY)
  if (orderDiff !== 0) return orderDiff
  return a.release_id.localeCompare(b.release_id)
}

/** One release per known service, using the same Full Show / order priority as YouTube. */
export function pickChosenReleasesByService(
  releases: ShowRelease[],
): ShowRelease[] {
  const byService = new Map<string, ShowRelease[]>()
  for (const release of releases) {
    const key = releaseServiceSortKey(release)
    if (key === OTHER_SERVICE_KEY || !hasKnownServiceIcon(key)) continue
    if (key === "youtube" && !release.release_link) continue
    const list = byService.get(key)
    if (list) list.push(release)
    else byService.set(key, [release])
  }
  const chosen: ShowRelease[] = []
  for (const list of byService.values()) {
    const best = [...list].sort(compareReleasesForEntryMedia)[0]
    if (best) chosen.push(best)
  }
  chosen.sort((a, b) =>
    compareServiceSectionKeys(
      releaseServiceSortKey(a),
      releaseServiceSortKey(b),
    ),
  )
  return chosen
}

export type SetlistEntryMediaIconItem = {
  service: string
  bandcampTrack: BandcampEntryTrack | null
  release: ShowRelease | null
}

/**
 * Icons to show in the setlist Media column: one per service.
 * A `bandcamp_tracks` row wins over a Bandcamp album release.
 */
export function collectSetlistEntryMediaIcons(
  entries: SetlistEntry[],
): SetlistEntryMediaIconItem[] {
  const byService = new Map<string, SetlistEntryMediaIconItem>()

  for (const entry of entries) {
    if (!entry.bandcampTrack || byService.has("bandcamp")) continue
    byService.set("bandcamp", {
      service: "bandcamp",
      bandcampTrack: entry.bandcampTrack,
      release: null,
    })
  }

  for (const entry of entries) {
    for (const release of entry.mediaReleases ?? []) {
      const key = releaseServiceSortKey(release)
      if (key === OTHER_SERVICE_KEY || !hasKnownServiceIcon(key)) continue
      if (byService.has(key)) continue
      byService.set(key, {
        service: key,
        bandcampTrack: null,
        release,
      })
    }
  }

  for (const entry of entries) {
    if (!entry.youtubeRelease || byService.has("youtube")) continue
    byService.set("youtube", {
      service: "youtube",
      bandcampTrack: null,
      release: entry.youtubeRelease,
    })
  }

  return [...byService.values()].sort((a, b) =>
    compareServiceSectionKeys(a.service, b.service),
  )
}

export function entryHasMediaColumnIcons(entry: SetlistEntry): boolean {
  return collectSetlistEntryMediaIcons([entry]).length > 0
}

export function getSetlistMediaReleaseHref(
  release: ShowRelease,
): string | null {
  const raw = release.release_link?.trim()
  if (!raw) return null
  return normalizeBandcampUrl(raw) ?? raw
}
