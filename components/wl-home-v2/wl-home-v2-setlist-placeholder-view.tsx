"use client"

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"

import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import {
  isWlHomeV2SetlistShowBadgesTileVisible,
  isWlHomeV2SetlistShowStatsTileVisible,
} from "@/components/wl-home-v2/wl-home-v2-setlist-show-meta-tile"
import { WlHomeV2SetlistTable } from "@/components/wl-home-v2/wl-home-v2-setlist-table"
import {
  isWlHomeV2SetlistShowChangesSectionVisible,
} from "@/components/wl-home-v2/wl-home-v2-setlist-show-changes-section"
import {
  isSetlistSongSpreadAsideVisible,
} from "@/components/dpro/setlist/setlist-song-spread-card"
import { cn } from "@/lib/utils"
import { WlHomeV2SetlistPlaceholderAside } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-aside"
import { WlHomeV2SetlistPlaceholderCrumbsBar } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-crumbs"
import { WlHomeV2SetlistPlaceholderMainHeader } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-main-header"
import type { WlHomeV2SetlistPlaceholderToolsProps } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-tools"
import type { WlHomeV2SetlistPlaceholderViewProps } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.types"
import type { BandcampEntryTrack, SetlistEntry } from "@/types/setlist"
import type { ShowRelease } from "@/hooks/use-setlist-releases"
import { WLTopPosts } from "@/components/wl-home-v2/wl-top-posts"
import { isValidWlCommunityTopicUrl } from "@/lib/wl-community-topic-url"
import { TAILWIND_XL_MIN_PX } from "@/components/wl-home-v2/wl-home-v2-years-view.constants"
import { SetlistEgnAttribution } from "@/components/dpro/setlist/setlist-egn-attribution"

type SetlistLayoutMode = "mobile" | "desktop" | null

/**
 * Setlist archive shell: same layout stack as years (`wl-home-v2-years-page` → body →
 * columns → `section` + `aside`). Static mock body from `Setlist.html` (no header/footer/cursor);
 * breadcrumbs use `/old/archive/setlist` resolution when `breadcrumbs` is set.
 */
