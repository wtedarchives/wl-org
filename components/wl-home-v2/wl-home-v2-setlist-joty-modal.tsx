"use client"

import { useId } from "react"

import {
  JOTY_DESCRIPTION,
  JotyBracketSponsorLogos,
  SetlistJotyBracketDataBody,
} from "@/components/dpro/setlist/setlist-joty-bracket-content"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

type WlHomeV2SetlistJotyModalProps = {
  open: boolean
  onClose: () => void
  year: number | null
  highlightedEntryId: string | null
  headingId: string
}

export function WlHomeV2SetlistJotyModal({
  open,
  onClose,
  year,
  highlightedEntryId,
  headingId,
}: WlHomeV2SetlistJotyModalProps) {
  const descId = useId()
  const displayYear = year ?? 0
  useWlHomeV2ScrollLock(open)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-joty-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--joty"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head modal-joty-head">
            <div className="modal-joty-head-spacer" aria-hidden={true} />
            <h3 id={headingId} className="modal-joty-title modal-joty-title--center">
              Jam of the Year {displayYear}
            </h3>
            <div className="modal-joty-head-trailing">
              <JotyBracketSponsorLogos />
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
          <div
            className="modal-request-body modal-joty-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <SetlistJotyBracketDataBody
              open={open}
              year={year}
              highlightedEntryId={highlightedEntryId}
              onNavigate={onClose}
              wlHomeV2YearsTable
            />
          </div>
          <p
            id={descId}
            className="modal-joty-footer"
          >
            {JOTY_DESCRIPTION}
          </p>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
