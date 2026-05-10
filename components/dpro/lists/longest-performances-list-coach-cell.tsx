"use client"

import { SetlistTruncatableHtmlCell } from "@/components/dpro/setlist/setlist-truncatable-cell"
import { TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const headCell = "!px-2 !py-0.5"

export function LongestPerformancesCoachNotesCell({
  entryId,
  coachNotes,
}: {
  entryId: string
  coachNotes: string | null | undefined
}) {
  const trimmed = coachNotes?.trim() ?? ""

  return (
    <TableCell
      className={cn("lp-list-notes-cell notes-cell align-middle", headCell)}
    >
      {trimmed ?
        <SetlistTruncatableHtmlCell
          maxWidthClass="max-w-[400px]"
          measureWidthClass="w-max max-w-[400px]"
          measureKey={`${entryId}-coach`}
          html={trimmed}
          expandLabel="Show full coach notes"
          htmlContentClassName="setlist-v2-notes-html"
          blockPlainClassName="setlist-v2-notes-plain"
        />
      : null}
    </TableCell>
  )
}
