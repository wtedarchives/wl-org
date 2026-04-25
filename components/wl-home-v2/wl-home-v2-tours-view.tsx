"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { LineSegments, Playlist, X } from "@phosphor-icons/react"

import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { useTourPageData } from "@/hooks/use-tour-page-data"
import { useYearIdFromYear } from "@/hooks/use-setlist-year-id"
import { TourShowsTable } from "@/components/dpro/tours/tour-shows-table"
import { TourSlotsTable } from "@/components/dpro/tours/tour-slots-table"
import { TourStats } from "@/components/dpro/tours/tour-stats"
import { ToursSidebarCard } from "@/components/dpro/tours/tours-sidebar-card"
import { AverageSetlistCard } from "@/components/dpro/years/average-setlist-card"
import { SetlistSongPerformancesSheet } from "@/components/dpro/setlist/setlist-song-performances-sheet"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2YearsToolModal } from "@/components/wl-home-v2/wl-home-v2-years-tool-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { supabase } from "@/lib/supabase"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"


/** Landing redirect when `/archive/tours` has no `id` (matches legacy). */
const DEFAULT_LANDING_TOUR_NAME = "2026 Spring"

const TAILWIND_XL_MIN_PX = 1280
const TOUR_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function extractYear(tourName: string): string {
  const match = tourName.match(/^(\d{4})/)
  return match ? match[1] : "Unknown"
}

type TourToolPanel = "tours" | "setlist" | null

type YearsLayoutMode = "mobile" | "desktop" | null

