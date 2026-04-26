"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getLastCountPillStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryLastCellProps {
  entry: SetlistEntry
  lastBadgeStyle: { className: string } | null
  showTooltips?: boolean
  /**
   * When set, TD/LIB/Debut use the same compact mono pill shape as `entry_short` (see
   * `getLastCountPillStyle` + `.last-pill` in wl-home-v2).
   */
  useWlHomeV2PillStyle?: boolean
  /** When set (e.g. `setlist-header-tooltip` in WL v2), matches header tooltip chrome. */
  tooltipContentClassName?: string
}

export function SetlistEntryLastCell({
  entry,
  lastBadgeStyle,
  showTooltips = true,
  useWlHomeV2PillStyle = false,
  tooltipContentClassName,
}: SetlistEntryLastCellProps) {
  if (
    entry.last_count == null ||
    entry.last_count === ""
  ) {
    return null
  }

  const wlPill = useWlHomeV2PillStyle
    ? getLastCountPillStyle(entry.last_count)
    : null

  const content =
    wlPill ? (
      <span
        className="last-pill"
        style={{
          backgroundColor: wlPill.background,
          color: wlPill.color,
          border: `1px solid ${wlPill.borderColor}`,
        }}
      >
        {entry.last_count}
      </span>
    ) : lastBadgeStyle ?
      <span className={lastBadgeStyle.className}>{entry.last_count}</span>
    : (
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
        <TooltipContent
          className={cn(
            !tooltipContentClassName && "max-w-[200px] text-xs",
            tooltipContentClassName,
          )}
          {...(tooltipContentClassName ?
            { side: "top" as const, sideOffset: 6 }
          : {})}
        >
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
