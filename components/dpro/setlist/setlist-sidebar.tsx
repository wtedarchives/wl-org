"use client"

import type { Show, SetlistEntry } from "@/types/setlist"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import { SetlistShowStatsCard } from "./setlist-show-stats-card"
import { SetlistShowChangesCard } from "./setlist-show-changes-card"
import { SetlistBadgesCard } from "./setlist-badges-card"
import { SetlistSongSpreadCard } from "./setlist-song-spread-card"
import { totalSetlistLength } from "@/lib/setlist-utils"

interface SetlistSidebarProps {
  show: Show
  setlist: SetlistEntry[]
  showLengthRank: number | null
  changes: ShowChangeRow[]
  changesLoading: boolean
  hasSetlistScan?: boolean
  onOpenSetlistScan?: () => void
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
}

export function SetlistSidebar({
  show,
  setlist,
  showLengthRank,
  changes,
  changesLoading,
  hasSetlistScan,
  onOpenSetlistScan,
  hoveredCategory,
  onCategoryHover,
}: SetlistSidebarProps) {
  const totalLength = totalSetlistLength(setlist) || null

  return (
    <aside className="flex min-w-0 flex-1 flex-col gap-3">
      <SetlistShowStatsCard
        show={show}
        totalLengthFromSetlist={totalLength}
        showLengthRank={showLengthRank}
      />
      {hasSetlistScan && (
        <SetlistShowChangesCard
          changes={changes}
          loading={changesLoading}
          onOpenModal={onOpenSetlistScan}
        />
      )}
      <SetlistBadgesCard show={show} />
      <SetlistSongSpreadCard
        setlist={setlist}
        hoveredCategory={hoveredCategory}
        onCategoryHover={onCategoryHover}
      />
    </aside>
  )
}
