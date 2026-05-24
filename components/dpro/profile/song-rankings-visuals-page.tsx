"use client"

import Link from "next/link"

import { ProfileStatsTabsShell } from "@/components/dpro/profile/profile-stats-tabs-shell"
import {
  SongRankingsVisualsRankingsGrid,
  type VisualRankingEntry,
} from "@/components/dpro/profile/song-rankings-visuals-rankings-grid"
import {
  SongRankingsVisualsVoteCards,
  type VisualRankingSong,
} from "@/components/dpro/profile/song-rankings-visuals-vote-cards"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  WL_HOME_V2_PROFILE_STATS_TABS_SHELL_CLASS,
  WlHomeV2ProfileArchiveShell,
} from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"
import { cn } from "@/lib/utils"

import "@/components/dpro/profile/profile-stats-tabs-shell.css"
import "@/components/dpro/profile/profile-rankings-tab.css"
import "./song-rankings-visuals-page.css"

const ART = {
  dripfield: "/badge-dripfield.png",
  emg: "/badge-everything.png",
  mooncabin: "/badge-mooncabin.png",
  greatblue: "/badge-greatblue.png",
  shenanigans: "/badge-shenanigans.png",
  orebolo: "/badge-orebolo.png",
  nightlights: "/badge-nightlights.png",
  vasudo: "/badge-vasudo.png",
  chain: "/badge-chain.png",
  autumn: "/badge-autumn.png",
  undecided: "/badge-undecided.png",
} as const

const PLACEHOLDER_SONG_A: VisualRankingSong = {
  song_id: "00000000-0000-4000-8000-000000000001",
  song: "Dripless",
  categoryArtwork: ART.dripfield,
}

const PLACEHOLDER_SONG_B: VisualRankingSong = {
  song_id: "00000000-0000-4000-8000-000000000002",
  song: "Arcadia",
  categoryArtwork: ART.emg,
}

const PLACEHOLDER_RANKS: VisualRankingEntry[] = [
  { rank: 1, ...PLACEHOLDER_SONG_A },
  {
    rank: 2,
    song_id: "00000000-0000-4000-8000-000000000003",
    song: "Thatch",
    categoryArtwork: ART.mooncabin,
  },
  {
    rank: 3,
    song_id: "00000000-0000-4000-8000-000000000004",
    song: "Hungersite",
    categoryArtwork: ART.greatblue,
  },
  {
    rank: 4,
    song_id: "00000000-0000-4000-8000-000000000005",
    song: "Flodown",
    categoryArtwork: ART.shenanigans,
  },
  {
    rank: 5,
    song_id: "00000000-0000-4000-8000-000000000006",
    song: "So Ready",
    categoryArtwork: ART.orebolo,
  },
  {
    rank: 6,
    song_id: "00000000-0000-4000-8000-000000000007",
    song: "Into the Myst",
    categoryArtwork: ART.nightlights,
  },
  {
    rank: 7,
    song_id: "00000000-0000-4000-8000-000000000008",
    song: "Rockdale",
    categoryArtwork: ART.vasudo,
  },
  {
    rank: 8,
    song_id: "00000000-0000-4000-8000-000000000009",
    song: "Hot Tea",
    categoryArtwork: ART.chain,
  },
  {
    rank: 9,
    song_id: "00000000-0000-4000-8000-000000000010",
    song: "Turned Clouds",
    categoryArtwork: ART.autumn,
  },
  {
    rank: 10,
    song_id: "00000000-0000-4000-8000-000000000011",
    song: "Your Direction",
    categoryArtwork: ART.undecided,
  },
  { rank: 11, ...PLACEHOLDER_SONG_B },
  {
    rank: 12,
    song_id: "00000000-0000-4000-8000-000000000012",
    song: "Madhuvan",
    categoryArtwork: ART.mooncabin,
  },
]

const PLACEHOLDER_UNRANKED: VisualRankingSong[] = [
  {
    song_id: "00000000-0000-4000-8000-000000000020",
    song: "Echo of a Rose",
    categoryArtwork: ART.emg,
  },
  {
    song_id: "00000000-0000-4000-8000-000000000021",
    song: "Bullet",
    categoryArtwork: ART.dripfield,
  },
]

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

