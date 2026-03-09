"use client"

import { Check } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistEntryNumberCellProps {
  entry: SetlistEntry
  displayNumber: number | null
  isCopied: boolean
  canCopyNumber: boolean
  showTooltips?: boolean
  onNumberClick?: (entryId: string) => void
}

export function SetlistEntryNumberCell({
  entry,
  displayNumber,
  isCopied,
  canCopyNumber,
  showTooltips = true,
  onNumberClick,
}: SetlistEntryNumberCellProps) {
  const numberCellContent = isCopied ? (
    <span className="inline-flex items-center justify-center text-white" aria-label="Copied">
      <Check className="size-3" />
    </span>
  ) : displayNumber !== null ? (
    showTooltips ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block cursor-default">{displayNumber}</span>
        </TooltipTrigger>
        <TooltipContent>
          {entry.entry_placement || `Song ${displayNumber}`}
        </TooltipContent>
      </Tooltip>
    ) : (
      <span className="inline-block cursor-default">{displayNumber}</span>
    )
  ) : null

  return (
    <>
      {canCopyNumber ? (
        <button
          type="button"
          onClick={() => onNumberClick?.(entry.entry_id)}
          className="inline-flex min-w-[1rem] cursor-pointer items-center justify-center rounded focus:outline-none focus:ring-0"
          {...(showTooltips && { title: "Copy entry ID" })}
        >
          {numberCellContent}
        </button>
      ) : (
        numberCellContent
      )}
    </>
  )
}
