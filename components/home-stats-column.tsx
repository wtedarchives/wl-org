"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useShowsData } from "@/hooks/use-shows-data"
import { MostRecentShowCard } from "@/components/home-stats-column/most-recent-show-card"
import { ShowsTableCard } from "@/components/home-stats-column/shows-table-card"

export function HomeStatsColumn() {
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
      <Card className="py-0 bg-card/95 text-xs shadow-sm">
        <CardContent className="px-3 py-4 text-[11px] text-muted-foreground">
          Trouble communicating with the database server. Please reload the
          page.
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <ShowsTableCard
          title="Last 5 Shows"
          shows={recentShows}
          loading={loading}
        />
        <MostRecentShowCard />
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
    </TooltipProvider>
  )
}
