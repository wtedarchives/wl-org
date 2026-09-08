"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReleaseServiceIcon } from "@/components/dpro/setlist/setlist-media-service-icon"
import { KNOWN_SERVICE_LABELS } from "@/components/dpro/setlist/setlist-media-section.model"
import {
  collectSetlistEntryMediaIcons,
  getSetlistMediaReleaseHref,
  type SetlistEntryMediaIconItem,
} from "@/lib/setlist-entry-media"
import { cn } from "@/lib/utils"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import type { SetlistEntry } from "@/types/setlist"

const ICON_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded p-1.5 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"

function serviceLabel(service: string): string {
  return (
    KNOWN_SERVICE_LABELS[service] ??
    service.replace(/^\w/, (c) => c.toUpperCase())
  )
}

function mediaIconTooltip(item: SetlistEntryMediaIconItem): string {
  const label = serviceLabel(item.service)
  if (item.bandcampTrack) return "Play this track on Bandcamp."
  if (item.service === "youtube") return "Watch this song on YouTube."
  if (item.service === "vinyl") return "View vinyl details."
  if (item.release && getSetlistMediaReleaseHref(item.release)) {
    return `Open this song on ${label}.`
  }
  return `${label} release.`
}

function mediaIconAriaLabel(item: SetlistEntryMediaIconItem): string {
  return mediaIconTooltip(item).replace(/\.$/, "")
}

export function SetlistEntryMediaCell({
  entries,
  onBandcampClick,
  onYouTubeClick,
  showTooltips = true,
  tooltipContentClassName,
}: {
  entries: SetlistEntry[]
  onBandcampClick?: () => void
  onYouTubeClick?: (release: ShowRelease) => void
  showTooltips?: boolean
  tooltipContentClassName?: string
}) {
  const items = collectSetlistEntryMediaIcons(entries)
  if (items.length === 0) return null

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 whitespace-nowrap">
      {items.map((item) => (
        <SetlistEntryMediaIcon
          key={item.service}
          item={item}
          onBandcampClick={onBandcampClick}
          onYouTubeClick={onYouTubeClick}
          showTooltips={showTooltips}
          tooltipContentClassName={tooltipContentClassName}
        />
      ))}
    </div>
  )
}

function SetlistEntryMediaIcon({
  item,
  onBandcampClick,
  onYouTubeClick,
  showTooltips,
  tooltipContentClassName,
}: {
  item: SetlistEntryMediaIconItem
  onBandcampClick?: () => void
  onYouTubeClick?: (release: ShowRelease) => void
  showTooltips: boolean
  tooltipContentClassName?: string
}) {
  const icon = <ReleaseServiceIcon service={item.service} size={16} />
  const href = item.release ? getSetlistMediaReleaseHref(item.release) : null
  const tooltip = mediaIconTooltip(item)
  const ariaLabel = mediaIconAriaLabel(item)

  let control: ReactNode
  if (item.bandcampTrack && onBandcampClick) {
    control = (
      <button
        type="button"
        onClick={onBandcampClick}
        className={ICON_BUTTON_CLASS}
        aria-label={ariaLabel}
      >
        {icon}
      </button>
    )
  } else if (item.service === "youtube" && item.release && onYouTubeClick) {
    control = (
      <button
        type="button"
        onClick={() => onYouTubeClick(item.release!)}
        className={ICON_BUTTON_CLASS}
        aria-label={ariaLabel}
      >
        {icon}
      </button>
    )
  } else if (href) {
    control = (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={ICON_BUTTON_CLASS}
        aria-label={ariaLabel}
      >
        {icon}
      </a>
    )
  } else {
    control = (
      <span className="inline-flex items-center justify-center p-1.5">
        {icon}
      </span>
    )
  }

  const innerClass =
    "inline-flex items-center justify-center align-middle leading-none"

  if (!showTooltips) {
    return <span className={innerClass}>{control}</span>
  }

  return (
    <span className={innerClass}>
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent
          className={cn(tooltipContentClassName)}
          {...(tooltipContentClassName ?
            { side: "top" as const, sideOffset: 6 }
          : {})}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}
