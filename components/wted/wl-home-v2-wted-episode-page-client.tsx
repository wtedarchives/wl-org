"use client"

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { SetlistSongSpreadCard } from "@/components/dpro/setlist/setlist-song-spread-card"
import { WlHomeV2SetlistJotyModal } from "@/components/wl-home-v2/wl-home-v2-setlist-joty-modal"
import { WlHomeV2SetlistWtedModal } from "@/components/wl-home-v2/wl-home-v2-setlist-wted-modal"
import { useWlHomeV2OpenLogin } from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { TAILWIND_XL_MIN_PX } from "@/components/wl-home-v2/wl-home-v2-years-view.constants"
import { WtedEpisodeGroupSpreadCard } from "@/components/wted/wted-episode-group-spread-card"
import { WtedEpisodePageHeroV2 } from "@/components/wted/wted-episode-page-hero-v2"
import {
  WtedEpisodePerformanceSpreadCard,
  wtedEpisodeHasMultipleShowYears,
} from "@/components/wted/wted-episode-performance-spread-card"
import { WtedEpisodeSetlistTable } from "@/components/wted/wted-episode-setlist-table"
import { useWtedEpisodeDetailData } from "@/hooks/use-wted-episode-detail-data"
import { useWtedEpisodePageId } from "@/hooks/use-wted-episode-page-id"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { wtedEpisodeHasMultipleShowGroups } from "@/lib/wted-episode-show-group"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "@/types/setlist"

import "@/components/archive-songs/songs-archive-verbatim.css"

const WL_V2_WTED_EPISODE_PAGE_CLASS =
  "wl-home-v2-years-page wl-home-v2-setlist songs-archive-verbatim wl-home-v2-songs-archive-page wl-home-v2-wted-episode-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col"

type WtedEpisodeLayoutMode = "mobile" | "desktop" | null

