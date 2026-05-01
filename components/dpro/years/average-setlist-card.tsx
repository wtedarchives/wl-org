"use client"

import { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import {
  useAverageSetlist,
  type AverageSetlistResult,
} from "@/hooks/use-average-setlist"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { SetlistDisplay } from "./setlist-display"
import { AverageSetlistInfoProse } from "@/components/dpro/years/average-setlist-info-prose"

interface ShowSlice {
  show_id: string
  show_iscanon?: boolean
  show_canonid?: number | null
}

interface AverageSetlistCardProps {
  shows: ShowSlice[]
  title: string
  type?: "year" | "tour"
  className?: string
  /** When provided, use pre-fetched data instead of fetching */
  averageSetlistResult?: AverageSetlistResult
  wlHomeV2?: boolean
  /** Hide panel title when wrapped in a modal; info stays inline unless controlled below. */
  embedInModal?: boolean
  /** With `embedInModal`, omit inline info when both set — parent supplies header control (e.g. modal). */
  infoOpen?: boolean
  onInfoOpenChange?: (open: boolean) => void
}

function AverageSetlistInfoDialog({
  open,
  onOpenChange,
  wlHomeV2 = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Use WL Home v2 centered modal (same chrome as Request a Song). */
  wlHomeV2?: boolean
}) {
  const headingId = useId()
  useWlHomeV2ScrollLock(open && wlHomeV2)

  useEffect(() => {
    if (!open || !wlHomeV2) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, wlHomeV2, onOpenChange])

  const onClose = () => onOpenChange(false)

  if (wlHomeV2) {
    if (!open) return null

    return (
      <WlHomeV2ModalPortal open={open}>
        <div
          className="modal-backdrop open"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div
            className="modal modal--wted-request modal--avg-setlist-info"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-request-head">
              <div className="modal-request-head-text">
                <h3 id={headingId}>How the Average Setlist Works</h3>
              </div>
              <button
                type="button"
                className="modal-request-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-request-body">
              <div className="modal-avg-setlist-info-scroll">
                <AverageSetlistInfoProse
                  headingClassName="modal-avg-setlist-info-section-title"
                  bodyClassName="modal-avg-setlist-info-p"
                />
              </div>
            </div>
          </div>
        </div>
      </WlHomeV2ModalPortal>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(85vh,36rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 text-left">
          <DialogTitle className="text-base font-semibold leading-snug">
            How the Average Setlist Works
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-xs leading-3.5 text-muted-foreground">
          <p className="text-foreground/90">
            The Average Setlist is a statistical model built from every
            canonical show in a given year or tour. It&apos;s not a real
            setlist — it&apos;s a representation of what a typical show looked
            like during that stretch.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Set inclusion
          </h3>
          <p className="mt-1.5">
            A set is only included if it was played in more than 50% of
            canonical shows in the slice that have setlist data (same entry
            filters as the rest of this model). The number of songs per set is
            the rounded average of distinct songs played in that set across all
            shows that included that set.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Song selection
          </h3>
          <p className="mt-1.5">
            Songs are ranked by how many shows they appeared in. The model
            calculates the total slots needed across all included sets and
            pulls the most-played songs to fill them. If multiple songs are tied
            at the cutoff, all tied songs enter the pool and the excess is
            trimmed after scoring.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Scoring and ordering
          </h3>
          <p className="mt-1.5">
            Each appearance is assigned a normalized position score: the
            song&apos;s absolute position in the show divided by the total songs
            in that show, scaled to the longest show in the slice. Per-show
            scores are averaged to produce a single number representing where in
            the night the song typically lives. The full pool is then sorted by
            this score — lower means earlier in the show.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Trimming ties
          </h3>
          <p className="mt-1.5">
            When the pool needs to be trimmed, only the least-played songs are
            eligible for cuts. Among those, songs are cut in this order:
            highest positional standard deviation first (most inconsistent
            placement), then lowest historical rarity percentage, then
            alphabetical as a last resort.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            What it tells you
          </h3>
          <p className="mt-1.5">
            The Average Setlist reflects what the band gravitated toward during
            a given period — which songs were staples, where they typically fell
            in the show, and how the sets were generally structured. It
            won&apos;t match any single real show exactly, but it&apos;s a
            useful lens for understanding the shape of a tour or year.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AverageSetlistCardHeader({
  title,
  onInfoClick,
}: {
  title: string
  onInfoClick: () => void
}) {
  return (
    <CardHeader className="border-b border-border/50 !py-1 pr-3">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="min-w-0 flex-1 text-sm font-semibold leading-snug">
          {title}
        </CardTitle>
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full border border-wl-dark-grey/50 bg-wl-orange/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wl-white",
            "transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          aria-label="How the average setlist works"
          onClick={onInfoClick}
        >
          info
        </button>
      </div>
    </CardHeader>
  )
}

export function AverageSetlistCard({
  shows,
  title,
  type = "year",
  className,
  averageSetlistResult,
  wlHomeV2 = false,
  embedInModal = false,
  infoOpen: infoOpenControlled,
  onInfoOpenChange,
}: AverageSetlistCardProps) {
  const [internalInfoOpen, setInternalInfoOpen] = useState(false)
  const infoControlled =
    infoOpenControlled !== undefined && onInfoOpenChange !== undefined
  const infoOpen = infoControlled ? infoOpenControlled : internalInfoOpen
  const setInfoOpen = infoControlled ? onInfoOpenChange : setInternalInfoOpen

  const hookResult = useAverageSetlist(
    averageSetlistResult ? [] : shows,
    type,
  )
  const { averageSetlist, isLoading, error } =
    averageSetlistResult ?? hookResult

  const cardClass = cn(
    "ring-0 border border-border/60 bg-card/80 py-0",
    className,
  )

  if (!isLoading && !error && (!averageSetlist || averageSetlist.length === 0)) {
    return null
  }

  const infoButton = (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-full border border-white/22 bg-white/8 !px-2 !py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90",
        "transition-colors hover:border-[rgba(88,200,174,0.5)] hover:bg-[rgba(88,200,174,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wl-light-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      )}
      aria-label="How the average setlist works"
      onClick={() => setInfoOpen(true)}
    >
      info
    </button>
  )

  return (
    <>
      <AverageSetlistInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        wlHomeV2={wlHomeV2}
      />
      {wlHomeV2 ?
        <div
          className={cn(
            "widget-panel",
            embedInModal && "wl-home-v2-years-tool-popup-panel--setlist",
            !embedInModal && "wl-home-v2-years-average-setlist-panel",
            className,
          )}
        >
          {embedInModal ?
            infoControlled ? null : (
              <div className="mb-2 flex justify-end">{infoButton}</div>
            )
          : <div className="wp-head">
              <span className="min-w-0 truncate">{title}</span>
              <span className="wp-head-right">{infoButton}</span>
            </div>}
          {isLoading ?
            <div className="flex items-center justify-center px-1 py-6 text-xs text-white/55">
              Calculating average setlist…
            </div>
          : error ?
            <div className="px-1 py-4 text-center text-xs text-red-300">
              Error: {error}
            </div>
          : (
            <SetlistDisplay
              setlist={averageSetlist ?? []}
              horizontalMargin=""
            />
          )}
        </div>
      : (
        <Card className={cardClass}>
          <AverageSetlistCardHeader
            title={title}
            onInfoClick={() => setInfoOpen(true)}
          />
          {isLoading ? (
            <CardContent className="flex items-center justify-center px-3 py-6 text-xs text-muted-foreground">
              Calculating average setlist…
            </CardContent>
          ) : error ? (
            <CardContent className="px-3 py-4 text-center text-xs text-destructive">
              Error: {error}
            </CardContent>
          ) : (
            <CardContent className="pt-2 pb-3">
              <SetlistDisplay
                setlist={averageSetlist ?? []}
                horizontalMargin=""
              />
            </CardContent>
          )}
        </Card>
      )}
    </>
  )
}
