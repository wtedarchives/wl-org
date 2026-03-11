"use client"

import { X, Trash2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SongPick } from "./types"

interface FooterProps {
  viewMode: boolean
  show_scored?: boolean
  submissionDetails?: {
    totalScore: number
    songsPicked: number
    songsPlayed: number
  }
  rawPointsTotal: number
  songPicks: SongPick[]
  totalSongsSelected: number
  submitting: boolean
  success: boolean
  isEditing: boolean
  onClose: () => void
  onSubmit: () => void
  onClearSelections: () => void
}

export function Footer({
  viewMode,
  show_scored,
  submissionDetails,
  rawPointsTotal,
  songPicks,
  totalSongsSelected,
  submitting,
  success,
  isEditing,
  onClose,
  onSubmit,
  onClearSelections,
}: FooterProps) {
  if (viewMode) {
    return (
      <div className="w-full flex flex-col items-center gap-2">
        {show_scored && (
          <div className="w-full text-center">
            <div className="text-xs font-semibold">
              Selection score:{" "}
              <span className="font-medium bg-green-600 text-white rounded py-0.5 px-1 ml-1">
                {rawPointsTotal} points
              </span>
            </div>
            {submissionDetails &&
              submissionDetails.songsPicked > submissionDetails.songsPlayed && (
                <div className="text-xs font-semibold mt-1">
                  {submissionDetails.songsPicked -
                    submissionDetails.songsPlayed ===
                  1
                    ? "1 extra song picked"
                    : `${submissionDetails.songsPicked - submissionDetails.songsPlayed} extra songs picked`}
                  :{" "}
                  <span className="font-medium bg-red-600 text-white rounded py-0.5 px-1 ml-1">
                    -
                    {(submissionDetails.songsPicked -
                      submissionDetails.songsPlayed) *
                      3}
                    {" "}
                    points
                  </span>
                </div>
              )}
          </div>
        )}
        <Button variant="destructive" size="sm" onClick={onClose}>
          <X className="size-3" />
          Close
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">
          {totalSongsSelected} song{totalSongsSelected !== 1 ? "s" : ""} selected
        </span>
        {songPicks.length > 0 && (
          <Button
            variant="destructive"
            size="xs"
            onClick={onClearSelections}
          >
            <Trash2 className="size-3" />
            <span className="hidden md:inline">Clear Selections</span>
            <span className="md:hidden">Clear</span>
          </Button>
        )}
      </div>
      <Button
        size="sm"
        onClick={onSubmit}
        disabled={songPicks.length === 0 || submitting || success}
        className="bg-green-600 hover:bg-green-700"
      >
        {submitting ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Submitting...
          </>
        ) : success ? (
          <>
            <Check className="size-3" />
            Submitted!
          </>
        ) : (
          <>
            <Check className="size-3" />
            {isEditing ? "Update Picks" : "Submit Picks"}
          </>
        )}
      </Button>
    </div>
  )
}
