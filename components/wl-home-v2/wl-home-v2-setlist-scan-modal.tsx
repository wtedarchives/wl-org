"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import {
  formatShowDateLong,
  getPlacementColor,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { Show, SetlistEntry } from "@/types/setlist"

import { getChangeTypeIcon } from "@/components/dpro/setlist/setlist-show-change-icon"

type WlHomeV2SetlistScanModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  setlistUrl: string
  show: Show
  setlist: SetlistEntry[]
  changes: ShowChangeRow[]
  error?: string | null
}

/**
 * WL Home v2: same content as {@link SetlistScanDrawer}, in the centered
 * `modal--wted-request` shell (Request a Song–style).
 */
export function WlHomeV2SetlistScanModal({
  open,
  onClose,
  headingId,
  setlistUrl,
  show,
  setlist,
  changes,
  error,
}: WlHomeV2SetlistScanModalProps) {
  const [imageError, setImageError] = useState(false)

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) setImageError(false)
  }, [open, setlistUrl])

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-setlist-scan-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-scan"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Setlist Scan</h3>
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
          <div className="modal-request-body modal-setlist-scan-body">
            <div className="wl-home-v2-setlist-scan-columns">
              <div className="wl-home-v2-setlist-scan-col wl-home-v2-setlist-scan-col--image">
                <div className="sc-label">Setlist Scan</div>
                <div className="wl-home-v2-setlist-scan-image-wrap">
                  {!imageError && setlistUrl ?
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={setlistUrl}
                      alt="Setlist scan"
                      className="wl-home-v2-setlist-scan-image"
                      onError={() => setImageError(true)}
                    />
                  : <p className="wl-home-v2-setlist-scan-image-fallback">
                      Image unavailable
                    </p>
                  }
                </div>
              </div>
              <div className="wl-home-v2-setlist-scan-col wl-home-v2-setlist-scan-col--setlist">
                <div className="sc-label">Actual Setlist</div>
                <div className="wl-home-v2-setlist-scan-detail">
                  <p className="wl-home-v2-setlist-scan-detail-primary">
                    {show.show_group}
                  </p>
                  <p className="wl-home-v2-setlist-scan-detail-muted">
                    {formatShowDateLong(show.show_date)}
                  </p>
                  {show.show_subvenue ?
                    <p className="wl-home-v2-setlist-scan-detail-muted">
                      {show.show_subvenue}
                    </p>
                  : null}
                  {show.show_venue_location ?
                    <p className="wl-home-v2-setlist-scan-detail-muted-subtle">
                      {show.show_venue_location}
                    </p>
                  : null}
                </div>
                <div className="wl-home-v2-setlist-scan-setlist-box">
                  {setlist.map((entry, index) => {
                    const prev = index > 0 ? setlist[index - 1] : null
                    const isNewSet = prev && prev.entry_set !== entry.entry_set
                    const placementColor = getPlacementColor(
                      entry.entry_placement,
                    )
                    return (
                      <div key={entry.entry_id}>
                        {isNewSet ?
                          <hr className="wl-home-v2-setlist-scan-set-divider" />
                        : null}
                        <div className="wl-home-v2-setlist-scan-entry-row">
                          <div
                            className="wl-home-v2-setlist-scan-entry-bar"
                            style={{ backgroundColor: placementColor }}
                          />
                          <div className="wl-home-v2-setlist-scan-entry-main">
                            <span className="wl-home-v2-setlist-scan-entry-song">
                              <Link
                                href={getSongArchiveUrl(entry.songs.song_id)}
                                className="wl-home-v2-setlist-scan-song-link"
                                onClick={() => onClose()}
                              >
                                <SongDisplayName
                                  song={entry.entry_song}
                                  songDisplayName={
                                    entry.songs.song_displayname
                                  }
                                />
                              </Link>
                              {shouldShowSetlistEntryShort(
                                entry.entry_song,
                                entry.entry_short,
                              ) ?
                                <span className="wl-home-v2-setlist-scan-entry-short">
                                  [{entry.entry_short}]
                                </span>
                              : null}
                              {entry.entry_segue ?
                                <span className="wl-home-v2-setlist-scan-entry-segue">
                                  →{" "}
                                  {entry.entry_segue
                                    .replace(/^>\s*/, "")
                                    .trim()}
                                </span>
                              : null}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="wl-home-v2-setlist-scan-changes-block">
                  <div className="sc-label">Setlist Changes</div>
                  {error ?
                    <p className="wl-home-v2-setlist-scan-changes-error">
                      {error}
                    </p>
                  : null}
                  {changes.length === 0 ?
                    <p className="wl-home-v2-setlist-scan-changes-empty">
                      No changes from original setlist.
                    </p>
                  : <ul className="wl-home-v2-setlist-scan-changes-list">
                      {changes.map((c) => {
                        const iconConfig = getChangeTypeIcon(c.change_type)
                        return (
                          <li
                            key={c.show_change_uuid}
                            className="wl-home-v2-setlist-scan-changes-item"
                          >
                            {iconConfig ?
                              <iconConfig.Icon
                                className={cn(
                                  "wl-home-v2-setlist-scan-changes-icon size-3.5 shrink-0",
                                  iconConfig.colorClass,
                                )}
                              />
                            : null}
                            <span
                              dangerouslySetInnerHTML={{ __html: c.change }}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
