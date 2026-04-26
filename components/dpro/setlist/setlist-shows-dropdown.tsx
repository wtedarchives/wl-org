"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ShowDate } from "@/types/setlist"

/** List row label: `mm.dd.yy (venue_location)` when location exists. */
export function showDateDropdownOptionLabel(s: ShowDate): string {
  const loc = s.show_venue_location?.trim()
  return loc ? `${s.formatted_show_date} (${loc})` : s.formatted_show_date
}

function ShowDateSelectOptionLabel({ s }: { s: ShowDate }) {
  const loc = s.show_venue_location?.trim()
  return (
    <>
      <span className="font-semibold tabular-nums">{s.formatted_show_date}</span>
      {loc ?
        <span className="font-normal tabular-nums"> ({loc})</span>
      : null}
    </>
  )
}

interface SetlistShowsDropdownProps {
  showDates: ShowDate[]
  currentShowId: string
  currentLabel: string
  onShowSelect: (showId: string) => void
  /** Merged onto SelectTrigger (e.g. mobile height) */
  triggerClassName?: string
  /** Optional className for the portaled SelectContent */
  contentClassName?: string
}

export function SetlistShowsDropdown({
  showDates,
  currentShowId,
  currentLabel,
  onShowSelect,
  triggerClassName,
  contentClassName,
}: SetlistShowsDropdownProps) {
  if (showDates.length === 0) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        {currentLabel}
      </span>
    )
  }

  const current = showDates.find((s) => s.show_id === currentShowId)
  const triggerLabel = current?.formatted_show_date ?? currentLabel

  return (
    <Select
      value={currentShowId}
      onValueChange={(value) => value && onShowSelect(value)}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-6 w-auto min-w-[90px] text-xs tabular-nums",
          triggerClassName
        )}
      >
        <SelectValue placeholder={currentLabel}>
          {currentShowId ?
            <span className="font-semibold tabular-nums">
              {triggerLabel || currentLabel}
            </span>
          : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {showDates.map((s) => (
          <SelectItem
            key={s.show_id}
            value={s.show_id}
            className="text-xs tabular-nums"
          >
            <ShowDateSelectOptionLabel s={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
