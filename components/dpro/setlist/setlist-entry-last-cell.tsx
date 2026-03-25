"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryLastCellProps {
  entry: SetlistEntry
  lastBadgeStyle: { className: string } | null
  showTooltips?: boolean
}

export function SetlistEntryLastCell({
  entry,
  lastBadgeStyle,
  showTooltips = true,
}: SetlistEntryLastCellProps) {
  if (
    entry.last_count == null ||
    entry.last_count === ""
  ) {
    return null
  }

  const content = lastBadgeStyle ? (
    <span className={lastBadgeStyle.className}>{entry.last_count}</span>
  ) : (
    entry.last_count
  )

  if (entry.last_show_id && showTooltips) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={getSetlistArchiveUrl(entry.last_show_id)}
            className="cursor-pointer hover:underline"
          >
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-xs">
          <div className="space-y-0.5">
            {entry.last_show_date && (
              <div>
                <span className="font-semibold">
                  {formatSetlistDate(entry.last_show_date)}
                </span>
              </div>
            )}
            {entry.last_venue_location && (
              <div>{entry.last_venue_location}</div>
            )}
            {entry.last_show_tour && (
              <div>{entry.last_show_tour}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (entry.last_show_id) {
    return (
      <Link
        href={getSetlistArchiveUrl(entry.last_show_id)}
        className="cursor-pointer hover:underline"
      >
        {content}
      </Link>
    )
  }

  return <>{content}</>
}
