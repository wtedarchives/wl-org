"use client"

import { WlHomeV2StatsArchiveTile } from "@/components/archive-stats/wl-home-v2-stats-archive-tile"
import { StatCard } from "@/components/dpro/stats/stat-card"
import { LongestSongsCard } from "@/components/dpro/stats/longest-songs-card"
import { LiberatedSongsCard } from "@/components/dpro/stats/liberated-songs-card"
import {
  ShowStatCard,
  RarityValue,
  GapValue,
} from "@/components/dpro/stats/show-stat-card"
import { TourSongSpread } from "@/components/dpro/tours/tour-song-spread"
import { WL_HOME_V2_STATS_TILE_ACCENT_CLASSES } from "@/components/archive-stats/wl-home-v2-stats-archive.constants"
import type {
  TopSong,
  ShowOpener,
  SetOpener,
  SetCloser,
  Encore,
  NotPlayedSong,
  LongestSong,
  LiberatedSong,
  ShowStat,
} from "@/lib/types/stats"
import type { TourSongSpreadShowInput } from "@/lib/stats/tour-song-spread-compute"

type StatsYear = "all-time" | number

export function WlHomeV2StatsArchiveSongGrids({
  selectedYear,
  showEmptyState,
  topSongs,
  showOpeners,
  setOpeners,
  setClosers,
  encores,
  notPlayedSongs,
  longestSongs,
  liberatedSongs,
  songSpreadShows,
}: {
  selectedYear: StatsYear
  showEmptyState: boolean
  topSongs: TopSong[]
  showOpeners: ShowOpener[]
  setOpeners: SetOpener[]
  setClosers: SetCloser[]
  encores: Encore[]
  notPlayedSongs: NotPlayedSong[]
  longestSongs: LongestSong[]
  liberatedSongs: LiberatedSong[]
  songSpreadShows: TourSongSpreadShowInput[]
}) {
  const accent = WL_HOME_V2_STATS_TILE_ACCENT_CLASSES

  return (
    <section className="flex min-h-0 flex-col">
      <h2 className="sc-label wl-home-v2-songs-archive-section-heading">
        Songs
      </h2>
      <div className="grid grid--stats-4">
        <WlHomeV2StatsArchiveTile panelTitle="Top Songs Played" bgIndex={0}>
          <StatCard
            title="Top Songs Played"
            headerClassName="bg-[#3C1E40] text-white py-2"
            items={topSongs}
            getDisplayName={(item) => item.song ?? ""}
            getSong={(item) => item.song ?? ""}
            getSongDisplayName={(item) => item.song_displayname ?? null}
            getCount={(item) => item.play_count ?? 0}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Top Show Openers"
          bgIndex={1}
          headerAccentClass={accent.topShowOpeners}
        >
          <StatCard
            title="Top Show Openers"
            headerClassName="bg-[#047857] text-white py-2"
            items={showOpeners}
            getDisplayName={(item) => item.song_name ?? ""}
            getSong={(item) => item.song_name ?? ""}
            getSongDisplayName={(item) => item.song_displayname ?? null}
            getCount={(item) => item.times_played ?? 0}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Top Set Openers"
          bgIndex={2}
          headerAccentClass={accent.topSetOpeners}
        >
          <StatCard
            title="Top Set Openers"
            headerClassName="bg-[#10b981] text-white py-2"
            items={setOpeners}
            getDisplayName={(item) => item.song_name ?? ""}
            getSong={(item) => item.song_name ?? ""}
            getSongDisplayName={(item) => item.song_displayname ?? null}
            getCount={(item) => item.times_played ?? 0}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Top Set Closers"
          bgIndex={3}
          headerAccentClass={accent.topSetClosers}
        >
          <StatCard
            title="Top Set Closers"
            headerClassName="bg-[#3b82f6] text-white py-2"
            items={setClosers}
            getDisplayName={(item) => item.song_name ?? ""}
            getSong={(item) => item.song_name ?? ""}
            getSongDisplayName={(item) => item.song_displayname ?? null}
            getCount={(item) => item.times_played ?? 0}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Top Encores"
          bgIndex={4}
          headerAccentClass={accent.topEncores}
        >
          <StatCard
            title="Top Encores"
            headerClassName="bg-[#be123c] text-white py-2"
            items={encores}
            getDisplayName={(item) => item.song_name ?? ""}
            getSong={(item) => item.song_name ?? ""}
            getSongDisplayName={(item) => item.song_displayname ?? null}
            getCount={(item) => item.times_played ?? 0}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        {selectedYear === "all-time" ?
          <WlHomeV2StatsArchiveTile panelTitle="Longest Songs" bgIndex={5}>
            <LongestSongsCard
              items={longestSongs}
              showEmptyState={false}
              wlHomeV2
            />
          </WlHomeV2StatsArchiveTile>
        : <WlHomeV2StatsArchiveTile panelTitle="Most Common Not Played" bgIndex={5}>
            <StatCard
              title="Most Common Not Played"
              headerClassName="bg-white text-black py-2"
              items={notPlayedSongs}
              getDisplayName={(item) => item.song ?? ""}
              getSong={(item) => item.song ?? ""}
              getSongDisplayName={(item) => item.song_displayname ?? null}
              getCount={(item) => item.play_count ?? 0}
              showEmptyState={showEmptyState}
              wlHomeV2
            />
          </WlHomeV2StatsArchiveTile>
        }

        {selectedYear !== "all-time" && (
          <WlHomeV2StatsArchiveTile panelTitle="Longest Songs" bgIndex={6}>
            <LongestSongsCard
              items={longestSongs}
              showEmptyState={showEmptyState}
              wlHomeV2
            />
          </WlHomeV2StatsArchiveTile>
        )}
        <WlHomeV2StatsArchiveTile
          panelTitle="Top Returning Songs"
          bgIndex={selectedYear === "all-time" ? 6 : 7}
        >
          <LiberatedSongsCard
            items={liberatedSongs}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          embed="tour-song-spread"
          bgIndex={selectedYear === "all-time" ? 7 : 8}
        >
          <TourSongSpread
            shows={songSpreadShows}
            variant="wl-home-v2-setlist"
          />
        </WlHomeV2StatsArchiveTile>
      </div>
    </section>
  )
}

