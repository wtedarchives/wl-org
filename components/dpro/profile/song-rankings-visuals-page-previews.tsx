"use client"

import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"
import {
  SongRankingsVisualsRankingsGrid,
} from "@/components/dpro/profile/song-rankings-visuals-rankings-grid"
import {
  SongRankingsVisualsVoteCards,
  type VisualRankingSong,
} from "@/components/dpro/profile/song-rankings-visuals-vote-cards"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS } from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"
import { cn } from "@/lib/utils"

import {
  SONG_RANKINGS_VISUALS_PLACEHOLDER_RANKS,
  SONG_RANKINGS_VISUALS_PLACEHOLDER_SONG_A,
  SONG_RANKINGS_VISUALS_PLACEHOLDER_SONG_B,
  SONG_RANKINGS_VISUALS_PLACEHOLDER_UNRANKED,
} from "@/components/dpro/profile/song-rankings-visuals-page.data"

function RankingsVisualsUi({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("rankings-visuals-ui", className)}>{children}</div>
}

function RankingsVisualsPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("widget-panel rankings-visuals-panel", className)}>
      {children}
    </div>
  )
}

export function VisualSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rankings-visuals-section">
      <header className="rankings-visuals-section__header">
        <h2 className="rankings-visuals-section__title">{title}</h2>
        {description ?
          <p className="rankings-visuals-section__description">{description}</p>
        : null}
      </header>
      <div className="rankings-visuals-section__preview">{children}</div>
    </section>
  )
}

export function InteractiveLoadingPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--loading">
        <WlHomeV2PageLoading message="Loading rankings…" />
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

export function InteractiveErrorPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--message">
        <p className="rankings-visuals-message">Failed to start ranking session</p>
        <button type="button" className="rankings-visuals-pill-button">
          Try again
        </button>
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

export function NotStartedPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--message">
        <p className="rankings-visuals-message">
          Click the button below to rank Goose&apos;s original songs.
        </p>
        <button type="button" className="rankings-visuals-pill-button">
          Start
        </button>
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

function UnrankedSongsSection({
  songs,
  rankingNew = false,
}: {
  songs: VisualRankingSong[]
  rankingNew?: boolean
}) {
  return (
    <section className="rankings-visuals-unranked" aria-label="Songs not yet ranked">
      <header className="rankings-visuals-unranked__header">
        <h3 className="rankings-visuals-unranked__title">New songs to rank</h3>
        <p className="rankings-visuals-unranked__description">
          These songs were added to the catalog after your last ranking session.
        </p>
      </header>
      <ul className="rankings-visuals-song-columns rankings-visuals-unranked__list">
        {songs.map((song) => (
          <li
            key={song.song_id}
            className="rankings-visuals-song-columns__item rankings-visuals-unranked__item"
          >
            {song.categoryArtwork ?
              <img
                src={song.categoryArtwork}
                alt=""
                width={36}
                height={36}
                className="rankings-visuals-unranked__art"
              />
            : null}
            <span className="rankings-visuals-unranked__song">{song.song}</span>
          </li>
        ))}
      </ul>
      <div className="rankings-visuals-unranked__actions">
        <button
          type="button"
          className="rankings-visuals-pill-button"
          disabled={rankingNew}
        >
          {rankingNew ? "Starting…" : "Rank new songs"}
        </button>
      </div>
    </section>
  )
}

export function InteractiveCompletePreview({
  restarting = false,
  withUnranked = false,
}: {
  restarting?: boolean
  withUnranked?: boolean
}) {
  return (
    <RankingsVisualsUi>
      <div className="song-rankings-interactive song-rankings-interactive--complete">
        <section className="song-rankings-complete-section" aria-label="Your rankings">
          <SongRankingsVisualsRankingsGrid ranks={SONG_RANKINGS_VISUALS_PLACEHOLDER_RANKS} />
        </section>
        {withUnranked ?
          <UnrankedSongsSection songs={SONG_RANKINGS_VISUALS_PLACEHOLDER_UNRANKED} />
        : null}
        <div className="song-rankings-complete-actions">
          <button
            type="button"
            className="rankings-visuals-pill-button"
            disabled={restarting}
          >
            {restarting ? "Starting…" : "Start Over"}
          </button>
        </div>
      </div>
    </RankingsVisualsUi>
  )
}

export function ReadonlyEmptyPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--message">
        <p className="rankings-visuals-message">Hasn&apos;t ranked songs yet.</p>
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

export function ReadonlyErrorPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--message">
        <p className="rankings-visuals-message">Failed to load rankings</p>
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

export function VotingPreview({ voting }: { voting: boolean }) {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--vote">
        <SongRankingsVisualsVoteCards
          song1={SONG_RANKINGS_VISUALS_PLACEHOLDER_SONG_A}
          song2={SONG_RANKINGS_VISUALS_PLACEHOLDER_SONG_B}
          voting={voting}
          onPick={() => {}}
        />
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

export function LiveChromeReference() {
  return (
    <RankingsVisualsUi className="rankings-visuals-ui--in-profile-shell">
      <ProfileStatsTabsShell
        className={WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS}
        activeTab="rankings"
        title="My Stats"
        tabHref={(slug) => `#${slug}`}
        showShareButton
        onShare={() => {}}
      >
        <div className="wl-home-v2-profile-rankings-tab">
          <div className="wl-home-v2-profile-rankings-tab__section">
            <InteractiveCompletePreview withUnranked />
          </div>
        </div>
      </ProfileStatsTabsShell>
    </RankingsVisualsUi>
  )
}

export function ReadonlyCompletedChartPreview() {
  return (
    <RankingsVisualsUi>
      <div className="song-rankings-readonly">
        <SongRankingsVisualsRankingsGrid ranks={SONG_RANKINGS_VISUALS_PLACEHOLDER_RANKS} />
      </div>
    </RankingsVisualsUi>
  )
}
