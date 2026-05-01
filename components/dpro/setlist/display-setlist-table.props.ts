import type {
  DiscographyShowColumnCell,
  GuestGroup,
  SetlistEntry,
} from "@/types/setlist"
import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"

export interface DisplaySetlistTableProps {
  setlist: SetlistEntry[]
  guestGroups: GuestGroup[]
  /** When true, show Last, Tour, and Rarity columns (show has canon id). */
  showCanonColumns: boolean
  showWtedColumn: boolean
  onWtedClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  /** When admin clicks # cell, entry_id is copied and added here for ~2s to show checkmark. */
  copiedEntryIds?: Set<string>
  /** Called when admin clicks the # cell; copies entry_id to clipboard. */
  onNumberClick?: (entryId: string) => void
  /** When true, # cell is clickable to copy entry ID. */
  showAdminUi?: boolean
  /** When set, rows matching this category are highlighted; others are dimmed. */
  hoveredCategory?: string | null
  /** When set, rows on this release are highlighted; others dimmed (overrides category). */
  hoveredReleaseId?: string | null
  /** release_id -> Set of setlist entry_ids on that release (from setlist_entry_media). */
  releaseToEntriesMap?: ReleaseToEntriesMap
  /** When length matches `setlist`, used as row keys (e.g. discography link UUIDs when the same entry appears twice). */
  rowKeys?: string[]
  /** When length matches `setlist`, # column shows these values (e.g. `discography_entries.order`). */
  numberColumnValues?: number[]
  /** # column is 1… every row (no blanks or skips). Ignored when `numberColumnValues` is provided. */
  plainAscendingNumbers?: boolean
  /** Hide Set Break / Encore divider rows (e.g. when rows come from multiple shows). */
  suppressPlacementBars?: boolean
  /**
   * When false, # column still uses placement colors even if `suppressPlacementBars` is true.
   * When undefined, # column colors follow `suppressPlacementBars` (legacy behavior).
   */
  suppressNumberPlacementColor?: boolean
  /** Request extra column after Personnel (hidden automatically if every label is blank). */
  showDiscographySourceColumn?: boolean
  /** Parallel to `setlist`; cell shows `mm.dd.yy [venue]` when the show has `discography_display`. */
  discographySourceLabels?: string[]
  /** When aligned with `setlist`, Show column uses linked setlist/venue URLs and song-matched text styles. */
  discographyShowColumnCells?: (DiscographyShowColumnCell | null)[]
}
