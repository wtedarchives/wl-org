"use client"

import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getPersonnelPillClassName } from "@/lib/setlist-utils"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryGuestsCellProps {
  entry: SetlistEntry
  showTooltips?: boolean
  /** When true, keep all pills on one row (for truncation / horizontal clip). */
  nowrap?: boolean
}

export function SetlistEntryGuestsCell({
  entry,
  showTooltips = true,
  nowrap = false,
}: SetlistEntryGuestsCellProps) {
  if (!entry.guests?.length) return null

  const sortedGuests = [...entry.guests].sort(
    (a, b) => a.guest_canonid - b.guest_canonid
  )

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
                className={`${getPersonnelPillClassName(g.guest_category)} no-underline hover:opacity-90`}
              >
                {g.guest_display_name}
              </Link>
            </TooltipTrigger>
            <TooltipContent>{g.guest_instrument || "Personnel"}</TooltipContent>
          </Tooltip>
        ) : (
          <Link
            key={g.guest_id}
            href={getPersonnelArchiveUrl(g.guest_id)}
            className={`${getPersonnelPillClassName(g.guest_category)} no-underline hover:opacity-90`}
          >
            {g.guest_display_name}
          </Link>
        )
      )}
    </div>
  )
}
