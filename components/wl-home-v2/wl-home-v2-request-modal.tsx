"use client"

import { useId } from "react"

import { WtedRequestSongFlow } from "@/components/wted/wted-request-song-flow"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

type WlHomeV2RequestModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

export function WlHomeV2RequestModal({
  open,
  onClose,
  headingId,
}: WlHomeV2RequestModalProps) {
  const subtextId = useId()
  useWlHomeV2ScrollLock(open)

  return (
    <div
      className={"modal-backdrop" + (open ? " open" : "")}
      id="request-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--wted-request"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={subtextId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-request-head">
          <div className="modal-request-head-text">
            <h3 id={headingId}>Request a Song</h3>
            <p id={subtextId} className="modal-request-sub">
              Users can request four songs every 60 minutes.
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
        <div className="modal-request-body">
          <WtedRequestSongFlow
            catalogFetchEnabled={open}
            panelWrapperClassName="min-h-[min(52vh,420px)]"
            panelClassName="rounded-none"
          />
        </div>
      </div>
    </div>
  )
}