export function WlHomeV2StatsArchiveShowGrids({
  selectedYear,
  showEmptyState,
  longestShows,
  lowestRarityShows,
  highestGapShows,
  highestAttendedShows,
  highestRatedShows,
}: {
  selectedYear: StatsYear
  showEmptyState: boolean
  longestShows: ShowStat[]
  lowestRarityShows: ShowStat[]
  highestGapShows: ShowStat[]
  highestAttendedShows: ShowStat[]
  highestRatedShows: ShowStat[]
}) {
  return (
    <section className="flex min-h-0 flex-col wl-home-v2-stats-archive-shows-section">
      <h2 className="sc-label wl-home-v2-songs-archive-section-heading">
        Shows
      </h2>
      <div className="grid grid--stats-4">
        <WlHomeV2StatsArchiveTile
          panelTitle="Longest Shows"
          bgIndex={selectedYear === "all-time" ? 8 : 9}
        >
          <ShowStatCard
            title="Longest Shows"
            headerClassName="bg-muted py-2"
            items={longestShows}
            showLengthRank
            showEmptyState={showEmptyState}
            wlHomeV2
            wlHomeV2FixedShowStatRowHeight
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Shows with Rarest Setlist"
          bgIndex={selectedYear === "all-time" ? 9 : 10}
        >
          <ShowStatCard
            title="Shows with Rarest Setlist"
            headerClassName="bg-muted py-2"
            items={lowestRarityShows}
            valueFormatter={(value) => <RarityValue value={value} />}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Shows with Longest Average Show Gap"
          bgIndex={selectedYear === "all-time" ? 10 : 11}
        >
          <ShowStatCard
            title="Shows with Longest Average Show Gap"
            headerClassName="bg-muted py-2"
            items={highestGapShows}
            valueFormatter={(value) => <GapValue value={value} />}
            showEmptyState={showEmptyState}
            wlHomeV2
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Most Attended Shows"
          bgIndex={selectedYear === "all-time" ? 11 : 12}
        >
          <ShowStatCard
            title="Most Attended Shows"
            headerClassName="bg-muted py-2"
            items={highestAttendedShows}
            showEmptyState={showEmptyState}
            wlHomeV2
            wlHomeV2FixedShowStatRowHeight
          />
        </WlHomeV2StatsArchiveTile>
        <WlHomeV2StatsArchiveTile
          panelTitle="Highest Rated Shows"
          bgIndex={selectedYear === "all-time" ? 12 : 13}
          panelHeadRight={
            <span className="text-[10px] font-normal text-white/55 normal-case tracking-normal">
              (min. 5 reviews)
            </span>
          }
        >
          <ShowStatCard
            title="Highest Rated Shows"
            headerClassName="bg-muted py-2"
            items={highestRatedShows}
            showEmptyState={showEmptyState}
            wlHomeV2
            wlHomeV2FixedShowStatRowHeight
          />
        </WlHomeV2StatsArchiveTile>
      </div>
    </section>
  )
}
