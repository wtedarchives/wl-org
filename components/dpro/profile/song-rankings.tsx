"use client"

import { useAuth } from "@/components/auth-context"
import { SongRankingsChart } from "@/components/dpro/profile/song-rankings-chart"
import { SongRankingsVoteCards } from "@/components/dpro/profile/song-rankings-vote-cards"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useSongRankingsInteractive } from "@/hooks/use-song-rankings-interactive"
import { useSongRankingsReadonly } from "@/hooks/use-song-rankings-readonly"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import "./profile-rankings-tab.css"

export interface SongRankingsProps {
  userId: string
  isOwnProfile: boolean
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
    submitVote,
    retry,
    restartRanking,
    restarting,
  } = useSongRankingsInteractive(session?.token)

  if (loading) {
    return (
      <div className="wl-home-v2-profile-rankings-tab__loading">
        <WlHomeV2PageLoading message="Loading rankings…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="song-rankings-message song-rankings-message--error">
        <p>{error}</p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => void retry()}
        >
          Try again
        </button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="song-rankings-interactive song-rankings-interactive--complete">
        <section className="song-rankings-complete-section" aria-label="Your rankings">
          <SongRankingsChart ranks={confirmedRanks} />
        </section>
        <div className="song-rankings-complete-actions">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "song-rankings-complete-actions__button",
            )}
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
    <div className="song-rankings-interactive">
      <SongRankingsVoteCards
        song1={song1}
        song2={song2}
        voting={voting}
        onPick={(winnerId, loserId) => void submitVote(winnerId, loserId)}
      />
    </div>
  )
}

function SongRankingsReadonly({ userId }: { userId: string }) {
  const { loading, ranks, hasResults, error } = useSongRankingsReadonly(userId)

  if (loading) {
    return (
      <div className="wl-home-v2-profile-rankings-tab__loading">
        <WlHomeV2PageLoading message="Loading rankings…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="song-rankings-message song-rankings-message--error">
        <p>{error}</p>
      </div>
    )
  }

  if (!hasResults) {
    return (
      <div className="song-rankings-message">
        <p>Hasn&apos;t ranked their songs yet.</p>
      </div>
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
