"use client"

import { useId } from "react"
import Image from "next/image"

import {
  SetlistWtedPanel,
  type SetlistWtedShowContext,
} from "@/components/dpro/setlist/setlist-wted-panel"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import type { SetlistEntry } from "@/types/setlist"

export type { SetlistWtedShowContext }

type WlHomeV2SetlistWtedModalProps = {
  open: boolean
  onClose: () => void
  entry: SetlistEntry | null
  /** Unique WTED-linked entries when a song pair has multiple radio IDs. */
  wtedEntryOptions?: SetlistEntry[] | null
  setlist: SetlistEntry[]
  show: SetlistWtedShowContext
  fallbackReleaseArtwork: string | null
  headingId: string
}

/**
 * WL Home v2: same WTED request queue + submit flow as {@link SetlistWtedSheet},
 * in the centered `modal--wted-request` shell.
 */
export function WlHomeV2SetlistWtedModal({
  open,
  onClose,
  entry,
  wtedEntryOptions = null,
  setlist,
  show,
  fallbackReleaseArtwork,
  headingId,
}: WlHomeV2SetlistWtedModalProps) {
  const subtextId = useId()
  useWlHomeV2ScrollLock(open)

  const onOpenChange = (next: boolean) => {
    if (!next) onClose()
  }

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-setlist-wted-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-wted"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId} className="modal-setlist-wted-title">
                <Image
                  src="/WTED2.png"
                  alt=""
                  width={28}
                  height={28}
                  className="modal-setlist-wted-title-icon"
                />
                <span>WTED Goose Radio</span>
              </h3>
              <p id={subtextId} className="modal-request-sub">
                Users can request four tracks every 60 minutes.
              </p>
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
          <div className="modal-request-body modal-setlist-wted-body">
            <SetlistWtedPanel
              open={open}
              onOpenChange={onOpenChange}
              entry={entry}
              wtedEntryOptions={wtedEntryOptions}
              setlist={setlist}
              show={show}
              fallbackReleaseArtwork={fallbackReleaseArtwork}
              variant="modal"
            />
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
