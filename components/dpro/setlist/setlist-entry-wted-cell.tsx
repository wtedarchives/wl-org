"use client"

import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryWtedCellProps {
  entry: SetlistEntry
  onWtedClick?: (entry: SetlistEntry) => void
  showTooltips?: boolean
  /** When set (e.g. `setlist-header-tooltip` in WL v2), matches header tooltip chrome. */
  tooltipContentClassName?: string
}

export function SetlistEntryWtedCell({
  entry,
  onWtedClick,
  showTooltips = true,
  tooltipContentClassName,
}: SetlistEntryWtedCellProps) {
  if (!entry.radio_id) return null

  const wtedButton = onWtedClick ? (
    <button
      type="button"
      onClick={() => onWtedClick(entry)}
      className="inline-flex items-center justify-center rounded p-1.5 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Request this song on WTED Goose Radio"
    >
      <Image
        src="/WTED2.png"
        alt="WTED"
        width={16}
        height={16}
        className="size-4"
      />
    </button>
  ) : (
    <span className="inline-flex items-center justify-center p-1.5">
      <Image
        src="/WTED2.png"
        alt="WTED"
        width={16}
        height={16}
        className="size-4"
      />
    </span>
  )

  const innerClass =
    "inline-flex items-center justify-center align-middle leading-none"

  if (showTooltips) {
    return (
      <span className={innerClass}>
        <Tooltip>
          <TooltipTrigger asChild>{wtedButton}</TooltipTrigger>
          <TooltipContent
            className={cn(tooltipContentClassName)}
            {...(tooltipContentClassName ?
              { side: "top" as const, sideOffset: 6 }
            : {})}
          >
            Request this song on WTED Goose Radio.
          </TooltipContent>
        </Tooltip>
      </span>
    )
  }

  return <span className={innerClass}>{wtedButton}</span>
}
