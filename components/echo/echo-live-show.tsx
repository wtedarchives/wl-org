"use client"

import { useCallback, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { useEchoLiveShow } from "@/hooks/use-echo-live-show"
import { useEchoLiveStandings } from "@/hooks/use-echo-live-standings"
import { useEchoLiveTopPicks } from "@/hooks/use-echo-live-top-picks"
import type { UserPick } from "@/hooks/use-user-picks"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { supabase } from "@/lib/supabase"

import { EchoLiveBars } from "./echo-live-bars"
import {
  buildEchoLivePickScore,
  buildEchoLivePickSets,
  buildEchoLiveSetlistSets,
  ECHO_OVERPICK_PENALTY,
} from "./echo-live-data"
import { EchoLivePicksInterface } from "./echo-live-picks-interface"
import { EchoLiveSetlist } from "./echo-live-setlist"
import { EchoLiveStandingsCard } from "./echo-live-standings-card"
import { EchoLiveSubmissionDialog } from "./echo-live-submission-dialog"

async function fetchPicksBySubmissionId(
  submissionId: string,
): Promise<UserPick[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("setlist_game_picks")
    .select(
      "song, set, setnum, placement, score, result, showcloser_correct, showopener_correct",
    )
    .eq("submission_id", submissionId)
    .order("set", { ascending: true })
    .order("setnum", { ascending: true })
  return data ?? []
}

export function EchoLiveShow({
  showId,
  resolving = false,
}: {
  showId: string | null
  resolving?: boolean
}) {
  const { session } = useAuth()
  const live = useEchoLiveShow(showId)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)
  const topPicks = useEchoLiveTopPicks(showId, statsRefreshKey)
  const standings = useEchoLiveStandings(
    showId,
    Boolean(live.show?.scored),
    session?.profileId,
    !live.complete,
    statsRefreshKey,
  )
  const [viewedPicks, setViewedPicks] = useState<UserPick[]>([])
  const [viewedUsername, setViewedUsername] = useState<string | null>(null)
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)

  const handlePicksSubmitted = useCallback(() => {
    void live.reload()
    setStatsRefreshKey((key) => key + 1)
  }, [live.reload])

  const existingPicks = useMemo(
    () =>
      live.picks.map((pick) => ({
        song: pick.song,
        set: pick.set,
        setnum: pick.setnum,
        placement: pick.placement,
      })),
    [live.picks],
  )

  const officiallyScored = Boolean(live.show?.scored)

  const setlistSets = useMemo(
    () =>
      buildEchoLiveSetlistSets(
        live.entries,
        live.picks,
        live.complete,
        officiallyScored,
      ),
    [live.complete, live.entries, live.picks, officiallyScored],
  )
  const pickSets = useMemo(
    () =>
      buildEchoLivePickSets(
        live.picks,
        live.entries,
        live.complete,
        officiallyScored,
      ),
    [live.complete, live.entries, live.picks, officiallyScored],
  )
  const pickScore = useMemo(
    () =>
      buildEchoLivePickScore(
        live.picks,
        live.entries,
        live.complete,
        officiallyScored,
      ),
    [live.complete, live.entries, live.picks, officiallyScored],
  )
  const extraSongs = pickScore.extraSongs
  const extraPoints = extraSongs * ECHO_OVERPICK_PENALTY
  const totalLabel = `${pickScore.total} points`
  const showPickScore =
    !live.loading && live.signedIn && live.picks.length > 0
  const showPicksInterface = live.picksOpen && !live.complete
  const date = live.show ? formatSetlistDate(live.show.date) : "\u00a0"
  const venue = live.show?.venue?.trim() || ""
  const city = live.show?.city?.trim() || ""
  const playerCount = live.show?.players

  const handleCloseSubmissionModal = () => {
    setSubmissionModalOpen(false)
    setViewedPicks([])
    setViewedUsername(null)
  }

  const handleViewUserSubmission = async (
    userId: string,
    username: string,
  ) => {
    if (!showId || !supabase) return
    if (!session) {
      alert("Please log in to view user submissions")
      return
    }

    try {
      const { data, error } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("user_id", userId)
        .eq("show_id", showId)
        .maybeSingle()

      if (error || !data) return

      const picks = await fetchPicksBySubmissionId(data.submission_id)
      setViewedPicks(picks)
      setViewedUsername(username)
      setSubmissionModalOpen(true)
    } catch (err) {
      console.error("Error viewing Echo user submission:", err)
    }
  }

  if (!showId) {
    return (
      <div
        className="echo-tour-placeholder"
        style={echoTourSurfaceBgStyle("live-pending")}
      >
        <div className="echo-tour-kicker">Live</div>
        <h1 className="echo-live-title">Live show</h1>
        <p className="echo-tour-placeholder-copy">
          {resolving ? "Loading live show…" : "No live show to open."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="echo-live">
        <div className="echo-live-head" style={echoTourSurfaceBgStyle("live-head")}>
          <h1 className="echo-live-title">{date}</h1>
          <div className="echo-live-meta">
            {venue ?
              <span className="echo-live-meta-pill">{venue}</span>
            : null}
            {city ?
              <span className="echo-live-meta-pill">{city}</span>
            : null}
            {playerCount != null ?
              <span className="echo-live-meta-pill">
                {playerCount} {playerCount === 1 ? "player" : "players"}
              </span>
            : null}
            {live.picksOpen ?
              <span className="echo-live-meta-pill is-countdown">
                <span className="echo-live-meta-pill-label">Time left to pick</span>
                <span className="echo-live-meta-pill-countdown">
                  {live.countdown}
                </span>
              </span>
            : null}
          </div>
        </div>

        {showPicksInterface ?
          <EchoLivePicksInterface
            showId={showId}
            showTime={live.show?.showTime ?? ""}
            showScored={Boolean(live.show?.scored)}
            submissionId={live.submissionId}
            existingPicks={existingPicks}
            onSubmitSuccess={handlePicksSubmitted}
          />
        : <div className="echo-live-ledger">
            <div
              className="echo-live-card"
              style={echoTourSurfaceBgStyle("live-setlist")}
            >
              <h2 className="echo-live-card-title">Setlist</h2>
              {live.loading && setlistSets.length === 0 ?
                <p className="echo-live-empty">Loading setlist…</p>
              : setlistSets.length > 0 ?
                <EchoLiveSetlist sets={setlistSets} />
              : <p className="echo-live-empty">
                  Setlist hasn&apos;t been entered yet.
                </p>}
            </div>

            <div
              className="echo-live-card"
              style={echoTourSurfaceBgStyle("live-picks")}
            >
              <div className="echo-live-picks-head">
                <h2 className="echo-live-card-title">Your picks</h2>
                {showPickScore ?
                  <span className="echo-live-total-pill">{totalLabel}</span>
                : null}
              </div>
              {live.loading ?
                <p className="echo-live-empty">Loading picks…</p>
              : !live.signedIn ?
                <p className="echo-live-empty">Sign in to see your picks.</p>
              : pickSets.length > 0 ?
                <>
                  <EchoLiveSetlist sets={pickSets} showScores />
                  {extraSongs > 0 && officiallyScored ?
                    <p className="echo-live-overpick">
                      {extraSongs} extra song{extraSongs === 1 ? "" : "s"}{" "}
                      picked:{" "}
                      <span className="echo-live-overpick-em">
                        -{extraPoints} points
                      </span>
                    </p>
                  : null}
                </>
              : <p className="echo-live-empty">No picks for this show.</p>}
            </div>
          </div>}

        <div className="echo-live-stats">
          <EchoLiveBars
            title="Most-picked songs"
            items={topPicks.topSongs}
            variant="accent"
            empty="No song data available yet."
            loading={topPicks.loading}
          />
          <EchoLiveBars
            title="Opener picks"
            items={topPicks.topOpeners}
            variant="sage"
            empty="No opener data available yet."
            loading={topPicks.loading}
          />
          <EchoLiveBars
            title="Closer picks"
            items={topPicks.topClosers}
            variant="sage"
            empty="No closer data available yet."
            loading={topPicks.loading}
          />
        </div>

        <EchoLiveStandingsCard
          standings={standings.standings}
          loading={standings.loading}
          picksOpen={live.picksOpen}
          onViewUser={(userId, username) => {
            void handleViewUserSubmission(userId, username)
          }}
        />
      </div>

      {viewedUsername ?
        <EchoLiveSubmissionDialog
          open={submissionModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseSubmissionModal()
          }}
          username={viewedUsername}
          entries={live.entries}
          picks={viewedPicks}
          complete={live.complete}
          officiallyScored={officiallyScored}
        />
      : null}
    </>
  )
}
