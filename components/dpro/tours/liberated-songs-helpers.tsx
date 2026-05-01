"use client"

import { type ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function formatTourDate(dateStr?: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`
  }
  return dateStr
}

export function extractShowCount(lastCount: string): string {
  if (!lastCount) return ""
  if (lastCount.trim().toLowerCase() === "debut") return ""
  const match = lastCount.match(/^(\d+)/)
  return match ? match[1] : ""
}

/** Same Radix chrome + `.setlist-header-tooltip` as song spread WL tooltips (`song-spread-display.tsx`). */
export function LiberatedSongLibTooltip({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        sideOffset={6}
        className="max-w-xs p-0 setlist-header-tooltip setlist-header-tooltip--tight"
      >
        <div className="wl-home-v2-setlist-song-spread-tooltip-inner text-left">
          <p className="wl-home-v2-setlist-song-spread-tooltip-title">
            LIB{" "}
            <span className="font-normal text-white/80">(Song Liberation)</span>
          </p>
          <p className="mb-0 leading-snug">
            Song returned after a full calendar year of not being played.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
