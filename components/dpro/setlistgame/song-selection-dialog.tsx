"use client"

import { useAuth } from "@/components/auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSongSelection, useSetlistOperations } from "./song-selection/hooks"
import { createSongOperations } from "./song-selection/operations"
import { createSubmissionHandler } from "./song-selection/submission"
import { ModalHeader, StatusDisplay } from "./song-selection/header"
import { SongSelector } from "./song-selection/song-selector"
import { SetlistDisplay } from "./song-selection/setlist-display"
import { Footer } from "./song-selection/footer"
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
        className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0"
        showCloseButton={true}
      >
        <ModalHeader
          show={showForModal}
          viewMode={viewMode}
          isEditing={isEditing}
          show_scored={show.show_scored}
          submissionDetails={submissionDetails}
          isSelectionClosed={showInfo.isSelectionClosed}
          timeRemaining={showInfo.timeRemaining}
          onClose={() => onOpenChange(false)}
        />

        <StatusDisplay
          show={showForModal}
          viewMode={viewMode}
          show_scored={show.show_scored}
          submissionDetails={submissionDetails}
          isSelectionClosed={showInfo.isSelectionClosed}
          timeRemaining={showInfo.timeRemaining}
        />

        <div className="flex-1 overflow-y-auto px-4 pt-2 min-h-0">
          {loading ? (
            <LoadingPageCard message="Loading songs…" />
          ) : success ? (
            <div className="text-center py-8">
              <div className="bg-green-500/20 text-foreground px-3 py-2 rounded-lg text-xs">
                Your song selections have been{" "}
                {isEditing ? "updated" : "submitted"} successfully!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {!viewMode && (
                <SongSelector
                  songs={songs}
                  selectedSong={selectedSong}
                  setSelectedSong={setSelectedSong}
                  onAddSong={() => {
                    handleAddSong(selectedSong)
                    setSelectedSong("")
                  }}
                  onAddNewOriginalSong={handleAddNewOriginalSong}
                  onAddNewCoverSong={handleAddNewCoverSong}
                  onAddSetBreak={handleAddSetBreak}
                  onAddEncoreBreak={handleAddEncoreBreak}
                  canAddSetBreak={canAddSetBreak()}
                  canAddEncoreBreak={canAddEncoreBreak()}
                  error={error}
                />
              )}

              <div>
                <SetlistDisplay
                  songPicks={songPicks}
                  actualSetlist={actualSetlist}
                  showActualSetlist={showActualSetlist}
                  setShowActualSetlist={setShowActualSetlist}
                  viewMode={viewMode}
                  show_scored={show.show_scored}
                  isSelectionClosed={showInfo.isSelectionClosed}
                  onRemoveSong={handleRemoveSong}
                  onMoveSongUp={moveSongUp}
                  onMoveSongDown={moveSongDown}
                  onRemoveSet={handleRemoveSet}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t bg-muted/30">
          <Footer
            viewMode={viewMode}
            show_scored={show.show_scored}
            submissionDetails={submissionDetails}
            rawPointsTotal={rawPointsTotal}
            songPicks={songPicks}
            totalSongsSelected={totalSongsSelected}
            submitting={submitting}
            success={success}
            isEditing={isEditing}
            onClose={() => onOpenChange(false)}
            onSubmit={handleSubmit}
            onClearSelections={handleClearSelections}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
