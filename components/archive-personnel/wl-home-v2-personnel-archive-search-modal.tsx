"use client"

import Link from "next/link"
import type { Dispatch, RefObject, SetStateAction } from "react"
import { useId } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { formatInstrument } from "@/lib/personnel-utils"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import type { PersonnelSearchGuestRow } from "@/components/archive-personnel/personnel-archive-search-helpers"

export function WlHomeV2PersonnelArchiveSearchModal({
  open,
  onClose,
  searchQuery,
  setSearchQuery,
  searchHits,
  searchInputRef,
}: {
  open: boolean
  onClose: () => void
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  searchHits: readonly PersonnelSearchGuestRow[]
  searchInputRef: RefObject<HTMLInputElement | null>
}) {
  const headingId = useId()
  const descId = useId()

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="personnel-archive-search-modal-backdrop"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--songs-archive-search"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Search personnel</h3>
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
          <div className="modal-request-body songs-archive-modal-search-body">
            <div className="songs-archive-modal-search-field-wrap">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                className="songs-archive-modal-search-input"
                id="personnel-archive-search-input"
                placeholder="Search personnel…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div
              className="songs-archive-modal-search-results"
              id="personnel-archive-search-results"
            >
              {searchQuery.trim().length > 0 && searchHits.length === 0 ?
                <div className="songs-archive-modal-empty">
                  No personnel match &quot;{searchQuery}&quot;.
                </div>
              : searchHits.map((g) => (
                  <Link
                    key={g.guest_id}
                    href={getPersonnelArchiveUrl(g.guest_id)}
                    className="songs-archive-modal-result-row personnel-archive-search-modal__row"
                    data-guest={g.guest}
                    onClick={onClose}
                  >
                    <span className="songs-archive-modal-result-title">
                      {g.guest}
                    </span>
                    <span className="songs-archive-modal-result-meta personnel-archive-search-modal__meta">
                      {g.guest_instrument ?
                        formatInstrument(g.guest_instrument, {
                          wrapInParens: false,
                        })
                      : ""}
                    </span>
                  </Link>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
