"use client"

import {
  Export,
  Info,
  ListNumbers,
  MusicNote,
  Users,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useId } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

const ICON_PROPS = {
  size: 22,
  weight: "regular" as const,
}

const RADIO_HUB_TITLE = "WTED Radio"
const RADIO_HUB_INTRO =
  ""

type WlHomeV2RadioModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  /** Opens the same Request a Song flow as the homepage tile. */
  onRequestSong: () => void
  /** Admin-only: closes hub then opens schedule PNG generator. */
  onShareSchedule?: () => void
}

export function WlHomeV2RadioModal({
  open,
  onClose,
  headingId,
  onRequestSong,
  onShareSchedule,
}: WlHomeV2RadioModalProps) {
  const descId = useId()
  useWlHomeV2ScrollLock(open)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="radio-hub-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--radio-hub"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{RADIO_HUB_TITLE}</h3>
              <p id={descId} className="modal-request-sub">
                {RADIO_HUB_INTRO}
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
          <div className="modal-request-body modal-radio-hub-body">
            <div className="modal-radio-hub-stack">
              <div className="modal-radio-hub-grid">
              <button
                type="button"
                className="modal-archive-tile modal-archive-tile--button"
                onClick={() => {
                  onClose()
                  onRequestSong()
                }}
              >
                <span className="modal-archive-tile-top">
                  <span className="modal-archive-tile-title">Request a Song</span>
                  <MusicNote
                    className="modal-archive-tile-icon"
                    {...ICON_PROPS}
                    aria-hidden
                  />
                </span>
                <span className="modal-archive-tile-desc">
                  Browse the on-air catalog and send a request to be played on
                  WTED Radio.
                </span>
              </button>

              <Link
                href="/wted/program-director"
                className="modal-archive-tile"
                onClick={onClose}
              >
                <span className="modal-archive-tile-top">
                  <span className="modal-archive-tile-title">
                    Program Director
                  </span>
                  <ListNumbers
                    className="modal-archive-tile-icon"
                    {...ICON_PROPS}
                    aria-hidden
                  />
                </span>
                <span className="modal-archive-tile-desc">
                  See playlists of all shows and episodes on WTED Radio.
                </span>
              </Link>

              <Link
                href="/wted/about"
                className="modal-archive-tile"
                onClick={onClose}
              >
                <span className="modal-archive-tile-top">
                  <span className="modal-archive-tile-title">About Us</span>
                  <Info
                    className="modal-archive-tile-icon"
                    {...ICON_PROPS}
                    aria-hidden
                  />
                </span>
                <span className="modal-archive-tile-desc">
                  What WTED is, popular FAQs, and how to support the station.
                </span>
              </Link>

              <Link
                href="/wted/gorps"
                className="modal-archive-tile"
                onClick={onClose}
              >
                <span className="modal-archive-tile-top">
                  <span className="modal-archive-tile-title">GORPs</span>
                  <Users
                    className="modal-archive-tile-icon"
                    {...ICON_PROPS}
                    aria-hidden
                  />
                </span>
                <span className="modal-archive-tile-desc">
                  The hosts and contributors of the shows on WTED Radio.
                </span>
              </Link>
            </div>

            {onShareSchedule ?
                <button
                  type="button"
                  className="modal-archive-tile modal-archive-tile--button modal-radio-hub-share-schedule"
                  onClick={() => {
                    onClose()
                    onShareSchedule()
                  }}
                >
                  <span className="modal-archive-tile-top">
                    <span className="modal-archive-tile-title">
                      Share Schedule
                    </span>
                    <Export
                      className="modal-archive-tile-icon"
                      {...ICON_PROPS}
                      aria-hidden
                    />
                  </span>
                  <span className="modal-archive-tile-desc">
                    Generate a 9∶16 image of today&apos;s on-air lineup for social
                    posts.
                  </span>
                </button>
              : null}
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
