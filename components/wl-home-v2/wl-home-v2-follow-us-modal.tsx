"use client"

import { FollowUsLinksGrid } from "@/components/follow-us-links-grid"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

type WlHomeV2FollowUsModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

export function WlHomeV2FollowUsModal({
  open,
  onClose,
  headingId,
}: WlHomeV2FollowUsModalProps) {
  useWlHomeV2ScrollLock(open)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="follow-us-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--follow-us"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Follow us</h3>
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
          <div className="modal-request-body modal-follow-us-body">
            <FollowUsLinksGrid layout="wl-modal" onSelectLink={onClose} />
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
