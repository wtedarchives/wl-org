"use client"

import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { TableCell } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getEchoLiveShowUrl } from "@/lib/echo-archive-url"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { cn } from "@/lib/utils"
import { Broadcast, FileAudio, Presentation, Trophy } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

function tourShowRowIconCellClass(wlHomeV2: boolean) {
  return cn(
    "w-[32px] text-center align-middle leading-none",
    wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
  )
}

function TourShowRowIconCell({
  wlHomeV2,
  visible,
  tooltip,
  trigger,
}: {
  wlHomeV2: boolean
  visible: boolean
  tooltip: string
  trigger: ReactNode
}) {
  return (
    <TableCell className={tourShowRowIconCellClass(wlHomeV2)}>
      <div className="inline-flex items-center justify-center">
        {visible ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-[11px]">{tooltip}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="inline-block size-3.5" aria-hidden />
        )}
      </div>
    </TableCell>
  )
}

export function TourShowRowEchoCell({
  showId,
  hasSetlistGame,
  wlHomeV2,
}: {
  showId: string
  hasSetlistGame: boolean
  wlHomeV2: boolean
}) {
  return (
    <TourShowRowIconCell
      wlHomeV2={wlHomeV2}
      visible={hasSetlistGame}
      tooltip="Echo of a Show"
      trigger={
        <ArchivePrefetchLink
          href={getEchoLiveShowUrl(showId)}
          aria-label="Echo of a Show"
          className="inline-flex items-center justify-center rounded p-0.5 text-sky-400 hover:text-sky-300"
        >
          <Trophy className="size-3.5" weight="regular" aria-hidden />
        </ArchivePrefetchLink>
      }
    />
  )
}

export function TourShowRowSetlistScanCell({
  showId,
  hasSetlist,
  wlHomeV2,
}: {
  showId: string
  hasSetlist: boolean
  wlHomeV2: boolean
}) {
  return (
    <TourShowRowIconCell
      wlHomeV2={wlHomeV2}
      visible={hasSetlist}
      tooltip="Setlist scan"
      trigger={
        <ArchivePrefetchLink
          href={getSetlistArchiveUrl(showId, { scan: true })}
          aria-label="View setlist scan"
          className="inline-flex items-center justify-center rounded p-0.5 text-emerald-600 hover:text-emerald-500"
        >
          <FileAudio className="size-3.5" aria-hidden />
        </ArchivePrefetchLink>
      }
    />
  )
}

export function TourShowRowPosterCell({
  showId,
  hasPoster,
  wlHomeV2,
}: {
  showId: string
  hasPoster: boolean
  wlHomeV2: boolean
}) {
  return (
    <TourShowRowIconCell
      wlHomeV2={wlHomeV2}
      visible={hasPoster}
      tooltip="Poster"
      trigger={
        <ArchivePrefetchLink
          href={getSetlistArchiveUrl(showId, { poster: true })}
          aria-label="View poster"
          className="inline-flex items-center justify-center rounded p-0.5 text-yellow-400 hover:text-yellow-300"
        >
          <Presentation className="size-3.5" aria-hidden />
        </ArchivePrefetchLink>
      }
    />
  )
}

export function TourShowRowReleasesCell({
  showId,
  hasReleases,
  wlHomeV2,
}: {
  showId: string
  hasReleases: boolean
  wlHomeV2: boolean
}) {
  return (
    <TourShowRowIconCell
      wlHomeV2={wlHomeV2}
      visible={hasReleases}
      tooltip="Media available"
      trigger={
        <ArchivePrefetchLink
          href={getSetlistArchiveUrl(showId)}
          aria-label="View releases"
          className="inline-flex items-center justify-center rounded p-0.5 text-rose-600 hover:text-rose-500"
        >
          <Broadcast className="size-3.5" aria-hidden />
        </ArchivePrefetchLink>
      }
    />
  )
}

export function TourShowRowAttendeeCountCell({
  attendeeCount,
  wlHomeV2,
}: {
  attendeeCount: number
  wlHomeV2: boolean
}) {
  return (
    <TableCell
      className={cn(
        "w-[32px] text-center align-middle text-[11px] font-medium leading-none",
        wlHomeV2 ? "!px-1 !py-0.5" : "px-1 py-1",
      )}
    >
      <div className="inline-flex items-center justify-center">
        {attendeeCount > 0 ? attendeeCount : ""}
      </div>
    </TableCell>
  )
}

export function TourShowRowWlLinkCell({
  wlLink,
  wlHomeV2,
}: {
  wlLink: string | null | undefined
  wlHomeV2: boolean
}) {
  return (
    <TourShowRowIconCell
      wlHomeV2={wlHomeV2}
      visible={Boolean(wlLink)}
      tooltip="Chat in the Wysteria Lane Community"
      trigger={
        <Link
          href={wlLink!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Wysteria Lane article"
          className="inline-flex items-center justify-center rounded hover:opacity-90"
        >
          <Image
            src="/WL.png"
            alt="Wysteria Lane"
            width={14}
            height={14}
            className="h-3.5 w-auto block"
          />
        </Link>
      }
    />
  )
}

export function TourShowRowRadioCell({
  showId,
  hasRadio,
  wlHomeV2,
}: {
  showId: string
  hasRadio: boolean
  wlHomeV2: boolean
}) {
  return (
    <TourShowRowIconCell
      wlHomeV2={wlHomeV2}
      visible={hasRadio}
      tooltip="WTED Goose Radio"
      trigger={
        <ArchivePrefetchLink
          href={getSetlistArchiveUrl(showId)}
          aria-label="WTED Goose Radio"
          className="inline-flex items-center justify-center rounded hover:opacity-90"
        >
          <Image
            src="/WTED2.png"
            alt="WTED Goose Radio"
            width={14}
            height={14}
            className="h-3.5 w-auto block"
          />
        </ArchivePrefetchLink>
      }
    />
  )
}
