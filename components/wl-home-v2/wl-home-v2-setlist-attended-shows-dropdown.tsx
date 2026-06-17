"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  WL_HOME_V2_SETLIST_SELECT_CONTENT,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.constants"
import { formatSetlistDate, formatOrdinal } from "@/lib/setlist-utils"
import type { AttendedGooseCanonShowRow } from "@/lib/user-attended-goose-canon-nav"
import { cn } from "@/lib/utils"

function AttendedShowSelectOptionLabel({
  show,
}: {
  show: AttendedGooseCanonShowRow
}) {
  const date = formatSetlistDate(show.show_date)
  const loc = show.show_venue_location?.trim()
  return (
    <>
      <span className="font-semibold tabular-nums">{date}</span>
      {loc ?
        <span className="font-normal tabular-nums"> ({loc})</span>
      : null}
    </>
  )
}

export function WlHomeV2SetlistAttendedShowsDropdown({
  shows,
  currentShowId,
  position,
  onShowSelect,
}: {
  shows: AttendedGooseCanonShowRow[]
  currentShowId: string
  position: number
  onShowSelect: (showId: string) => void
}) {
  const ordinalLabel = formatOrdinal(position)

  if (shows.length <= 1) {
    return (
      <span className="setlist-alt-name-pill">{ordinalLabel}</span>
    )
  }

  return (
    <Select
      value={currentShowId}
      onValueChange={(value) => value && onShowSelect(value)}
    >
      <SelectTrigger
        size="sm"
        className={cn("wl-home-v2-setlist-attended-nav-pill-trigger")}
        aria-label={`Your ${ordinalLabel} Goose show. Choose another attended show.`}
      >
        <SelectValue>
          <span className="tabular-nums">{ordinalLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={WL_HOME_V2_SETLIST_SELECT_CONTENT}>
        {shows.map((show) => (
          <SelectItem
            key={show.show_id}
            value={show.show_id}
            className="text-xs tabular-nums"
          >
            <AttendedShowSelectOptionLabel show={show} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
