"use client"

import Link from "next/link"
import { Fragment, useEffect, useId } from "react"
import { Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { useSandwichPerformances } from "@/hooks/use-sandwich-performances"
import type { SandwichRow } from "@/hooks/use-unfinished-reprised-data"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

function formatShowDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date
  return `${month}.${day}.${year.slice(2)}`
}

type WlHomeV2RepriseSandwichModalProps = {
  open: boolean
  onClose: () => void
  sandwich: SandwichRow | null
}

/**
 * WL Home v2: reprise sandwich performances in the same centered shell as
 * {@link WlHomeV2SetlistSongModal} (tour song popup).
 */
export function WlHomeV2RepriseSandwichModal({
  open,
  onClose,
  sandwich,
}: WlHomeV2RepriseSandwichModalProps) {
  useWlHomeV2ScrollLock(open)
  const headingId = useId()
  const subLineId = useId()

  const { performances, loading, error } = useSandwichPerformances(open, sandwich)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const perfCount = performances.length
  const countLabel = loading ?
    "Loading performances…"
  : `${perfCount} performance${perfCount !== 1 ? "s" : ""}`

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-reprise-sandwich-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-song"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subLineId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head modal-setlist-song-head">
            <div className="modal-setlist-song-head-spacer" aria-hidden={true} />
            <div className="modal-setlist-song-head-center">
              <h3 id={headingId} className="modal-setlist-song-title">
                Reprise Lookup
              </h3>
              {sandwich?.songs.length ?
                <>
                  <p
                    id={subLineId}
                    className="modal-setlist-song-tour modal-setlist-song-tour--flow"
                  >
                    {sandwich.songs.map((s, j) => (
                      <Fragment key={`${s.song_id}-${j}`}>
                        {j > 0 && <span className="text-destructive"> → </span>}
                        <SongDisplayName
                          compactInline
                          song={s.song_name}
                          songDisplayName={s.song_displayname}
                        />
                      </Fragment>
                    ))}
                  </p>
                  <p className="modal-request-sub">{countLabel}</p>
                </>
              : <span id={subLineId} className="sr-only">
                  No sandwich selected.
                </span>
              }
            </div>
            <div className="modal-setlist-song-head-trailing">
              <button
                type="button"
                className="modal-request-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          <div className="modal-request-body modal-setlist-song-body">
            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto text-xs">
              {loading ?
                <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>Loading performances…</span>
                </div>
              : error ?
                <p className="text-destructive">{error}</p>
              : performances.length === 0 ?
                <p className="py-2 text-muted-foreground">
                  No performances found.
                </p>
              : <div className="min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  <Table className="min-w-max text-xs">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-center font-medium">
                          Date
                        </TableHead>
                        <TableHead className="font-medium">Location</TableHead>
                        <TableHead className="text-center font-medium">
                          Length
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performances.map((p) => (
                        <TableRow key={p.show_id} className="border-border/60">
                          <TableCell className="text-center tabular-nums">
                            <Link
                              href={getSetlistArchiveUrl(p.show_id)}
                              className="hover:underline"
                              onClick={() => onClose()}
                            >
                              {formatShowDate(p.show_date)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {p.venue_id ?
                              <Link
                                href={getVenueArchiveUrl(p.venue_id)}
                                className="hover:underline"
                                onClick={() => onClose()}
                              >
                                {p.show_venue_location ?? p.show_subvenue}
                              </Link>
                            : p.show_subvenue_venue ?
                              <Link
                                href={getVenueArchiveUrl(p.show_subvenue_venue)}
                                className="hover:underline"
                                onClick={() => onClose()}
                              >
                                {p.show_venue_location ?? p.show_subvenue}
                              </Link>
                            : (p.show_venue_location ?? p.show_subvenue)}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {p.combined_length}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              }
            </div>
          </div>
          <div className="modal-setlist-song-footer">
            <button
              type="button"
              className="modal-setlist-song-footer-close"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
