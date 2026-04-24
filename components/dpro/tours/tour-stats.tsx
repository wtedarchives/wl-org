"use client"

import { TourSongSpread } from "./tour-song-spread"
import { TopSlotsCarousel } from "./top-slots-carousel"
import { LongestSongs } from "./longest-songs"
import { TourSongsCombined } from "./tour-songs-combined"
import { NotPlayedInTour } from "./not-played-in-tour"
import { LiberatedSongs } from "./liberated-songs"
import { GuestAppearances } from "./guest-appearances"
import type { TourShow } from "@/types/tour"
import type { SlotData } from "@/types/tour"
import type { NotPlayedSong } from "@/hooks/use-not-played-in-tour"
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
  wlHomeV2 = false,
}: TourStatsProps) {
  const showIds = shows.map((s) => s.show_id)
  const isMobile = windowWidth < 1280

  if (!hasTourSetlistEntries) return null

  const sep = wlHomeV2 ? "" : "mt-4"

  const inner = (
    <>
      {/* Row 1: Song spread (left), Longest Songs + Top Returning (right) */}
      <div
        className={cn("grid grid-cols-1 xl:grid-cols-2 gap-4 items-start", sep)}
      >
        <TourSongSpread shows={shows} />
        <div className="flex flex-col gap-4">
          <div className="self-start w-full">
            <LongestSongs
            showIds={showIds}
            songIdMap={songIdMap}
            tourId={currentTourId}
            onSongClick={onSongClick}
          />
          </div>
          {currentTourShowFields && (
            <LiberatedSongs
              showIds={showIds}
              songIdMap={songIdMap}
              tourId={currentTourId}
              onSongClick={onSongClick}
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
          />
        </div>
      )}

      {/* Row 3: Most common not played + Guest appearances */}
      {currentTourShowFields && (
        <div className={cn("grid grid-cols-1 xl:grid-cols-2 gap-4 items-start", sep)}>
          <NotPlayedInTour
            tourId={currentTourId}
            tourName={currentTour}
            showIds={showIds}
            songIdMap={songIdMap}
            notPlayedSongs={notPlayedSongs}
          />
          <GuestAppearances
            showIds={showIds}
            tourId={currentTourId}
            onDataLoaded={setHasGuestAppearances}
          />
        </div>
      )}

      {/* Row 4+: Remaining cards */}
      <div className={sep}>
        <TourSongsCombined
          shows={shows}
          songIdMap={songIdMap}
          onSongCountChange={setUniqueSongCount}
          uniqueSongCount={uniqueSongCount}
          tourId={currentTourId}
          onSongClick={onSongClick}
        />
      </div>
    </>
  )

  if (wlHomeV2) {
    return (
      <div className="flex min-w-0 flex-col gap-4">{inner}</div>
    )
  }

  return inner
}
