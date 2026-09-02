"use client"

import { useEffect, useId } from "react"

import { echoFontClassName } from "@/components/echo/echo-fonts"
import { useAdminShowTimeEditor } from "@/components/dpro/setlistgame/admin-show-time-cell"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import type { GameShow } from "@/hooks/use-game-shows"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

function formatMmDd(dateInput: string): string {
  const date = new Date(
    dateInput.includes("T") ? dateInput : `${dateInput}T00:00:00Z`,
  )
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${month}.${day}`
}

export function EchoTourShowTimeDialog({
  show,
  open,
  onOpenChange,
  onSaved,
}: {
  show: GameShow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void | Promise<void>
}) {
  const headingId = useId()
  const onClose = () => onOpenChange(false)
  useWlHomeV2ScrollLock(open)

  const { draft, setDraft, saving, error, dirty, token, handleSave } =
    useAdminShowTimeEditor(show, async () => {
      await onSaved()
      onOpenChange(false)
    })

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open || !show) return null

  const detail = show.show_detail?.trim()

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        id="echo-show-time-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className={`modal modal--wted-request modal--echo-show-time echo-modal ${echoFontClassName}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Show Time (ET)</h3>
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
            <p className="echo-show-time-show">
              <span className="echo-show-time-date">
                {formatMmDd(show.show_date)}
              </span>
              <span className="echo-show-time-venue">{show.show_subvenue}</span>
              {detail ?
                <span className="echo-show-time-detail">{detail}</span>
              : null}
            </p>
            <div className="echo-show-time-form">
              <label className="echo-show-time-label" htmlFor="echo-show-time-input">
                Date and time (Eastern)
              </label>
              <div className="echo-show-time-row">
                <input
                  id="echo-show-time-input"
                  type="datetime-local"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="echo-show-time-input"
                  aria-label="Show time (Eastern)"
                />
                <button
                  type="button"
                  className="echo-tour-btn-primary"
                  disabled={!dirty || saving || !token}
                  onClick={handleSave}
                >
                  {saving ? "…" : "Save"}
                </button>
              </div>
              {error ?
                <p className="echo-show-time-error">{error}</p>
              : null}
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
