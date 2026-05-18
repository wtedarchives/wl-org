"use client"

import { UserSound } from "@phosphor-icons/react"
import { forwardRef } from "react"

import type { RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import { formatRadioScheduleTimeRange } from "@/hooks/use-radio-schedule"
import {
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_SAFE_INSET_PX,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX,
} from "@/lib/wl-home-v2-radio-schedule-share-export-config"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { parseWtedEpisodeHosts } from "@/lib/wted-episode-host"

import "./wl-home-v2-radio-schedule-share-export.css"

export type WlHomeV2RadioScheduleShareExportCardProps = {
  backgroundSrc: string
  /** Local calendar day this schedule snapshot represents (subtitle + filtering already applied). */
  scheduleDay: Date
  slots: RadioScheduleSlot[]
  loading: boolean
  error: string | null
}

export const WlHomeV2RadioScheduleShareExportCard = forwardRef<
  HTMLDivElement,
  WlHomeV2RadioScheduleShareExportCardProps
>(function WlHomeV2RadioScheduleShareExportCard(
  { backgroundSrc, scheduleDay, slots, loading, error },
  ref,
) {
  const dateSubtitle = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(scheduleDay)

  return (
    <div
      className="wl-radio-schedule-share-export__root"
      style={{
        width: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX,
        maxWidth: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX,
      }}
    >
      <div
        ref={ref}
        className="wl-radio-schedule-share-export__frame"
        style={{
          width: "100%",
          height: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX,
          maxHeight: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX,
          /* IG Stories: UI in-flow only between bands; bg stays full-bleed via absolute layer */
          paddingTop: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_SAFE_INSET_PX,
          paddingBottom: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_SAFE_INSET_PX,
          boxSizing: "border-box",
        }}
      >
        <div className="wl-radio-schedule-share-export__bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- PNG capture */}
          <img
            src={backgroundSrc}
            alt=""
            crossOrigin="anonymous"
            className="wl-radio-schedule-share-export__bg-img"
            draggable={false}
          />
          <div className="wl-radio-schedule-share-export__bg-wash" />
        </div>

        <div className="wl-radio-schedule-share-export__body">
          <div className="wl-radio-schedule-share-export__brand-bar">
            <div className="wl-radio-schedule-share-export__brand-cluster">
              <div
                className="wl-radio-schedule-share-export__brand-mark"
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/WTED3.png"
                  alt=""
                  className="wl-radio-schedule-share-export__brand-mark-img"
                  draggable={false}
                />
              </div>
              <div className="wl-radio-schedule-share-export__brand-text">
                <span className="wl-radio-schedule-share-export__brand-title">
                  WTED Radio
                </span>
                <span className="wl-radio-schedule-share-export__brand-tagline">
                  {dateSubtitle}
                </span>
              </div>
            </div>
          </div>

          <div className="wl-radio-schedule-share-export__panel-slot">
            <div className="wl-radio-schedule-share-export__panel">
              <div className="wl-radio-schedule-share-export__panel-inner">
              {loading ?
                <p className="wl-radio-schedule-share-export__status">
                  Loading schedule…
                </p>
              : error ?
                <p className="wl-radio-schedule-share-export__status">{error}</p>
              : slots.length === 0 ?
                <p className="wl-radio-schedule-share-export__status">
                  No shows scheduled for this calendar day.
                </p>
              : <div className="wl-radio-schedule-share-export__rows">
                  {slots.map((slot) => {
                    const playlistName = slot.event.playlist.name?.trim() ?? ""
                    const radioTitle = slot.event.playlist.title?.trim() ?? ""
                    const wted = slot.wtedEpisode
                    const displayTitle = wted
                      ? getWtedEpisodeDisplayName(
                          playlistName,
                          wted.display_name,
                        )
                      : (radioTitle || playlistName)
                    if (!displayTitle) return null
                    const artworkSrc =
                      wted?.artwork?.trim() ||
                      slot.event.playlist.artwork?.trim() ||
                      ""
                    const rowArt = (
                      <div
                        className="wl-radio-schedule-share-export__row-art"
                        aria-hidden
                      >
                        {artworkSrc ?
                          /* eslint-disable-next-line @next/next/no-img-element -- episode / Radio.co artwork for PNG capture */
                          <img
                            src={artworkSrc}
                            alt=""
                            crossOrigin="anonymous"
                            className="wl-radio-schedule-share-export__row-art-img"
                            draggable={false}
                          />
                        : <div className="wl-radio-schedule-share-export__row-art-placeholder" />
                        }
                      </div>
                    )
                    const timeRange = formatRadioScheduleTimeRange(
                      slot.event.start,
                      slot.event.end,
                    )
                    const hostNames =
                      wted ?
                        parseWtedEpisodeHosts(wted.host)
                          .map((h) => h.name.trim())
                          .filter(Boolean)
                      : []
                    return (
                      <div
                        key={`${slot.event.event_id}-${slot.event.start}`}
                        className="wl-radio-schedule-share-export__row"
                      >
                        <div className="wl-radio-schedule-share-export__row-layout">
                          {rowArt}
                          <div className="wl-radio-schedule-share-export__row-main">
                            <div className="wl-radio-schedule-share-export__upcoming">
                              {wted ?
                                <span className="wl-radio-schedule-share-export__row-show">
                                  {wted.show}
                                </span>
                              : null}
                              <span className="wl-radio-schedule-share-export__upcoming-title">
                                {displayTitle}
                              </span>
                              <span className="wl-radio-schedule-share-export__upcoming-time">
                                {timeRange}
                              </span>
                              {hostNames.length > 0 ?
                                <div className="wl-radio-schedule-share-export__row-hosts">
                                  {hostNames.map((name, hi) => (
                                    <span
                                      key={`${slot.event.event_id}-${slot.event.start}-host-${hi}`}
                                      className="wl-radio-schedule-share-export__host-pill"
                                    >
                                      <UserSound
                                        className="wl-radio-schedule-share-export__host-pill-icon"
                                        size={14}
                                        weight="regular"
                                        aria-hidden
                                      />
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              }
              </div>
            </div>
          </div>

          <div className="wl-radio-schedule-share-export__store-badges">
            <a
              className="wl-radio-schedule-share-export__store-badge-link"
              href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download WTED Goose Radio on the App Store"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- PNG capture */}
              <img
                src="/iOS.svg"
                alt=""
                className="wl-radio-schedule-share-export__store-badge-img"
                draggable={false}
              />
            </a>
            <a
              className="wl-radio-schedule-share-export__store-badge-link"
              href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get WTED Goose Radio on Google Play"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- PNG capture */}
              <img
                src="/Android.svg"
                alt=""
                className="wl-radio-schedule-share-export__store-badge-img"
                draggable={false}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
})
