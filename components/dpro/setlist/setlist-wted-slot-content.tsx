"use client"

import { Fragment } from "react"
import Image from "next/image"
import { Check, Loader2 } from "lucide-react"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedRequestEnriched, WtedRequestEnrichedSegment } from "@/types/wted"

const PILL_CLASSES = {
  date: "rounded-full border border-border bg-wl-orange/30 px-2 py-0.5 text-[10px] font-medium tabular-nums text-foreground",
  group: "rounded-full border border-border bg-wl-orange/50 px-2 py-0.5 text-[10px] font-medium text-foreground",
  venue: "rounded-full border border-border bg-wl-green/30 px-2 py-0.5 text-[10px] font-medium text-foreground",
} as const

export function WtedSegmentsTitle({
  segments,
}: {
  segments: WtedRequestEnrichedSegment[]
}) {
  return (
    <span className="min-w-0 break-words text-xs font-medium leading-snug text-foreground">
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {i > 0 ?
            <span className="text-red-400 mr-0.5" aria-hidden>
              {" "}
              →{" "}
            </span>
          : null}
          <SongDisplayName
            as="span"
            song={seg.song}
            songDisplayName={seg.song_displayname}
          />
          {shouldShowSetlistEntryShort(seg.song, seg.entry_short) && (
            <span className="ml-1 text-[0.625rem] text-red-400">
              [{seg.entry_short}]
            </span>
          )}
        </Fragment>
      ))}
    </span>
  )
}

export function WtedRequestSlotContent({
  request,
}: {
  request: WtedRequestEnriched
}) {
  const pills: { label: string; type: keyof typeof PILL_CLASSES }[] = [
    request.show_date && {
      label: formatSetlistDate(request.show_date),
      type: "date",
    },
    request.show_group && { label: request.show_group, type: "group" },
    request.show_venue_location && {
      label: request.show_venue_location,
      type: "venue",
    },
  ].filter(Boolean) as { label: string; type: keyof typeof PILL_CLASSES }[]

  return (
    <>
      {request.release_artwork && (
        <div className="relative size-12 shrink-0 overflow-hidden rounded border border-border">
          <Image
            src={request.release_artwork}
            alt=""
            width={48}
            height={48}
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <WtedSegmentsTitle segments={request.segments} />
        <div className="mt-1 flex flex-wrap gap-1">
          {pills.map(({ label, type }) => (
            <span key={label} className={cn("inline-flex", PILL_CLASSES[type])}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-primary/20 p-1.5"
        aria-label="Requested"
      >
        <Check className="size-4 text-primary" />
      </div>
    </>
  )
}

export function WtedPendingSlotContent({
  groupEntries,
  show,
  releaseArtwork,
  releaseArtworkLoading = false,
  onRequest,
  submitting,
  submitError,
  waitSeconds,
}: {
  groupEntries: SetlistEntry[]
  show: {
    show_date: string
    show_venue_location: string | null
    show_group: string | null
  }
  releaseArtwork: string | null
  releaseArtworkLoading?: boolean
  onRequest: () => void
  submitting: boolean
  submitError: string | null
  waitSeconds: number
}) {
  const pills: { label: string; type: keyof typeof PILL_CLASSES }[] = [
    show.show_date && {
      label: formatSetlistDate(show.show_date),
      type: "date",
    },
    show.show_group && { label: show.show_group, type: "group" },
    show.show_venue_location && {
      label: show.show_venue_location,
      type: "venue",
    },
  ].filter(Boolean) as { label: string; type: keyof typeof PILL_CLASSES }[]

  const mustWait = waitSeconds > 0

  const segments: WtedRequestEnrichedSegment[] = groupEntries.map((e) => ({
    song: e.songs?.song ?? e.entry_song,
    song_displayname: e.songs?.song_displayname ?? null,
    entry_short: e.entry_short,
  }))

  return (
    <>
      {releaseArtworkLoading ? (
        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/60">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : releaseArtwork ? (
        <div className="relative size-12 shrink-0 overflow-hidden rounded border border-border">
          <Image
            src={releaseArtwork}
            alt=""
            width={48}
            height={48}
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <WtedSegmentsTitle segments={segments} />
        <div className="mt-1 flex flex-wrap gap-1">
          {pills.map(({ label, type }) => (
            <span key={label} className={cn("inline-flex", PILL_CLASSES[type])}>
              {label}
            </span>
          ))}
        </div>
        {submitError && (
          <p className="mt-1 text-[10px] text-destructive">{submitError}</p>
        )}
      </div>
      <Button
        size="sm"
        className={cn(
          "shrink-0",
          mustWait && "text-sm",
          !submitting && !mustWait && "animate-pulse-ring",
        )}
        onClick={onRequest}
        disabled={submitting || mustWait}
      >
        {submitting
          ? "Requesting…"
          : mustWait
            ? `Wait ${waitSeconds}s`
            : "Request track"}
      </Button>
    </>
  )
}
