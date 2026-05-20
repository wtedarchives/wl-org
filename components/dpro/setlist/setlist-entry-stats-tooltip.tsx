"use client"

import type { ReactElement } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"
import {
  entryHasSongStatsLines,
  SetlistEntryStatsTooltipContent,
} from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"

/** Per-row song stats panel (times played, shows since debut, rarity copy). */
export function SetlistEntryStatsTooltip({
  entry,
  wlV2Chrome = false,
  children,
}: {
  entry: SetlistEntry
  wlV2Chrome?: boolean
  children: ReactElement
}) {
  if (!entryHasSongStatsLines(entry)) {
    return children
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        className={cn(
          "max-w-[280px] leading-tight",
          wlV2Chrome && SETLIST_V2_ROW_TOOLTIP_CONTENT.className,
        )}
        {...(wlV2Chrome ?
          {
            side: SETLIST_V2_ROW_TOOLTIP_CONTENT.side,
            sideOffset: SETLIST_V2_ROW_TOOLTIP_CONTENT.sideOffset,
          }
        : { side: "top" as const })}
      >
        <SetlistEntryStatsTooltipContent entry={entry} />
      </TooltipContent>
    </Tooltip>
  )
}
