"use client"

import { ArrowRight } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import type { AttendanceStatsData } from "@/types/attendance"
import type { UserCanonicalBookendShow } from "@/hooks/use-user-canonical-bookend-shows"
import {
  wlHomeProfileBookendTitle,
} from "@/hooks/use-user-canonical-bookend-shows"
import { formatWlHomeTileShowDate } from "@/hooks/use-wl-home-most-recent-show"

import "./wl-home-v2-tile-profile.css"

export function WlHomeV2TileProfile({
  onOpenLogin,
  profileSignedIn,
  profilePicture,
  profilePhotoLoadFailed,
  setProfilePhotoLoadFailed,
  profilePhotoAlt,
  attendanceLoading,
  attendanceData,
  profileBookendsLoading,
  lastShow,
  nextShow,
}: {
  onOpenLogin: () => void
  profileSignedIn: boolean
  profilePicture?: string | null
  profilePhotoLoadFailed: boolean
  setProfilePhotoLoadFailed: (v: boolean) => void
  profilePhotoAlt: string
  attendanceLoading: boolean
  attendanceData: AttendanceStatsData
  profileBookendsLoading: boolean
  lastShow: UserCanonicalBookendShow | null
  nextShow: UserCanonicalBookendShow | null
}) {
  return (
    <section
      className={
        "tile tile-profile" +
        (!profileSignedIn ? " tile-profile--guest" : "")
      }
    >
      {profileSignedIn ?
        <Link
          href="/archive/profile?tab=overview"
          className="tile-link"
          aria-label="View your show stats"
        />
      : null}
      <div className="icon-wrap">
        <div className="icon-bg" />
        {profileSignedIn && profilePicture && !profilePhotoLoadFailed ?
          <img
            src={profilePicture}
            alt={profilePhotoAlt}
            className="wl-home-v2-tile-profile-photo h-full w-full"
            width={110}
            height={110}
            decoding="async"
            onError={() => setProfilePhotoLoadFailed(true)}
          />
        : <Image
            src="/icon-myprofile.png"
            alt=""
            width={110}
            height={110}
            className="h-full w-full object-contain"
          />}
      </div>

      {profileSignedIn ?
        <div className="tile-widget">
          <div className="stat-grid">
            <div className="stat s-accent">
              <div className="s-label">Shows Attended</div>
              <div className="s-value">
                {attendanceLoading ? "…" : attendanceData.showsCount}
              </div>
              <div className="s-sub">
                {attendanceLoading ? "…" : (
                  attendanceData.firstCanonicalShowYear != null ?
                    `since ${attendanceData.firstCanonicalShowYear}`
                  : "—"
                )}
              </div>
            </div>
            <div className="stat">
              <div className="s-label">Unique Songs</div>
              <div className="s-value">
                {attendanceLoading ? "…" : attendanceData.songsCount}
              </div>
              <div className="s-sub">
                {attendanceLoading ? "…" : "seen"}
              </div>
            </div>
            <div className="stat">
              <div className="s-label">Last Show</div>
              <div className="s-value s-value--bookend">
                {profileBookendsLoading ? "…" : (
                  lastShow ?
                    wlHomeProfileBookendTitle(lastShow)
                  : "—"
                )}
              </div>
              <div className="s-sub">
                {profileBookendsLoading ? "…" : (
                  lastShow ?
                    formatWlHomeTileShowDate(lastShow.show_date)
                  : "—"
                )}
              </div>
            </div>
            <div className="stat s-accent">
              <div className="s-label">Next Show</div>
              <div className="s-value s-value--bookend">
                {profileBookendsLoading ? "…" : (
                  nextShow ?
                    wlHomeProfileBookendTitle(nextShow)
                  : "—"
                )}
              </div>
              <div className="s-sub">
                {profileBookendsLoading ? "…" : (
                  nextShow ?
                    formatWlHomeTileShowDate(nextShow.show_date)
                  : "—"
                )}
              </div>
            </div>
          </div>
        </div>
      : null}

      <div className="tile-body">
        <h2>
          My
          <br />
          Show Stats
        </h2>
        <p>
          Shows attended, badges earned, songs tracked, predictions logged.
          Your Goose story.
        </p>
        <span className="cta">
          <span className="cta-label">
            {profileSignedIn ? "View show stats" : "Sign In"}
          </span>
          <ArrowRight
            className="arrow"
            size={16}
            weight="regular"
            aria-hidden
          />
        </span>
      </div>

      {!profileSignedIn ?
        <button
          type="button"
          className="tile-link"
          aria-label="Sign in to view your show stats"
          onClick={() => onOpenLogin()}
        />
      : null}
    </section>
  )
}
