"use client"

import { useEffect, useId } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

export type BugsResolveModalBug = {
  bug_id: string
  bug_type: string
  bug_detail: string | null
}

type BugsResolveModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBug: BugsResolveModalBug | null
  updating: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function BugsResolveModal({
  open,
  onOpenChange,
  selectedBug,
  updating,
  onConfirm,
  onCancel,
}: BugsResolveModalProps) {
  const headingId = useId()
  const subtextId = useId()

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const backdropClass = open ? "modal-backdrop open" : "modal-backdrop"

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={backdropClass}
        id="bugs-resolve-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request modal--dpro-bugs-resolve"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Resolve Bug</h3>
              <p id={subtextId} className="modal-request-sub">
                Has this bug been resolved?
              </p>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <div className="modal-dpro-bugs-resolve-inner">
              {selectedBug && (
                <div className="modal-dpro-bugs-resolve-summary">
                  <p className="modal-dpro-bugs-resolve-type">{selectedBug.bug_type}</p>
                  <p className="modal-dpro-bugs-resolve-detail">
                    {selectedBug.bug_detail ?? "No details provided."}
                  </p>
                </div>
              )}
              <div className="modal-dpro-bugs-resolve-actions">
                <button
                  type="button"
                  className="wbtn"
                  onClick={onCancel}
                  disabled={updating}
                >
                  No
                </button>
                <button
                  type="button"
                  className="wbtn primary"
                  onClick={onConfirm}
                  disabled={updating}
                >
                  {updating ? "Updating…" : "Yes, Resolved"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
