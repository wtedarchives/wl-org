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
import { ShowInfoCard } from "./song-selection/show-info-card"
import { SongSearchCard } from "./song-selection/song-search-card"
import { ActionButtonsCard } from "./song-selection/action-buttons-card"
import { PicksDisplayCard } from "./song-selection/picks-display-card"
import { ActualSetlistCard } from "./song-selection/actual-setlist-card"
import { ToggleSwitch } from "./song-selection/toggle-switch"
import { SubmitCard } from "./song-selection/submit-card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useSetlistGameWlV2Chrome } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import type { UserPick } from "@/hooks/use-user-picks"
import { cn } from "@/lib/utils"

import "./song-selection-dialog.css"

/** Minimal show shape needed for song selection (compatible with GameShow from either hook). */
export interface ShowForSongSelection {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string
  show_time: string
  show_tour: string
  show_detail?: string | null
  show_scored?: boolean
  timeRemaining?: string
  isSelectionClosed?: boolean
  submission_id?: string
}

interface SongSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  show: ShowForSongSelection
  existingPicks: UserPick[]
  isEditing: boolean
  viewMode: boolean
  submissionDetails?: {
    totalScore: number
    songsPicked: number
    songsPlayed: number
    setlist: Array<{
      entry_song: string
      entry_set: string
      entry_setnum: number
      entry_placement: string
    }>
  }
  onSuccess?: () => void
}

