"use client"

import { useId } from "react"

import { WTED_SCHEDULE_EMBED_URL } from "@/lib/wted-schedule-embed"

type WlHomeV2ScheduleModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

/**
 * Same shell as {@link WlHomeV2RequestModal}; body is the Radio.co schedule iframe
 * (matches {@link WtedRadioScheduleCard}).
 */
export function WlHomeV2ScheduleModal({
  open,
  onClose,
  headingId,
}: WlHomeV2ScheduleModalProps) {
  const subtextId = useId()

  return (
    <div
      className={"modal-backdrop" + (open ? " open" : "")}
      id="schedule-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--wted-request modal--wted-schedule"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={subtextId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-request-head">
          <div className="modal-request-head-text">
            <h3 id={headingId}>Upcoming Schedule</h3>
            <p id={subtextId} className="modal-request-sub">
              Full WTED program schedule from Radio.co.
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
        <div className="modal-request-body modal-schedule-embed-body">
          {open ?
            <iframe
              src={WTED_SCHEDULE_EMBED_URL}
              title="WTED Schedule"
              allow="autoplay"
              scrolling="no"
              className="modal-schedule-iframe"
            />
          : null}
        </div>
      </div>
    </div>
  )
}
