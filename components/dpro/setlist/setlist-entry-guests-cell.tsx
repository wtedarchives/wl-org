"use client"

import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getPersonnelPillWlV2Style } from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  getPersonnelPillClassName,
  sortGuestsForSetlistDisplay,
} from "@/lib/setlist-utils"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryGuestsCellProps {
  entry: Pick<SetlistEntry, "guests">
  showTooltips?: boolean
  /** When true, keep all pills on one row (for truncation / horizontal clip). */
  nowrap?: boolean
  /**
   * WL Home v2: same pill treatment as the Last column (see `getPersonnelPillWlV2Style`).
   */
  useWlHomeV2PillStyle?: boolean
  /** When set (e.g. `setlist-header-tooltip` in WL v2), matches header tooltip chrome. */
  tooltipContentClassName?: string
}

export function SetlistEntryGuestsCell({
  entry,
  showTooltips = true,
  nowrap = false,
  useWlHomeV2PillStyle = false,
  tooltipContentClassName,
}: SetlistEntryGuestsCellProps) {
  if (!entry.guests?.length) return null

  const sortedGuests = sortGuestsForSetlistDisplay(entry.guests)

  const linkClass = (category: string | null | undefined) => {
    if (useWlHomeV2PillStyle)
      return "personnel-pill no-underline hover:opacity-90"
    return `${getPersonnelPillClassName(category)} no-underline hover:opacity-90`
  }

  const linkStyle = (category: string | null | undefined) => {
    if (!useWlHomeV2PillStyle) return undefined
    const s = getPersonnelPillWlV2Style(category)
    return {
      background: s.background,
      color: s.color,
      border: `1px solid ${s.borderColor}`,
    } as const
  }

  return (
    <div
      className={cn(
        "flex gap-0.5",
        nowrap ?
          "min-w-0 flex-nowrap [&_a]:shrink-0"
        : "flex-wrap",
      )}
    >
      {sortedGuests.map((g) =>
        showTooltips ? (
          <Tooltip key={g.guest_id}>
            <TooltipTrigger asChild>
              <Link
                href={getPersonnelArchiveUrl(g.guest_id)}
                className={linkClass(g.guest_category)}
                style={linkStyle(g.guest_category)}
              >
                {g.guest_display_name}
              </Link>
            </TooltipTrigger>
            <TooltipContent
              className={cn(tooltipContentClassName)}
              {...(tooltipContentClassName ?
                { side: "top" as const, sideOffset: 6 }
              : {})}
            >
              {g.guest_instrument || "Personnel"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            key={g.guest_id}
            href={getPersonnelArchiveUrl(g.guest_id)}
            className={linkClass(g.guest_category)}
            style={linkStyle(g.guest_category)}
          >
            {g.guest_display_name}
          </Link>
        )
      )}
    </div>
  )
}
