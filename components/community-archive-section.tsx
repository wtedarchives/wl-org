"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useShowsData } from "@/hooks/use-shows-data"
import { ColumnBanner } from "./column-banner"
import { FeaturedTopicsCard } from "@/components/featured-topics-card"
import { FlodownEventsCard } from "@/components/flodown-events-card"
import { MostRecentShowCard } from "@/components/home-stats-column/most-recent-show-card"
import { ShowsTableCard } from "@/components/home-stats-column/shows-table-card"

function SetlistStackedContent() {
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

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <ShowsTableCard
        title="Last 5 Shows"
        shows={recentShows}
        loading={loading}
      />
      <ShowsTableCard
        title="Next 5 Shows"
        shows={upcomingShows}
        loading={loadingUpcoming}
      />
      <ShowsTableCard
        title="This Day in Goose History"
        shows={historicalShows}
        loading={loadingHistorical}
        emptyMessage="No shows occurred on this date in Goose history."
      />
    </div>
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

      {/* Setlist: 3 columns – header, stacked shows, Most Recent Show */}
      <TooltipProvider>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ColumnBanner
            src="/archive-banner.jpg"
            alt="Setlist Archive"
            label="Setlist Archive"
            description="The ultimate show history archive for Goose."
            href="/archive"
            mutedBg
            logoSrc="/wted-sa-cropped-2.png"
          />
          <div className="flex min-h-0 flex-col">
            <SetlistStackedContent />
          </div>
          <div className="flex min-h-0 flex-col">
            <MostRecentShowCard />
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
