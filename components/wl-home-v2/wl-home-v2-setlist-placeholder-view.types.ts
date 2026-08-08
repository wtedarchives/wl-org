import { type BreadcrumbItem } from "@/components/setlist-breadcrumb-context"
import type { Tour } from "@/hooks/use-setlist-data"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { ReleaseToEntriesMap, ShowRelease } from "@/hooks/use-setlist-releases"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import type { UserAttendedGooseCanonNavState } from "@/hooks/use-user-attended-goose-canon-nav"
import type { SetlistEntry, Show, ShowDate } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

export type WlHomeV2SetlistPlaceholderViewProps = {
  breadcrumbs: BreadcrumbItem[] | null
  show: Show
  showId: string
  setlist: SetlistEntry[]
  songPairs: SongPair[]
  showAdminUi?: boolean
  adminLinkCopied?: boolean
  onAdminCopyShowId?: () => void
  onAdminEditShow?: () => void
  onShareSetlistImage?: () => void
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  onJotyBadgeClick: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onPairSongClick?: (entries: SetlistEntry[], pair: SongPair) => void
  onWtedClick?: (entry: SetlistEntry) => void
  onPairWtedClick?: (entries: SetlistEntry[]) => void
  showPositionInTour: ShowPositionInTour | null
  tourShowNav: {
    prevShowId: string | null
    nextShowId: string | null
  } | null
  onTourShowSelect: (showId: string) => void
  tours: Tour[]
  showDates: ShowDate[]
  onTourSelect: (tourId: string) => void
  maxShowCanonId: number | null
  maxShowCanonIdLoading: boolean
  releases: ShowRelease[]
  releaseToEntriesMap: ReleaseToEntriesMap
  averageRating: number
  reviewCount: number
  onRatingClick: () => void
  onAttendeesClick: () => void
  attendeeCount: number
  attended: boolean
  attendanceToggling: boolean
  onAttendanceToggle: () => void
  attendedGooseCanonNav: UserAttendedGooseCanonNavState
  onAttendedShowSelect: (showId: string) => void
  showLengthRank: number | null
  showChanges: ShowChangeRow[]
  showChangesLoading: boolean
  onOpenSetlistScan?: () => void
  hoveredCategory: string | null
  onCategoryHover: (category: string | null) => void
}
