"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { SetlistJotyDrawer } from "@/components/dpro/setlist/setlist-joty-drawer"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { WtedEpisodePageHero } from "@/components/wted/wted-episode-page-hero"
import { WtedEpisodePlaylistSection } from "@/components/wted/wted-episode-playlist-section"
import {
  wtedEpisodeHasMultipleShowYears,
} from "@/components/wted/wted-episode-performance-spread-card"
import { useWtedEpisodeDetailData } from "@/hooks/use-wted-episode-detail-data"
import { useWtedEpisodePageId } from "@/hooks/use-wted-episode-page-id"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { wtedEpisodeHasMultipleShowGroups } from "@/lib/wted-episode-show-group"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import type { SetlistEntry } from "@/types/setlist"

export function WtedEpisodePageClient() {
  const router = useRouter()
  const { session } = useAuth()
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredPerformanceYear, setHoveredPerformanceYear] = useState<
    string | null
  >(null)
  const [hoveredShowGroupKey, setHoveredShowGroupKey] = useState<string | null>(
    null,
  )
  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [wtedSheetEntry, setWtedSheetEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedLoginRequiredOpen, setWtedLoginRequiredOpen] = useState(false)
  const [jotyDrawerOpen, setJotyDrawerOpen] = useState(false)
  const [jotyDrawerYear, setJotyDrawerYear] = useState<number | null>(null)
  const [jotyDrawerHighlightedEntryId, setJotyDrawerHighlightedEntryId] =
    useState<string | null>(null)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { episodeId, invalidParams } = useWtedEpisodePageId()
  const {
    episode,
    wtedShow,
    rows,
    siblings,
    loading,
    notFound,
    loadError,
  } = useWtedEpisodeDetailData(
    invalidParams ? undefined : episodeId,
  )

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
    setWtedSheetOpen(false)
    setWtedSheetEntry(null)
    setWtedLoginRequiredOpen(false)
    setJotyDrawerOpen(false)
    setJotyDrawerYear(null)
    setJotyDrawerHighlightedEntryId(null)
  }, [episodeId])

  const handleWtedClick = useCallback(
    (entry: SetlistEntry) => {
      if (!session) {
        setWtedLoginRequiredOpen(true)
        return
      }
      setWtedSheetEntry(entry)
      setWtedSheetOpen(true)
    },
    [session],
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
      setJotyDrawerYear(year)
      setJotyDrawerHighlightedEntryId(entry.entry_id)
      setJotyDrawerOpen(true)
    },
    [rows],
  )

  useEffect(() => {
    if (!episodeId || invalidParams || !episode || notFound || loadError) {
      setSetlistBreadcrumbs(null)
      return
    }
    const displayName = getWtedEpisodeDisplayName(
      episode.episode,
      episode.display_name,
    )
    const showLabel = wtedShow?.show ?? episode.show
    setSetlistBreadcrumbs([
      { label: "WTED Radio", href: "/wted/program-director" },
      { label: showLabel, href: "/wted/program-director" },
      { label: displayName, href: getWtedEpisodeUrl(episode.uuid) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [
    episodeId,
    invalidParams,
    episode,
    notFound,
    loadError,
    wtedShow,
    setSetlistBreadcrumbs,
  ])

  useEffect(() => {
    if (episode?.episode) {
      const label = getWtedEpisodeDisplayName(
        episode.episode,
        episode.display_name,
      )
      document.title = `${label} – WTED Radio – WysteriaLane.org`
    } else {
      document.title = "WTED Radio – WysteriaLane.org"
    }
    return () => {
      document.title = ""
    }
  }, [episode?.episode, episode?.display_name])

  if (invalidParams || !episodeId) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <p className="text-center text-sm text-muted-foreground">
          Missing or invalid episode. Open an episode from{" "}
          <Link href="/wted" className="font-medium text-foreground underline">
            WTED Radio
          </Link>
          .
        </p>
      </div>
    )
  }

  if (loading) {
    return <LoadingPageCard message="Loading episode…" />
  }

  if (notFound || loadError || !episode) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <p className="text-center text-sm text-muted-foreground">
          {loadError
            ? "Could not load this episode. Please try again."
            : "Episode not found."}
        </p>
        <p className="text-center">
          <Link
            href="/wted"
            className="text-sm font-medium text-foreground underline"
          >
            Back to WTED Radio
          </Link>
        </p>
      </div>
    )
  }

  const showName = wtedShow?.show ?? episode.show

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <WtedEpisodePageHero
        episode={episode}
        showName={showName}
        siblings={siblings}
        onNavigateEpisode={(id) =>
          router.push(getWtedEpisodeUrl(id), { scroll: false })
        }
      />

      {rows.length === 0 ?
        <p className="text-sm text-muted-foreground">
          No track listing is published for this episode yet.
        </p>
      : (
        <>
          <WtedEpisodePlaylistSection
            rows={rows}
            playlistSetlist={playlistSetlist}
            hoveredCategory={hoveredCategory}
            hoveredPerformanceYear={hoveredPerformanceYear}
            hoveredShowGroupKey={hoveredShowGroupKey}
            onCategoryHover={(c) => {
              setHoveredPerformanceYear(null)
              setHoveredShowGroupKey(null)
              setHoveredCategory(c)
            }}
            onYearHover={(y) => {
              setHoveredCategory(null)
              setHoveredShowGroupKey(null)
              setHoveredPerformanceYear(y)
            }}
            onGroupHover={(key) => {
              setHoveredCategory(null)
              setHoveredPerformanceYear(null)
              setHoveredShowGroupKey(key)
            }}
            onWtedClick={handleWtedClick}
            onJotyClick={handleJotyClick}
          />
          <SetlistWtedLoginRequiredDialog
            open={wtedLoginRequiredOpen}
            onOpenChange={setWtedLoginRequiredOpen}
          />
          <SetlistJotyDrawer
            open={jotyDrawerOpen}
            onOpenChange={setJotyDrawerOpen}
            year={jotyDrawerYear}
            highlightedEntryId={jotyDrawerHighlightedEntryId}
          />
          <SetlistWtedSheet
            open={wtedSheetOpen}
            onOpenChange={setWtedSheetOpen}
            entry={wtedSheetEntry}
            setlist={playlistSetlist}
            show={
              wtedSheetEntry ?
                (() => {
                  const row = rows.find(
                    (r) =>
                      r.setlistEntry.entry_id === wtedSheetEntry.entry_id,
                  )
                  return {
                    show_date: row?.showDate ?? "",
                    show_venue_location: row?.venueLocation ?? null,
                    show_group: row?.showGroup ?? null,
                  }
                })()
              : {
                  show_date: "",
                  show_venue_location: null,
                  show_group: null,
                }
            }
            fallbackReleaseArtwork={null}
          />
        </>
      )}
    </div>
  )
}
