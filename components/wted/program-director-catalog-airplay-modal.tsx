"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useId } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Button } from "@/components/ui/button"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import type { ProgramDirectorCatalogRow } from "@/lib/fetch-program-director-catalog"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"

import "./program-director-catalog.css"

type ProgramDirectorCatalogAirplayModalProps = {
  open: boolean
  onClose: () => void
  row: ProgramDirectorCatalogRow | null
}

export function ProgramDirectorCatalogAirplayModal({
  open,
  onClose,
  row,
}: ProgramDirectorCatalogAirplayModalProps) {
  const headingId = useId()
  const descId = useId()
  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const songId = row?.songId ?? null

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-pd-catalog-airplay-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-song modal--pd-catalog-airplay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head modal-setlist-song-head">
            <div className="modal-setlist-song-head-spacer" aria-hidden />
            <div className="modal-setlist-song-head-center">
              {row ?
                <>
                  <h3 id={headingId} className="modal-setlist-song-title">
                    <SongDisplayName
                      song={row.entrySong}
                      songDisplayName={row.songDisplayName}
                    />
                  </h3>
                  <p id={descId} className="modal-setlist-song-tour">
                    This performance appears on {row.wtedAppearancesCount}{" "}
                    {row.wtedAppearancesCount === 1 ? "show listing" : "show listings"}
                    .
                  </p>
                </>
              : <>
                  <h3 id={headingId}>Performance</h3>
                  <p id={descId} className="modal-request-sub sr-only">
                    No performance selected.
                  </p>
                </>
              }
            </div>
            <div className="modal-setlist-song-head-trailing">
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

          <div className="modal-request-body modal-setlist-song-body">
            <div className="modal-pd-show-info-scroll">
              {!row || row.episodes.length === 0 ?
                <p className="modal-pd-show-info-text text-white/55">
                  No WTED episodes linked for this performance.
                </p>
              : <ul className="wl-home-v2-pd-catalog-modal-episodes m-0 list-none p-0">
                  {row.episodes.map((ep) => {
                    const label = getWtedEpisodeDisplayName(
                      ep.episode,
                      ep.display_name,
                    )
                    const art = ep.artwork?.trim() ?? ""
                    return (
                      <li key={ep.uuid} className="list-none">
                        <Link
                          href={getWtedEpisodeUrl(ep.uuid)}
                          className="wl-home-v2-pd-catalog-modal-episode-link"
                          onClick={() => onClose()}
                        >
                          <span className="wl-home-v2-pd-catalog-modal-episode-art">
                            {art ?
                              <Image
                                src={art}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="44px"
                                unoptimized
                              />
                            : null}
                          </span>
                          <span className="wl-home-v2-pd-catalog-modal-episode-text">
                            <p className="wl-home-v2-pd-catalog-modal-episode-series">
                              {ep.show}
                            </p>
                            <p className="wl-home-v2-pd-catalog-modal-episode-title">
                              {label}
                            </p>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              }
            </div>
          </div>

          <div className="modal-setlist-song-footer">
            {songId ?
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="modal-setlist-song-footer-link"
                asChild
              >
                <Link href={getSongArchiveUrl(songId)} onClick={() => onClose()}>
                  View full song history
                </Link>
              </Button>
            : null}
            <button
              type="button"
              className="modal-setlist-song-footer-close"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
