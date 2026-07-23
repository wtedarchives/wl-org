"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react"
import { CaretDown, LineSegments } from "@phosphor-icons/react"

import {
  useSetlistBreadcrumb,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { useTourPageData } from "@/hooks/use-tour-page-data"
import { useYearIdFromYear } from "@/hooks/use-setlist-year-id"
import { useShowsWithPosters } from "@/hooks/use-shows-with-posters"
import { TourShowsTable } from "@/components/dpro/tours/tour-shows-table"
import { TourSlotsTable } from "@/components/dpro/tours/tour-slots-table"
import { TourStats } from "@/components/dpro/tours/tour-stats"
import { ToursSidebarCard } from "@/components/dpro/tours/tours-sidebar-card"
import { WlHomeV2SetlistSongModal } from "@/components/wl-home-v2/wl-home-v2-setlist-song-modal"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2YearsToolModal } from "@/components/wl-home-v2/wl-home-v2-years-tool-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { TAILWIND_XL_MIN_PX } from "@/components/wl-home-v2/wl-home-v2-years-view.constants"
import { extractYear } from "@/components/wl-home-v2/wl-home-v2-tours-view.utils"

type TourToolPanel = "tours" | null

type YearsLayoutMode = "mobile" | "desktop" | null

export function WlHomeV2TourPageBody({ tourId }: { tourId: string }) {
  const [layoutMode, setLayoutMode] = useState<YearsLayoutMode>(null)
  const [viewportWidth, setViewportWidth] = useState(TAILWIND_XL_MIN_PX)
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [songSheetOpen, setSongSheetOpen] = useState(false)
  const [songSheetSongName, setSongSheetSongName] = useState<string | null>(null)
  const [songSheetSongDisplayName, setSongSheetSongDisplayName] = useState<
    string | null
  >(null)
  const [songSheetSongId, setSongSheetSongId] = useState<string | null>(null)
  const [openToolPanel, setOpenToolPanel] = useState<TourToolPanel>(null)
  const tourSongModalHeadingId = useId()
  const tourSongModalTourLineId = useId()

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
  const showsWithPosters = useShowsWithPosters()

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
      document.title = `${currentTour.tour} – WTEDRadio.com`
      return () => {
        document.title = "WTEDRadio.com"
      }
    }
  }, [currentTour])

  const closeTourSongModal = useCallback(() => {
    setSongSheetOpen(false)
    setSongSheetSongName(null)
    setSongSheetSongDisplayName(null)
    setSongSheetSongId(null)
  }, [])

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
            <div className="wl-home-v2-years-tile-inner wl-home-v2-tour-page-main min-h-0 flex flex-1 flex-col gap-4">
              <div className="flex min-h-0 min-w-0 shrink-0 flex-col">
                <TourShowsTable
                  shows={shows}
                  currentTour={currentTour.tour}
                  attendeeCounts={attendeeCounts}
                  showRatings={showRatings}
                  showsWithSetlists={showsWithSetlists}
                  showsWithPosters={showsWithPosters}
                  showsWithReleases={showsWithReleases}
                  showsWithRadioIds={showsWithRadioIds}
                  loading={isLoading}
                  wlHomeV2
                  wlCompactHideShowCount={
                    useCompactTools && currentTourShowFields === false
                  }
                  wlHeaderTrailing={
                    useCompactTools ?
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="wl-home-v2-tours-header-pill gap-1"
                        onClick={() => setOpenToolPanel("tours")}
                        aria-haspopup="dialog"
                        aria-expanded={openToolPanel === "tours"}
                      >
                        <LineSegments className="size-3.5" aria-hidden />
                        Tours
                        <CaretDown
                          className="size-3.5 shrink-0 opacity-80"
                          aria-hidden
                        />
                      </Button>
                    : undefined
                  }
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
                  averageSetlistResult={averageSetlistResult}
                  wlHomeV2
                />
              </Suspense>
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
            </aside>
          : null}
        </div>
      </div>

      <WlHomeV2SetlistSongModal
        open={songSheetOpen}
        onClose={closeTourSongModal}
        entry={null}
        tourName={currentTour.tour}
        headingId={tourSongModalHeadingId}
        tourLineId={tourSongModalTourLineId}
        songName={songSheetSongName}
        songDisplayName={songSheetSongDisplayName}
        songId={songSheetSongId}
      />

      <WlHomeV2YearsToolModal
        open={openToolPanel === "tours"}
        onClose={() => setOpenToolPanel(null)}
        title={
          yearFromTour && yearFromTour !== "Unknown" ?
            `${yearFromTour} Tours`
          : "Tours"
        }
      >
        <ToursSidebarCard
          tours={tours}
          currentTourId={currentTourId}
          expandedYear={expandedYear}
          onToggleYear={toggleYear}
          onTourSelect={() => setOpenToolPanel(null)}
          loading={isLoading}
          embedInModal
          wlHomeV2
        />
      </WlHomeV2YearsToolModal>
    </div>
  )
}
