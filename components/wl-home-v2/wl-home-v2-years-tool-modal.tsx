"use client"

import { useId, type ReactNode } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

type WlHomeV2YearsToolModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /** Rendered to the left of the close control (e.g. Filter by Group “Clear”). */
  headerActions?: ReactNode
  children: ReactNode
}

/** Centered WL Home v2 modal shell (same pattern as the request-a-song dialog). */
export function WlHomeV2YearsToolModal({
  open,
  onClose,
  title,
  description,
  headerActions,
  children,
}: WlHomeV2YearsToolModalProps) {
  const headingId = useId()
  const descId = useId()
  useWlHomeV2ScrollLock(open)

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
          className="modal modal--wted-request modal--years-tools"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={description ? descId : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{title}</h3>
              {description ?
                <p id={descId} className="modal-request-sub">
                  {description}
                </p>
              : null}
            </div>
            <div className="modal-request-head-trailing">
              {headerActions}
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
          <div className="modal-request-body">
            <div className="modal-years-tools-scroll">{children}</div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
