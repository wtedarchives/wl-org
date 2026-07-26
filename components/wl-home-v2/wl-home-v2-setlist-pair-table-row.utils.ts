import {
  getLastCountBadgeStyle,
  getSetlistEntrySongSpreadCategoryKey,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  buildPairCoachNotesCollapsedHtml,
  mergePairGuests,
  pairCombinedLength,
  pairCombinedRarity,
  pairHasWted,
  pairPlacementBarTokens,
  pairSharedLastCount,
  pairSharedTourCount,
} from "@/lib/song-pairs"
import {
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import type { SetlistEntry } from "@/types/setlist"

export function deriveWlHomeV2SetlistPairTableRowState({
  entries,
  copiedEntryIds,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
}: {
  entries: SetlistEntry[]
  copiedEntryIds?: Set<string>
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
}) {
  const primaryEntry = entries[0]!
  const mergedGuests = mergePairGuests(entries)
  const coachCollapsedHtml = buildPairCoachNotesCollapsedHtml(entries)
  const combinedLength = pairCombinedLength(entries)
  const hasWted = pairHasWted(entries)
  const wtedProxyEntry = entries.find((e) => e.radio_id) ?? primaryEntry
  const hasBandcamp = entries.some((e) => !!e.bandcampTrack)
  const bandcampProxyEntry =
    entries.find((e) => e.bandcampTrack) ?? primaryEntry

  const barPlacementTokens = pairPlacementBarTokens(entries)
  const isCopied = entries.some((e) => copiedEntryIds?.has(e.entry_id))

  const entryIdsForRelease = hoveredReleaseId
    ? releaseToEntriesMap?.[hoveredReleaseId]
    : undefined
  const isOnHoveredRelease = entries.some((e) =>
    entryIdsForRelease?.has(e.entry_id),
  )
  const shouldReleaseHighlight = !!hoveredReleaseId && isOnHoveredRelease
  const shouldReleaseDim = !!hoveredReleaseId && !isOnHoveredRelease

  const shouldCategoryHighlight =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    entries.some(
      (e) => getSetlistEntrySongSpreadCategoryKey(e) === hoveredCategory,
    )
  const shouldCategoryDim =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    !entries.some(
      (e) => getSetlistEntrySongSpreadCategoryKey(e) === hoveredCategory,
    )

  const guestProxyEntry: SetlistEntry = {
    ...primaryEntry,
    guests: mergedGuests,
  }

  const sharedLastCount = pairSharedLastCount(entries)
  const sharedTourCount = pairSharedTourCount(entries)
  const combinedRarity = pairCombinedRarity(entries)
  const lastBadgeStyle = getLastCountBadgeStyle(sharedLastCount)
  const rarityPillBackground = getRarityPillBackground(combinedRarity)
  const rarityPillBorderColor = getRarityColor(combinedRarity)

  return {
    primaryEntry,
    mergedGuests,
    coachCollapsedHtml,
    combinedLength,
    hasWted,
    wtedProxyEntry,
    hasBandcamp,
    bandcampProxyEntry,
    barPlacementTokens,
    isCopied,
    shouldReleaseHighlight,
    shouldReleaseDim,
    shouldCategoryHighlight,
    shouldCategoryDim,
    guestProxyEntry,
    sharedLastCount,
    sharedTourCount,
    combinedRarity,
    lastBadgeStyle,
    rarityPillBackground,
    rarityPillBorderColor,
  }
}
