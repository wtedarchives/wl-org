"use client"

import { TourSongSpread } from "./tour-song-spread"
import { TopSlotsCarousel } from "./top-slots-carousel"
import { LongestSongs } from "./longest-songs"
import { TourSongsCombined } from "./tour-songs-combined"
import { NotPlayedInTour } from "./not-played-in-tour"
import { LiberatedSongs } from "./liberated-songs"
import { GuestAppearances } from "./guest-appearances"
import { AverageSetlistCard } from "@/components/dpro/years/average-setlist-card"
import type { AverageSetlistResult } from "@/hooks/use-average-setlist"
import type { TourShow } from "@/types/tour"
import type { SlotData } from "@/types/tour"
import type { NotPlayedSong } from "@/hooks/use-not-played-in-tour"
import { DESKTOP_CONTENT_MIN_WIDTH } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface TourStatsProps {
  shows: TourShow[]
  topSlots: SlotData[]
  windowWidth: number
  currentTourId: string
  currentTour: string
  currentTourShowFields: boolean | undefined
  hasGuestAppearances: boolean
  setHasGuestAppearances: (has: boolean) => void
  songIdMap: Record<string, string>
  uniqueSongCount: number
  setUniqueSongCount: (count: number) => void
  hasTourSetlistEntries: boolean
  onSongClick: (songName: string, songDisplayName?: string | null) => void
  notPlayedSongs?: NotPlayedSong[]
  averageSetlistResult?: AverageSetlistResult
  wlHomeV2?: boolean
}

export function TourStats({
  shows,
  topSlots,
  windowWidth,
  currentTourId,
  currentTour,
  currentTourShowFields,
  hasGuestAppearances,
  setHasGuestAppearances,
  songIdMap,
  uniqueSongCount,
  setUniqueSongCount,
  hasTourSetlistEntries,
  onSongClick,
  notPlayedSongs,
  averageSetlistResult,
  wlHomeV2 = false,
}: TourStatsProps) {
  const showIds = shows.map((s) => s.show_id)
  const isMobile = windowWidth < DESKTOP_CONTENT_MIN_WIDTH

  if (!hasTourSetlistEntries) return null

  const sep = wlHomeV2 ? "" : "mt-4"

  const songsPlayedCombined = (
    <TourSongsCombined
      shows={shows}
      songIdMap={songIdMap}
      onSongCountChange={setUniqueSongCount}
      uniqueSongCount={uniqueSongCount}
      tourId={currentTourId}
      onSongClick={onSongClick}
      wlHomeV2={wlHomeV2}
    />
  )

  const notPlayedBlock = (
    <NotPlayedInTour
      tourId={currentTourId}
      tourName={currentTour}
      showIds={showIds}
      songIdMap={songIdMap}
      notPlayedSongs={notPlayedSongs}
      wlHomeV2={wlHomeV2}
    />
  )

  const guestAppearancesBlock = (
    <GuestAppearances
      showIds={showIds}
      tourId={currentTourId}
      onDataLoaded={setHasGuestAppearances}
      wlHomeV2={wlHomeV2}
    />
  )

  const showAverageSetlist =
    currentTourShowFields === true && shows.length > 0

  const averageSetlistBlock =
    showAverageSetlist ?
      <AverageSetlistCard
        shows={shows}
        title="Average Setlist"
        type="tour"
        averageSetlistResult={averageSetlistResult}
        wlHomeV2={wlHomeV2}
        className={
          wlHomeV2 ? "wl-home-v2-years-average-setlist-panel" : undefined
        }
      />
    : null

  const inner = (
    <>
      {/* Row 1: Song spread (left), Longest Songs + Top Returning (right) */}
      <div
        className={cn(
          "items-start gap-4",
          wlHomeV2 ?
            "flex min-w-0 flex-col xl:flex-row"
          : "grid grid-cols-1 xl:grid-cols-2",
          sep,
        )}
      >
        {wlHomeV2 ?
          <div className="wl-home-v2-setlist min-w-0 w-full xl:min-w-0 xl:flex-1">
            <div className="side-card wl-home-v2-setlist-song-spread-side-card wl-home-v2-tour-stats-song-spread overflow-hidden rounded-[10px] border border-[rgb(44,46,45)]">
              <div className="sc-label">Song Spread</div>
              <TourSongSpread shows={shows} variant="wl-home-v2-setlist" />
            </div>
          </div>
        : <TourSongSpread shows={shows} />}
        <div className="flex min-w-0 w-full flex-col gap-4 xl:flex-1">
          <div className="self-start w-full">
            <LongestSongs
            showIds={showIds}
            songIdMap={songIdMap}
            tourId={currentTourId}
            onSongClick={onSongClick}
            wlHomeV2={wlHomeV2}
          />
          </div>
          {currentTourShowFields && (
            <LiberatedSongs
              showIds={showIds}
              songIdMap={songIdMap}
              tourId={currentTourId}
              onSongClick={onSongClick}
              wlHomeV2={wlHomeV2}
            />
          )}
        </div>
      </div>

      {/* Row 2: Tour slots carousel – all four on one line */}
      {topSlots.length > 0 && (
        <div className={sep}>
          <TopSlotsCarousel
            slots={topSlots}
            isMobile={isMobile}
            songIdMap={songIdMap}
            onSongClick={onSongClick}
            tourId={currentTourId}
            wlHomeV2={wlHomeV2}
          />
        </div>
      )}

      {/* Non-WL: Average setlist, then most common not played + Guest appearances. */}
      {!wlHomeV2 && currentTourShowFields && (
        <div className={cn("flex flex-col gap-4", sep)}>
          {averageSetlistBlock}
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
            {notPlayedBlock}
            {guestAppearancesBlock}
          </div>
        </div>
      )}

      {/* Songs Played: WL uses 75%–25% split (3:1 tracks); sidebar stacks not played + guests */}
      {!wlHomeV2 ?
        <div className={sep}>{songsPlayedCombined}</div>
      : <div className={sep}>
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-4">
            <div
              className={cn(
                "min-w-0 w-full",
                currentTourShowFields ?
                  "xl:flex-[3] xl:basis-0 xl:min-w-0"
                : "xl:w-full",
              )}
            >
              {songsPlayedCombined}
            </div>
            {currentTourShowFields ?
              <aside className="flex min-w-0 w-full shrink-0 flex-col gap-4 xl:flex-[1] xl:basis-0 xl:min-w-0">
                {averageSetlistBlock}
                {notPlayedBlock}
                {guestAppearancesBlock}
              </aside>
            : null}
          </div>
        </div>
      }
    </>
  )

  if (wlHomeV2) {
    return (
      <div className="flex min-w-0 flex-col gap-4">{inner}</div>
    )
  }

  return inner
}
