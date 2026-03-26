"use client"

import { Suspense, use, useEffect, useRef, useState } from "react"
import { notFound } from "next/navigation"
import { MapPin, X } from "lucide-react"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { useTourPageData } from "@/hooks/use-tour-page-data"
import { useYearIdFromYear } from "@/hooks/use-setlist-year-id"
import { TourShowsTable } from "@/components/dpro/tours/tour-shows-table"
import { TourSlotsTable } from "@/components/dpro/tours/tour-slots-table"
import { TourStats } from "@/components/dpro/tours/tour-stats"
import { ToursSidebarCard } from "@/components/dpro/tours/tours-sidebar-card"
import { AverageSetlistCard } from "@/components/dpro/years/average-setlist-card"
import { SetlistSongPerformancesSheet } from "@/components/dpro/setlist/setlist-song-performances-sheet"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { Button } from "@/components/ui/button"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

const DESKTOP_MIN_WIDTH = 1280

function extractYear(tourName: string): string {
  const match = tourName.match(/^(\d{4})/)
  return match ? match[1] : "Unknown"
}

export default function TourPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: tourId } = use(params)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutMode, setLayoutMode] = useState<"mobile" | "desktop">("desktop")
  const [windowWidth, setWindowWidth] = useState(1280)
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [songSheetOpen, setSongSheetOpen] = useState(false)
  const [songSheetSongName, setSongSheetSongName] = useState<string | null>(null)
  const [songSheetSongDisplayName, setSongSheetSongDisplayName] = useState<
    string | null
  >(null)
  const [songSheetSongId, setSongSheetSongId] = useState<string | null>(null)
  const [toursSheetOpen, setToursSheetOpen] = useState(false)

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
    progress,
  } = useTourPageData(tourId)

  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const yearFromTour = currentTour ? extractYear(currentTour.tour) : null
  const yearId = useYearIdFromYear(yearFromTour)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      setWindowWidth(w)
      setLayoutMode(w >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile")
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!currentTour || !tourId) {
      setSetlistBreadcrumbs(null)
      return
    }
    const year = extractYear(currentTour.tour)
    const items: { label: string; href: string }[] = [
      { label: "Setlist Archive", href: "/archive" },
      ...(yearId && year !== "Unknown"
        ? [{ label: year, href: getYearArchiveUrl(yearId) }]
        : []),
      { label: currentTour.tour, href: "" },
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
      document.title = `${currentTour.tour} – WysteriaLane.org`
      return () => { document.title = "" }
    }
  }, [currentTour])

  const handleSongClick = (
    songName: string,
    songDisplayName?: string | null,
  ) => {
    setSongSheetSongName(songName)
    setSongSheetSongDisplayName(
      songDisplayName ?? songDisplayNameMap[songName] ?? null,
    )
    setSongSheetSongId(songIdMap[songName] ?? null)
    setSongSheetOpen(true)
  }

  const toggleYear = (year: string) => {
    setExpandedYear((prev) => (prev === year ? null : year))
  }

  if (!tourId) notFound()

  if (isLoading) {
    return (
      <div ref={containerRef}>
        <LoadingPageCard
          message={currentTour ? `Loading ${currentTour.tour} data…` : undefined}
          page="tour"
          progress={progress}
        />
      </div>
    )
  }

  if (!currentTour) return null

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6"
    >
      {layoutMode === "mobile" && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setToursSheetOpen(true)}
          >
            <MapPin className="size-3.5" />
            Tours
          </Button>
        </div>
      )}

      <div
        className={`flex min-w-0 gap-4 ${
          layoutMode === "desktop" ? "flex-row" : "flex-col"
        }`}
      >
        <div className="min-w-0 flex-1 space-y-4 overflow-x-auto">
          <TourShowsTable
            shows={shows}
            currentTour={currentTour.tour}
            attendeeCounts={attendeeCounts}
            showRatings={showRatings}
            showsWithSetlists={showsWithSetlists}
            showsWithReleases={showsWithReleases}
            showsWithRadioIds={showsWithRadioIds}
            loading={isLoading}
          />

          {hasSlotEntries && (
            <TourSlotsTable
              slots={slots}
              activeColumns={activeColumns}
              onSongClick={handleSongClick}
            />
          )}

          <Suspense fallback={null}>
            <TourStats
              shows={shows}
              topSlots={topSlots}
              windowWidth={windowWidth}
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
            />
          </Suspense>

          {layoutMode === "mobile" &&
            shows.length > 0 &&
            currentTourShowFields && (
              <AverageSetlistCard
                shows={shows}
                title="Average Setlist"
                type="tour"
                averageSetlistResult={averageSetlistResult}
              />
            )}
        </div>

        {layoutMode === "desktop" && (
          <div className="flex w-[280px] shrink-0 flex-col gap-3">
            <ToursSidebarCard
              tours={tours}
              currentTourId={currentTourId}
              expandedYear={expandedYear}
              onToggleYear={toggleYear}
              loading={isLoading}
            />
            {shows.length > 0 && currentTourShowFields && (
              <AverageSetlistCard
                shows={shows}
                title="Average Setlist"
                type="tour"
                averageSetlistResult={averageSetlistResult}
              />
            )}
          </div>
        )}
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

      <Sheet
        open={toursSheetOpen}
        onOpenChange={setToursSheetOpen}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] flex flex-col rounded-t-none overflow-hidden"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Tours</SheetTitle>
          <button
            type="button"
            onClick={() => setToursSheetOpen(false)}
            className="flex w-full items-center justify-center gap-2 border-b border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
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
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
