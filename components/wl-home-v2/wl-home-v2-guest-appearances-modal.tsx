"use client"

import { useEffect, useId } from "react"
import Link from "next/link"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import { GuestAppearancesDetailTable } from "@/components/dpro/tours/guest-appearances-detail-table"
import { GuestPersonnelShowsTable } from "@/components/dpro/tours/guest-personnel-shows-table"
import type { GuestAppearancesDrawerProps } from "@/components/dpro/tours/guest-appearances-drawer"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Button } from "@/components/ui/button"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

/**
 * WL Home v2: guest appearance drill-down in the same centered shell as
 * {@link WlHomeV2SetlistSongModal} (`modal--setlist-song`).
 */
export function WlHomeV2GuestAppearancesModal({
  modalData,
  onOpenChange,
}: GuestAppearancesDrawerProps) {
  const open = modalData.isOpen
  const headingId = useId()
  const tourLineId = useId()

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-guest-appearances-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false)
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
              {modalData.guestName ?
                <>
                  <h3 id={headingId} className="modal-setlist-song-title">
                    {modalData.guestName}
                  </h3>
                  <div className="mt-2 flex max-w-full flex-wrap items-center justify-center gap-2">
                    {modalData.guestInstrument ?
                      <span className="modal-setlist-song-instrument">
                        {modalData.guestInstrument}
                      </span>
                    : null}
                    {modalData.tourName ?
                      <p id={tourLineId} className="modal-setlist-song-tour !m-0">
                        {modalData.tourName}
                      </p>
                    : <span id={tourLineId} className="sr-only">
                        Guest appearances on this tour.
                      </span>
                    }
                  </div>
                </>
              : <>
                  <h3 id={headingId}>Guest</h3>
                  <p id={tourLineId} className="modal-request-sub">
                    No guest selected.
                  </p>
                </>
              }
            </div>
            <div className="modal-setlist-song-head-trailing">
              <button
                type="button"
                className="modal-request-close"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          <div className="modal-request-body modal-setlist-song-body">
            <div className="wl-home-v2-years-table-scroll flex min-h-0 flex-1 flex-col overflow-auto px-0.5 pt-0.5 pb-1.5">
              {modalData.personnelShows !== undefined ?
                <GuestPersonnelShowsTable
                  shows={modalData.personnelShows}
                  variant="wl-modal"
                  onNavigate={() => onOpenChange(false)}
                />
              : <GuestAppearancesDetailTable
                  songs={modalData.songs}
                  variant="wl-modal"
                  onNavigate={() => onOpenChange(false)}
                />
              }
            </div>
          </div>
          <div className="modal-setlist-song-footer">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="modal-setlist-song-footer-link"
              asChild
            >
              <Link
                href={getPersonnelArchiveUrl(modalData.guestId)}
                onClick={() => onOpenChange(false)}
              >
                Guest Profile
              </Link>
            </Button>
            <button
              type="button"
              className="modal-setlist-song-footer-close"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
