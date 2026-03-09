"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useYearBreadcrumb } from "@/components/year-breadcrumb-context"
import { YearsProvider, useYears } from "@/components/years-provider"
import { YearShowsTable } from "@/components/dpro/years/year-shows-table"
import { ToursCard } from "@/components/dpro/years/tours-card"
import { GroupFiltersCard } from "@/components/dpro/years/group-filters-card"
import { AverageSetlistCard } from "@/components/dpro/years/average-setlist-card"
import { useShowsDataByYear, type YearShow } from "@/hooks/use-shows-data-by-year"
import { useToursData } from "@/hooks/use-tours-data"
import { useGroupsData } from "@/hooks/use-groups-data"
import { useAttendeeData } from "@/hooks/use-attendee-data"
import { useShowRatings } from "@/hooks/use-show-ratings"
import { useShowMetadata } from "@/hooks/use-show-metadata"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ListFilter, ListMusic, MapPin, X } from "lucide-react"

const DEFAULT_YEAR = "2025"
const DESKTOP_MIN_WIDTH = 1280

type MobileModal = "tours" | "groups" | "setlist" | null

function YearPageContent({ yearId }: { yearId?: string }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { years, loading: yearsLoading } = useYears()
  const { setYearLabel } = useYearBreadcrumb()

  // Default to desktop so containers show until we measure < 1280
  const [layoutMode, setLayoutMode] = useState<"mobile" | "desktop">("desktop")
  const [mobileModal, setMobileModal] = useState<MobileModal>(null)
  const [currentYear, setCurrentYear] = useState<string>("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [filteredShows, setFilteredShows] = useState<YearShow[]>([])
  const [previousYearId, setPreviousYearId] = useState<string | null>(null)

  const { shows, loading: showsLoading } = useShowsDataByYear(currentYear)
  const { tours } = useToursData(currentYear)
  const { groups } = useGroupsData(shows)
  const { attendeeCounts } = useAttendeeData(filteredShows)
  const { showRatings } = useShowRatings(filteredShows)
  const { showsWithSetlists, showsWithReleases, showsWithRadioIds } =
    useShowMetadata(shows, currentYear)

  const loading = yearsLoading || showsLoading
  const yearsProgress = yearsLoading ? 0 : 50
  const showsProgress = showsLoading ? yearsProgress : 100
  const progress = loading ? showsProgress : undefined

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateLayout = () => {
      const width = el.clientWidth
      setLayoutMode((prev) =>
        width >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile"
      )
    }
    updateLayout()
    const ro = new ResizeObserver(updateLayout)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (selectedGroups.length === 0) {
      setFilteredShows(shows)
    } else {
      setFilteredShows(
        shows.filter((show) => selectedGroups.includes(show.show_group)),
      )
    }
  }, [shows, selectedGroups])

  useEffect(() => {
    if (years.length === 0) return

    const fallbackYear = years.find((y) => y.year === DEFAULT_YEAR)

    if (!yearId) {
      if (fallbackYear) {
        router.replace(`/dpro/years/${fallbackYear.year_id}`, {
          scroll: false,
        })
      }
      return
    }

    const yearData = years.find((y) => y.year_id === yearId)
    if (yearData) {
      setCurrentYear(yearData.year)
    } else if (fallbackYear) {
      router.replace(`/dpro/years/${fallbackYear.year_id}`, {
        scroll: false,
      })
    }
  }, [yearId, years, router])

  useEffect(() => {
    if (yearId !== previousYearId) {
      setPreviousYearId(yearId ?? null)
      setSelectedGroups([])
    }
  }, [yearId, previousYearId])

  useEffect(() => {
    setYearLabel(currentYear || null)
    return () => setYearLabel(null)
  }, [currentYear, setYearLabel])

  useEffect(() => {
    if (currentYear) {
      document.title = `${currentYear} Shows – Wysteria Lane`
    }
    return () => { document.title = "" }
  }, [currentYear])

  const handleYearClick = (id: string) => {
    router.push(`/dpro/years/${id}`)
  }

  const toggleGroupSelection = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group],
    )
  }

  const clearGroupFilters = () => {
    setSelectedGroups([])
  }

  const yearLabel =
    yearId && years.length > 0
      ? years.find((y) => y.year_id === yearId)?.year ?? DEFAULT_YEAR
      : currentYear || DEFAULT_YEAR

  if (loading) {
    return (
      <div ref={containerRef}>
        <LoadingPageCard
          message={`Loading ${yearLabel} data…`}
          progress={progress}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6"
    >
      <div
        className={`flex min-w-0 flex-col gap-3 ${
          layoutMode === "desktop"
            ? "md:flex-row md:items-center md:justify-between"
            : ""
        }`}
      >
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <h1 className="text-lg font-semibold">{yearLabel} Shows</h1>
          {selectedGroups.length > 0 && (
            <button
              type="button"
              onClick={clearGroupFilters}
              className="rounded border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive hover:bg-destructive/40 hover:text-destructive/80"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="flex max-h-24 min-w-0 flex-wrap gap-1 overflow-y-auto text-[11px]">
          {years.map((year) => (
            <button
              key={year.year_id}
              type="button"
              onClick={() => handleYearClick(year.year_id)}
              className={`rounded-full border px-2 py-0.5 transition-colors ${
                yearId === year.year_id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {year.year}
            </button>
          ))}
        </div>
      </div>

      {layoutMode === "mobile" && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 transition-colors hover:bg-muted hover:border-muted-foreground/40 active:bg-muted/80"
            onClick={() => setMobileModal("tours")}
          >
            <MapPin className="size-3.5" />
            Tours
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 transition-colors hover:bg-muted hover:border-muted-foreground/40 active:bg-muted/80"
            onClick={() => setMobileModal("groups")}
          >
            <ListFilter className="size-3.5" />
            Filter by Group
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 transition-colors hover:bg-muted hover:border-muted-foreground/40 active:bg-muted/80"
            onClick={() => setMobileModal("setlist")}
          >
            <ListMusic className="size-3.5" />
            Average Setlist
          </Button>
        </div>
      )}

      <div
        className={`flex min-w-0 gap-4 ${
          layoutMode === "desktop" ? "flex-row" : "flex-col"
        }`}
      >
        <div className="min-w-0 flex-1 overflow-x-auto">
          <YearShowsTable
            shows={filteredShows}
            tours={tours}
            attendeeCounts={attendeeCounts}
            showRatings={showRatings}
            showsWithSetlists={showsWithSetlists}
            showsWithReleases={showsWithReleases}
            showsWithRadioIds={showsWithRadioIds}
            currentYear={currentYear}
            selectedGroups={selectedGroups}
            onClearFilters={clearGroupFilters}
            loading={loading}
          />
        </div>

        {layoutMode === "desktop" && (
          <div className="flex w-[280px] shrink-0 flex-col gap-3">
            <ToursCard
              tours={tours}
              currentYear={currentYear}
              loading={loading}
            />
            <GroupFiltersCard
              groups={groups}
              selectedGroups={selectedGroups}
              onToggleGroup={toggleGroupSelection}
              onClearFilters={clearGroupFilters}
              loading={loading}
            />
            <AverageSetlistCard
              shows={shows}
              title={
                currentYear
                  ? `${currentYear} Average Setlist`
                  : "Average Setlist"
              }
            />
          </div>
        )}
      </div>

      <Sheet
        open={mobileModal !== null}
        onOpenChange={(open) => !open && setMobileModal(null)}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] flex flex-col rounded-t-none overflow-hidden"
          showCloseButton={false}
        >
          <button
            type="button"
            onClick={() => setMobileModal(null)}
            className="flex w-full items-center justify-center gap-2 border-b border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
            Close
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {mobileModal === "tours" && (
              <ToursCard
                tours={tours}
                currentYear={currentYear}
                loading={loading}
                className="rounded-none border-t-0 border-x-0"
              />
            )}
            {mobileModal === "groups" && (
              <GroupFiltersCard
                groups={groups}
                selectedGroups={selectedGroups}
                onToggleGroup={toggleGroupSelection}
                onClearFilters={clearGroupFilters}
                loading={loading}
                className="rounded-none border-t-0 border-x-0"
              />
            )}
            {mobileModal === "setlist" && (
              <AverageSetlistCard
                shows={shows}
                title={
                  currentYear
                    ? `${currentYear} Average Setlist`
                    : "Average Setlist"
                }
                className="rounded-none border-t-0 border-x-0"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function DproYearPage({
  params,
}: {
  params: Promise<{ year_id?: string }>
}) {
  const { year_id } = use(params)
  return (
    <YearsProvider>
      <YearPageContent yearId={year_id} />
    </YearsProvider>
  )
}

