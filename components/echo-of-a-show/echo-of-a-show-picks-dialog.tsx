"use client"

import { useEffect, useId } from "react"

import { useAuth } from "@/components/auth-context"
import {
  useSetlistOperations,
  useSongSelection,
} from "@/components/dpro/setlistgame/song-selection/hooks"
import { createSubmissionHandler } from "@/components/dpro/setlistgame/song-selection/submission"
import type { SongSelectionDialogProps } from "@/components/dpro/setlistgame/song-selection-dialog-types"
import { EchoPicksEditor } from "@/components/echo-of-a-show/echo-of-a-show-picks-editor"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"

import "./echo-of-a-show.css"
import { useTopSongsData } from "@/hooks/use-top-songs-data"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  formatEchoCompactRemaining,
  formatEchoDotDate,
  formatEchoLockClock,
  getEchoLockCountdown,
} from "@/lib/echo-of-a-show"

export function EchoOfAShowPicksDialog({
  open,
  onOpenChange,
  show,
  existingPicks,
  isEditing,
  onSuccess,
}: Omit<SongSelectionDialogProps, "viewMode" | "submissionDetails">) {
  const { session } = useAuth()
  const headingId = useId()
  useWlHomeV2ScrollLock(open)
  const topSongs = useTopSongsData(open ? show.show_id : undefined)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const showForModal = {
    show_id: show.show_id,
    show_date: show.show_date,
    show_subvenue: show.show_subvenue,
    show_detail: show.show_detail,
    show_venue_location: show.show_venue_location,
    show_time: show.show_time,
    show_tour: show.show_tour,
    show_scored: show.show_scored,
    timeRemaining: show.timeRemaining,
    isSelectionClosed: show.isSelectionClosed,
    submission_id: show.submission_id,
  }

  const {
    songs,
    loading,
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    setNextSetNum,
    submitting,
    setSubmitting,
    error,
    setError,
    success,
    setSuccess,
  } = useSongSelection({
    isOpen: open,
    onClose: () => onOpenChange(false),
    show: showForModal,
    existingPicks,
    isEditing,
    viewMode: false,
  })

  const { renumberSongPicks } = useSetlistOperations(songPicks, setSongPicks)

  const handleSubmit = createSubmissionHandler(
    session,
    showForModal,
    songPicks,
    isEditing,
    setSubmitting,
    setError,
    setSuccess,
    () => onOpenChange(false),
    onSuccess,
  )

  const countdown = getEchoLockCountdown(show.show_time)
  const venue = show.show_subvenue || "Show"
  const lockLabel = countdown.isClosed
    ? "Locked"
    : formatEchoLockClock(countdown)
  const lockShort = countdown.isClosed
    ? "Locked"
    : formatEchoCompactRemaining(countdown)

  if (!open) return null

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className="modal-backdrop open"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request echo-of-a-show-picks"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="echo-picks__head">
            <div className="echo-picks__head-copy">
              <h3 id={headingId}>Your setlist</h3>
              <p>
                {formatEchoDotDate(show.show_date)} · {venue}
                {show.show_venue_location ? ` · ${show.show_venue_location}` : ""}
              </p>
            </div>
            <span className="echo-picks__lock">
              <span className="echo-picks__lock-label">Locks in</span>
              <span className="echo-picks__lock-time echo-picks__lock-time--full">
                {lockLabel}
              </span>
              <span className="echo-picks__lock-time echo-picks__lock-time--short">
                {lockShort}
              </span>
            </span>
            <button
              type="button"
              className="echo-picks__close"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              ×
            </button>
          </header>
          <div className="echo-picks__body">
            {loading ?
              <p className="echo-picks__empty">Loading songs…</p>
            : <EchoPicksEditor
                songs={songs}
                picks={songPicks}
                setPicks={(next) => {
                  setSongPicks(next)
                  const max = Math.max(
                    0,
                    ...next
                      .filter((pick) => !pick.isBreak)
                      .map((pick) => pick.setnum),
                  )
                  setNextSetNum(max + 1)
                }}
                currentSet={currentSet}
                setCurrentSet={setCurrentSet}
                topSongs={topSongs}
                submitting={submitting}
                error={error}
                success={success}
                isEditing={isEditing}
                onSubmit={() => void handleSubmit()}
                onClear={() => {
                  setSongPicks([])
                  setCurrentSet("1")
                  setNextSetNum(1)
                  setError(null)
                }}
                onRenumber={() => {
                  window.setTimeout(() => renumberSongPicks(), 0)
                }}
              />}
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
