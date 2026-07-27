"use client"

import { ArrowRight, CalendarBlank, ClockCounterClockwise, Trophy } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import type { CSSProperties, MouseEvent } from "react"

import type { WlHomeMostRecentSetlistEntry } from "@/hooks/use-wl-home-most-recent-show"
import {
  formatWlHomeTileShowDate,
  wlHomeSetlistPillClass,
} from "@/hooks/use-wl-home-most-recent-show"
import type { WlHomeMostRecentShow } from "@/hooks/use-wl-home-most-recent-show"
import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { WlHomeV2ArchiveRandomShowButton } from "@/components/wl-home-v2/wl-home-v2-archive-random-show-button"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSetlistGameArchiveIndexUrl } from "@/lib/setlist-game-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

export function WlHomeV2TileArchive({
  onArchiveTileLinkClick,
  onOpenTourSchedule,
  onOpenThisDayInHistory,
  archiveMostRecentShow,
  archiveMostRecentLoading,
  archiveSetlistPanelActive,
  archiveSetlistBySet,
}: {
  onArchiveTileLinkClick: (e: MouseEvent<HTMLAnchorElement>) => void
  onOpenTourSchedule: () => void
  onOpenThisDayInHistory: () => void
  archiveMostRecentShow: WlHomeMostRecentShow | null
  archiveMostRecentLoading: boolean
  archiveSetlistPanelActive: boolean
  archiveSetlistBySet: WlHomeMostRecentSetlistEntry[][]
}) {
  return (
    <section
      className="tile tile-archive"
      style={{ "--tile-bg": "url('/newbg3.jpeg')" } as CSSProperties}
    >
      <Link
        href="/archive"
        className="tile-link"
        aria-label="Open Wysteria Lane Archives"
        onClick={onArchiveTileLinkClick}
      />
      <div className="tile-icon-stack">
        <div className="icon-wrap">
          <div className="icon-bg" />
          <Image
            src="/wted-sa-cropped-2.png"
            alt=""
            width={110}
            height={110}
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      <div className="tile-widget">
        <div
          className={[
            "widget-panel",
            archiveSetlistPanelActive && "widget-panel--archive-setlist",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {archiveSetlistPanelActive && archiveMostRecentShow ?
            <ArchivePrefetchLink
              href={getSetlistArchiveUrl(archiveMostRecentShow.show_id)}
              className="widget-panel-hit-area"
              aria-label={`View setlist — ${archiveMostRecentShow.show_venue_location}${archiveMostRecentShow.show_subvenue ? `, ${archiveMostRecentShow.show_subvenue}` : ""}, ${formatWlHomeTileShowDate(archiveMostRecentShow.show_date)}`}
            />
          : null}
          <div className="wp-head">
            <span>Most Recent Show</span>
            <span className="wp-head-right">
              {archiveMostRecentLoading ?
                "…"
              : archiveMostRecentShow ?
                <span className="wp-head-date">
                  {formatWlHomeTileShowDate(archiveMostRecentShow.show_date)}
                </span>
              : null}
            </span>
          </div>
          {archiveMostRecentLoading ?
            <p className="px-0 py-2 font-mono text-[10px] text-white/50">
              Loading show…
            </p>
          : archiveMostRecentShow ?
            <>
              <div className="archive-recent-venue">
                <div className="setlist-venue setlist-venue--solo setlist-venue--stack">
                  <div className="setlist-venue-names">
                    <span className="v-name">
                      {archiveMostRecentShow.show_venue_location}
                    </span>
                    {archiveMostRecentShow.show_subvenue ?
                      <span className="v-subvenue">
                        {archiveMostRecentShow.show_subvenue}
                      </span>
                    : null}
                    {archiveMostRecentShow.show_detail?.trim() ?
                      <span className="v-detail">
                        {archiveMostRecentShow.show_detail.trim()}
                      </span>
                    : null}
                  </div>
                </div>
              </div>
              <div className="setlist setlist--by-set archive-recent-setlist">
                {archiveSetlistBySet.map((setEntries, setIndex) => (
                  <div
                    key={`${setEntries[0]?.entry_set ?? "set"}-${setIndex}-${setEntries[0]?.entry_setnum ?? 0}`}
                    className="setlist-set-row"
                  >
                    {setEntries.map((entry, index) => {
                      const label =
                        entry.song_displayname?.trim() || entry.entry_song
                      const href =
                        entry.song_id ?
                          getSongArchiveUrl(entry.song_id)
                        : getSetlistArchiveUrl(archiveMostRecentShow.show_id)
                      return (
                        <ArchivePrefetchLink
                          key={`${entry.entry_song}-${entry.entry_set}-${entry.entry_setnum}-${setIndex}-${index}`}
                          href={href}
                          className={wlHomeSetlistPillClass(entry.entry_set)}
                        >
                          {label}
                        </ArchivePrefetchLink>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          : <p className="px-0 py-2 font-mono text-[10px] text-white/50">
              No recent canonical show with a setlist.
            </p>
          }
        </div>
        <div className="tile-widget-actions">
          <div className="tile-widget-actions-row">
            <button
              type="button"
              className="wbtn wbtn--app-store"
              onClick={onOpenTourSchedule}
            >
              <span className="wbtn-text">Tour Schedule</span>
              <CalendarBlank
                className="wbtn-icon"
                size={18}
                weight="regular"
                aria-hidden
              />
            </button>
            <button
              type="button"
              className="wbtn wbtn--app-store"
              onClick={onOpenThisDayInHistory}
            >
              <span className="wbtn-text">Today in History</span>
              <ClockCounterClockwise
                className="wbtn-icon"
                size={18}
                weight="regular"
                aria-hidden
              />
            </button>
          </div>
          <div className="tile-widget-actions-row">
            <WlHomeV2ArchiveRandomShowButton variant="tile-action" />
            <Link
              href={getSetlistGameArchiveIndexUrl()}
              className="wbtn wbtn--app-store"
            >
              <span className="wbtn-text">Setlist Game</span>
              <Trophy
                className="wbtn-icon"
                size={18}
                weight="regular"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>

      <div className="tile-body">
        <h2>
          WTED
          <br />
          Archives
        </h2>
        <div className="tile-body-copy">
          <p>
            The comprehensive show archive — setlists, stats, tours, and
            this-day-in-Goose history.
          </p>
          <span className="cta">
            <span className="cta-label">Dive in</span>
            <ArrowRight
              className="arrow"
              size={16}
              weight="regular"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </section>
  )
}
