"use client"

import { formatSetlistDate } from "@/lib/setlist-utils"
import type { SongSelectionShow } from "./types"

interface ModalHeaderProps {
  show: SongSelectionShow
  viewMode: boolean
  isEditing: boolean
  show_scored?: boolean
  submissionDetails?: {
    totalScore: number
    songsPicked: number
    songsPlayed: number
  }
  isSelectionClosed?: boolean
  timeRemaining?: string
  onClose: () => void
}

export function ModalHeader({
  viewMode,
  isEditing,
  show_scored,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <h2 className="text-sm font-semibold">
        {viewMode
          ? show_scored
            ? "Setlist Game Results"
            : "Your Setlist Picks"
          : isEditing
            ? "Edit Setlist Picks"
            : "Select Setlist"}
      </h2>
    </div>
  )
}

interface StatusDisplayProps {
  show: SongSelectionShow
  viewMode: boolean
  show_scored?: boolean
  submissionDetails?: { totalScore: number; songsPicked: number; songsPlayed: number }
  isSelectionClosed?: boolean
  timeRemaining?: string
}

export function StatusDisplay({
  show,
  viewMode,
  show_scored,
  submissionDetails,
  isSelectionClosed,
  timeRemaining,
}: StatusDisplayProps) {
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div>
          <h3 className="text-xs font-medium">
            {formatSetlistDate(show.show_date)} — {show.show_subvenue}
          </h3>
          <p className="text-xs text-muted-foreground">
            {show.show_venue_location}
          </p>
        </div>
        {viewMode && show_scored && submissionDetails ? (
          <div className="flex justify-end">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-600 text-white">
              {submissionDetails.totalScore} points
            </span>
          </div>
        ) : viewMode && isSelectionClosed ? (
          <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">
            Awaiting results
          </span>
        ) : (
          <div>
            {isSelectionClosed ? (
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs">
                Picks closed
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs">
                {timeRemaining} left to submit
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
