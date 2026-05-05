"use client"

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react"
import { notFound } from "next/navigation"
import { FunnelSimple, LineSegments } from "@phosphor-icons/react"

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
import { useAverageSetlist } from "@/hooks/use-average-setlist"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2YearsToolModal } from "@/components/wl-home-v2/wl-home-v2-years-tool-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { NAV_YEARS } from "@/components/app-sidebar.constants"
import { DEFAULT_YEAR, TAILWIND_XL_MIN_PX } from "@/components/wl-home-v2/wl-home-v2-years-view.constants"

type YearsToolPanel = "tours" | "groups" | null

/** Until measured: assume compact (no right column) to match SSR + first paint. */
type YearsLayoutMode = "mobile" | "desktop" | null

export function WlHomeV2YearPageBody({ yearId }: { yearId: string }) {
  const { years, loading: yearsLoading } = useYears()

  const [layoutMode, setLayoutMode] = useState<YearsLayoutMode>(null)
  const [openToolPanel, setOpenToolPanel] = useState<YearsToolPanel>(null)
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

  const averageSetlistResult = useAverageSetlist(shows, "year")

  const loading = yearsLoading || showsLoading

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

  useEffect(() => {
    if (openToolPanel == null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenToolPanel(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [openToolPanel])

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
    const yearData = years.find((y) => y.year_id === yearId)
    if (yearData) {
      setCurrentYear(yearData.year)
    }
  }, [yearId, years])

  useEffect(() => {
    if (yearsLoading || years.length === 0) return
    if (!years.some((y) => y.year_id === yearId)) {
      notFound()
    }
  }, [years, yearsLoading, yearId])

  useEffect(() => {
    if (yearId !== previousYearId) {
      setPreviousYearId(yearId)
      setSelectedGroups([])
    }
  }, [yearId, previousYearId])

  useEffect(() => {
    if (currentYear) {
      document.title = `${currentYear} Shows – WysteriaLane.org`
    }
    return () => {
      document.title = ""
    }
  }, [currentYear])

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

  const yearLabelFromNav = NAV_YEARS.find((y) => y.year_id === yearId)?.year
  const yearLabel =
    (years.length > 0 ?
      years.find((y) => y.year_id === yearId)?.year
    : undefined) ??
    yearLabelFromNav ??
    (currentYear || DEFAULT_YEAR)

  const toursModalTitle =
    currentYear ? `${currentYear} Tours` : "Tours"

  if (loading) {
    return (
      <WlHomeV2PageLoading message={`Loading ${yearLabel} data…`} />
    )
  }

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
              onClick={() => setOpenToolPanel("tours")}
            >
              <LineSegments className="size-3.5" aria-hidden />
              Tours
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="wl-home-v2-years-mobile-action gap-1.5"
              onClick={() => setOpenToolPanel("groups")}
            >
              <FunnelSimple className="size-3.5" aria-hidden />
              Filter by Group
            </Button>
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
            <div className="wl-home-v2-years-tile-inner">
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
                wlHomeV2
              />
            </div>
          </section>

          {!useCompactTools ?
            <aside className="wl-home-v2-years-aside" aria-label="Year tools">
              <section
                className="wl-home-v2-years-tile"
                style={
                  {
                    "--tile-bg": "url('/newbg.png')",
                  } as CSSProperties
                }
              >
                <div className="wl-home-v2-years-tile-inner">
                  <ToursCard
                    tours={tours}
                    currentYear={currentYear}
                    loading={loading}
                    wlHomeV2
                  />
                </div>
              </section>
              <section
                className="wl-home-v2-years-tile"
                style={
                  {
                    "--tile-bg": "url('/newbg2.jpeg')",
                  } as CSSProperties
                }
              >
                <div className="wl-home-v2-years-tile-inner">
                  <GroupFiltersCard
                    groups={groups}
                    selectedGroups={selectedGroups}
                    onToggleGroup={toggleGroupSelection}
                    onClearFilters={clearGroupFilters}
                    loading={loading}
                    wlHomeV2
                  />
                </div>
              </section>
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
                    title="Average Setlist"
                    averageSetlistResult={averageSetlistResult}
                    wlHomeV2
                  />
                </div>
              </section>
            </aside>
          : null}
        </div>
      </div>

      <WlHomeV2YearsToolModal
        open={openToolPanel === "tours"}
        onClose={() => setOpenToolPanel(null)}
        title={toursModalTitle}
      >
        <ToursCard
          tours={tours}
          currentYear={currentYear}
          loading={loading}
          wlHomeV2
          embedInModal
        />
      </WlHomeV2YearsToolModal>
      <WlHomeV2YearsToolModal
        open={openToolPanel === "groups"}
        onClose={() => setOpenToolPanel(null)}
        title="Filter by Group"
        description="Select one or more groups to filter the shows table."
        headerActions={
          selectedGroups.length > 0 ?
            <button
              type="button"
              onClick={clearGroupFilters}
              className="rounded-md border border-[rgb(58,61,59)] bg-white/5 !px-2 !py-0.5 text-[11px] font-medium text-white/85 transition-colors hover:border-[rgb(52,109,95)] hover:bg-[rgba(88,200,174,0.15)]"
            >
              Clear
            </button>
          : null
        }
      >
        <GroupFiltersCard
          groups={groups}
          selectedGroups={selectedGroups}
          onToggleGroup={toggleGroupSelection}
          onClearFilters={clearGroupFilters}
          loading={loading}
          wlHomeV2
          embedInModal
        />
      </WlHomeV2YearsToolModal>
    </div>
  )
}

export function YearsArchiveRoutes({ yearId }: { yearId: string }) {
  return (
    <YearsProvider>
      <WlHomeV2YearPageBody yearId={yearId} />
    </YearsProvider>
  )
}
