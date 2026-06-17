"use client"

import { WlHomeV2SetlistAttendedNav } from "@/components/wl-home-v2/wl-home-v2-setlist-attended-nav"
import {
  WlHomeV2SetlistPlaceholderRatingAttendees,
  type WlHomeV2SetlistPlaceholderToolsProps,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-tools"
import type { UserAttendedGooseCanonNavState } from "@/hooks/use-user-attended-goose-canon-nav"
import { cn } from "@/lib/utils"

export type WlHomeV2SetlistToolsPanelProps = {
  toolsProps: WlHomeV2SetlistPlaceholderToolsProps
  attendedNav: UserAttendedGooseCanonNavState
  currentShowId: string
  onAttendedShowSelect: (showId: string) => void
  panelClassName?: string
}

export function WlHomeV2SetlistToolsPanel({
  toolsProps,
  attendedNav,
  currentShowId,
  onAttendedShowSelect,
  panelClassName,
}: WlHomeV2SetlistToolsPanelProps) {
  return (
    <div
      className={cn("wl-home-v2-setlist-tools-panel", panelClassName)}
    >
      <WlHomeV2SetlistPlaceholderRatingAttendees {...toolsProps} />
      <WlHomeV2SetlistAttendedNav
        visible={attendedNav.visible}
        nav={attendedNav.nav}
        shows={attendedNav.shows}
        currentShowId={currentShowId}
        onShowSelect={onAttendedShowSelect}
      />
    </div>
  )
}
