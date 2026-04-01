"use client"

import { ArrowLeft, ArrowRight, Calendar1, History, MessageCircle, Music } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useShowsData } from "@/hooks/use-shows-data"
import { ColumnBanner } from "@/components/column-banner"
import { FeaturedTopicsCard } from "@/components/featured-topics-card"
import { FlodownEventsCard } from "@/components/flodown-events-card"
import { MostRecentShowCard } from "@/components/home-stats-column/most-recent-show-card"
import { ShowsTableCard } from "@/components/home-stats-column/shows-table-card"

function CommunityHighlightsAccordion() {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="featured"
      className="overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] text-xs shadow-sm ring-0"
    >
      <AccordionItem value="featured" className="border-0 border-b border-wl-dark-grey/50">
        <AccordionTrigger className="bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
            <span>Featured Topics</span>
            <MessageCircle className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <FeaturedTopicsCard variant="accordion" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="events" className="border-0">
        <AccordionTrigger className="bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
            <span>Upcoming Community Events</span>
            <Calendar1 className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <FlodownEventsCard variant="accordion" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function SetlistArchiveAccordion() {
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
    <Accordion
      type="single"
      collapsible
      defaultValue="most-recent"
      className="overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] text-xs shadow-sm ring-0"
    >
      <AccordionItem value="last-5" className="border-0 border-b border-wl-dark-grey/50">
        <AccordionTrigger className="bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
            <span>Last 5 Shows</span>
            <ArrowLeft className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <ShowsTableCard
            title="Last 5 Shows"
            shows={recentShows}
            loading={loading}
            hideHeader
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="next-5" className="border-0 border-b border-wl-dark-grey/50">
        <AccordionTrigger className="bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
            <span>Next 5 Shows</span>
            <ArrowRight className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <ShowsTableCard
            title="Next 5 Shows"
            shows={upcomingShows}
            loading={loadingUpcoming}
            hideHeader
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="most-recent" className="border-0 border-b border-wl-dark-grey/50">
        <AccordionTrigger className="bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
            <span>Most Recent Show</span>
            <Music className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <MostRecentShowCard hideHeader />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="this-day" className="border-0">
        <AccordionTrigger className="bg-black/30">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
            <span>This Day in Goose History</span>
            <History className="size-4 shrink-0 text-wl-white/80" aria-hidden />
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount>
          <ShowsTableCard
            title="This Day in Goose History"
            shows={historicalShows}
            loading={loadingHistorical}
            emptyMessage="No shows occurred on this date in Goose history."
            hideHeader
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function CommunityArchiveSection() {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-x-4 lg:gap-y-4">
        <div className="min-h-0 lg:col-span-2 lg:row-start-1">
          <ColumnBanner
            src="/community-banner.jpg"
            alt="Wysteria Lane Community"
            label="Wysteria Lane Community"
            description="A community made for Goose fans, by Goose fans."
            href="https://community.wysterialane.org"
            dim
            mutedBg
            logoSrc="/WL.png"
          />
        </div>
        <div className="min-h-0 lg:hidden">
          <CommunityHighlightsAccordion />
        </div>
        <div className="min-h-0 hidden lg:block lg:col-start-1 lg:row-start-2 lg:self-start">
          <FeaturedTopicsCard />
        </div>
        <div className="min-h-0 hidden lg:block lg:col-start-2 lg:row-start-2 lg:self-start">
          <FlodownEventsCard />
        </div>
        <div className="min-h-0 lg:col-start-3 lg:row-start-1 lg:pl-2">
          <ColumnBanner
            src="/archive-banner.jpg"
            alt="WTED Archives"
            label="WTED Archives"
            description="The ultimate show history archive for Goose."
            href="/archive"
            mutedBg
            logoSrc="/wted-sa-cropped-2.png"
          />
        </div>
        <div className="min-h-0 lg:col-start-3 lg:row-start-2 lg:self-start lg:pl-2">
          <SetlistArchiveAccordion />
        </div>
      </div>
    </TooltipProvider>
  )
}