function TourPageBody({ tourId }: { tourId: string }) {
  const [layoutMode, setLayoutMode] = useState<YearsLayoutMode>(null)
  const [viewportWidth, setViewportWidth] = useState(TAILWIND_XL_MIN_PX)
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [songSheetOpen, setSongSheetOpen] = useState(false)
  const [songSheetSongName, setSongSheetSongName] = useState<string | null>(null)
  const [songSheetSongDisplayName, setSongSheetSongDisplayName] = useState<
    string | null
  >(null)
  const [songSheetSongId, setSongSheetSongId] = useState<string | null>(null)
  const [toursSheetOpen, setToursSheetOpen] = useState(false)
  const [openToolPanel, setOpenToolPanel] = useState<TourToolPanel>(null)
  const [avgSetlistInfoOpen, setAvgSetlistInfoOpen] = useState(false)

  const {
    currentTour,
    currentTourId,
    currentTourShowFields,
    shows,
    tours,
    slots,
    activeColumns,
    hasSlotEntries,
    songIdMap,
    songDisplayNameMap,
    topSlots,
    hasTourSetlistEntries,
    hasGuestAppearances,
    setHasGuestAppearances,
    uniqueSongCount,
    setUniqueSongCount,
    attendeeCounts,
    showRatings,
    showsWithSetlists,
    showsWithReleases,
    showsWithRadioIds,
    isLoading,
    notPlayedSongs,
    averageSetlistResult,
  } = useTourPageData(tourId)

  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const yearFromTour = currentTour ? extractYear(currentTour.tour) : null
  const yearId = useYearIdFromYear(yearFromTour)

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${TAILWIND_XL_MIN_PX}px)`)
    const apply = () => {
      setLayoutMode(mq.matches ? "desktop" : "mobile")
      setViewportWidth(window.innerWidth)
    }
    apply()
    mq.addEventListener("change", apply)
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => {
      mq.removeEventListener("change", apply)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  useEffect(() => {
    if (openToolPanel == null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenToolPanel(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [openToolPanel])

  useEffect(() => {
    if (openToolPanel !== "setlist") {
      setAvgSetlistInfoOpen(false)
    }
  }, [openToolPanel])

  useEffect(() => {
    if (!currentTour || !tourId) {
      setSetlistBreadcrumbs(null)
      return
    }
    const year = extractYear(currentTour.tour)
    const items: { label: string; href: string }[] = [
      WTED_ARCHIVES_BREADCRUMB_ROOT,
      ...(yearId && year !== "Unknown"
        ? [{ label: year, href: getYearArchiveUrl(yearId) }]
        : []),
      { label: currentTour.tour, href: getTourArchiveUrl(tourId) },
    ]
    setSetlistBreadcrumbs(items)
    return () => setSetlistBreadcrumbs(null)
  }, [currentTour, tourId, yearId, setSetlistBreadcrumbs])

  useEffect(() => {
    if (currentTour && tours.length > 0) {
      const year = extractYear(currentTour.tour)
      if (year !== "Unknown") setExpandedYear(year)
    }
  }, [currentTour, tours])

  useEffect(() => {
    if (currentTour) {
      document.title = `${currentTour.tour} – WTED.org`
      return () => {
        document.title = ""
      }
    }
  }, [currentTour])

  const handleSongClick = useCallback(
    (songName: string, songDisplayName?: string | null) => {
      setSongSheetSongName(songName)
      setSongSheetSongDisplayName(
        songDisplayName ?? songDisplayNameMap[songName] ?? null,
      )
      setSongSheetSongId(songIdMap[songName] ?? null)
      setSongSheetOpen(true)
    },
    [songDisplayNameMap, songIdMap],
  )

  const toggleYear = useCallback((year: string) => {
    setExpandedYear((prev) => (prev === year ? null : year))
  }, [])

  const useCompactTools = layoutMode !== "desktop"
  const avgTitle =
    currentTour?.tour ? `${currentTour.tour} Average Setlist` : "Average Setlist"

  if (isLoading) {
    return (
      <WlHomeV2PageLoading
        message={
          currentTour ? `Loading ${currentTour.tour} data…` : "Loading tour…"
        }
      />
    )
  }

  if (!currentTour) return null

  return (
    <div className="wl-home-v2-years-page">
      <div className="wl-home-v2-years-body">
        {useCompactTools ?
          <div className="wl-home-v2-years-mobile-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="wl-home-v2-years-mobile-action gap-1.5"
              onClick={() => setToursSheetOpen(true)}
            >
              <LineSegments className="size-3.5" aria-hidden />
              Tours
            </Button>
            {shows.length > 0 && currentTourShowFields ?
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="wl-home-v2-years-mobile-action gap-1.5"
                onClick={() => setOpenToolPanel("setlist")}
              >
                <Playlist className="size-3.5" aria-hidden />
                Average Setlist
              </Button>
            : null}
          </div>
        : null}

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
            <div className="wl-home-v2-years-tile-inner min-h-0 flex flex-1 flex-col gap-4">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <TourShowsTable
                  shows={shows}
                  currentTour={currentTour.tour}
                  attendeeCounts={attendeeCounts}
                  showRatings={showRatings}
                  showsWithSetlists={showsWithSetlists}
                  showsWithReleases={showsWithReleases}
                  showsWithRadioIds={showsWithRadioIds}
                  loading={isLoading}
                  wlHomeV2
                />
              </div>

              {hasSlotEntries ?
                <TourSlotsTable
                  slots={slots}
                  activeColumns={activeColumns}
                  onSongClick={handleSongClick}
                  wlHomeV2
                />
              : null}

              <Suspense fallback={null}>
                <TourStats
                  shows={shows}
                  topSlots={topSlots}
                  windowWidth={viewportWidth}
                  currentTourId={currentTourId ?? ""}
                  currentTour={currentTour?.tour ?? ""}
                  currentTourShowFields={currentTourShowFields}
                  hasGuestAppearances={hasGuestAppearances}
                  setHasGuestAppearances={setHasGuestAppearances}
                  songIdMap={songIdMap}
                  uniqueSongCount={uniqueSongCount}
                  setUniqueSongCount={setUniqueSongCount}
                  hasTourSetlistEntries={hasTourSetlistEntries}
                  onSongClick={handleSongClick}
                  notPlayedSongs={notPlayedSongs}
                  wlHomeV2
                />
              </Suspense>

              {useCompactTools && shows.length > 0 && currentTourShowFields ?
                <AverageSetlistCard
                  shows={shows}
                  title={avgTitle}
                  type="tour"
                  averageSetlistResult={averageSetlistResult}
                  wlHomeV2
                />
              : null}
            </div>
          </section>

          {!useCompactTools ?
            <aside className="wl-home-v2-years-aside" aria-label="Tour tools">
              <section
                className="wl-home-v2-years-tile"
                style={
                  {
                    "--tile-bg": "url('/newbg.png')",
                  } as CSSProperties
                }
              >
                <div className="wl-home-v2-years-tile-inner">
                  <ToursSidebarCard
                    tours={tours}
                    currentTourId={currentTourId}
                    expandedYear={expandedYear}
                    onToggleYear={toggleYear}
                    loading={isLoading}
                    wlHomeV2
                  />
                </div>
              </section>
              {shows.length > 0 && currentTourShowFields ?
                <section
                  className="wl-home-v2-years-tile"
                  style={
                    {
                      "--tile-bg": "url('/newbg4.jpeg')",
                    } as CSSProperties
                  }
                >
                  <div className="wl-home-v2-years-tile-inner">
                    <AverageSetlistCard
                      shows={shows}
                      title={avgTitle}
                      type="tour"
                      averageSetlistResult={averageSetlistResult}
                      wlHomeV2
                      className="wl-home-v2-years-average-setlist-panel"
                    />
                  </div>
                </section>
              : null}
            </aside>
          : null}
        </div>
      </div>

      <SetlistSongPerformancesSheet
        open={songSheetOpen}
        onOpenChange={setSongSheetOpen}
        entry={null}
        tourName={currentTour.tour}
        songName={songSheetSongName}
        songDisplayName={songSheetSongDisplayName}
        songId={songSheetSongId}
      />

      <Sheet open={toursSheetOpen} onOpenChange={setToursSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] flex flex-col rounded-t-none overflow-hidden"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Tours</SheetTitle>
          <button
            type="button"
            onClick={() => setToursSheetOpen(false)}
            className="flex w-full items-center justify-center gap-2 border-b border-border py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
            Close
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ToursSidebarCard
              tours={tours}
              currentTourId={currentTourId}
              expandedYear={expandedYear}
              onToggleYear={toggleYear}
              onTourSelect={() => setToursSheetOpen(false)}
              loading={isLoading}
              className="rounded-none border-t-0 border-x-0"
              wlHomeV2
            />
          </div>
        </SheetContent>
      </Sheet>

      <WlHomeV2YearsToolModal
        open={openToolPanel === "setlist"}
        onClose={() => setOpenToolPanel(null)}
        title={avgTitle}
        headerActions={
          <button
            type="button"
            className={cn(
              "shrink-0 rounded-full border border-[rgb(68,70,69)] bg-white/8 !px-2 !py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90",
              "transition-colors hover:border-[rgb(52,109,95)] hover:bg-[rgba(88,200,174,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wl-light-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            )}
            aria-label="How the average setlist works"
            onClick={() => setAvgSetlistInfoOpen(true)}
          >
            info
          </button>
        }
      >
        <AverageSetlistCard
          shows={shows}
          title={avgTitle}
          type="tour"
          averageSetlistResult={averageSetlistResult}
          wlHomeV2
          embedInModal
          infoOpen={avgSetlistInfoOpen}
          onInfoOpenChange={setAvgSetlistInfoOpen}
        />
      </WlHomeV2YearsToolModal>
    </div>
  )
}

function ToursArchiveRoutes({ tourId }: { tourId: string }) {
  return <TourPageBody tourId={tourId} />
}

export function WlHomeV2ToursView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawList = useMemo(
    () =>
      searchParams
        .getAll("id")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  )
  const idSet = new Set(rawList)
  const tourIdParam = rawList[0] ?? ""

  useEffect(() => {
    if (tourIdParam) return
    let cancelled = false
    ;(async () => {
      if (!supabase) {
        if (!cancelled) router.replace("/archive")
        return
      }
      const { data: tour } = await supabase
        .from("tours")
        .select("tour_id")
        .eq("tour", DEFAULT_LANDING_TOUR_NAME)
        .single()
      if (cancelled) return
      if (tour?.tour_id) {
        router.replace(getTourArchiveUrl(tour.tour_id))
      } else {
        router.replace("/archive")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tourIdParam, router])

  if (idSet.size > 1) notFound()

  if (!tourIdParam) {
    return <WlHomeV2PageLoading message="Loading tour…" />
  }

  if (!TOUR_ID_RE.test(tourIdParam)) notFound()

  return <ToursArchiveRoutes tourId={tourIdParam} />
}
