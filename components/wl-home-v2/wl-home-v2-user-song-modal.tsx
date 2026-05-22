"use client"

import Link from "next/link"
import { useEffect } from "react"

import { UserSongPerformancesPanel } from "@/components/dpro/profile/user-song-performances-panel"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Button } from "@/components/ui/button"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

type WlHomeV2UserSongModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  scopeLineId: string
  songName: string | null
  songDisplayName?: string | null
  songId?: string | null
  userId: string | null
  attendedShowIds: string[]
  isOwnProfile: boolean
}

/**
 * WL Home v2: attended-show song performances in the same centered shell as
 * {@link WlHomeV2SetlistSongModal} (tour song popup).
 */
export function WlHomeV2UserSongModal({
  open,
  onClose,
  headingId,
  scopeLineId,
  songName,
  songDisplayName,
  songId,
  userId,
  attendedShowIds,
  isOwnProfile,
}: WlHomeV2UserSongModalProps) {
  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const scopeLabel = isOwnProfile ? "Your shows" : "Attended shows"

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-user-song-modal"
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
          aria-describedby={scopeLineId}
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
                      songDisplayName={songDisplayName}
                    />
                  </h3>
                  <p id={scopeLineId} className="modal-setlist-song-tour">
                    {scopeLabel}
                  </p>
                </>
              : <>
                  <h3 id={headingId}>Song</h3>
                  <p id={scopeLineId} className="modal-request-sub">
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
            <UserSongPerformancesPanel
              open={open}
              onDismiss={onClose}
              songName={songName}
              songDisplayName={songDisplayName}
              songId={songId}
              userId={userId}
              attendedShowIds={attendedShowIds}
              scopeLabel={scopeLabel}
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
