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
    totalSlots,
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

  const slots =
    totalSlots > 0 ? totalSlots
    : isComplete ? confirmedRanks.length
    : 0

  return (
    <div className="song-rankings-interactive">
      {!isComplete ?
        <SongRankingsVoteCards
          song1={song1}
          song2={song2}
          voting={voting}
          onPick={(winnerId, loserId) => void submitVote(winnerId, loserId)}
        />
      : null}

      {isComplete ?
        <div className="song-rankings-complete">
          <p className="song-rankings-complete__message">
            Congratulations — your Goose song ranking is complete!
          </p>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "song-rankings-complete__restart",
            )}
            disabled={restarting}
            onClick={() => void restartRanking()}
          >
            {restarting ? "Starting…" : "Rank again"}
          </button>
        </div>
      : null}

      {slots > 0 ?
        <section className="song-rankings-chart-section" aria-label="Ranking progress">
          {!isComplete ?
            <h2 className="song-rankings-chart-section__title">Your ranking so far</h2>
          : null}
          <SongRankingsChart
            totalSlots={slots}
            confirmedRanks={confirmedRanks}
            showEmptySlots={!isComplete}
          />
        </section>
      : null}
    </div>
  )
}

function SongRankingsReadonly({ userId }: { userId: string }) {
  const { loading, ranks, hasResults, error, totalSlots } =
    useSongRankingsReadonly(userId)

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
      <SongRankingsChart
        totalSlots={totalSlots}
        confirmedRanks={ranks}
        showEmptySlots={false}
      />
    </div>
  )
}

export function SongRankings({ userId, isOwnProfile }: SongRankingsProps) {
  if (isOwnProfile) {
    return <SongRankingsInteractive />
  }

  return <SongRankingsReadonly userId={userId} />
}
