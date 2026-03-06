"use client"

import type { Show, SetlistEntry } from "@/types/setlist"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import { SetlistShowStatsCard } from "./setlist-show-stats-card"
import { SetlistShowChangesCard } from "./setlist-show-changes-card"
import { SetlistBadgesCard } from "./setlist-badges-card"
import { SetlistSongSpreadCard } from "./setlist-song-spread-card"
import { SetlistReleaseContainer } from "./setlist-release-container"
import { totalSetlistLength } from "@/lib/setlist-utils"

interface SetlistSidebarProps {
  show: Show
  setlist: SetlistEntry[]
  showLengthRank: number | null
  changes: ShowChangeRow[]
  changesLoading: boolean
  releases: ShowRelease[]
  hasReleases: boolean
  onOpenChangesModal?: () => void
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
  onReleaseHover?: (releaseId: string | null) => void
}

export function SetlistSidebar({
  show,
  setlist,
  showLengthRank,
  changes,
  changesLoading,
  releases,
  hasReleases,
  onOpenChangesModal,
  hoveredCategory,
  onCategoryHover,
  onReleaseHover,
}: SetlistSidebarProps) {
  const totalLength = totalSetlistLength(setlist) || null

  return (
    <aside className="flex min-w-0 flex-1 flex-col gap-3">
      <SetlistShowStatsCard
        show={show}
        totalLengthFromSetlist={totalLength}
        showLengthRank={showLengthRank}
      />
      <SetlistShowChangesCard
        changes={changes}
        loading={changesLoading}
        onOpenModal={onOpenChangesModal}
      />
      <SetlistBadgesCard show={show} />
      <SetlistSongSpreadCard
        setlist={setlist}
        hoveredCategory={hoveredCategory}
        onCategoryHover={onCategoryHover}
      />
      {hasReleases && (
        <SetlistReleaseContainer
          releases={releases}
          onReleaseHover={onReleaseHover}
        />
      )}
    </aside>
  )
}
