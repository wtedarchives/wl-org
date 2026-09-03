"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { usePastTours } from "@/hooks/use-past-tours"
import type { TourStats } from "@/hooks/use-past-tours"
import { useStandingsData } from "@/hooks/use-standings-data"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { cn } from "@/lib/utils"

import { EchoTourShowStatistics } from "./echo-tour-show-statistics"
import { EchoTourShows } from "./echo-tour-shows"

function formatTourChampions(
  winners: TourStats["winners"],
): string | null {
  if (winners.length === 0) return null
  return winners
    .map((winner) => `${winner.username} (${winner.score})`)
    .join(", ")
}

function championLabel(count: number): string {
  if (count <= 1) return "Champion"
  return "Champions"
}

export function EchoTourHistory() {
  const tourSelectId = useId()
  const showsColumnRef = useRef<HTMLDivElement>(null)
  const myRowRef = useRef<HTMLDivElement>(null)
  const [matchedPanelHeight, setMatchedPanelHeight] = useState<number | null>(
    null,
  )
  const { session } = useAuth()
  const { loading, pastTours } = usePastTours()
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null)

  useEffect(() => {
    if (pastTours.length === 0) return
    setSelectedTourId((current) => {
      if (current && pastTours.some((tour) => tour.tour_id === current)) {
        return current
      }
      // Default to the highest-canonId tour that has scored submissions
      const firstScored = pastTours.find((tour) => tour.playerCount > 0)
      return (firstScored ?? pastTours[0])?.tour_id ?? null
    })
  }, [pastTours])

  const selectedTour = useMemo(
    () => pastTours.find((tour) => tour.tour_id === selectedTourId) ?? null,
    [pastTours, selectedTourId],
  )

  useEffect(() => {
    if (!selectedTour) {
      setMatchedPanelHeight(null)
      return
    }

    const column = showsColumnRef.current
    if (!column) return

    const desktopQuery = window.matchMedia("(min-width: 640px)")

    const syncPanelHeight = () => {
      if (!desktopQuery.matches) {
        setMatchedPanelHeight(null)
        return
      }
      setMatchedPanelHeight(Math.ceil(column.getBoundingClientRect().height))
    }

    syncPanelHeight()

    const observer = new ResizeObserver(syncPanelHeight)
    observer.observe(column)
    desktopQuery.addEventListener("change", syncPanelHeight)

    return () => {
      observer.disconnect()
      desktopQuery.removeEventListener("change", syncPanelHeight)
    }
  }, [selectedTour?.tour_id])

  const { standings, loading: standingsLoading } = useStandingsData(
    selectedTour?.tour ?? "",
    "totalPoints",
    "desc",
  )
  const showFinalStandingsPanel = standingsLoading || standings.length > 0

  // Scroll the signed-in user's row into view once standings finish loading
  useEffect(() => {
    if (standingsLoading) return
    if (!myRowRef.current) return
    myRowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [standingsLoading, selectedTourId])

  const selectedChampions = selectedTour ?
    formatTourChampions(selectedTour.winners)
  : null

  return (
    <div className="echo-tour-past-tours">
      <header
        className="echo-tour-past-tours-head"
        style={echoTourSurfaceBgStyle("history-head")}
      >
        <h1 className="echo-tour-past-tours-title">History</h1>
        {!loading && pastTours.length > 0 ?
          <div className="echo-tour-past-tours-head-picker">
            <label className="sr-only" htmlFor={tourSelectId}>
              Select tour
            </label>
            <select
              id={tourSelectId}
              className="echo-tour-past-tours-select"
              value={selectedTourId ?? ""}
              onChange={(event) => setSelectedTourId(event.target.value)}
            >
              {pastTours.map((tour) => (
                <option key={tour.tour_id} value={tour.tour_id}>
                  {tour.tour}
                </option>
              ))}
            </select>
          </div>
        : null}
      </header>

      {loading ?
        <p className="echo-tour-past-tours-empty">Loading past tours…</p>
      : pastTours.length === 0 ?
        <p className="echo-tour-past-tours-empty">No past tours found.</p>
      : selectedTour ?
        <>
          <div className="echo-tour-past-tours-layout">
          <div
            ref={showsColumnRef}
            className="echo-tour-past-tours-shows-column"
          >
            <EchoTourShows
              key={selectedTour.tour_id}
              league={selectedTour.tour}
              allowAdmin={false}
              variant="history"
            />
          </div>

          {showFinalStandingsPanel ?
            <section
              className="echo-tour-past-tours-detail"
              style={{
                ...echoTourSurfaceBgStyle(
                  `past-tours-detail-${selectedTour.tour_id}`,
                ),
                ...(matchedPanelHeight != null ?
                  { height: Math.max(matchedPanelHeight, 500) }
                : {}),
              }}
              aria-label={`${selectedTour.tour} final standings`}
            >
              <h2 className="echo-tour-past-tours-detail-title">
                Final standings
              </h2>

              <div className="echo-tour-past-tours-summary">
                <dl className="echo-tour-past-tours-stats">
                  <div>
                    <dt>Shows</dt>
                    <dd>{selectedTour.showCount}</dd>
                  </div>
                  <div>
                    <dt>Players</dt>
                    <dd>{selectedTour.playerCount}</dd>
                  </div>
                </dl>

                <div className="echo-tour-past-tours-detail-champion">
                  <div className="echo-tour-past-tours-champion-label">
                    {championLabel(selectedTour.winners.length)}
                  </div>
                  <div className="echo-tour-past-tours-champion-names">
                    {selectedChampions ?? "No scores"}
                  </div>
                </div>
              </div>

              <div className="echo-tour-past-tours-standings-scroll">
                {standingsLoading ?
                  <p className="echo-tour-past-tours-detail-loading">
                    Loading standings…
                  </p>
                : <div className="echo-tour-past-tours-standings">
                    {standings.map((player, index) => {
                      const isMe = Boolean(
                        session?.profileId &&
                          player.userId === session.profileId,
                      )
                      return (
                        <div
                          key={player.userId}
                          ref={isMe ? myRowRef : null}
                          className={cn(
                            "echo-tour-past-tours-standing-row",
                            isMe && "is-me",
                          )}
                        >
                          <span className="echo-tour-past-tours-standing-rank">
                            {index + 1}
                          </span>
                          <span
                            className={cn(
                              "echo-tour-past-tours-standing-name",
                              isMe && "is-me",
                            )}
                          >
                            {player.username}
                          </span>
                          <span className="echo-tour-past-tours-standing-pts">
                            {player.totalPoints}
                          </span>
                        </div>
                      )
                    })}
                  </div>}
              </div>
            </section>
          : null}
        </div>

          <EchoTourShowStatistics
            key={`${selectedTour.tour_id}-stats`}
            league={selectedTour.tour}
            variant="history"
          />
        </>
      : null}
    </div>
  )
}
