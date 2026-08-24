import type { ReleaseToEntriesMap, ShowRelease } from "@/hooks/use-setlist-releases"
import type { PlacementBarSpanRole } from "@/lib/placement-bar-span"
import type { SetlistTreeChrome } from "@/lib/song-pairs"
import type { SetlistEntry } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

export type WlHomeV2SetlistPairTableRowProps = {
  pair: SongPair
  entries: SetlistEntry[]
  displayNumber: number | null
  showCanonColumns: boolean
  showWtedColumn: boolean
  showMediaColumn: boolean
  showTimeColumn: boolean
  showCoachColumn: boolean
  isDesktop: boolean
  isFirstOfRun: boolean
  runSpan: number
  isRowHovered: boolean
  onDataCellPointerEnter: () => void
  onSetRailPointerEnter: () => void
  onExpand: () => void
  onCoachNotesExpand: () => void
  onJotyBadgeClick?: (entry: SetlistEntry) => void
  onSongClick?: (entries: SetlistEntry[]) => void
  onWtedClick?: (entries: SetlistEntry[]) => void
  onBandcampClick?: (entries: SetlistEntry[]) => void
  youtubeRelease?: ShowRelease | null
  onYouTubeClick?: (release: ShowRelease) => void
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
  showDiscographySetUi: boolean
  treeChrome?: SetlistTreeChrome
  placementBarSpanRole?: PlacementBarSpanRole | null
}
