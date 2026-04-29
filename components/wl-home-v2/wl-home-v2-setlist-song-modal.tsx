"use client"

import Link from "next/link"
import { useEffect } from "react"
import { SetlistSongPerformancesPanel } from "@/components/dpro/setlist/setlist-song-performances-panel"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Button } from "@/components/ui/button"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import type { SetlistEntry } from "@/types/setlist"

type WlHomeV2SetlistSongModalProps = {
  open: boolean
  onClose: () => void
  entry: SetlistEntry | null
  tourName: string | null
  headingId: string
  tourLineId: string
  /**
   * Tour stats / slots (no setlist row): same shape as
   * {@link SetlistSongPerformancesSheet} — panel resolves performances from song name + tour.
   */
  songName?: string | null
  songDisplayName?: string | null
  songId?: string | null
}

/**
 * WL Home v2: same tour-performance content as {@link SetlistSongPerformancesSheet},
 * in the centered `modal--wted-request` shell (Request a Song–style).
 */
export function WlHomeV2SetlistSongModal({
  open,
  onClose,
  entry,
  tourName,
  headingId,
  tourLineId,
  songName: songNameProp,
  songDisplayName: songDisplayNameProp,
  songId: songIdProp,
}: WlHomeV2SetlistSongModalProps) {
  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const songName = songNameProp ?? entry?.entry_song ?? ""
  const songId = songIdProp ?? entry?.song_id ?? null
  const headerDisplayName =
    entry?.songs?.song_displayname ?? songDisplayNameProp ?? null

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-setlist-song-modal"
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
          aria-describedby={tourLineId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head modal-setlist-song-head">
            <div className="modal-setlist-song-head-spacer" aria-hidden={true} />
            <div className="modal-setlist-song-head-center">
              {songName ?
                <>
                  <h3 id={headingId} className="modal-setlist-song-title">
                    <SongDisplayName
                      song={songName}
                      songDisplayName={headerDisplayName}
                    />
                  </h3>
                  {tourName ?
                    <p id={tourLineId} className="modal-setlist-song-tour">
                      {tourName}
                    </p>
                  : <span id={tourLineId} className="sr-only">
                      Performances of this song on the same tour as this show.
                    </span>
                  }
                </>
              : <>
                  <h3 id={headingId}>Song</h3>
                  <p id={tourLineId} className="modal-request-sub">
                    No song selected.
                  </p>
                </>
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
            <SetlistSongPerformancesPanel
              open={open}
              onDismiss={onClose}
              entry={entry}
              tourName={tourName}
              songName={songNameProp ?? undefined}
              songDisplayName={songDisplayNameProp ?? undefined}
              songId={songIdProp ?? undefined}
              showHeader={false}
              showFooter={false}
              wlHomeV2YearsTable
              className="flex min-h-0 flex-1 flex-col overflow-hidden text-xs"
            />
          </div>
          <div className="modal-setlist-song-footer">
            {songId ?
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="modal-setlist-song-footer-link"
                asChild
              >
                <Link href={getSongArchiveUrl(songId)} onClick={() => onClose()}>
                  View full song history
                </Link>
              </Button>
            : null}
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
