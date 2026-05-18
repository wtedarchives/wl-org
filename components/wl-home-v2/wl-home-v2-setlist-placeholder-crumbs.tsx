"use client"

import { SetlistShowsDropdown } from "@/components/dpro/setlist/setlist-shows-dropdown"
import { SetlistTourDropdown } from "@/components/dpro/setlist/setlist-tour-dropdown"
import { type BreadcrumbItem } from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import type { Tour } from "@/hooks/use-setlist-data"
import type { Show, ShowDate } from "@/types/setlist"
import { formatSetlistDate } from "@/lib/setlist-utils"

import {
  WL_HOME_V2_SETLIST_SELECT_CONTENT,
  WL_HOME_V2_SETLIST_SELECT_TRIGGER,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.constants"
import { WlHomeV2SetlistAdminToolbar } from "@/components/wl-home-v2/wl-home-v2-setlist-admin-toolbar"

export type WlHomeV2SetlistPlaceholderCrumbsBarProps = {
  breadcrumbs: BreadcrumbItem[] | null
  showId: string
  show: Show
  tours: Tour[]
  showDates: ShowDate[]
  onTourSelect: (tourId: string) => void
  onTourShowSelect: (showId: string) => void
  openArchiveHub: (() => void) | undefined
  showAdminUi?: boolean
  adminLinkCopied?: boolean
  onAdminCopyShowId?: () => void
  onAdminEditShow?: () => void
  /** Opens share-image modal (admin toolbar upload icon). */
  onShareSetlistImage?: () => void
}

export function WlHomeV2SetlistPlaceholderCrumbsBar({
  breadcrumbs,
  showId,
  show,
  tours,
  showDates,
  onTourSelect,
  onTourShowSelect,
  openArchiveHub,
  showAdminUi,
  adminLinkCopied,
  onAdminCopyShowId,
  onAdminEditShow,
  onShareSetlistImage,
}: WlHomeV2SetlistPlaceholderCrumbsBarProps) {
  return (
    <WlHomeV2ArchiveCrumbsShell
      variant="rail"
      bottomSpacing={false}
      selectorsAriaLabel="Tour and show date"
      trail={
        <WlHomeV2ArchiveCrumbsTrail
          items={breadcrumbs ?? []}
          openArchiveHub={openArchiveHub}
        />
      }
      selectors={
        <>
          {showAdminUi && onAdminCopyShowId && onAdminEditShow ?
            <WlHomeV2SetlistAdminToolbar
              linkCopied={adminLinkCopied ?? false}
              onCopyShowId={onAdminCopyShowId}
              onEditInAdmin={onAdminEditShow}
              onShareSetlistImage={onShareSetlistImage}
            />
          : null}
          <div className="wl-home-v2-setlist-crumbs-selectors-cell min-w-0">
            <SetlistTourDropdown
              tours={tours}
              currentTourId={show.tour_id ?? ""}
              currentTourName={show.show_tour}
              onTourSelect={onTourSelect}
              triggerClassName={WL_HOME_V2_SETLIST_SELECT_TRIGGER}
              contentClassName={WL_HOME_V2_SETLIST_SELECT_CONTENT}
            />
          </div>
          <div className="wl-home-v2-setlist-crumbs-selectors-cell min-w-0">
            <SetlistShowsDropdown
              showDates={showDates}
              currentShowId={showId}
              currentLabel={formatSetlistDate(show.show_date)}
              onShowSelect={onTourShowSelect}
              triggerClassName={WL_HOME_V2_SETLIST_SELECT_TRIGGER}
              contentClassName={WL_HOME_V2_SETLIST_SELECT_CONTENT}
            />
          </div>
        </>
      }
    />
  )
}