function getDialogTitle(
  viewMode: boolean,
  isEditing: boolean,
  show_scored?: boolean
): string {
  if (viewMode) {
    return show_scored ? "Setlist Game Results" : "Your Setlist Picks"
  }
  return isEditing ? "Edit Setlist Picks" : "Select Setlist"
}

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
    renumberSongPicks
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
    onSuccess
  )

  const handleClearSelections = () => {
    setSongPicks([])
    setCurrentSet("1")
    setNextSetNum(1)
    setError(null)
  }

  const totalSongsSelected = songPicks.filter((p) => !p.isBreak).length

  const dialogTitleText = getDialogTitle(viewMode, isEditing, show.show_scored)

  const modalMain =
    loading ? <LoadingPageCard message="Loading songs…" />
    : success ?
      <div className="py-12 text-center animate-in fade-in duration-200">
        <p className="text-sm text-muted-foreground">
          Your song selections have been {isEditing ? "updated" : "submitted"}{" "}
          successfully!
        </p>
      </div>
    : viewMode ?
      <div
        className={cn(
          "flex flex-col gap-4",
          wlV2 && "px-3 pb-3 pt-1 sm:px-4",
        )}
      >
        <ShowInfoCard
          show={showForModal}
          viewMode={viewMode}
          show_scored={show.show_scored}
          submissionDetails={submissionDetails}
          isSelectionClosed={showInfo.isSelectionClosed}
          timeRemaining={showInfo.timeRemaining}
          wlHomeV2Chrome={wlV2}
        />
        {show.show_scored ?
          <>
            <div className="flex flex-col gap-3 md:hidden">
              <ToggleSwitch
                showActualSetlist={showActualSetlist}
                setShowActualSetlist={setShowActualSetlist}
                leftLabel="Your picks"
                rightLabel="Actual setlist"
                wlV2Chrome={wlV2}
              />
              <div
                key={showActualSetlist ? "actual" : "picks"}
                className="animate-in fade-in duration-200"
              >
                {!showActualSetlist ?
                  <PicksDisplayCard
                    songPicks={songPicks}
                    actualSetlist={actualSetlist}
                    viewMode={true}
                    show_scored={show.show_scored}
                    isSelectionClosed={showInfo.isSelectionClosed}
                    onRemoveSong={handleRemoveSong}
                    onMoveSongUp={moveSongUp}
                    onMoveSongDown={moveSongDown}
                    onRemoveSet={handleRemoveSet}
                    wlHomeV2Chrome={wlV2}
                  />
                : <ActualSetlistCard
                    actualSetlist={actualSetlist}
                    songPicks={songPicks}
                    wlHomeV2Chrome={wlV2}
                  />}
              </div>
            </div>
            <div className="hidden gap-4 md:grid md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                {wlV2 ?
                  <h4 className="song-selection-column-title">Your picks</h4>
                : null}
                <PicksDisplayCard
                  songPicks={songPicks}
                  actualSetlist={actualSetlist}
                  viewMode={true}
                  show_scored={show.show_scored}
                  isSelectionClosed={showInfo.isSelectionClosed}
                  onRemoveSong={handleRemoveSong}
                  onMoveSongUp={moveSongUp}
                  onMoveSongDown={moveSongDown}
                  onRemoveSet={handleRemoveSet}
                  wlHomeV2Chrome={wlV2}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                {wlV2 ?
                  <h4 className="song-selection-column-title">
                    Actual setlist
                  </h4>
                : null}
                <ActualSetlistCard
                  actualSetlist={actualSetlist}
                  songPicks={songPicks}
                  wlHomeV2Chrome={wlV2}
                />
              </div>
            </div>
          </>
        : <div className={cn("flex flex-col gap-3", wlV2 && "gap-2")}>
            {wlV2 ?
              <h4 className="song-selection-column-title">Your picks</h4>
            : null}
            <PicksDisplayCard
              songPicks={songPicks}
              actualSetlist={actualSetlist}
              viewMode={true}
              show_scored={show.show_scored}
              isSelectionClosed={showInfo.isSelectionClosed}
              onRemoveSong={handleRemoveSong}
              onMoveSongUp={moveSongUp}
              onMoveSongDown={moveSongDown}
              onRemoveSet={handleRemoveSet}
              wlHomeV2Chrome={wlV2}
            />
          </div>}
        <SubmitCard
          viewMode={viewMode}
          show_scored={show.show_scored}
          submissionDetails={submissionDetails}
          rawPointsTotal={rawPointsTotal}
          totalSongsSelected={totalSongsSelected}
          songPicks={songPicks}
          submitting={submitting}
          success={success}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onClearSelections={handleClearSelections}
          onClose={() => onOpenChange(false)}
          wlHomeV2Chrome={wlV2}
        />
      </div>
    : <div
        className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-[1.25fr_2fr]",
          wlV2 && "px-3 pb-3 pt-1 sm:px-4",
        )}
      >
        <div className="order-1 flex flex-col gap-3">
          <ShowInfoCard
            show={showForModal}
            viewMode={viewMode}
            show_scored={show.show_scored}
            submissionDetails={submissionDetails}
            isSelectionClosed={showInfo.isSelectionClosed}
            timeRemaining={showInfo.timeRemaining}
            wlHomeV2Chrome={wlV2}
          />
          <SongSearchCard
            songs={songs}
            selectedSong={selectedSong}
            setSelectedSong={setSelectedSong}
            onAddSong={() => {
              handleAddSong(selectedSong)
              setSelectedSong("")
            }}
            error={error}
          />
          <ActionButtonsCard
            onAddSetBreak={handleAddSetBreak}
            onAddEncoreBreak={handleAddEncoreBreak}
            onAddNewOriginalSong={handleAddNewOriginalSong}
            onAddNewCoverSong={handleAddNewCoverSong}
            canAddSetBreak={canAddSetBreak()}
            canAddEncoreBreak={canAddEncoreBreak()}
          />
        </div>
        <div className="order-2 flex flex-col gap-3">
          {wlV2 ?
            <h4 className="song-selection-column-title">Your picks</h4>
          : null}
          <PicksDisplayCard
            songPicks={songPicks}
            actualSetlist={actualSetlist}
            viewMode={false}
            show_scored={show.show_scored}
            isSelectionClosed={showInfo.isSelectionClosed}
            onRemoveSong={handleRemoveSong}
            onMoveSongUp={moveSongUp}
            onMoveSongDown={moveSongDown}
            onRemoveSet={handleRemoveSet}
            wlHomeV2Chrome={wlV2}
          />
          <SubmitCard
            viewMode={viewMode}
            show_scored={show.show_scored}
            submissionDetails={submissionDetails}
            rawPointsTotal={rawPointsTotal}
            totalSongsSelected={totalSongsSelected}
            songPicks={songPicks}
            submitting={submitting}
            success={success}
            isEditing={isEditing}
            onSubmit={handleSubmit}
            onClearSelections={handleClearSelections}
            onClose={() => onOpenChange(false)}
            wlHomeV2Chrome={wlV2}
          />
        </div>
      </div>

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