export function WlHomeV2SetlistPlaceholderView({
  breadcrumbs,
  show,
  showId,
  setlist,
  songPairs,
  showAdminUi,
  adminLinkCopied,
  onAdminCopyShowId,
  onAdminEditShow,
  onShareSetlistImage,
  copiedEntryIds,
  onNumberClick,
  showPositionInTour,
  tourShowNav,
  onTourShowSelect,
  tours,
  showDates,
  onTourSelect,
  maxShowCanonId,
  maxShowCanonIdLoading,
  releases,
  releaseToEntriesMap,
  onJotyBadgeClick,
  onSongClick,
  onPairSongClick,
  onWtedClick,
  onPairWtedClick,
  averageRating,
  reviewCount,
  onRatingClick,
  attendeeCount,
  attended,
  attendanceToggling,
  onAttendanceToggle,
  attendedGooseCanonNav,
  onAttendedShowSelect,
  showLengthRank,
  showChanges,
  showChangesLoading,
  onOpenSetlistScan,
  hoveredCategory,
  onCategoryHover,
}: WlHomeV2SetlistPlaceholderViewProps) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const [layoutMode, setLayoutMode] = useState<SetlistLayoutMode>(null)
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(
    null,
  )
  const [activeBandcampTrack, setActiveBandcampTrack] =
    useState<BandcampEntryTrack | null>(null)
  const [activeYouTubeRelease, setActiveYouTubeRelease] =
    useState<ShowRelease | null>(null)

  useEffect(() => {
    setHoveredReleaseId(null)
    setActiveBandcampTrack(null)
    setActiveYouTubeRelease(null)
  }, [showId])

  /**
   * Per-entry YouTube release to link in the Media column. A song may have several YouTube
   * media; pick one by: prefer displayname != "Full Show", then lowest release_order;
   * fall back to the "Full Show" video if that's all there is.
   */
  const entryYouTubeReleaseMap = useMemo(() => {
    const isFullShow = (r: ShowRelease) =>
      (r.release_displayname ?? "").trim().toLowerCase() === "full show"
    const byEntry: Record<string, ShowRelease[]> = {}
    for (const r of releases) {
      if ((r.release_service ?? "").toLowerCase().trim() !== "youtube") continue
      if (!r.release_link) continue
      const entries = releaseToEntriesMap[r.release_id]
      if (!entries) continue
      entries.forEach((entryId) => {
        ;(byEntry[entryId] ??= []).push(r)
      })
    }
    const map: Record<string, ShowRelease> = {}
    for (const [entryId, list] of Object.entries(byEntry)) {
      const chosen = [...list].sort((a, b) => {
        const aFull = isFullShow(a) ? 1 : 0
        const bFull = isFullShow(b) ? 1 : 0
        if (aFull !== bFull) return aFull - bFull
        return (a.release_order ?? Infinity) - (b.release_order ?? Infinity)
      })[0]
      if (chosen) map[entryId] = chosen
    }
    return map
  }, [releases, releaseToEntriesMap])

  const handleBandcampClick = (entry: SetlistEntry) => {
    setActiveYouTubeRelease(null)
    setActiveBandcampTrack((prev) =>
      prev && prev.track_id === entry.bandcampTrack?.track_id ?
        null
      : entry.bandcampTrack ?? null,
    )
  }
  const handlePairBandcampClick = (entries: SetlistEntry[]) => {
    const track = entries.find((e) => e.bandcampTrack)?.bandcampTrack ?? null
    setActiveYouTubeRelease(null)
    setActiveBandcampTrack((prev) =>
      prev && prev.track_id === track?.track_id ? null : track,
    )
  }
  const handleYouTubeClick = (release: ShowRelease) => {
    setActiveBandcampTrack(null)
    setActiveYouTubeRelease((prev) =>
      prev && prev.release_id === release.release_id ? null : release,
    )
  }

  const showMediaSection =
    releases.length > 0 || !!activeBandcampTrack || !!activeYouTubeRelease

  const hasAverageRating = averageRating > 0
  const ratingValueDisplay = hasAverageRating ?
      averageRating.toFixed(2)
    : "0.00"
  const wlCommunityHref = show.show_wl_link?.trim() ?? ""
  const showWlTopPosts = isValidWlCommunityTopicUrl(wlCommunityHref)
  const reviewSummary =
    reviewCount > 0 ?
      `${reviewCount.toLocaleString("en-US")} ${reviewCount === 1 ? "review" : "reviews"}`
    : "No reviews yet"

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${TAILWIND_XL_MIN_PX}px)`)
    const apply = () => {
      setLayoutMode(mq.matches ? "desktop" : "mobile")
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const useCompactTools = layoutMode !== "desktop"

  const asideStatsVisible = isWlHomeV2SetlistShowStatsTileVisible(show, setlist)
  const asideBadgesVisible = isWlHomeV2SetlistShowBadgesTileVisible(show)
  const asideSongSpreadVisible = isSetlistSongSpreadAsideVisible(setlist)
  const asideShowChangesVisible = isWlHomeV2SetlistShowChangesSectionVisible(
    showChangesLoading,
    showChanges,
    onOpenSetlistScan,
  )

  /** Strip between tools and next tile when a block follows (stats bundle; WL posts on mobile only). */
  const setlistAsideHasBlocksBelowTools =
    asideStatsVisible ||
    asideSongSpreadVisible ||
    asideShowChangesVisible ||
    asideBadgesVisible ||
    (useCompactTools && showWlTopPosts)

  const showDesktopBelowTableRow =
    !useCompactTools && (showMediaSection || showWlTopPosts)

  const showGroupLabel = show.show_group?.trim() ?? ""
  const venueLocation = show.show_venue_location?.trim() ?? ""
  const subvenueLabel = show.show_subvenue?.trim() ?? ""
  const showDetailLabel = show.show_detail?.trim() ?? ""
  const showAlertLabel = show.show_alert?.trim() ?? ""

  const showCanonPositionPill =
    show.show_canonid != null &&
    !maxShowCanonIdLoading &&
    maxShowCanonId != null

  /** Compact layout: split long tour name from "Show n of m" (`< xl`, tour string > 24 chars). */
  const mobileStackTourNameAndPositionLines =
    useCompactTools &&
    (show.show_tour?.length ?? 0) > 24 &&
    showPositionInTour != null

  const toolsProps: WlHomeV2SetlistPlaceholderToolsProps = {
    hasAverageRating,
    ratingValueDisplay,
    reviewSummary,
    averageRating,
    attendeeCount,
    attended,
    attendanceToggling,
    onAttendanceToggle,
    onRatingClick,
  }

  const showEgnAttribution = show.egn_sourced === true

  return (
    <div className="wl-home-v2-years-page wl-home-v2-setlist">
      <WlHomeV2SetlistPlaceholderCrumbsBar
        breadcrumbs={breadcrumbs}
        showId={showId}
        show={show}
        tours={tours}
        showDates={showDates}
        onTourSelect={onTourSelect}
        onTourShowSelect={onTourShowSelect}
        openArchiveHub={openArchiveHub ?? undefined}
        showAdminUi={showAdminUi}
        adminLinkCopied={adminLinkCopied}
        onAdminCopyShowId={onAdminCopyShowId}
        onAdminEditShow={onAdminEditShow}
        onShareSetlistImage={onShareSetlistImage}
      />

      <div className="wl-home-v2-years-body">
        <div
          className={cn(
            "wl-home-v2-years-columns",
            !useCompactTools && "wl-home-v2-years-columns--desktop",
          )}
        >
          <section
            className="wl-home-v2-years-tile wl-home-v2-years-tile--main"
            style={
              {
                "--tile-bg": "url('/newbg3.jpeg')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner min-h-0 flex min-w-0 flex-1 flex-col gap-4">
              <WlHomeV2SetlistPlaceholderMainHeader
                useCompactTools={useCompactTools}
                show={show}
                showGroupLabel={showGroupLabel}
                subvenueLabel={subvenueLabel}
                venueLocation={venueLocation}
                showDetailLabel={showDetailLabel}
                showAlertLabel={showAlertLabel}
                showCanonPositionPill={showCanonPositionPill}
                maxShowCanonId={maxShowCanonId}
                mobileStackTourNameAndPositionLines={
                  mobileStackTourNameAndPositionLines
                }
                showPositionInTour={showPositionInTour}
                tourShowNav={tourShowNav}
                onTourShowSelect={onTourShowSelect}
                toolsProps={toolsProps}
                attendedGooseCanonNav={attendedGooseCanonNav}
                onAttendedShowSelect={onAttendedShowSelect}
              />

              <div className="wl-home-v2-setlist-main-fill flex min-h-0 min-w-0 flex-1 flex-col gap-4">
                <WlHomeV2SetlistTable
                  show={show}
                  setlist={setlist}
                  songPairs={songPairs}
                  showAdminUi={showAdminUi}
                  copiedEntryIds={copiedEntryIds}
                  onNumberClick={onNumberClick}
                  onJotyBadgeClick={onJotyBadgeClick}
                  onSongClick={onSongClick}
                  onPairSongClick={onPairSongClick}
                  onWtedClick={onWtedClick}
                  onPairWtedClick={onPairWtedClick}
                  onBandcampClick={handleBandcampClick}
                  onPairBandcampClick={handlePairBandcampClick}
                  entryYouTubeReleaseMap={entryYouTubeReleaseMap}
                  onYouTubeClick={handleYouTubeClick}
                  hoveredReleaseId={hoveredReleaseId}
                  releaseToEntriesMap={releaseToEntriesMap}
                  hoveredCategory={hoveredCategory}
                />
                {showDesktopBelowTableRow ?
                  <div className="wl-home-v2-setlist-below-table-row">
                    {showMediaSection ?
                      <div className="wl-home-v2-setlist-below-table-media">
                        <SetlistMediaSection
                          releases={releases}
                          visualVariant="wl-home-v2"
                          onReleaseHover={setHoveredReleaseId}
                          bandcampTrackEmbed={activeBandcampTrack}
                          onCloseBandcampTrack={() =>
                            setActiveBandcampTrack(null)
                          }
                          youtubeReleaseEmbed={activeYouTubeRelease}
                          onCloseYoutube={() => setActiveYouTubeRelease(null)}
                        />
                      </div>
                    : null}
                    {showWlTopPosts ?
                      <div className="wl-home-v2-setlist-below-table-wl">
                        <WLTopPosts wlLink={wlCommunityHref} />
                      </div>
                    : null}
                  </div>
                : showMediaSection ?
                  <SetlistMediaSection
                    releases={releases}
                    visualVariant="wl-home-v2"
                    onReleaseHover={setHoveredReleaseId}
                    bandcampTrackEmbed={activeBandcampTrack}
                    onCloseBandcampTrack={() => setActiveBandcampTrack(null)}
                    youtubeReleaseEmbed={activeYouTubeRelease}
                    onCloseYoutube={() => setActiveYouTubeRelease(null)}
                  />
                : null}
                {!useCompactTools && showEgnAttribution ?
                  <SetlistEgnAttribution className="w-full shrink-0" />
                : null}
              </div>
            </div>
          </section>

          <WlHomeV2SetlistPlaceholderAside
            useCompactTools={useCompactTools}
            showId={showId}
            setlistAsideHasBlocksBelowTools={setlistAsideHasBlocksBelowTools}
            toolsProps={toolsProps}
            attendedGooseCanonNav={attendedGooseCanonNav}
            onAttendedShowSelect={onAttendedShowSelect}
            show={show}
            setlist={setlist}
            showLengthRank={showLengthRank}
            asideStatsVisible={asideStatsVisible}
            asideSongSpreadVisible={asideSongSpreadVisible}
            asideShowChangesVisible={asideShowChangesVisible}
            asideBadgesVisible={asideBadgesVisible}
            hoveredCategory={hoveredCategory}
            onCategoryHover={onCategoryHover}
            showChanges={showChanges}
            showChangesLoading={showChangesLoading}
            onOpenSetlistScan={onOpenSetlistScan}
            showWlTopPosts={showWlTopPosts}
            wlCommunityHref={wlCommunityHref}
          />
          {useCompactTools && showEgnAttribution ?
            <div className="wl-home-v2-setlist-egn-mobile-tail">
              <SetlistEgnAttribution className="w-full shrink-0" />
            </div>
          : null}
        </div>
      </div>
    </div>
  )
}
