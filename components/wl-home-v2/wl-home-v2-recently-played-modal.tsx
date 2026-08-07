"use client"

import Image from "next/image"
import { Fragment, useId } from "react"
import { CircleNotch } from "@phosphor-icons/react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWtedRecentlyPlayedTracks } from "@/hooks/use-wted-recently-played-tracks"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import type { WtedRecentlyPlayedTrack } from "@/lib/wted-recently-played"
import { cn } from "@/lib/utils"

const RECENTLY_PLAYED_ARTWORK_FALLBACK = "/WL.png"

// `overflow-hidden` is what actually clips the artwork to the rounded corners,
// so the border can go without losing them.
const thumbFrame = "relative size-[30px] shrink-0 overflow-hidden rounded"

function RecentlyPlayedRowThumbnail({
  track,
}: {
  track: WtedRecentlyPlayedTrack
}) {
  if (track.artworkUrl) {
    return (
      <div className={thumbFrame}>
        <Image
          src={track.artworkUrl}
          alt=""
          width={30}
          height={30}
          className="size-full object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    // Centred rather than filled: the logo is sized to 24px while the frame
    // stays 30px, so fallback rows keep the same footprint as real artwork.
    <div className={cn(thumbFrame, "flex items-center justify-center bg-black/20")}>
      <Image
        src={RECENTLY_PLAYED_ARTWORK_FALLBACK}
        alt=""
        width={24}
        height={24}
        className="h-auto w-[24px]"
        unoptimized
      />
    </div>
  )
}

type WlHomeV2RecentlyPlayedModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

export function WlHomeV2RecentlyPlayedModal({
  open,
  onClose,
  headingId,
}: WlHomeV2RecentlyPlayedModalProps) {
  const subtextId = useId()
  const { tracks, loading, error } = useWtedRecentlyPlayedTracks(open)
  useWlHomeV2ScrollLock(open)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="recently-played-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--recently-played"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Recently Played</h3>
              <p id={subtextId} className="modal-request-sub">
                Tracks recently heard on WTED Goose Radio.
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
          <div className="modal-request-body modal-recently-played-body">
            {loading && tracks.length === 0 ?
              <div className="modal-recently-played-status">
                <CircleNotch className="size-5 animate-spin" aria-hidden />
                <span>Loading recently played…</span>
              </div>
            : error ?
              <p className="modal-recently-played-status">{error}</p>
            : tracks.length === 0 ?
              <p className="modal-recently-played-status">No history yet.</p>
            : <ul className="modal-recently-played-list">
                {tracks.map((track) => (
                  <Fragment key={track.id}>
                    {track.startsEpisode && track.episodeName ?
                      <li
                        className="modal-recently-played-divider"
                        aria-hidden
                      >
                        {track.episodeName}
                      </li>
                    : null}
                    <li className="modal-recently-played-row">
                      <RecentlyPlayedRowThumbnail track={track} />
                      <span
                        className="modal-recently-played-row-title"
                        title={track.title}
                      >
                        {track.title}
                      </span>
                    </li>
                  </Fragment>
                ))}
              </ul>
            }
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