export function WlHomeV2WtedEpisodePageClient() {
  const router = useRouter()
  const { session } = useAuth()
  const openLogin = useWlHomeV2OpenLogin()
  const wtedModalHeadingId = useId()
  const jotyModalHeadingId = useId()
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredPerformanceYear, setHoveredPerformanceYear] = useState<
    string | null
  >(null)
  const [hoveredShowGroupKey, setHoveredShowGroupKey] = useState<string | null>(
    null,
  )
  const [wtedModalOpen, setWtedModalOpen] = useState(false)
  const [wtedModalEntry, setWtedModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [jotyModalOpen, setJotyModalOpen] = useState(false)
  const [jotyModalYear, setJotyModalYear] = useState<number | null>(null)
  const [jotyModalHighlightedEntryId, setJotyModalHighlightedEntryId] =
    useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<WtedEpisodeLayoutMode>(null)
  const { episodeId, invalidParams } = useWtedEpisodePageId()
  const {
    episode,
    wtedShow,
    rows,
    siblings,
    loading,
    notFound,
    loadError,
  } = useWtedEpisodeDetailData(invalidParams ? undefined : episodeId)

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${TAILWIND_XL_MIN_PX}px)`)
    const apply = () => {
      setLayoutMode(mq.matches ? "desktop" : "mobile")
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const useTwoColumnLayout = layoutMode === "desktop"

  const playlistSetlist = useMemo(
    () => rows.map((r) => r.setlistEntry),
    [rows],
  )

  useEffect(() => {
    setHoveredCategory(null)
    setHoveredPerformanceYear(null)
    setHoveredShowGroupKey(null)
  }, [episodeId])

  useEffect(() => {
    if (!wtedEpisodeHasMultipleShowYears(rows)) {
      setHoveredPerformanceYear(null)
    }
    if (!wtedEpisodeHasMultipleShowGroups(rows)) {
      setHoveredShowGroupKey(null)
    }
  }, [rows])

  useEffect(() => {
    setWtedModalOpen(false)
    setWtedModalEntry(null)
    setJotyModalOpen(false)
    setJotyModalYear(null)
    setJotyModalHighlightedEntryId(null)
  }, [episodeId])

  const closeWtedModal = useCallback(() => {
    setWtedModalOpen(false)
    setWtedModalEntry(null)
  }, [])

  useEffect(() => {
    if (!wtedModalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      closeWtedModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [wtedModalOpen, closeWtedModal])

  const wtedModalShow = useMemo(
    () => {
      if (!wtedModalEntry) {
        return {
          show_date: "",
          show_venue_location: null as string | null,
          show_group: null as string | null,
        }
      }
      const row = rows.find(
        (r) => r.setlistEntry.entry_id === wtedModalEntry.entry_id,
      )
      return {
        show_date: row?.showDate ?? "",
        show_venue_location: row?.venueLocation ?? null,
        show_group: row?.showGroup ?? null,
      }
    },
    [wtedModalEntry, rows],
  )

  const handleWtedClick = useCallback(
    (entry: SetlistEntry) => {
      if (!session) {
        openLogin?.()
        return
      }
      setWtedModalEntry(entry)
      setWtedModalOpen(true)
    },
    [session, openLogin],
  )

  const handleJotyClick = useCallback(
    (entry: SetlistEntry) => {
      const row = rows.find(
        (r) => r.setlistEntry.entry_id === entry.entry_id,
      )
      const raw = row?.showDate?.trim()
      const year =
        raw && !Number.isNaN(new Date(raw).getTime()) ?
          new Date(raw).getFullYear()
        : null
      setJotyModalYear(year)
      setJotyModalHighlightedEntryId(entry.entry_id)
      setJotyModalOpen(true)
    },
    [rows],
  )

  useEffect(() => {
    if (episode?.episode) {
      const label = getWtedEpisodeDisplayName(
        episode.episode,
        episode.display_name,
      )
      document.title = `${label} – WTED Radio – WTEDRadio.com`
    }
    return () => {
      document.title = "WTEDRadio.com"
    }
  }, [episode?.episode, episode?.display_name])

  if (invalidParams || !episodeId) {
    return (
      <div className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/65">
            Missing or invalid episode. Open an episode from{" "}
            <Link
              href="/radio/episodes"
              className="font-medium text-wl-orange underline underline-offset-2 hover:text-white"
            >
              Shows
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <WlHomeV2PageLoading message="Loading episode…" />
  }

  if (notFound || loadError || !episode) {
    return (
      <div className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/65">
            {loadError
              ? "Could not load this episode. Please try again."
              : "Episode not found."}
          </p>
          <p className="mt-3">
            <Link
              href="/radio/episodes"
              className="text-sm font-medium text-wl-orange underline underline-offset-2 hover:text-white"
            >
              Back to WTED Radio
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const showName = wtedShow?.show ?? episode.show
  const displayName = getWtedEpisodeDisplayName(
    episode.episode,
    episode.display_name,
  )

  return (
    <div className={WL_V2_WTED_EPISODE_PAGE_CLASS}>
      <WlHomeV2ArchiveCrumbsShell
        variant="rail"
        bottomSpacing={false}
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={[
              { label: "WTED Radio", href: "/radio/episodes" },
              { label: showName, href: "/radio/episodes" },
              {
                label: displayName,
                href: getWtedEpisodeUrl(episode.uuid),
              },
            ]}
          />
        }
      />

      <div className="wl-home-v2-years-body">
        <div
          className={cn(
            "wl-home-v2-years-columns",
            useTwoColumnLayout && "wl-home-v2-years-columns--desktop",
          )}
        >
          <section className="wl-home-v2-years-tile wl-home-v2-years-tile--main wl-home-v2-tile-bg--newbg3">
            <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
              <WtedEpisodePageHeroV2
                episode={episode}
                showName={showName}
                siblings={siblings}
                onNavigateEpisode={(id) =>
                  router.push(getWtedEpisodeUrl(id), { scroll: false })
                }
              />

              <div className="wl-home-v2-setlist-main-fill flex min-h-0 min-w-0 flex-1 flex-col gap-4">
                {rows.length === 0 ?
                  <p className="text-sm text-white/60">
                    No track listing is published for this episode yet.
                  </p>
                : (
                  <div className="wl-home-v2-setlist flex min-w-0 flex-col gap-4">
                    <div className="setlist-card wl-home-v2-setlist-card min-w-0">
                      <div
                        className="wl-home-v2-setlist-table-scroll"
                        role="region"
                        aria-label="Episode playlist"
                      >
                        <WtedEpisodeSetlistTable
                          rows={rows}
                          hoveredCategory={hoveredCategory}
                          hoveredPerformanceYear={hoveredPerformanceYear}
                          hoveredShowGroupKey={hoveredShowGroupKey}
                          onWtedClick={handleWtedClick}
                          onJotyClick={handleJotyClick}
                          wlHomeV2SetlistChrome
                        />
                      </div>
                    </div>
                    <WlHomeV2SetlistJotyModal
                      open={jotyModalOpen}
                      onClose={() => setJotyModalOpen(false)}
                      year={jotyModalYear}
                      highlightedEntryId={jotyModalHighlightedEntryId}
                      headingId={jotyModalHeadingId}
                    />
                    <WlHomeV2SetlistWtedModal
                      open={wtedModalOpen}
                      onClose={closeWtedModal}
                      entry={wtedModalEntry}
                      setlist={playlistSetlist}
                      show={wtedModalShow}
                      fallbackReleaseArtwork={null}
                      headingId={wtedModalHeadingId}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {rows.length > 0 ?
            <aside
              className="wl-home-v2-years-aside wl-home-v2-setlist-aside"
              aria-label="Playlist breakdown"
            >
              <div className="wl-home-v2-setlist-aside-stats-tiles">
                <SetlistSongSpreadCard
                  setlist={playlistSetlist}
                  hoveredCategory={hoveredCategory}
                  onCategoryHover={(c) => {
                    setHoveredPerformanceYear(null)
                    setHoveredShowGroupKey(null)
                    setHoveredCategory(c)
                  }}
                  includeAllEpisodeEntries
                  visualVariant="wl-home-v2"
                />
                <WtedEpisodePerformanceSpreadCard
                  rows={rows}
                  hoveredYear={hoveredPerformanceYear}
                  onYearHover={(y) => {
                    setHoveredCategory(null)
                    setHoveredShowGroupKey(null)
                    setHoveredPerformanceYear(y)
                  }}
                  visualVariant="wl-home-v2"
                />
                <WtedEpisodeGroupSpreadCard
                  rows={rows}
                  hoveredGroupKey={hoveredShowGroupKey}
                  onGroupHover={(key) => {
                    setHoveredCategory(null)
                    setHoveredPerformanceYear(null)
                    setHoveredShowGroupKey(key)
                  }}
                  visualVariant="wl-home-v2"
                />
              </div>
            </aside>
          : null}
        </div>
      </div>
    </div>
  )
}
