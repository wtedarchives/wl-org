"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import type { GameShow } from "@/hooks/use-game-shows"
import { useEchoSettingsAdmin } from "@/hooks/use-echo-settings"
import { useEchoTours } from "@/hooks/use-echo-tours"
import { useSetlistScoring } from "@/hooks/use-setlist-scoring"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"

import { echoFontClassName } from "./echo-fonts"

function formatShowOption(show: GameShow) {
  return `${formatSetlistDate(show.show_date)} - [${show.show_canonid}] - ${show.show_subvenue}`
}

export function EchoTourScoringDialog({
  open,
  onOpenChange,
  gameShows,
  onScoringComplete,
  onLeagueChanged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameShows: GameShow[]
  onScoringComplete: () => void
  onLeagueChanged?: () => void
}) {
  const headingId = useId()
  const selectLabelId = useId()
  const selectId = useId()
  const leagueSelectLabelId = useId()
  const leagueSelectId = useId()

  const [selectedShowToScore, setSelectedShowToScore] = useState<string | null>(null)
  const { isScoring, scoringComplete, scoringError, scoreSubmissions } =
    useSetlistScoring()

  const {
    activeLeague,
    loading: leagueLoading,
    saving: leagueSaving,
    saveError: leagueSaveError,
    setActiveLeague,
  } = useEchoSettingsAdmin()
  const { tours, loading: toursLoading } = useEchoTours()

  const scoreableShows = useMemo(
    () => gameShows.filter((show) => show.show_scored !== true),
    [gameShows],
  )

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) setSelectedShowToScore(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const onClose = () => onOpenChange(false)

  const handleScoreSubmissions = async () => {
    if (!selectedShowToScore) return
    await scoreSubmissions(selectedShowToScore, () => {
      onScoringComplete()
      onOpenChange(false)
      setSelectedShowToScore(null)
    })
  }

  if (!open) return null

  const bodyInner =
    scoringComplete ?
      <div
        className="echo-scoring-alert echo-scoring-alert--success"
        role="status"
      >
        Scoring completed successfully!
      </div>
    : scoringError ?
      <div
        className="echo-scoring-alert echo-scoring-alert--error"
        role="alert"
      >
        <strong>Error</strong>
        <span>{scoringError}</span>
      </div>
    : scoreableShows.length === 0 ?
      <p className="echo-scoring-empty" role="status">
        No unscored shows are available for this league.
      </p>
    : (
      <div className="echo-scoring-form">
        <label className="echo-show-time-label" id={selectLabelId} htmlFor={selectId}>
          Show to score
        </label>
        <Select
          value={selectedShowToScore ?? ""}
          onValueChange={setSelectedShowToScore}
        >
          <SelectTrigger
            id={selectId}
            aria-labelledby={selectLabelId}
            size="sm"
            className={cn(
              "echo-scoring-select-trigger",
              "h-auto w-full min-h-0 justify-between gap-1.5 tabular-nums shadow-none",
            )}
          >
            <SelectValue placeholder="Select a show…" />
          </SelectTrigger>
          <SelectContent
            className="echo-scoring-select-content"
            position="popper"
            sideOffset={4}
          >
            {scoreableShows.map((show) => (
              <SelectItem
                key={show.show_id}
                value={show.show_id}
                className="text-xs font-medium tabular-nums"
              >
                {formatShowOption(show)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )

  const leagueSection = (
    <div className="echo-scoring-league-section">
      <div className="echo-scoring-league-head">
        Active league
        {leagueSaving && (
          <span className="echo-scoring-league-saving">
            <Loader2 className="size-3 animate-spin inline-block mr-1" aria-hidden />
            Saving…
          </span>
        )}
      </div>
      {leagueLoading || toursLoading ?
        <p className="echo-scoring-empty">Loading tours…</p>
      : (
        <Select
          value={activeLeague}
          onValueChange={(val) => void setActiveLeague(val).then(() => onLeagueChanged?.())}
          disabled={leagueSaving}
        >
          <SelectTrigger
            id={leagueSelectId}
            aria-labelledby={leagueSelectLabelId}
            size="sm"
            className={cn(
              "echo-scoring-select-trigger",
              "h-auto w-full min-h-0 justify-between gap-1.5 shadow-none",
            )}
          >
            <SelectValue placeholder="Select active league…" />
          </SelectTrigger>
          <SelectContent
            className="echo-scoring-select-content"
            position="popper"
            sideOffset={4}
          >
            {tours.map((t) => (
              <SelectItem
                key={t.tour_id}
                value={t.tour}
                className="text-xs font-medium"
              >
                {t.tour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {leagueSaveError && (
        <div className="echo-scoring-alert echo-scoring-alert--error" role="alert">
          <strong>Error saving league</strong>
          <span>{leagueSaveError}</span>
        </div>
      )}
      {!leagueLoading && !toursLoading && activeLeague && !leagueSaveError && (
        <span className="echo-scoring-league-badge">{activeLeague}</span>
      )}
    </div>
  )

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        id="echo-scoring-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className={`modal modal--wted-request modal--echo-scoring echo-modal ${echoFontClassName}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={
            scoringComplete || scoringError ? undefined : selectLabelId
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Score show</h3>
              {!scoringComplete && !scoringError ?
                <p className="modal-request-sub">
                  Choose a show, then score every submission for that show.
                </p>
              : null}
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <div className="echo-scoring-stack">
              {bodyInner}
              <hr className="echo-scoring-divider" />
              {leagueSection}
            </div>
            {!scoringComplete ?
              <div className="echo-scoring-footer">
                <button
                  type="button"
                  className="echo-tour-btn-ghost"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="echo-tour-btn-primary"
                  onClick={() => void handleScoreSubmissions()}
                  disabled={!selectedShowToScore || isScoring}
                >
                  {isScoring ?
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      <span>Scoring…</span>
                    </>
                  : (
                    "Score submissions"
                  )}
                </button>
              </div>
            : null}
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
