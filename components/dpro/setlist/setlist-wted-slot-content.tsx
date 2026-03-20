"use client"

import Image from "next/image"
import { Check } from "lucide-react"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedRequestEnriched } from "@/types/wted"

const PILL_CLASSES = {
  date: "rounded-full border border-border bg-wl-orange/30 px-2 py-0.5 text-[10px] font-medium tabular-nums text-foreground",
  group: "rounded-full border border-border bg-wl-orange/50 px-2 py-0.5 text-[10px] font-medium text-foreground",
  venue: "rounded-full border border-border bg-wl-green/30 px-2 py-0.5 text-[10px] font-medium text-foreground",
} as const

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
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">
          {request.entry_song}
          {request.entry_short && (
            <span className="ml-1 text-[0.625rem] text-red-400">
              [{request.entry_short}]
            </span>
          )}
        </p>
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
  entry,
  show,
  releaseArtwork,
  onRequest,
  submitting,
  submitError,
  waitSeconds,
}: {
  entry: SetlistEntry
  show: {
    show_date: string
    show_venue_location: string | null
    show_group: string | null
  }
  releaseArtwork: string | null
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

  return (
    <>
      {releaseArtwork && (
        <div className="relative size-12 shrink-0 overflow-hidden rounded border border-border">
          <Image
            src={releaseArtwork}
            alt=""
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">
          {entry.entry_song}
          {entry.entry_short && (
            <span className="ml-1 text-[0.625rem] text-red-400">
              [{entry.entry_short}]
            </span>
          )}
        </p>
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
        className={cn("shrink-0", !submitting && !mustWait && "animate-pulse-ring")}
        onClick={onRequest}
        disabled={submitting || mustWait}
      >
        {submitting
          ? "Requesting…"
          : mustWait
            ? `Wait ${waitSeconds}s`
            : "Request this song"}
      </Button>
    </>
  )
}
