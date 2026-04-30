"use client"

import Link from "next/link"
import type { Dispatch, RefObject, SetStateAction } from "react"
import { useId } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import type { SongsArchiveSong } from "@/hooks/use-songs-archive-data"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

export function SongsArchiveListSearchModal({
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
  searchHits: readonly SongsArchiveSong[]
  searchInputRef: RefObject<HTMLInputElement | null>
}) {
  const headingId = useId()
  const descId = useId()

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="songs-archive-search-modal-backdrop"
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
              <h3 id={headingId}>Search songs</h3>
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
                id="songs-archive-search-input"
                placeholder="Search songs…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div
              className="songs-archive-modal-search-results"
              id="songs-archive-search-results"
            >
              {searchQuery.trim().length > 0 && searchHits.length === 0 ?
                <div className="songs-archive-modal-empty">
                  No songs match &quot;{searchQuery}&quot;.
                </div>
              : searchHits.map((s) => (
                  <Link
                    key={s.song_id}
                    href={getSongArchiveUrl(s.song_id)}
                    className="songs-archive-modal-result-row"
                    data-song={s.song}
                    onClick={onClose}
                  >
                    <span className="songs-archive-modal-result-title">
                      <SongDisplayName
                        song={s.song}
                        songDisplayName={s.song_displayname}
                      />
                    </span>
                    <span className="songs-archive-modal-result-meta">
                      {s.song_category}
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

export function SongsArchiveListFilterModal({
  title,
  description,
  options,
  selected,
  setSelected,
  onClose,
}: {
  title: string
  description: string
  options: readonly string[]
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  onClose: () => void
}) {
  const headingId = useId()
  const descId = useId()

  function toggle(opt: string, on: boolean) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (on) n.add(opt)
      else n.delete(opt)
      return n
    })
  }

  function clear() {
    setSelected(new Set())
    onClose()
  }

  return (
    <WlHomeV2ModalPortal open>
      <div
        className="modal-backdrop open"
        id="songs-archive-filter-modal-backdrop"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--songs-archive-filter"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{title}</h3>
              <p id={descId} className="modal-request-sub">
                {description}
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
          <div className="modal-request-body songs-archive-modal-filter-body">
            <div className="songs-archive-filter-modal-scroll">
              {options.map((opt) => (
                <label key={opt} className="songs-archive-filter-option">
                  <input
                    type="checkbox"
                    checked={selected.has(opt)}
                    onChange={(e) => toggle(opt, e.target.checked)}
                    value={opt}
                  />
                  <span className="songs-archive-filter-option-label">
                    {opt}
                  </span>
                </label>
              ))}
            </div>
            <div className="songs-archive-filter-modal-footer">
              <button type="button" className="songs-archive-filter-clear-btn" onClick={clear}>
                Clear filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
