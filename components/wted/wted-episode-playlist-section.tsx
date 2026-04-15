"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SetlistSongSpreadCard } from "@/components/dpro/setlist/setlist-song-spread-card"
import {
  WtedEpisodePerformanceSpreadCard,
} from "@/components/wted/wted-episode-performance-spread-card"
import { WtedEpisodeGroupSpreadCard } from "@/components/wted/wted-episode-group-spread-card"
import { WtedEpisodeSetlistTable } from "@/components/wted/wted-episode-setlist-table"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"

export type WtedEpisodePlaylistSectionProps = {
  rows: WtedEpisodeTableRow[]
  playlistSetlist: SetlistEntry[]
  hoveredCategory: string | null
  hoveredPerformanceYear: string | null
  hoveredShowGroupKey: string | null
  onCategoryHover: (category: string | null) => void
  onYearHover: (year: string | null) => void
  onGroupHover: (key: string | null) => void
  onWtedClick: (entry: SetlistEntry) => void
  onJotyClick: (entry: SetlistEntry) => void
}

export function WtedEpisodePlaylistSection({
  rows,
  playlistSetlist,
  hoveredCategory,
  hoveredPerformanceYear,
  hoveredShowGroupKey,
  onCategoryHover,
  onYearHover,
  onGroupHover,
  onWtedClick,
  onJotyClick,
}: WtedEpisodePlaylistSectionProps) {
  return (
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
                  onWtedClick={onWtedClick}
                  onJotyClick={onJotyClick}
                />
              </CardContent>
            </Card>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[280px]">
            <SetlistSongSpreadCard
              setlist={playlistSetlist}
              hoveredCategory={hoveredCategory}
              onCategoryHover={onCategoryHover}
              includeAllEpisodeEntries
            />
            <WtedEpisodePerformanceSpreadCard
              rows={rows}
              hoveredYear={hoveredPerformanceYear}
              onYearHover={onYearHover}
            />
            <WtedEpisodeGroupSpreadCard
              rows={rows}
              hoveredGroupKey={hoveredShowGroupKey}
              onGroupHover={onGroupHover}
            />
          </div>
        </div>
      </section>
    </>
  )
}
