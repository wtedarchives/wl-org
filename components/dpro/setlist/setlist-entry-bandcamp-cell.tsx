"use client"

import { SiBandcamp } from "react-icons/si"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryBandcampCellProps {
  entry: SetlistEntry
  onBandcampClick?: (entry: SetlistEntry) => void
  showTooltips?: boolean
  /** When set (e.g. `setlist-header-tooltip` in WL v2), matches header tooltip chrome. */
  tooltipContentClassName?: string
}

export function SetlistEntryBandcampCell({
  entry,
  onBandcampClick,
  showTooltips = true,
  tooltipContentClassName,
}: SetlistEntryBandcampCellProps) {
  if (!entry.bandcampTrack) return null

  const icon = (
    <SiBandcamp className="size-4 text-[#1da0c3]" aria-hidden />
  )

  const bandcampButton = onBandcampClick ? (
    <button
      type="button"
      onClick={() => onBandcampClick(entry)}
      className="inline-flex items-center justify-center rounded p-1.5 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Play this track on Bandcamp"
    >
      {icon}
    </button>
  ) : (
    <span className="inline-flex items-center justify-center p-1.5">{icon}</span>
  )

  const innerClass =
    "inline-flex items-center justify-center align-middle leading-none"

  if (showTooltips) {
    return (
      <span className={innerClass}>
        <Tooltip>
          <TooltipTrigger asChild>{bandcampButton}</TooltipTrigger>
          <TooltipContent
            className={cn(tooltipContentClassName)}
            {...(tooltipContentClassName ?
              { side: "top" as const, sideOffset: 6 }
            : {})}
          >
            Play this track on Bandcamp.
          </TooltipContent>
        </Tooltip>
      </span>
    )
  }

  return <span className={innerClass}>{bandcampButton}</span>
}
