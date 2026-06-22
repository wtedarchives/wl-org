"use client"

import { type CSSProperties } from "react"

import {
  SetlistSongSpreadCard,
} from "@/components/dpro/setlist/setlist-song-spread-card"
import { WlHomeV2SetlistAsideAccent } from "@/components/wl-home-v2/wl-home-v2-setlist-aside-accent"
import type { WlHomeV2SetlistPlaceholderToolsProps } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-tools"
import {
  WlHomeV2SetlistShowBadgesTile,
  WlHomeV2SetlistShowStatsTile,
} from "@/components/wl-home-v2/wl-home-v2-setlist-show-meta-tile"
import {
  WlHomeV2SetlistShowChangesSection,
} from "@/components/wl-home-v2/wl-home-v2-setlist-show-changes-section"
import { WlHomeV2SetlistToolsPanel } from "@/components/wl-home-v2/wl-home-v2-setlist-tools-panel"
import { WLTopPosts } from "@/components/wl-home-v2/wl-top-posts"
import type { UserAttendedGooseCanonNavState } from "@/hooks/use-user-attended-goose-canon-nav"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import type { SetlistEntry, Show } from "@/types/setlist"
import { cn } from "@/lib/utils"

export function WlHomeV2SetlistPlaceholderAside({
  useCompactTools,
  showId,
  setlistAsideHasBlocksBelowTools,
  toolsProps,
  attendedGooseCanonNav,
  onAttendedShowSelect,
  show,
  setlist,
  showLengthRank,
  asideStatsVisible,
  asideSongSpreadVisible,
  asideShowChangesVisible,
  asideBadgesVisible,
  hoveredCategory,
  onCategoryHover,
  showChanges,
  showChangesLoading,
  onOpenSetlistScan,
  showWlTopPosts,
  wlCommunityHref,
}: {
  useCompactTools: boolean
  showId: string
  setlistAsideHasBlocksBelowTools: boolean
  toolsProps: WlHomeV2SetlistPlaceholderToolsProps
  attendedGooseCanonNav: UserAttendedGooseCanonNavState
  onAttendedShowSelect: (showId: string) => void
  show: Show
  setlist: SetlistEntry[]
  showLengthRank: number | null
  asideStatsVisible: boolean
  asideSongSpreadVisible: boolean
  asideShowChangesVisible: boolean
  asideBadgesVisible: boolean
  hoveredCategory: string | null
  onCategoryHover: (category: string | null) => void
  showChanges: ShowChangeRow[]
  showChangesLoading: boolean
  onOpenSetlistScan?: () => void
  showWlTopPosts: boolean
  wlCommunityHref: string
}) {
  return (
    <aside
      className="wl-home-v2-years-aside wl-home-v2-setlist-aside"
      aria-label="Show tools"
    >
      {!useCompactTools ?
        <>
          <WlHomeV2SetlistAsideAccent showId={showId} slot={0} />
          <section
            className={cn(
              "wl-home-v2-years-tile",
              !setlistAsideHasBlocksBelowTools &&
                "wl-home-v2-setlist-tools-tile--aside-tail",
            )}
            style={
              {
                "--tile-bg": "url('/newbg.png')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner flex flex-col gap-3">
              <WlHomeV2SetlistToolsPanel
                toolsProps={toolsProps}
                attendedNav={attendedGooseCanonNav}
                currentShowId={showId}
                onAttendedShowSelect={onAttendedShowSelect}
              />
            </div>
          </section>
        </>
      : null}

      {!useCompactTools && setlistAsideHasBlocksBelowTools ?
        <WlHomeV2SetlistAsideAccent showId={showId} slot={1} />
      : null}
      <div
        className={cn(
          "wl-home-v2-setlist-aside-stats-tiles",
          useCompactTools &&
            showWlTopPosts &&
            "wl-home-v2-setlist-aside-stats-tiles--with-wl-posts",
        )}
      >
        <WlHomeV2SetlistShowStatsTile
          show={show}
          setlist={setlist}
          showLengthRank={showLengthRank}
        />
        {asideStatsVisible &&
        (asideSongSpreadVisible ||
          asideShowChangesVisible ||
          asideBadgesVisible) ?
          <WlHomeV2SetlistAsideAccent showId={showId} slot={2} />
        : null}
        <SetlistSongSpreadCard
          setlist={setlist}
          hoveredCategory={hoveredCategory}
          onCategoryHover={onCategoryHover}
          visualVariant="wl-home-v2"
        />
        {asideSongSpreadVisible &&
        (asideShowChangesVisible || asideBadgesVisible) ?
          <WlHomeV2SetlistAsideAccent showId={showId} slot={3} />
        : null}
        <WlHomeV2SetlistShowChangesSection
          changes={showChanges}
          loading={showChangesLoading}
          onOpenScan={onOpenSetlistScan}
        />
        {asideShowChangesVisible && asideBadgesVisible ?
          <WlHomeV2SetlistAsideAccent showId={showId} slot={4} />
        : null}
        <WlHomeV2SetlistShowBadgesTile show={show} />
        {useCompactTools && showWlTopPosts &&
        (asideStatsVisible ||
          asideSongSpreadVisible ||
          asideShowChangesVisible ||
          asideBadgesVisible) ?
          <WlHomeV2SetlistAsideAccent showId={showId} slot={5} />
        : null}
        {useCompactTools && showWlTopPosts ?
          <WLTopPosts wlLink={wlCommunityHref} />
        : null}
      </div>
    </aside>
  )
}
