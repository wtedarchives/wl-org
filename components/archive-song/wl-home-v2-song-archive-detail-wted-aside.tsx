"use client"

import Link from "next/link"
import { type RefObject } from "react"

import { CaretDown, CaretUp } from "@phosphor-icons/react"

import { formatSetlistDate } from "@/lib/setlist-utils"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import type { SongWtedAirplayGroup } from "@/types/song-wted-airplay"

export function WlHomeV2SongArchiveDetailWtedAside({
  wtedListRef,
  wtedScrollUp,
  wtedScrollDown,
  scrollWtedListBy,
  loading,
  groups,
}: {
  wtedListRef: RefObject<HTMLUListElement | null>
  wtedScrollUp: boolean
  wtedScrollDown: boolean
  scrollWtedListBy: (delta: number) => void
  loading: boolean
  groups: SongWtedAirplayGroup[]
}) {
  return (
    <aside
      className="perf-wted-band__wted"
      aria-label="WTED Radio appearances"
    >
      <div className="card">
        <div className="card-head wted-card-head">
          <h3>WTED Radio</h3>
          <p className="wted-intro">
            Performances that appear in episodes on WTED Radio.
          </p>
        </div>
        <div className="wted-list-scroll-shell">
          {wtedScrollUp ?
            <button
              type="button"
              className="wted-scroll-hint wted-scroll-hint--up"
              aria-label="Scroll WTED list up"
              onClick={() => scrollWtedListBy(-140)}
            >
              <CaretUp
                size={12}
                weight="bold"
                aria-hidden
                className="wted-scroll-hint-icon"
              />
            </button>
          : null}
          <ul ref={wtedListRef} className="wted-list">
            {loading ?
              <li style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                Loading…
              </li>
            : groups.map((g) => {
                const dateText =
                  g.showDate ? formatSetlistDate(g.showDate) : null
                const rowKey =
                  g.showId
                  ?? `r:${g.showDate}:${g.venueLocation}`
                return (
                  <li key={rowKey}>
                    <div className="wted-date">
                      {dateText && g.showId ?
                        <Link href={getSetlistArchiveUrl(g.showId)}>
                          {dateText}
                        </Link>
                      : dateText}
                      {g.venueLocation?.trim() ?
                        <span className="wted-venue">
                          {" "}
                          {"\u00A0"}
                          ·
                          {"\u00A0"}
                          {" "}
                          {g.venueLocation}
                        </span>
                      : null}
                    </div>
                    <ul className="wted-eps">
                      {g.episodes.map((ep) => (
                        <li key={ep.eeUuid}>
                          <span className="series">{ep.wtedSeries}</span>
                          <span className="ep">
                            <Link href={getWtedEpisodeUrl(ep.episodeUuid)}>
                              {getWtedEpisodeDisplayName(
                                ep.episodeCode,
                                ep.episodeDisplayName,
                              )}
                            </Link>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
          </ul>
          {wtedScrollDown ?
            <button
              type="button"
              className="wted-scroll-hint wted-scroll-hint--down"
              aria-label="Scroll WTED list down"
              onClick={() => scrollWtedListBy(140)}
            >
              <CaretDown
                size={12}
                weight="bold"
                aria-hidden
                className="wted-scroll-hint-icon"
              />
            </button>
          : null}
        </div>
      </div>
    </aside>
  )
}
