"use client"

import { useEffect, useId } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { WlHomeV2SetlistAttendeesPanel } from "@/components/wl-home-v2/wl-home-v2-setlist-attendees-panel"
import type { SetlistAttendeeEntry } from "@/hooks/use-setlist-attendees"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { formatSetlistDate } from "@/lib/setlist-utils"

type WlHomeV2SetlistAttendeesModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  showDate: string
  showVenueLocation: string
  attendeeCount: number
  attendees: SetlistAttendeeEntry[]
  isLoadingAttendees: boolean
  attendeesError: string | null
  onFetchAttendees: () => void
  showCanonPositions: boolean
  currentUserId?: string | null
}

/**
 * WL Home v2: attendees list for a setlist show (usernames + Goose canon #).
 */
export function WlHomeV2SetlistAttendeesModal({
  open,
  onClose,
  headingId,
  showDate,
  showVenueLocation,
  attendeeCount,
  attendees,
  isLoadingAttendees,
  attendeesError,
  onFetchAttendees,
  showCanonPositions,
  currentUserId = null,
}: WlHomeV2SetlistAttendeesModalProps) {
  const subtextId = useId()
  useWlHomeV2ScrollLock(open)

  const formattedDate = formatSetlistDate(showDate)
  const title = formattedDate || "Attendees"
  const countLabel = `${attendeeCount.toLocaleString("en-US")} ${
    attendeeCount === 1 ? "attendee" : "attendees"
  }`

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-setlist-attendees-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-attendees"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{title}</h3>
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
          <div
            id={subtextId}
            className="modal-request-sub modal-setlist-attendees-sub"
          >
            <span className="modal-setlist-attendees-sub__venue">
              {showVenueLocation || "\u00a0"}
            </span>
            <span className="modal-setlist-attendees-sub__count">
              {countLabel}
            </span>
          </div>
          <div className="modal-request-body modal-setlist-attendees-body">
            <WlHomeV2SetlistAttendeesPanel
              active={open}
              attendees={attendees}
              isLoadingAttendees={isLoadingAttendees}
              attendeesError={attendeesError}
              onFetchAttendees={onFetchAttendees}
              showCanonPositions={showCanonPositions}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
