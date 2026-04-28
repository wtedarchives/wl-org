"use client"

import {
  AppleLogo,
  ArrowRight,
  GooglePlayLogo,
  Info,
  ListNumbers,
  MusicNote,
  Users,
} from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import type { CSSProperties, MouseEvent } from "react"
import { useCallback, useMemo } from "react"

import { useAuth } from "@/components/auth-context"
import { useBumpHomeRadioEmbedPulse } from "@/components/persistent-radio"
import { scrollMainInsetToTopThenPulse } from "@/components/wl-home-shared"
import { useAttendanceStats } from "@/hooks/use-attendance-stats"
import { useDiscourseFeaturedTopics } from "@/hooks/use-discourse-featured-topics"
import {
  useUserCanonicalBookendShows,
  wlHomeProfileBookendTitle,
} from "@/hooks/use-user-canonical-bookend-shows"
import {
  formatWlHomeTileShowDate,
  useWlHomeMostRecentShow,
  wlHomeSetlistPillClass,
} from "@/hooks/use-wl-home-most-recent-show"
import { useUserProfilePicture } from "@/hooks/use-user-profile-picture"
import { decodeHtmlEntitiesForDisplay } from "@/lib/decode-html-entities"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { WL_HOME_V2_COMMUNITY_URL } from "./wl-home-v2-constants"
import { WlHomeV2OnAirPill } from "./wl-home-v2-on-air-pill"
import { useWlHomeV2OpenArchiveHub } from "./wl-home-v2-open-archive-hub-context"

import type { WlHomeMostRecentSetlistEntry } from "@/hooks/use-wl-home-most-recent-show"

/** Rows are already ordered by set; split when `entry_set` changes. */
function groupTileSetlistBySet(entries: WlHomeMostRecentSetlistEntry[]) {
  if (entries.length === 0) return []
  const groups: WlHomeMostRecentSetlistEntry[][] = []
  let batch: WlHomeMostRecentSetlistEntry[] = [entries[0]!]
  let prevSet = entries[0]!.entry_set
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i]!
    if (e.entry_set === prevSet) {
      batch.push(e)
    } else {
      groups.push(batch)
      batch = [e]
      prevSet = e.entry_set
    }
  }
  groups.push(batch)
  return groups
}

