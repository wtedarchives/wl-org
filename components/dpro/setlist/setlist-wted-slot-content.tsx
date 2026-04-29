"use client"

import { Fragment } from "react"
import Image from "next/image"
import { Check, CircleNotch } from "@phosphor-icons/react"
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

/** WL Home v2: styles live in `wl-home-v2.css` (`.wl-home-v2-wted-slot-pill*`). */
const PILL_CLASSES_WL_HOME_V2 = {
  date: "wl-home-v2-wted-slot-pill wl-home-v2-wted-slot-pill--date",
  group: "wl-home-v2-wted-slot-pill wl-home-v2-wted-slot-pill--group",
  venue: "wl-home-v2-wted-slot-pill wl-home-v2-wted-slot-pill--venue",
} as const

export type WtedSlotVisualVariant = "drawer" | "wlHomeV2"

function pillClassesFor(
  type: keyof typeof PILL_CLASSES,
  visualVariant: WtedSlotVisualVariant,
) {
  return visualVariant === "wlHomeV2" ? PILL_CLASSES_WL_HOME_V2[type] : PILL_CLASSES[type]
}

export function WtedSegmentsTitle({
  segments,
  visualVariant = "drawer",
}: {
  segments: WtedRequestEnrichedSegment[]
  visualVariant?: WtedSlotVisualVariant
}) {
  return (
    <span
      className={cn(
        "min-w-0 break-words text-xs font-medium leading-snug",
        visualVariant === "wlHomeV2" ?
          "text-[12px] text-white/[0.88]"
        : "text-foreground",
      )}
    >
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {i > 0 ?
            <span className="text-red-400 mr-0.5" aria-hidden>
              {" "}
              →{" "}
            </span>
          : null}
          <span className="inline-flex min-w-0 max-w-full flex-wrap items-baseline gap-x-1">
            <SongDisplayName
              as="span"
              song={seg.song}
              songDisplayName={seg.song_displayname}
            />
            {shouldShowSetlistEntryShort(seg.song, seg.entry_short) && (
              <span className="shrink-0 text-[0.625rem] text-red-400">
                [{seg.entry_short}]
              </span>
            )}
          </span>
        </Fragment>
      ))}
    </span>
  )
}

export function WtedRequestSlotContent({
  request,
  visualVariant = "drawer",
}: {
  request: WtedRequestEnriched
  visualVariant?: WtedSlotVisualVariant
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
        <div
          className={cn(
            "relative shrink-0 overflow-hidden",
            visualVariant === "wlHomeV2" ?
              "wl-home-v2-wted-slot-art"
            : "size-12 rounded border border-border",
          )}
        >
          {visualVariant === "wlHomeV2" ?
            <Image
              src={request.release_artwork}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
            />
          : <Image
              src={request.release_artwork}
              alt=""
              width={48}
              height={48}
              className="object-cover"
              unoptimized
            />
          }
        </div>
      )}
      <div
        className={cn(
          "min-w-0 flex-1",
          visualVariant === "wlHomeV2" && "wl-home-v2-wted-slot-body",
        )}
      >
        <WtedSegmentsTitle
          segments={request.segments}
          visualVariant={visualVariant}
        />
        <div
          className={cn(
            visualVariant === "wlHomeV2" ?
              "wl-home-v2-wted-slot-pills"
            : "mt-1 flex flex-wrap gap-1",
          )}
        >
          {pills.map(({ label, type }) => (
            <span
              key={label}
              className={cn(
                visualVariant !== "wlHomeV2" && "inline-flex",
                pillClassesFor(type, visualVariant),
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          visualVariant === "wlHomeV2" ?
            "wl-home-v2-wted-slot-check"
          : "bg-primary/20 p-1.5",
        )}
        aria-label="Requested"
      >
        <Check
          className={cn(
            visualVariant === "wlHomeV2" ?
              "wl-home-v2-wted-slot-check-icon"
            : "size-4 text-primary",
          )}
          aria-hidden
        />
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
  visualVariant = "drawer",
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
  visualVariant?: WtedSlotVisualVariant
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
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden",
            visualVariant === "wlHomeV2" ?
              "wl-home-v2-wted-slot-art"
            : "size-12 rounded border border-border bg-muted/60",
          )}
        >
          <CircleNotch
            className={cn(
              "size-5 animate-spin",
              visualVariant === "wlHomeV2" ?
                "text-white/45"
              : "text-muted-foreground",
            )}
            aria-hidden
          />
        </div>
      ) : releaseArtwork ?
        <div
          className={cn(
            "relative shrink-0 overflow-hidden",
            visualVariant === "wlHomeV2" ?
              "wl-home-v2-wted-slot-art"
            : "size-12 rounded border border-border",
          )}
        >
          {visualVariant === "wlHomeV2" ?
            <Image
              src={releaseArtwork}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
            />
          : <Image
              src={releaseArtwork}
              alt=""
              width={48}
              height={48}
              className="object-cover"
              unoptimized
            />
          }
        </div>
      : null}
      <div
        className={cn(
          "min-w-0 flex-1",
          visualVariant === "wlHomeV2" && "wl-home-v2-wted-slot-body",
        )}
      >
        <WtedSegmentsTitle segments={segments} visualVariant={visualVariant} />
        <div
          className={cn(
            visualVariant === "wlHomeV2" ?
              "wl-home-v2-wted-slot-pills"
            : "mt-1 flex flex-wrap gap-1",
          )}
        >
          {pills.map(({ label, type }) => (
            <span
              key={label}
              className={cn(
                visualVariant !== "wlHomeV2" && "inline-flex",
                pillClassesFor(type, visualVariant),
              )}
            >
              {label}
            </span>
          ))}
        </div>
        {submitError && (
          <p
            className={cn(
              "mt-1 text-[10px]",
              visualVariant === "wlHomeV2" ?
                "wl-home-v2-wted-slot-submit-error text-red-300/95"
              : "text-destructive",
            )}
          >
            {submitError}
          </p>
        )}
      </div>
      {visualVariant === "wlHomeV2" ?
        <div className="wl-home-v2-wted-slot-trailing">
          <Button
            size="sm"
            className={cn(
              "shrink-0",
              mustWait && "text-sm",
              "wl-home-v2-wted-request-track-btn",
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
        </div>
      : <Button
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
      }
    </>
  )
}
