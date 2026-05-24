"use client"

import { useAuth } from "@/components/auth-context"
import { SongRankingsChart } from "@/components/dpro/profile/song-rankings-chart"
import { SongRankingsUnrankedSection } from "@/components/dpro/profile/song-rankings-unranked-section"
import { SongRankingsVoteCards } from "@/components/dpro/profile/song-rankings-vote-cards"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useSongRankingsInteractive } from "@/hooks/use-song-rankings-interactive"
import { useSongRankingsReadonly } from "@/hooks/use-song-rankings-readonly"
import { cn } from "@/lib/utils"

import "./profile-rankings-tab.css"

export interface SongRankingsProps {
  userId: string
  isOwnProfile: boolean
}

function RankingsPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("widget-panel song-rankings-panel", className)}>
      {children}
    </div>
  )
}

function SongRankingsInteractive() {
  const { session } = useAuth()
  const {
    loading,
    voting,
    error,
    song1,
    song2,
    confirmedRanks,
    isComplete,
    notStarted,
    unrankedSongs,
    submitVote,
    retry,
    restartRanking,
    beginRanking,
    rankNewSongs,
    restarting,
    rankingNew,
    starting,
  } = useSongRankingsInteractive(session?.token)

  if (loading) {
    return (
      <RankingsPanel className="song-rankings-panel--loading">
        <WlHomeV2PageLoading message="Loading rankings…" />
      </RankingsPanel>
    )
  }

  if (error) {
    return (
      <RankingsPanel className="song-rankings-panel--message song-rankings-message song-rankings-message--error">
        <p>{error}</p>
        <button
          type="button"
          className="song-rankings-pill-button"
          onClick={() => void retry()}
        >
          Try again
        </button>
      </RankingsPanel>
    )
  }

  if (notStarted) {
    return (
      <RankingsPanel className="song-rankings-panel--message song-rankings-message">
        <p>Click the button below to rank released Goose songs.</p>
        <button
          type="button"
          className="song-rankings-pill-button"
          disabled={starting}
          onClick={() => void beginRanking()}
        >
          {starting ? "Starting…" : "Start"}
        </button>
      </RankingsPanel>
    )
  }

  if (isComplete) {
    return (
      <div className="song-rankings-interactive song-rankings-interactive--complete">
        {error ?
          <div className="song-rankings-message song-rankings-message--error">
            <p>{error}</p>
          </div>
        : null}
        <section className="song-rankings-complete-section" aria-label="Your rankings">
          <SongRankingsChart ranks={confirmedRanks} />
        </section>
        <SongRankingsUnrankedSection
          songs={unrankedSongs}
          rankingNew={rankingNew}
          onRankNewSongs={() => void rankNewSongs()}
        />
        <div className="song-rankings-complete-actions">
          <button
            type="button"
            className="song-rankings-pill-button"
            disabled={restarting}
            onClick={() => void restartRanking()}
          >
            {restarting ? "Starting…" : "Start Over"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <RankingsPanel className="song-rankings-panel--vote">
      <SongRankingsVoteCards
        song1={song1}
        song2={song2}
        voting={voting}
        onPick={(winnerId, loserId) => void submitVote(winnerId, loserId)}
      />
    </RankingsPanel>
  )
}

function SongRankingsReadonly({ userId }: { userId: string }) {
  const { loading, ranks, hasResults, error } = useSongRankingsReadonly(userId)

  if (loading) {
    return (
      <RankingsPanel className="song-rankings-panel--loading">
        <WlHomeV2PageLoading message="Loading rankings…" />
      </RankingsPanel>
    )
  }

  if (error) {
    return (
      <RankingsPanel className="song-rankings-panel--message song-rankings-message song-rankings-message--error">
        <p>{error}</p>
      </RankingsPanel>
    )
  }

  if (!hasResults) {
    return (
      <RankingsPanel className="song-rankings-panel--message song-rankings-message">
        <p>Hasn&apos;t ranked songs yet.</p>
      </RankingsPanel>
    )
  }

  return (
    <div className="song-rankings-readonly">
      <SongRankingsChart ranks={ranks} />
    </div>
  )
}

export function SongRankings({ userId, isOwnProfile }: SongRankingsProps) {
  if (isOwnProfile) {
    return <SongRankingsInteractive />
  }

  return <SongRankingsReadonly userId={userId} />
}
