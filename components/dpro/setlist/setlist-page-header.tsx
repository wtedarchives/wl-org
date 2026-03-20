"use client"

import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { SetlistPageHeaderMobile } from "./setlist-page-header-mobile"
import { SetlistPageHeaderDesktop } from "./setlist-page-header-desktop"
import type { Show, ShowDate } from "@/types/setlist"
import type { Tour } from "@/hooks/use-setlist-data"

export interface SetlistPageHeaderProps {
  show: Show
  showId: string
  showDates: ShowDate[]
  showPosition: {
    prevShowId: string | null
    nextShowId: string | null
  } | null
  showPositionInTour: { position: number; total: number } | null
  tours: Tour[]
  onTourSelect: (tourId: string) => void
  onShowSelect: (showId: string) => void
  showAdminUi?: boolean
  linkCopied?: boolean
  onCopyLink: () => void
  onEditShow: () => void
}

export function SetlistPageHeader({
  show,
  showId,
  showDates,
  showPosition,
  showPositionInTour,
  tours,
  onTourSelect,
  onShowSelect,
  showAdminUi,
  linkCopied,
  onCopyLink,
  onEditShow,
}: SetlistPageHeaderProps) {
  const isDesktop = useIsDesktopContentLayout()

  if (!isDesktop) {
    return (
      <SetlistPageHeaderMobile
        show={show}
        showId={showId}
        showDates={showDates}
        showPosition={showPosition}
        showPositionInTour={showPositionInTour}
        tours={tours}
        onTourSelect={onTourSelect}
        onShowSelect={onShowSelect}
        showAdminUi={showAdminUi}
        linkCopied={linkCopied}
        onCopyLink={onCopyLink}
        onEditShow={onEditShow}
      />
    )
  }

  return (
    <SetlistPageHeaderDesktop
      show={show}
      showId={showId}
      showDates={showDates}
      showPosition={showPosition}
      showPositionInTour={showPositionInTour}
      tours={tours}
      onTourSelect={onTourSelect}
      onShowSelect={onShowSelect}
      showAdminUi={showAdminUi}
      linkCopied={linkCopied}
      onCopyLink={onCopyLink}
      onEditShow={onEditShow}
    />
  )
}
