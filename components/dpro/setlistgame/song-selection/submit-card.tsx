"use client"

import { Trash2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SongPick } from "./types"

interface SubmitCardProps {
  viewMode: boolean
  show_scored?: boolean
  submissionDetails?: {
    totalScore: number
    songsPicked: number
    songsPlayed: number
  }
  rawPointsTotal: number
  totalSongsSelected: number
  songPicks: SongPick[]
  submitting: boolean
  success: boolean
  isEditing: boolean
  onSubmit: () => void
  onClearSelections: () => void
  onClose: () => void
  wlHomeV2Chrome?: boolean
}

export function SubmitCard({
  viewMode,
  show_scored,
  submissionDetails,
  rawPointsTotal,
  totalSongsSelected,
  songPicks,
  submitting,
  success,
  isEditing,
  onSubmit,
  onClearSelections,
  onClose,
  wlHomeV2Chrome = false,
}: SubmitCardProps) {
  if (viewMode) {
    if (wlHomeV2Chrome) {
      return (
        <div className="song-selection-view-footer-stack">
          {show_scored && (
            <div className="space-y-1 px-1 text-center">
              <p className="song-selection-footer-score-line">
                Selection score:{" "}
                <span className="song-selection-footer-score-em">
                  {rawPointsTotal} points
                </span>
              </p>
              {submissionDetails &&
                submissionDetails.songsPicked > submissionDetails.songsPlayed && (
                  <p className="song-selection-footer-penalty-line">
                    {submissionDetails.songsPicked - submissionDetails.songsPlayed} extra
                    song
                    {submissionDetails.songsPicked - submissionDetails.songsPlayed !== 1
                      ? "s"
                      : ""}{" "}
                    picked:{" "}
                    <span className="song-selection-footer-penalty-em">
                      -
                      {(submissionDetails.songsPicked -
                        submissionDetails.songsPlayed) *
                        3}{" "}
                      points
                    </span>
                  </p>
                )}
            </div>
          )}
          <div className="modal-setlist-song-footer">
            <button
              type="button"
              className="modal-setlist-song-footer-close"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      )
    }
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <CardContent className="p-3">
          {show_scored && (
            <div className="text-center space-y-1 mb-3">
              <p className="text-sm font-medium">
                Selection score:{" "}
                <span className="text-primary font-semibold">{rawPointsTotal} points</span>
              </p>
              {submissionDetails &&
                submissionDetails.songsPicked > submissionDetails.songsPlayed && (
                  <p className="text-xs text-muted-foreground">
                    {submissionDetails.songsPicked - submissionDetails.songsPlayed} extra
                    song
                    {submissionDetails.songsPicked - submissionDetails.songsPlayed !== 1
                      ? "s"
                      : ""}{" "}
                    picked:{" "}
                    <span className="text-destructive font-medium">
                      -
                      {(submissionDetails.songsPicked -
                        submissionDetails.songsPlayed) *
                        3}{" "}
                      points
                    </span>
                  </p>
                )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "ring-0 border overflow-hidden py-0",
        wlHomeV2Chrome ?
          "song-selection-edit-footer-card"
        : "border-border/60 bg-card/80",
      )}
    >
      <CardContent
        className={cn(
          "p-3 space-y-2",
          wlHomeV2Chrome && "song-selection-edit-footer-inner",
        )}
      >
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="text-sm font-medium">
            {totalSongsSelected} song{totalSongsSelected !== 1 ? "s" : ""} selected
          </span>
          {songPicks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelections}
              className={cn(
                "text-destructive hover:text-destructive hover:bg-destructive/10 h-6",
                wlHomeV2Chrome && "song-selection-btn-ghost-warn",
              )}
            >
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={songPicks.length === 0 || submitting || success}
          className={cn("w-full", wlHomeV2Chrome && "song-selection-submit-primary")}
        >
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Submitting...
            </>
          ) : success ? (
            <>
              <Check className="size-3.5" />
              Submitted!
            </>
          ) : (
            <>
              <Check className="size-3.5" />
              {isEditing ? "Update Picks" : "Submit Picks"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
