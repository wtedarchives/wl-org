"use client"

import { Trash2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
}: SubmitCardProps) {
  if (viewMode) {
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
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="text-sm font-medium">
            {totalSongsSelected} song{totalSongsSelected !== 1 ? "s" : ""} selected
          </span>
          {songPicks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelections}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6"
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
          className="w-full"
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
