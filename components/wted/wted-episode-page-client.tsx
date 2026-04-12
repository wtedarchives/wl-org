"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { SetlistSongSpreadCard } from "@/components/dpro/setlist/setlist-song-spread-card"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import { SetlistWtedSheet } from "@/components/dpro/setlist/setlist-wted-sheet"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { WtedEpisodeGroupSpreadCard } from "@/components/wted/wted-episode-group-spread-card"
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
import type { SetlistEntry } from "@/types/setlist"

export function WtedEpisodePageClient() {
  const router = useRouter()
  const { user } = useAuth()
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
  }, [episodeId])

  const handleWtedClick = useCallback(
    (entry: SetlistEntry) => {
      if (!user) {
        setWtedLoginRequiredOpen(true)
        return
      }
      setWtedSheetEntry(entry)
      setWtedSheetOpen(true)
    },
    [user],
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
      { label: "WTED Radio", href: "/wted" },
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

  const displayName = getWtedEpisodeDisplayName(
    episode.episode,
    episode.display_name,
  )
  const showName = wtedShow?.show ?? episode.show
  const description = episode.description?.trim() ?? ""
  const hosts = episode.hosts

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {episode.artwork?.trim() ?
          <div className="mx-auto w-full max-w-full shrink-0 sm:mx-0 sm:w-max">
            <Image
              src={episode.artwork}
              alt={displayName}
              width={280}
              height={280}
              className="block h-auto w-full max-h-none max-w-none rounded-lg border border-border bg-muted/30 shadow-sm transition-all duration-200 ease-out sm:h-auto sm:w-auto sm:max-h-[min(70vh,520px)] sm:max-w-[min(100vw-2rem,280px)]"
              unoptimized
            />
          </div>
        : null}

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground leading-6 md:text-2xl">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{showName}</p>
          </div>

          {siblings.length > 1 ?
            <div className="min-w-0 w-fit max-w-full">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Episode
              </h2>
              <div className="mt-2 min-w-0 w-fit max-w-full">
                <Select
                  value={episode.uuid}
                  onValueChange={(id) =>
                    router.push(getWtedEpisodeUrl(id), { scroll: false })
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="h-auto min-h-8 min-w-0 max-w-full border-border px-2 py-1 text-xs font-medium"
                  >
                    <SelectValue placeholder="Episode" />
                  </SelectTrigger>
                  <SelectContent>
                    {siblings.map((s) => (
                      <SelectItem
                        key={s.uuid}
                        value={s.uuid}
                        className="text-xs"
                      >
                        {getWtedEpisodeDisplayName(s.episode, s.display_name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          : null}

          {(hosts.length > 0) || description ?
            <Separator />
          : null}

          {hosts.length > 0 ?
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {hosts.length > 1 ? "Hosts" : "Host"}
              </h2>
              <ul className="m-0 mt-2 list-none space-y-2 p-0 font-medium text-foreground">
                {hosts.map((h, i) => (
                  <li
                    key={`${h.name}-${h.handle}-${i}`}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {h.name ?
                      <span className="text-sm font-normal">{h.name}</span>
                    : null}
                    {h.handle ?
                      <span className="inline-flex max-w-full min-w-0 items-center truncate rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {h.handle}
                      </span>
                    : null}
                  </li>
                ))}
              </ul>
            </div>
          : null}

          {description ?
            <>
              {hosts.length > 0 ?
                <Separator />
              : null}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-4 text-foreground">
                  {description}
                </p>
              </div>
            </>
          : null}
        </div>
      </div>

      {rows.length === 0 ?
        <p className="text-sm text-muted-foreground">
          No track listing is published for this episode yet.
        </p>
      : (
        <>
          <Separator className="shrink-0" />
          <section
            className="min-w-0 space-y-2"
            aria-labelledby="wted-episode-track-listing-heading"
          >
            <h2
              id="wted-episode-track-listing-heading"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Playlist
            </h2>
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <Card className="border-border/60 bg-card/80 py-0">
                  <CardContent className="p-0">
                    <WtedEpisodeSetlistTable
                      rows={rows}
                      hoveredCategory={hoveredCategory}
                      hoveredPerformanceYear={hoveredPerformanceYear}
                      hoveredShowGroupKey={hoveredShowGroupKey}
                      onWtedClick={handleWtedClick}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[280px]">
                <SetlistSongSpreadCard
                  setlist={playlistSetlist}
                  hoveredCategory={hoveredCategory}
                  onCategoryHover={(c) => {
                    setHoveredPerformanceYear(null)
                    setHoveredShowGroupKey(null)
                    setHoveredCategory(c)
                  }}
                  includeAllEpisodeEntries
                />
                <WtedEpisodePerformanceSpreadCard
                  rows={rows}
                  hoveredYear={hoveredPerformanceYear}
                  onYearHover={(y) => {
                    setHoveredCategory(null)
                    setHoveredShowGroupKey(null)
                    setHoveredPerformanceYear(y)
                  }}
                />
                <WtedEpisodeGroupSpreadCard
                  rows={rows}
                  hoveredGroupKey={hoveredShowGroupKey}
                  onGroupHover={(key) => {
                    setHoveredCategory(null)
                    setHoveredPerformanceYear(null)
                    setHoveredShowGroupKey(key)
                  }}
                />
              </div>
            </div>
          </section>
          <SetlistWtedLoginRequiredDialog
            open={wtedLoginRequiredOpen}
            onOpenChange={setWtedLoginRequiredOpen}
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
