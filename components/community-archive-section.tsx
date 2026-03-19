"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useShowsData } from "@/hooks/use-shows-data"
import { ColumnBanner } from "./column-banner"
import { FeaturedTopicsCard } from "@/components/featured-topics-card"
import { FlodownEventsCard } from "@/components/flodown-events-card"
import { MostRecentShowCard } from "@/components/home-stats-column/most-recent-show-card"
import { ShowsTableCard } from "@/components/home-stats-column/shows-table-card"

function SetlistSectionContent() {
  const {
    recentShows,
    upcomingShows,
    historicalShows,
    loading,
    loadingUpcoming,
    loadingHistorical,
  } = useShowsData()

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-wl-dark-grey/50 bg-[#313a34] px-3 py-4 text-[11px] text-wl-white/70">
        Trouble communicating with the database server. Please reload the page.
      </div>
    )
  }

  const last5 = (
    <ShowsTableCard
      title="Last 5 Shows"
      shows={recentShows}
      loading={loading}
    />
  )
  const mostRecent = <MostRecentShowCard />
  const next5 = (
    <ShowsTableCard
      title="Next 5 Shows"
      shows={upcomingShows}
      loading={loadingUpcoming}
    />
  )
  const thisDay = (
    <ShowsTableCard
      title="This Day in Goose History"
      shows={historicalShows}
      loading={loadingHistorical}
      emptyMessage="No shows occurred on this date in Goose history."
    />
  )

  return (
    <>
      {/* Mobile: order 1 */}
      <div className="flex min-h-0 flex-col lg:col-start-2 lg:row-start-1">
        {last5}
      </div>
      {/* Mobile: order 2 */}
      <div className="flex min-h-0 flex-col lg:col-start-3 lg:row-span-3 lg:row-start-1">
        {mostRecent}
      </div>
      {/* Mobile: order 3 */}
      <div className="flex min-h-0 flex-col lg:col-start-2 lg:row-start-2">
        {next5}
      </div>
      {/* Mobile: order 4 */}
      <div className="flex min-h-0 flex-col lg:col-start-2 lg:row-start-3">
        {thisDay}
      </div>
    </>
  )
}

export function CommunityArchiveSection() {
  return (
    <div className="flex flex-col gap-6">
      {/* Community: 3 columns – header, Featured Topics, Flodown Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ColumnBanner
          src="/community-banner.jpg"
          alt="Community Forum"
          label="Community Forum"
          description="A community made for Goose fans, by Goose fans."
          href="https://community.wysterialane.org"
          dim
          mutedBg
          logoSrc="/WL.png"
        />
        <div className="flex min-h-0 flex-col">
          <FeaturedTopicsCard />
        </div>
        <div className="flex min-h-0 flex-col">
          <FlodownEventsCard />
        </div>
      </div>

      {/* Setlist: mobile order Last 5 → Most Recent → Next 5 → This Day; desktop 3-col grid */}
      <TooltipProvider>
        <div className="grid grid-cols-1 grid-rows-[auto_auto_auto_auto_auto] gap-6 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto] lg:gap-x-6 lg:gap-y-3">
          <div className="lg:row-span-3">
            <ColumnBanner
              src="/archive-banner.jpg"
              alt="Setlist Archive"
              label="Setlist Archive"
              description="The ultimate show history archive for Goose."
              href="/archive"
              mutedBg
              logoSrc="/wted-sa-cropped-2.png"
            />
          </div>
          <SetlistSectionContent />
        </div>
      </TooltipProvider>
    </div>
  )
}
