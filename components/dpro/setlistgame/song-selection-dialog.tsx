"use client"

import { useEffect, useId } from "react"
import { useAuth } from "@/components/auth-context"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { useSongSelection, useSetlistOperations } from "./song-selection/hooks"
import { createSongOperations } from "./song-selection/operations"
import { createSubmissionHandler } from "./song-selection/submission"
import { SongSelectionModalMain } from "@/components/dpro/setlistgame/song-selection-modal-main"
import { useSetlistGameWlV2Chrome } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import { getSongSelectionDialogTitle } from "@/components/dpro/setlistgame/song-selection-dialog-title"
import type { SongSelectionDialogProps } from "@/components/dpro/setlistgame/song-selection-dialog-types"

import "./song-selection-dialog.css"

export type { ShowForSongSelection } from "@/components/dpro/setlistgame/song-selection-dialog-types"

export function SongSelectionDialog({
  open,
  onOpenChange,
  show,
  existingPicks,
  isEditing,
  viewMode,
  submissionDetails,
  onSuccess,
}: SongSelectionDialogProps) {
  const { session } = useAuth()
  const wlV2 = useSetlistGameWlV2Chrome()
  const headingId = useId()
  useWlHomeV2ScrollLock(open && wlV2)

  useEffect(() => {
    if (!open || !wlV2) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, wlV2, onOpenChange])

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
    selectedSong,
    setSelectedSong,
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    nextSetNum,
    setNextSetNum,
    submitting,
    setSubmitting,
    error,
    setError,
    success,
    setSuccess,
    rawPointsTotal,
    actualSetlist,
    showActualSetlist,
    setShowActualSetlist,
    showInfo,
  } = useSongSelection({
    isOpen: open,
    onClose: () => onOpenChange(false),
    show: showForModal,
    existingPicks,
    isEditing,
    viewMode,
    submissionDetails,
  })

  const { canAddSetBreak, canAddEncoreBreak, renumberSongPicks } =
    useSetlistOperations(songPicks, setSongPicks)

  const {
    handleAddSong,
    handleAddNewOriginalSong,
    handleAddNewCoverSong,
    handleAddSetBreak,
    handleAddEncoreBreak,
    handleRemoveSong,
    handleRemoveSet,
    moveSongUp,
    moveSongDown,
  } = createSongOperations(
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    nextSetNum,
    setNextSetNum,
    setError,
    canAddSetBreak,
    canAddEncoreBreak,
    renumberSongPicks,
  )

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

  const handleClearSelections = () => {
    setSongPicks([])
    setCurrentSet("1")
    setNextSetNum(1)
    setError(null)
  }

  const totalSongsSelected = songPicks.filter((p) => !p.isBreak).length

  const dialogTitleText = getSongSelectionDialogTitle(
    viewMode,
    isEditing,
    show.show_scored,
  )

  const modalMain = (
    <SongSelectionModalMain
      wlV2={wlV2}
      loading={loading}
      success={success}
      viewMode={viewMode}
      isEditing={isEditing}
      showScored={show.show_scored}
      showForModal={showForModal}
      submissionDetails={submissionDetails}
      songs={songs}
      selectedSong={selectedSong}
      setSelectedSong={setSelectedSong}
      songPicks={songPicks}
      actualSetlist={actualSetlist}
      showActualSetlist={showActualSetlist}
      setShowActualSetlist={setShowActualSetlist}
      showInfo={showInfo}
      error={error}
      rawPointsTotal={rawPointsTotal}
      totalSongsSelected={totalSongsSelected}
      submitting={submitting}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      onClearSelections={handleClearSelections}
      handleAddSong={handleAddSong}
      handleAddSetBreak={handleAddSetBreak}
      handleAddEncoreBreak={handleAddEncoreBreak}
      handleAddNewOriginalSong={handleAddNewOriginalSong}
      handleAddNewCoverSong={handleAddNewCoverSong}
      canAddSetBreak={canAddSetBreak()}
      canAddEncoreBreak={canAddEncoreBreak()}
      handleRemoveSong={handleRemoveSong}
      handleRemoveSet={handleRemoveSet}
      moveSongUp={moveSongUp}
      moveSongDown={moveSongDown}
    />
  )

  if (!open) return null

  if (wlV2) {
    return (
      <WlHomeV2ModalPortal open={open}>
        <div
          className="modal-backdrop open"
          id="song-selection-modal"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false)
          }}
        >
          <div
            className="modal modal--wted-request modal--song-selection"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-request-head">
              <div className="modal-request-head-text">
                <h3 id={headingId}>{dialogTitleText}</h3>
              </div>
              <button
                type="button"
                className="modal-request-close"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-request-body">
              <div className="song-selection-modal-scroll">{modalMain}</div>
            </div>
          </div>
        </div>
      </WlHomeV2ModalPortal>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px]"
        showCloseButton={true}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <DialogTitle className="text-sm font-semibold">
            {dialogTitleText}
          </DialogTitle>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">{modalMain}</div>
      </DialogContent>
    </Dialog>
  )
}
