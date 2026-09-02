"use client"

import Link from "next/link"
import { Check, Trophy } from "@phosphor-icons/react"

import { useAuth } from "@/components/auth-context"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useEchoProfile } from "@/hooks/use-echo-profile"
import { useUserProfilePicture } from "@/hooks/use-user-profile-picture"
import {
  getEchoArchiveUrl,
  getEchoLiveShowUrl,
  getEchoPastTourUrl,
} from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { formatOrdinal } from "@/lib/setlist-utils"

import { ECHO_ACTIVE_LEAGUE } from "./echo-tour-data"

function formatProfileDate(dateInput: string): string {
  const date = new Date(
    dateInput.includes("T") ? dateInput : `${dateInput}T00:00:00Z`,
  )
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const year = String(date.getUTCFullYear()).slice(-2)
  return `${month}.${day}.${year}`
}

function formatSongsCorrect(count: number): string {
  return count === 1 ? "1 song correct" : `${count} songs correct`
}

function formatSetsCorrect(count: number): string {
  return count === 1 ? "1 set correct" : `${count} sets correct`
}

function getEchoTourUrl(tourId: string, tourName: string): string {
  if (!tourId) return getEchoArchiveUrl("tour")
  if (tourName === ECHO_ACTIVE_LEAGUE) return getEchoArchiveUrl("tour")
  return getEchoPastTourUrl(tourId)
}

function EchoProfileStandingPills({
  showOpenerPicked,
  showCloserPicked,
}: {
  showOpenerPicked: boolean
  showCloserPicked: boolean
}) {
  if (!showOpenerPicked && !showCloserPicked) {
    return null
  }

  return (
    <div className="echo-profile-show-pills">
      {showOpenerPicked ?
        <span className="echo-live-standing-pill">
          <Check size={12} weight="bold" aria-hidden />
          show opener
        </span>
      : null}
      {showCloserPicked ?
        <span className="echo-live-standing-pill">
          <Check size={12} weight="bold" aria-hidden />
          show closer
        </span>
      : null}
    </div>
  )
}

export function EchoTourProfile() {
  const { session } = useAuth()
  const { profileDisplayName, profilePicture } = useUserProfilePicture()
  const { loading, tours, shows } = useEchoProfile(session?.profileId)

  const displayName =
    profileDisplayName ??
    (session?.email ? session.email.split("@")[0] : "Your")

  if (!session) {
    return (
      <div
        className="echo-tour-placeholder"
        style={echoTourSurfaceBgStyle("profile-sign-in")}
      >
        <h1 className="echo-live-title">Profile</h1>
        <p className="echo-tour-placeholder-copy">
          Sign in to see your Echo of a Show history.
        </p>
      </div>
    )
  }

  return (
    <div className="echo-tour-profile">
      <header
        className="echo-tour-profile-header"
        style={echoTourSurfaceBgStyle("profile-header")}
      >
        <Avatar className="echo-tour-profile-avatar">
          <AvatarImage src={profilePicture ?? undefined} alt="" />
          <AvatarFallback className="echo-tour-profile-avatar-fallback">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="echo-tour-profile-header-title">
          {displayName}&apos;s Stats
        </h1>
      </header>

      <section
        className="echo-live-card echo-tour-profile-card"
        style={echoTourSurfaceBgStyle("profile-tours")}
      >
        <h2 className="echo-live-card-title">Tours</h2>
        {loading && tours.length === 0 ?
          <p className="echo-live-empty">Loading tours…</p>
        : tours.length === 0 ?
          <p className="echo-live-empty">No tour submissions yet.</p>
        : <div className="echo-tour-profile-scroll">
            <table className="echo-tour-profile-table">
              <thead>
                <tr>
                  <th scope="col" className="is-left">
                    Tour
                  </th>
                  <th scope="col" className="is-center">
                    Rank
                  </th>
                  <th scope="col" className="is-right">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {tours.map((row) => (
                  <tr key={row.tourId || row.tour}>
                    <td className="is-tour">
                      {row.tourId ?
                        <Link
                          href={getEchoTourUrl(row.tourId, row.tour)}
                          className="echo-tour-profile-tour-link"
                          scroll={false}
                        >
                          {row.tour}
                        </Link>
                      : row.tour}
                    </td>
                    <td
                      className={
                        row.rank === 1 ?
                          "is-center is-first-rank"
                        : "is-center is-muted"
                      }
                    >
                      {row.rank != null ?
                        row.rank === 1 ?
                          <span className="echo-profile-tour-rank-winner">
                            <Trophy size={14} weight="fill" aria-hidden />
                            {formatOrdinal(row.rank)}
                          </span>
                        : formatOrdinal(row.rank)
                      : "—"}
                    </td>
                    <td className="is-right is-strong">{row.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </section>

      <section
        className="echo-live-card echo-tour-profile-card"
        style={echoTourSurfaceBgStyle("profile-shows")}
      >
        <h2 className="echo-live-card-title">Shows</h2>
        {loading && shows.length === 0 ?
          <p className="echo-live-empty">Loading shows…</p>
        : shows.length === 0 ?
          <p className="echo-live-empty">No show submissions yet.</p>
        : <div className="echo-tour-profile-scroll">
            <table className="echo-tour-profile-table echo-tour-profile-shows-table">
              <thead>
                <tr>
                  <th scope="col" className="is-left">
                    Date
                  </th>
                  <th scope="col" className="is-left">
                    Tour
                  </th>
                  <th scope="col" className="is-left is-pills">
                    Picks
                  </th>
                  <th scope="col" className="is-right">
                    Songs
                  </th>
                  <th scope="col" className="is-right">
                    Sets
                  </th>
                  <th scope="col" className="is-right">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {shows.map((row) => (
                  <tr key={row.showId}>
                    <td className="is-date">
                      <Link
                        href={getEchoLiveShowUrl(row.showId)}
                        className="echo-profile-show-date"
                        scroll={false}
                      >
                        {formatProfileDate(row.showDate)}
                      </Link>
                    </td>
                    <td className="is-tour">
                      {row.tourId ?
                        <Link
                          href={getEchoTourUrl(row.tourId, row.tour)}
                          className="echo-profile-show-tour"
                          scroll={false}
                        >
                          {row.tour}
                        </Link>
                      : <span className="echo-profile-show-tour is-plain">
                          {row.tour}
                        </span>}
                    </td>
                    <td className="is-pills">
                      <EchoProfileStandingPills
                        showOpenerPicked={row.showOpenerPicked}
                        showCloserPicked={row.showCloserPicked}
                      />
                    </td>
                    <td className="is-right is-muted">
                      {formatSongsCorrect(row.songsCorrect)}
                    </td>
                    <td className="is-right is-muted">
                      {formatSetsCorrect(row.setsCorrect)}
                    </td>
                    <td className="is-right is-strong">{row.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </section>
    </div>
  )
}
