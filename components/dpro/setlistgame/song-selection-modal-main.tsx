"use client"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { cn } from "@/lib/utils"
import type {
  SongSelectionDialogProps,
  ShowForSongSelection,
} from "@/components/dpro/setlistgame/song-selection-dialog-types"
import { ShowInfoCard } from "./song-selection/show-info-card"
import { SongSearchCard } from "./song-selection/song-search-card"
import { ActionButtonsCard } from "./song-selection/action-buttons-card"
import { PicksDisplayCard } from "./song-selection/picks-display-card"
import { ActualSetlistCard } from "./song-selection/actual-setlist-card"
import { ToggleSwitch } from "./song-selection/toggle-switch"
import { SubmitCard } from "./song-selection/submit-card"
import type { SongPick, Song, SetlistEntry } from "./song-selection/types"

export interface SongSelectionModalMainProps {
  wlV2: boolean
  loading: boolean
  success: boolean
  viewMode: boolean
  isEditing: boolean
  showScored?: boolean
  showForModal: ShowForSongSelection
  submissionDetails?: SongSelectionDialogProps["submissionDetails"]
  songs: Song[]
  selectedSong: string
  setSelectedSong: (v: string) => void
  songPicks: SongPick[]
  actualSetlist: SetlistEntry[]
  showActualSetlist: boolean
  setShowActualSetlist: (v: boolean) => void
  showInfo: { timeRemaining: string; isSelectionClosed: boolean }
  error: string | null
  rawPointsTotal: number
  totalSongsSelected: number
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void | Promise<void>
  onClearSelections: () => void
  handleAddSong: (songId: string) => void
  handleAddSetBreak: () => void
  handleAddEncoreBreak: () => void
  handleAddNewOriginalSong: () => void
  handleAddNewCoverSong: () => void
  canAddSetBreak: boolean
  canAddEncoreBreak: boolean
  handleRemoveSong: (index: number) => void
  handleRemoveSet: (setToRemove: string) => void
  moveSongUp: (id: string) => void
  moveSongDown: (id: string) => void
}

export function SongSelectionModalMain({
  wlV2,
  loading,
  success,
  viewMode,
  isEditing,
  showScored,
  showForModal,
  submissionDetails,
  songs,
  selectedSong,
  setSelectedSong,
  songPicks,
  actualSetlist,
  showActualSetlist,
  setShowActualSetlist,
  showInfo,
  error,
  rawPointsTotal,
  totalSongsSelected,
  submitting,
  onOpenChange,
  onSubmit,
  onClearSelections,
  handleAddSong,
  handleAddSetBreak,
  handleAddEncoreBreak,
  handleAddNewOriginalSong,
  handleAddNewCoverSong,
  canAddSetBreak,
  canAddEncoreBreak,
  handleRemoveSong,
  handleRemoveSet,
  moveSongUp,
  moveSongDown,
}: SongSelectionModalMainProps) {
  if (loading) {
    return <LoadingPageCard message="Loading songs…" />
  }

  if (success) {
    return (
      <div className="py-12 text-center animate-in fade-in duration-200">
        <p className="text-sm text-muted-foreground">
          Your song selections have been {isEditing ? "updated" : "submitted"}{" "}
          successfully!
        </p>
      </div>
    )
  }

  if (viewMode) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4",
          wlV2 && "px-3 pb-3 pt-1 sm:px-4",
        )}
      >
        <ShowInfoCard
          show={showForModal}
          viewMode={viewMode}
          show_scored={showScored}
          submissionDetails={submissionDetails}
          isSelectionClosed={showInfo.isSelectionClosed}
          timeRemaining={showInfo.timeRemaining}
          wlHomeV2Chrome={wlV2}
        />
        {showScored ?
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
                    show_scored={showScored}
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
                  show_scored={showScored}
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
              show_scored={showScored}
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
          show_scored={showScored}
          submissionDetails={submissionDetails}
          rawPointsTotal={rawPointsTotal}
          totalSongsSelected={totalSongsSelected}
          songPicks={songPicks}
          submitting={submitting}
          success={success}
          isEditing={isEditing}
          onSubmit={onSubmit}
          onClearSelections={onClearSelections}
          onClose={() => onOpenChange(false)}
          wlHomeV2Chrome={wlV2}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-[1.25fr_2fr]",
        wlV2 && "px-3 pb-3 pt-1 sm:px-4",
      )}
    >
      <div className="order-1 flex flex-col gap-3">
        <ShowInfoCard
          show={showForModal}
          viewMode={viewMode}
          show_scored={showScored}
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
          canAddSetBreak={canAddSetBreak}
          canAddEncoreBreak={canAddEncoreBreak}
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
          show_scored={showScored}
          isSelectionClosed={showInfo.isSelectionClosed}
          onRemoveSong={handleRemoveSong}
          onMoveSongUp={moveSongUp}
          onMoveSongDown={moveSongDown}
          onRemoveSet={handleRemoveSet}
          wlHomeV2Chrome={wlV2}
        />
        <SubmitCard
          viewMode={viewMode}
          show_scored={showScored}
          submissionDetails={submissionDetails}
          rawPointsTotal={rawPointsTotal}
          totalSongsSelected={totalSongsSelected}
          songPicks={songPicks}
          submitting={submitting}
          success={success}
          isEditing={isEditing}
          onSubmit={onSubmit}
          onClearSelections={onClearSelections}
          onClose={() => onOpenChange(false)}
          wlHomeV2Chrome={wlV2}
        />
      </div>
    </div>
  )
}
