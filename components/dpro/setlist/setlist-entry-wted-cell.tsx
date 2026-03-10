"use client"

import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryWtedCellProps {
  entry: SetlistEntry
  onWtedClick?: (entry: SetlistEntry) => void
  showTooltips?: boolean
}

export function SetlistEntryWtedCell({
  entry,
  onWtedClick,
  showTooltips = true,
}: SetlistEntryWtedCellProps) {
  if (!entry.radio_id) return null

  const wtedButton = onWtedClick ? (
    <button
      type="button"
      onClick={() => onWtedClick(entry)}
      className="rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Request this song on WTED Goose Radio"
    >
      <Image
        src="/WTED2.png"
        alt="WTED"
        width={20}
        height={20}
        className="size-4"
      />
    </button>
  ) : (
    <span className="inline-block">
      <Image
        src="/WTED2.png"
        alt="WTED"
        width={20}
        height={20}
        className="size-5"
      />
    </span>
  )

  if (showTooltips) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{wtedButton}</TooltipTrigger>
        <TooltipContent>Request this song on WTED Goose Radio.</TooltipContent>
      </Tooltip>
    )
  }

  return wtedButton
}
