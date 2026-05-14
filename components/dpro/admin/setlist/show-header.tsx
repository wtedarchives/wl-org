"use client"

import { Plus } from "@phosphor-icons/react"
import { formatDate } from "@/lib/utils/show-utils"
import type { ShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ShowHeaderProps {
  selectedShow: ShowData
  onCreateNewEntry: () => void
}

/** Tour shows table–style row: `.wp-head` + date / venue + add entry. */
export function ShowHeader({
  selectedShow,
  onCreateNewEntry,
}: ShowHeaderProps) {
  return (
    <div
      className={cn(
        "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
        "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="wp-head-date min-w-0 truncate">
          {formatDate(selectedShow.show_date)} [{selectedShow.show_group}]
        </span>
        <span className="text-[11px] leading-snug text-white/55">
          {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCreateNewEntry}
        className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        title="Add setlist entry"
      >
        <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
        Add entry
      </Button>
    </div>
  )
}
