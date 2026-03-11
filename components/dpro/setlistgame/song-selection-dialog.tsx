"use client"

import { useAuth } from "@/components/auth-context"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSongSelection, useSetlistOperations } from "./song-selection/hooks"
import { createSongOperations } from "./song-selection/operations"
import { createSubmissionHandler } from "./song-selection/submission"
import { ShowInfoCard } from "./song-selection/show-info-card"
import { SongSearchCard } from "./song-selection/song-search-card"
import { ActionButtonsCard } from "./song-selection/action-buttons-card"
import { PicksDisplayCard } from "./song-selection/picks-display-card"
import { ActualSetlistCard } from "./song-selection/actual-setlist-card"
import { SubmitCard } from "./song-selection/submit-card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import type { UserPick } from "@/hooks/use-user-picks"

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
  const { user } = useAuth()

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
    user ?? null,
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

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <div className="shrink-0 flex items-center justify-between border-b px-4 py-3">
          <DialogTitle className="text-sm font-semibold">
            {getDialogTitle(viewMode, isEditing, show.show_scored)}
          </DialogTitle>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {loading ? (
            <LoadingPageCard message="Loading songs…" />
          ) : success ? (
            <div className="text-center py-12 animate-in fade-in duration-200">
              <p className="text-sm text-muted-foreground">
                Your song selections have been{" "}
                {isEditing ? "updated" : "submitted"} successfully!
              </p>
            </div>
          ) : viewMode ? (
              /* View mode: show info full width, even columns, selection score full width */
              <div className="flex flex-col gap-4">
                <ShowInfoCard
                  show={showForModal}
                  viewMode={viewMode}
                  show_scored={show.show_scored}
                  submissionDetails={submissionDetails}
                  isSelectionClosed={showInfo.isSelectionClosed}
                  timeRemaining={showInfo.timeRemaining}
                />
                <div
                  className={
                    show.show_scored
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
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
                  />
                  {show.show_scored && (
                    <ActualSetlistCard
                      actualSetlist={actualSetlist}
                      songPicks={songPicks}
                    />
                  )}
                </div>
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
                />
              </div>
            ) : (
              /* Edit mode: original 1.25:2 layout */
              <div className="grid grid-cols-1 md:grid-cols-[1.25fr_2fr] gap-4">
                <div className="flex flex-col gap-3 order-1">
                  <ShowInfoCard
                    show={showForModal}
                    viewMode={viewMode}
                    show_scored={show.show_scored}
                    submissionDetails={submissionDetails}
                    isSelectionClosed={showInfo.isSelectionClosed}
                    timeRemaining={showInfo.timeRemaining}
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
                <div className="flex flex-col gap-3 order-2">
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
                  />
                </div>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
