"use client"

import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getPersonnelPillClassName } from "@/lib/setlist-utils"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryGuestsCellProps {
  entry: SetlistEntry
  showTooltips?: boolean
}

export function SetlistEntryGuestsCell({
  entry,
  showTooltips = true,
}: SetlistEntryGuestsCellProps) {
  if (!entry.guests?.length) return null

  const sortedGuests = [...entry.guests].sort(
    (a, b) => a.guest_canonid - b.guest_canonid
  )

  return (
    <div className="flex flex-wrap gap-0.5">
      {sortedGuests.map((g) =>
        showTooltips ? (
          <Tooltip key={g.guest_id}>
            <TooltipTrigger asChild>
              <Link
                href={`/dpro/personnel/${g.guest_id}`}
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
            href={`/dpro/personnel/${g.guest_id}`}
            className={`${getPersonnelPillClassName(g.guest_category)} no-underline hover:opacity-90`}
          >
            {g.guest_display_name}
          </Link>
        )
      )}
    </div>
  )
}
