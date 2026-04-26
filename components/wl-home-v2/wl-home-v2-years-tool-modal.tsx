"use client"

import { createPortal } from "react-dom"
import { useId, useLayoutEffect, useState, type ReactNode } from "react"

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
  const [container, setContainer] = useState<Element | null>(null)
  useWlHomeV2ScrollLock(open)

  useLayoutEffect(() => {
    setContainer(document.querySelector(".wl-home-v2"))
  }, [])

  if (!open) return null
  if (!container) return null

  return createPortal(
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
    </div>,
    container,
  )
}