export function WlHomeV2Tiles({
  onOpenRequest,
  onOpenLogin,
  onOpenSchedule,
}: {
  onOpenRequest: () => void
  /** Same as nav “Sign In” — opens the home login modal (credentials form). */
  onOpenLogin: () => void
  /** Full Radio.co schedule embed (same as old homepage schedule card). */
  onOpenSchedule: () => void
}) {
  const { user } = useAuth()
  const {
    profileSignedIn,
    profilePicture,
    profilePhotoLoadFailed,
    setProfilePhotoLoadFailed,
    profilePhotoAlt,
  } = useUserProfilePicture()
  const {
    show: archiveMostRecentShow,
    setlist: archiveMostRecentSetlist,
    loading: archiveMostRecentLoading,
  } = useWlHomeMostRecentShow()
  const archiveSetlistBySet = useMemo(
    () => groupTileSetlistBySet(archiveMostRecentSetlist),
    [archiveMostRecentSetlist],
  )
  const archiveSetlistPanelActive =
    !archiveMostRecentLoading && archiveMostRecentShow != null
  const {
    topics: featuredTopics,
    loading: featuredTopicsLoading,
    error: featuredTopicsError,
  } = useDiscourseFeaturedTopics()
  const profileStatsUserId = profileSignedIn && user?.id ? user.id : null
  const { data: attendanceData, loading: attendanceLoading } =
    useAttendanceStats(profileStatsUserId)
  const { lastShow, nextShow, loading: profileBookendsLoading } =
    useUserCanonicalBookendShows(profileStatsUserId)

  const bumpHomeRadioEmbedPulse = useBumpHomeRadioEmbedPulse()
  const onWtedRadioTileClick = useCallback(() => {
    scrollMainInsetToTopThenPulse(bumpHomeRadioEmbedPulse)
  }, [bumpHomeRadioEmbedPulse])

  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const onArchiveTileLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (!openArchiveHub) return
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }
      e.preventDefault()
      openArchiveHub()
    },
    [openArchiveHub],
  )

  return (
    <section className="grid" id="tileGrid">
      <section
        className="tile tile-radio"
        style={{ "--tile-bg": "url('/newbg.png')" } as CSSProperties}
        onClick={onWtedRadioTileClick}
      >
        <button
          type="button"
          className="tile-link"
          aria-label="Tune in to WTED Goose Radio — scroll to the player and highlight it"
          onClick={(e) => {
            e.stopPropagation()
            onWtedRadioTileClick()
          }}
        />
        <div className="icon-wrap">
          <div className="icon-bg" />
          <Image
            src="/WTED3.png"
            alt=""
            width={110}
            height={110}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="tile-widget">
          <WlHomeV2OnAirPill onOpenSchedule={onOpenSchedule} />
          <div className="tile-widget-actions">
            <button
              type="button"
              className="wbtn"
              id="btn-request"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenRequest()
              }}
            >
              <span className="wbtn-text">Request a Song</span>
              <MusicNote className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </button>
            <Link className="wbtn" href="/wted/program-director">
              <span className="wbtn-text">Program Director</span>
              <ListNumbers className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </Link>
            <Link className="wbtn" href="/wted/about">
              <span className="wbtn-text">About Us</span>
              <Info className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </Link>
            <Link className="wbtn" href="/wted/gorps">
              <span className="wbtn-text">GORPs</span>
              <Users className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </Link>
            <a
              className="wbtn wbtn--app-store"
              href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="wbtn-text">iOS App</span>
              <AppleLogo className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </a>
            <a
              className="wbtn wbtn--app-store"
              href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="wbtn-text">Android App</span>
              <GooglePlayLogo
                className="wbtn-icon"
                size={18}
                weight="regular"
                aria-hidden
              />
            </a>
          </div>
        </div>

        <div className="tile-body">
          <h2>
            WTED
            <br />
            Goose Radio
          </h2>
          <p>
            Listen to Goose on demand, 24/7 — live streams, historic sets, and
            listener requests.
          </p>
          <span className="cta">
            <span className="cta-label">Tune in</span>
            <ArrowRight
              className="arrow"
              size={16}
              weight="regular"
              aria-hidden
            />
          </span>
        </div>
      </section>

      <section
        className="tile tile-community"
        style={{ "--tile-bg": "url('/newbg2.jpeg')" } as CSSProperties}
      >
        <a
          href={WL_HOME_V2_COMMUNITY_URL}
          className="tile-link"
          aria-label="WTED Community — opens in a new tab"
          target="_blank"
          rel="noopener noreferrer"
        />
        <div className="icon-wrap">
          <div className="icon-bg" />
          <Image
            src="/WL.png"
            alt=""
            width={110}
            height={110}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="tile-widget">
          <div
            className={[
              "widget-panel",
              "transition-opacity duration-200 ease-out",
              featuredTopicsLoading ? "opacity-90" : "opacity-100",
            ].join(" ")}
            aria-busy={featuredTopicsLoading}
          >
            <div className="wp-head">
              <span>Featured Topics</span>
            </div>
            {featuredTopicsLoading ?
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="topic-row" aria-hidden>
                  <span className="block h-3 min-w-0 flex-1 max-w-[85%] rounded bg-white/10 motion-safe:animate-pulse" />
                  <span className="count text-transparent">0 posts</span>
                </div>
              ))
            : featuredTopicsError && featuredTopics.length === 0 ?
              <p className="m-0 py-1 text-[11px] leading-snug text-white/70">
                {featuredTopicsError}
              </p>
            : featuredTopics.length === 0 ?
              <p className="m-0 py-1 text-[11px] leading-snug text-white/70">
                No featured topics right now.
              </p>
            : featuredTopics.map((item) => {
                const titleText = decodeHtmlEntitiesForDisplay(item.topic)
                const postsLabel =
                  item.posts_count === 1 ? "post" : "posts"
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="topic-row"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={titleText}
                  >
                    <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] leading-3">
                      {titleText}
                    </span>
                    <span className="count shrink-0">
                      {item.posts_count.toLocaleString()} {postsLabel}
                    </span>
                  </a>
                )
              })}
          </div>
        </div>

        <div className="tile-body">
          <h2>
            WTED
            <br />
            Community
          </h2>
          <p>
            A home made for Goose fans, by Goose fans. Discuss the band and join the couch tour.
          </p>
          <span className="cta">
            <span className="cta-label">Join the community</span>
            <ArrowRight
              className="arrow"
              size={16}
              weight="regular"
              aria-hidden
            />
          </span>
        </div>
      </section>

      <section
        className="tile tile-archive"
        style={{ "--tile-bg": "url('/newbg3.jpeg')" } as CSSProperties}
      >
        <Link
          href="/archive"
          className="tile-link"
          aria-label="Open WTED Archives"
          onClick={onArchiveTileLinkClick}
        />
        <div className="icon-wrap">
          <div className="icon-bg" />
          <Image
            src="/wted-sa-cropped-2.png"
            alt=""
            width={110}
            height={110}
            className="h-full w-full object-contain"
          />
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
              <Link
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
                  <>
                    {archiveMostRecentShow.show_detail?.trim() ?
                      <span className="wp-head-detail">
                        {archiveMostRecentShow.show_detail.trim()}
                      </span>
                    : null}
                    <span className="wp-head-date">
                      {formatWlHomeTileShowDate(archiveMostRecentShow.show_date)}
                    </span>
                  </>
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
                          <Link
                            key={`${entry.entry_song}-${entry.entry_set}-${entry.entry_setnum}-${setIndex}-${index}`}
                            href={href}
                            className={wlHomeSetlistPillClass(entry.entry_set)}
                          >
                            {label}
                          </Link>
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
        </div>

        <div className="tile-body">
          <h2>
            WTED
            <br />
            Archives
          </h2>
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
      </section>

      <section
        className={
          "tile tile-profile" +
          (!profileSignedIn ? " tile-profile--guest" : "")
        }
        style={{ "--tile-bg": "url('/newbg4.jpeg')" } as CSSProperties}
      >
        {profileSignedIn ?
          <Link
            href="/old/archive/profile/overview"
            className="tile-link"
            aria-label="View your profile"
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
            />
          }
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
            Profile
          </h2>
          <p>
            Shows attended, badges earned, songs tracked, predictions logged.
            Your Goose story.
          </p>
          <span className="cta">
            <span className="cta-label">
              {profileSignedIn ? "View profile" : "Sign In"}
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
            aria-label="Sign in to view your profile"
            onClick={() => onOpenLogin()}
          />
        : null}
      </section>
    </section>
  )
}
