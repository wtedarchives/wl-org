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
  onSongClick: (songName: string) => void
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
}: TourStatsProps) {
  const showIds = shows.map((s) => s.show_id)
  const isMobile = windowWidth < 1280

  if (!hasTourSetlistEntries) return null

  return (
    <>
      {/* Row 1: Song spread (left), Longest Songs + Top Returning (right) */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <TourSongSpread shows={shows} />
        <div className="flex flex-col gap-4">
          <LongestSongs
            showIds={showIds}
            songIdMap={songIdMap}
            tourId={currentTourId}
            onSongClick={onSongClick}
          />
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
        <div className="mt-4">
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
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <NotPlayedInTour
            tourId={currentTourId}
            tourName={currentTour}
            showIds={showIds}
            songIdMap={songIdMap}
          />
          <GuestAppearances
            showIds={showIds}
            tourId={currentTourId}
            onDataLoaded={setHasGuestAppearances}
          />
        </div>
      )}

      {/* Row 4+: Remaining cards */}
      <div className="mt-4">
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
}
