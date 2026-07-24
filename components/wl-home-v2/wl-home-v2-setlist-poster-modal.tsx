"use client"

import { useEffect, useId, useState } from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { Button } from "@/components/ui/button"
import type { ShowPosterRecord } from "@/types/admin"

type WlHomeV2SetlistPosterModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  posters: ShowPosterRecord[]
  initialIndex?: number
  /** Hide tour names in details (e.g. tour page posters panel). */
  hideTours?: boolean
  /** Poster uuid → show lines (`mm.dd.yy (venue)`), shown first when present. */
  showLabelsByUuid?: Record<string, string[]>
}

/**
 * WL Home v2: poster detail modal (same shell as setlist scan).
 * Left: artwork · Right: show / artist / print run / description / tours.
 */
export function WlHomeV2SetlistPosterModal({
  open,
  onClose,
  headingId,
  posters,
  initialIndex = 0,
  hideTours = false,
  showLabelsByUuid,
}: WlHomeV2SetlistPosterModalProps) {
  const [index, setIndex] = useState(initialIndex)
  const [imageError, setImageError] = useState(false)

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    setIndex(
      Math.min(Math.max(0, initialIndex), Math.max(0, posters.length - 1)),
    )
    setImageError(false)
  }, [open, initialIndex, posters.length])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (posters.length <= 1) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        setIndex((i) => (i - 1 + posters.length) % posters.length)
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        setIndex((i) => (i + 1) % posters.length)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose, posters.length])

  useEffect(() => {
    setImageError(false)
  }, [index])

  const poster = posters[index] ?? null
  const artists = poster?.artist ?? []
  const tours = hideTours ? [] : (poster?.tour ?? [])
  const showLabels =
    poster && showLabelsByUuid ? (showLabelsByUuid[poster.uuid] ?? []) : []
  const hasDetails =
    showLabels.length > 0 ||
    artists.length > 0 ||
    poster?.print_run != null ||
    Boolean(poster?.description?.trim()) ||
    tours.length > 0

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-setlist-poster-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--setlist-poster"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Show Poster</h3>
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
          <div className="modal-request-body modal-setlist-poster-body">
            {!poster ?
              <p className="wl-home-v2-setlist-poster-empty">
                No poster available.
              </p>
            : <div className="wl-home-v2-setlist-poster-columns">
                <div className="wl-home-v2-setlist-poster-col wl-home-v2-setlist-poster-col--image">
                  <div className="wl-home-v2-setlist-poster-image-wrap">
                    {!imageError && poster.image ?
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={poster.image}
                        alt="Show poster"
                        className="wl-home-v2-setlist-poster-image"
                        onError={() => setImageError(true)}
                      />
                    : <p className="wl-home-v2-setlist-poster-image-fallback">
                        Image unavailable
                      </p>
                    }
                  </div>
                  {posters.length > 1 ?
                    <div className="wl-home-v2-setlist-poster-nav">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="wl-home-v2-setlist-poster-nav-btn h-9 gap-1 sm:h-8"
                        aria-label="Previous poster"
                        onClick={() =>
                          setIndex(
                            (i) => (i - 1 + posters.length) % posters.length,
                          )
                        }
                      >
                        <CaretLeft className="size-3.5" aria-hidden />
                        Prev
                      </Button>
                      <span className="wl-home-v2-setlist-poster-nav-count">
                        {index + 1} / {posters.length}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="wl-home-v2-setlist-poster-nav-btn h-9 gap-1 sm:h-8"
                        aria-label="Next poster"
                        onClick={() =>
                          setIndex((i) => (i + 1) % posters.length)
                        }
                      >
                        Next
                        <CaretRight className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  : null}
                </div>
                <div className="wl-home-v2-setlist-poster-col wl-home-v2-setlist-poster-col--details">
                  {!hasDetails ?
                    <p className="wl-home-v2-setlist-poster-empty-details">
                      No additional details for this poster.
                    </p>
                  : <div className="wl-home-v2-setlist-poster-detail">
                      {showLabels.length > 0 ?
                        <div className="wl-home-v2-setlist-poster-field">
                          <div className="sc-label">
                            {showLabels.length === 1 ? "Show" : "Shows"}
                          </div>
                          <ul className="wl-home-v2-setlist-poster-tours">
                            {showLabels.map((label) => (
                              <li
                                key={label}
                                className="wl-home-v2-setlist-poster-detail-primary"
                              >
                                {label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      : null}
                      {artists.length > 0 ?
                        <div className="wl-home-v2-setlist-poster-field">
                          <div className="sc-label">Artist</div>
                          <ul className="wl-home-v2-setlist-poster-artists">
                            {artists.map((artist, i) => {
                              const name = artist.name.trim() || "Artist"
                              const link = artist.link.trim()
                              return (
                                <li key={`${name}-${i}`}>
                                  {link ?
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="wl-home-v2-setlist-poster-artist-link"
                                    >
                                      {name}
                                    </a>
                                  : <span className="wl-home-v2-setlist-poster-detail-primary">
                                      {name}
                                    </span>
                                  }
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      : null}
                      {poster.print_run != null ?
                        <div className="wl-home-v2-setlist-poster-field">
                          <div className="sc-label">Print run</div>
                          <p className="wl-home-v2-setlist-poster-detail-primary">
                            {poster.print_run.toLocaleString("en-US")}
                          </p>
                        </div>
                      : null}
                      {poster.description?.trim() ?
                        <div className="wl-home-v2-setlist-poster-field">
                          <div className="sc-label">Description</div>
                          <p className="wl-home-v2-setlist-poster-detail-muted">
                            {poster.description.trim()}
                          </p>
                        </div>
                      : null}
                      {tours.length > 0 ?
                        <div className="wl-home-v2-setlist-poster-field">
                          <div className="sc-label">
                            {tours.length === 1 ? "Tour" : "Tours"}
                          </div>
                          <ul className="wl-home-v2-setlist-poster-tours">
                            {tours.map((tour) => (
                              <li
                                key={tour}
                                className="wl-home-v2-setlist-poster-detail-muted"
                              >
                                {tour}
                              </li>
                            ))}
                          </ul>
                        </div>
                      : null}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
