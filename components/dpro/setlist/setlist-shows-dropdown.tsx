"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ShowDate } from "@/types/setlist"

interface SetlistShowsDropdownProps {
  showDates: ShowDate[]
  currentShowId: string
  currentLabel: string
  onShowSelect: (showId: string) => void
}

export function SetlistShowsDropdown({
  showDates,
  currentShowId,
  currentLabel,
  onShowSelect,
}: SetlistShowsDropdownProps) {
  if (showDates.length === 0) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        {currentLabel}
      </span>
    )
  }

  return (
    <Select
      value={currentShowId}
      onValueChange={(value) => value && onShowSelect(value)}
    >
      <SelectTrigger size="sm" className="h-8 w-auto min-w-[90px] text-xs tabular-nums">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {showDates.map((s) => (
          <SelectItem
            key={s.show_id}
            value={s.show_id}
            className="text-xs tabular-nums"
          >
            {s.formatted_show_date}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
