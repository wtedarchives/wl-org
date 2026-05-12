"use client"

import { formatSetlistDate } from "@/lib/setlist-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SongSelectionShow } from "./types"

interface ShowInfoCardProps {
  show: SongSelectionShow
  viewMode: boolean
  show_scored?: boolean
  submissionDetails?: {
    totalScore: number
    songsPicked: number
    songsPlayed: number
  }
  isSelectionClosed?: boolean
  timeRemaining?: string
  /** WL Home v2 setlist game: match archive setlist `.show-header` + tour stat pills. */
  wlHomeV2Chrome?: boolean
}

export function ShowInfoCard({
  show,
  viewMode,
  show_scored,
  submissionDetails,
  isSelectionClosed,
  timeRemaining,
  wlHomeV2Chrome = false,
}: ShowInfoCardProps) {
  if (wlHomeV2Chrome) {
    const statusPill =
      viewMode && show_scored && submissionDetails ?
        <span className="song-selection-stat-pill song-selection-stat-pill--points">
          {submissionDetails.totalScore} points
        </span>
      : viewMode && isSelectionClosed ?
        <span className="song-selection-stat-pill song-selection-stat-pill--awaiting">
          Awaiting results
        </span>
      : isSelectionClosed ?
        <span className="song-selection-stat-pill song-selection-stat-pill--closed">
          Picks closed
        </span>
      : (
        <span className="song-selection-stat-pill song-selection-stat-pill--time">
          {timeRemaining} left to submit
        </span>
      )
    return (
      <div className="song-selection-show-header">
        <div className="left">
          <h1 className="song-selection-show-header-heading">
            <span className="date">{formatSetlistDate(show.show_date)}</span>
            <span className="show-header-title-divider"> — </span>
            <span className="show-header-title-group">
              {show.show_venue_location}
            </span>
          </h1>
          <div className="venue">{show.show_subvenue}</div>
          <div className="meta song-selection-show-meta">{statusPill}</div>
        </div>
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="pt-2 pb-0.5 px-3">
        <CardTitle className="text-sm font-medium">
          {formatSetlistDate(show.show_date)} — {show.show_venue_location}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-1">
        <p className="text-xs text-muted-foreground">{show.show_subvenue}</p>
        {viewMode && show_scored && submissionDetails ?
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {submissionDetails.totalScore} points
            </span>
          </div>
        : viewMode && isSelectionClosed ?
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
            Awaiting results
          </span>
        : (
          <div>
            {isSelectionClosed ?
              <span className="inline-flex items-center rounded-md bg-destructive/20 text-destructive px-2 py-0.5 text-xs font-medium">
                Picks closed
              </span>
            : (
              <span className="inline-flex items-center rounded-md bg-primary/20 text-primary px-2 py-0.5 text-xs font-medium">
                {timeRemaining} left to submit
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