function VisualSection({
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

function InteractiveLoadingPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--loading">
        <WlHomeV2PageLoading message="Loading rankings…" />
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

function InteractiveErrorPreview() {
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

function NotStartedPreview() {
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

function InteractiveCompletePreview({
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
          <SongRankingsVisualsRankingsGrid ranks={PLACEHOLDER_RANKS} />
        </section>
        {withUnranked ?
          <UnrankedSongsSection songs={PLACEHOLDER_UNRANKED} />
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

function ReadonlyEmptyPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--message">
        <p className="rankings-visuals-message">Hasn&apos;t ranked songs yet.</p>
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

function ReadonlyErrorPreview() {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--message">
        <p className="rankings-visuals-message">Failed to load rankings</p>
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

function VotingPreview({ voting }: { voting: boolean }) {
  return (
    <RankingsVisualsUi>
      <RankingsVisualsPanel className="rankings-visuals-panel--vote">
        <SongRankingsVisualsVoteCards
          song1={PLACEHOLDER_SONG_A}
          song2={PLACEHOLDER_SONG_B}
          voting={voting}
          onPick={() => {}}
        />
      </RankingsVisualsPanel>
    </RankingsVisualsUi>
  )
}

function LiveChromeReference() {
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

export function SongRankingsVisualsPage() {
  return (
    <WlHomeV2>
      <WlHomeV2ProfileArchiveShell>
        <div className="rankings-visuals-page">
          <header className="rankings-visuals-page__intro">
            <h1 className="rankings-visuals-page__title">Rankings tab visuals</h1>
            <p className="rankings-visuals-page__lede">
              Ungated review page for every Rankings UI state. Container styling
              matches overview / profile widget panels. Placeholder data only.
            </p>
          </header>

          <div className="rankings-visuals-page__grid">
            <VisualSection
              title="Reference — complete in profile shell"
              description="Same chrome as the live Rankings tab (My Stats header + tabs)."
            >
              <LiveChromeReference />
            </VisualSection>

            <VisualSection
              title="Own profile — loading"
              description="Initial start_session fetch."
            >
              <InteractiveLoadingPreview />
            </VisualSection>

            <VisualSection
              title="Own profile — not started"
              description="No session yet; user must tap Start."
            >
              <NotStartedPreview />
            </VisualSection>

            <VisualSection
              title="Own profile — error"
              description="Edge function or network failure with retry."
            >
              <InteractiveErrorPreview />
            </VisualSection>

            <VisualSection
              title="Own profile — voting (idle)"
              description="In-progress session; category artwork on each card."
            >
              <VotingPreview voting={false} />
            </VisualSection>

            <VisualSection
              title="Own profile — voting (submitting)"
              description="Between submit_vote and the next matchup; progress dots pulse."
            >
              <VotingPreview voting />
            </VisualSection>

            <VisualSection
              title="Own profile — complete"
              description="Session finished; responsive grid and Start Over."
            >
              <InteractiveCompletePreview />
            </VisualSection>

            <VisualSection
              title="Own profile — complete with new songs"
              description="Catalog grew since last ranking; rank new songs or start over."
            >
              <InteractiveCompletePreview withUnranked />
            </VisualSection>

            <VisualSection
              title="Own profile — restarting"
              description="Start Over clicked; button disabled while restart_session runs."
            >
              <InteractiveCompletePreview restarting />
            </VisualSection>

            <VisualSection
              title="Public profile — loading"
              description="Read-only fetch for another user&apos;s completed ranking."
            >
              <InteractiveLoadingPreview />
            </VisualSection>

            <VisualSection
              title="Public profile — error"
              description="Read-only Supabase query failed."
            >
              <ReadonlyErrorPreview />
            </VisualSection>

            <VisualSection
              title="Public profile — no ranking yet"
              description="User has no complete session."
            >
              <ReadonlyEmptyPreview />
            </VisualSection>

            <VisualSection
              title="Public profile — completed chart"
              description="Read-only ranked grid (no Start Over)."
            >
              <RankingsVisualsUi>
                <div className="song-rankings-readonly">
                  <SongRankingsVisualsRankingsGrid ranks={PLACEHOLDER_RANKS} />
                </div>
              </RankingsVisualsUi>
            </VisualSection>
          </div>

          <p className="rankings-visuals-page__footer-note">
            Tweak styles in{" "}
            <Link href="/rankings-visuals" className="rankings-visuals-page__footer-link">
              song-rankings-visuals-page.css
            </Link>{" "}
            before porting to live components.
          </p>
        </div>
      </WlHomeV2ProfileArchiveShell>
    </WlHomeV2>
  )
}
