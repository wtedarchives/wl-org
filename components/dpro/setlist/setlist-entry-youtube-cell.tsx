"use client"

import { YoutubeLogo } from "@phosphor-icons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SERVICE_COLORS } from "@/components/dpro/setlist/setlist-media-section.model"
import type { ShowRelease } from "@/hooks/use-setlist-releases"

interface SetlistEntryYouTubeCellProps {
  /** The chosen YouTube release for this entry (null = no YouTube media). */
  release: ShowRelease | null
  onYouTubeClick?: (release: ShowRelease) => void
  showTooltips?: boolean
  /** When set (e.g. `setlist-header-tooltip` in WL v2), matches header tooltip chrome. */
  tooltipContentClassName?: string
}

export function SetlistEntryYouTubeCell({
  release,
  onYouTubeClick,
  showTooltips = true,
  tooltipContentClassName,
}: SetlistEntryYouTubeCellProps) {
  if (!release) return null

  const icon = (
    <YoutubeLogo
      className="size-4 shrink-0"
      weight="fill"
      style={{ color: SERVICE_COLORS.youtube }}
      aria-hidden
    />
  )

  const youtubeButton = onYouTubeClick ? (
    <button
      type="button"
      onClick={() => onYouTubeClick(release)}
      className="inline-flex items-center justify-center rounded p-1.5 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Watch this song on YouTube"
    >
      {icon}
    </button>
  ) : (
    <span className="inline-flex items-center justify-center p-1.5">{icon}</span>
  )

  const innerClass =
    "inline-flex items-center justify-center align-middle leading-none"

  if (showTooltips) {
    return (
      <span className={innerClass}>
        <Tooltip>
          <TooltipTrigger asChild>{youtubeButton}</TooltipTrigger>
          <TooltipContent
            className={cn(tooltipContentClassName)}
            {...(tooltipContentClassName ?
              { side: "top" as const, sideOffset: 6 }
            : {})}
          >
            Watch this song on YouTube.
          </TooltipContent>
        </Tooltip>
      </span>
    )
  }

  return <span className={innerClass}>{youtubeButton}</span>
}
