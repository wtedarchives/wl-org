"use client"

import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { formatPerformanceLength } from "@/lib/song-performance-utils"
import type { SongPerformance } from "@/types/song"

export interface PerformanceTooltipContentProps {
  fullData: SongPerformance
}

/** Content for use inside TooltipContent (anchored to trigger, not cursor). */
export function PerformanceTooltipContent({
  fullData,
}: PerformanceTooltipContentProps) {
  return (
    <div className="space-y-0.5 max-w-[250px]">
      <div className="font-medium">
        {formatSetlistDate(fullData.show_date)}
        {shouldShowSetlistEntryShort(
          fullData.entry_song,
          fullData.entry_short,
        ) && (
          <span className="text-destructive ml-1">
            [{fullData.entry_short}]
          </span>
        )}
      </div>
      <div>
        <span className="font-medium pr-2">{fullData.show_group}</span>
        {fullData.show_tour && ` (${fullData.show_tour})`}
      </div>
      <div>
        <span className="pr-1">{fullData.show_subvenue}</span>
        {fullData.show_venue_location &&
          ` (${fullData.show_venue_location})`}
      </div>
      <div>
        <span className="pr-2">{fullData.entry_placement}</span>
        {fullData.entry_length &&
          ` (${formatPerformanceLength(fullData.entry_length)})`}
      </div>
      {fullData.entry_coachnotes && (
        <div
          className="italic"
          dangerouslySetInnerHTML={{ __html: fullData.entry_coachnotes }}
        />
      )}
    </div>
  )
}
