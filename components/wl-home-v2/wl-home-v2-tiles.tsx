"use client"

import type { MouseEvent } from "react"
import { useCallback, useMemo } from "react"

import { useAuth } from "@/components/auth-context"
import { useBumpHomeRadioEmbedPulse } from "@/components/persistent-radio"
import { scrollMainInsetToTopThenPulse } from "@/components/wl-home-shared"
import { useAttendanceStats } from "@/hooks/use-attendance-stats"
import { useDiscourseFeaturedTopics } from "@/hooks/use-discourse-featured-topics"
import { useUserCanonicalBookendShows } from "@/hooks/use-user-canonical-bookend-shows"
import { useWlHomeMostRecentShow } from "@/hooks/use-wl-home-most-recent-show"
import { useUserProfilePicture } from "@/hooks/use-user-profile-picture"
import { useWlHomeV2OpenArchiveHub } from "./wl-home-v2-open-archive-hub-context"

import { WlHomeV2TileArchive } from "@/components/wl-home-v2/wl-home-v2-tile-archive"
import { WlHomeV2TileCommunity } from "@/components/wl-home-v2/wl-home-v2-tile-community"
import { WlHomeV2TileProfile } from "@/components/wl-home-v2/wl-home-v2-tile-profile"
import { WlHomeV2TileRadio } from "@/components/wl-home-v2/wl-home-v2-tile-radio"
import { groupTileSetlistBySet } from "@/components/wl-home-v2/wl-home-v2-tiles.utils"

export function WlHomeV2Tiles({
  onOpenRequest,
  onOpenLogin,
  onOpenSchedule,
  onOpenTourSchedule,
  onOpenThisDayInHistory,
}: {
  onOpenRequest: () => void
  /** Same as nav “Sign In” — opens the home login modal (credentials form). */
  onOpenLogin: () => void
  /** Full Radio.co schedule embed (homepage radio tile pill). */
  onOpenSchedule: () => void
  /** Goose past + upcoming shows (archive widget). */
  onOpenTourSchedule: () => void
  /** Same-day calendar shows across years (matches legacy homepage). */
  onOpenThisDayInHistory: () => void
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
  const profileStatsUserId = profileSignedIn && session?.profileId ? session?.profileId : null
  const { data: attendanceData, loading: attendanceLoading } =
    useAttendanceStats(profileStatsUserId)
  const { lastShow, nextShow, loading: profileBookendsLoading } =
    useUserCanonicalBookendShows(profileStatsUserId)

  const bumpHomeRadioEmbedPulse = useBumpHomeRadioEmbedPulse()
  const onWtedRadioTileClick = useCallback(() => {
    const bump = bumpHomeRadioEmbedPulse
    const anchor = document.getElementById(
      "wl-home-v2-radio-tile-player-anchor",
    )
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" })
      globalThis.setTimeout(bump, 450)
      return
    }
    scrollMainInsetToTopThenPulse(bump)
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
      <WlHomeV2TileRadio
        onWtedRadioTileClick={onWtedRadioTileClick}
        onOpenRequest={onOpenRequest}
        onOpenSchedule={onOpenSchedule}
      />
      <WlHomeV2TileCommunity
        featuredTopics={featuredTopics}
        featuredTopicsLoading={featuredTopicsLoading}
        featuredTopicsError={featuredTopicsError}
      />
      <WlHomeV2TileArchive
        onArchiveTileLinkClick={onArchiveTileLinkClick}
        onOpenTourSchedule={onOpenTourSchedule}
        onOpenThisDayInHistory={onOpenThisDayInHistory}
        archiveMostRecentShow={archiveMostRecentShow}
        archiveMostRecentLoading={archiveMostRecentLoading}
        archiveSetlistPanelActive={archiveSetlistPanelActive}
        archiveSetlistBySet={archiveSetlistBySet}
      />
      <WlHomeV2TileProfile
        onOpenLogin={onOpenLogin}
        profileSignedIn={profileSignedIn}
        profilePicture={profilePicture}
        profilePhotoLoadFailed={profilePhotoLoadFailed}
        setProfilePhotoLoadFailed={setProfilePhotoLoadFailed}
        profilePhotoAlt={profilePhotoAlt}
        attendanceLoading={attendanceLoading}
        attendanceData={attendanceData}
        profileBookendsLoading={profileBookendsLoading}
        lastShow={lastShow}
        nextShow={nextShow}
      />
    </section>
  )
}
