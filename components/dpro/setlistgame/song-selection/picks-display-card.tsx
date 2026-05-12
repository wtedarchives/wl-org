"use client"

import { X, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { getPlacementBarPillColors } from "@/lib/placement-bar-color"
import { cn } from "@/lib/utils"
import { SongSelectionPlacementPill } from "./song-selection-placement-pill"
import type { SongPick, SetlistEntry } from "./types"
import {
  getSetDisplayName,
  getUniqueSets,
  getAllUniqueSets,
  getSongsForSet,
} from "./utils"
import { TooltipContainer } from "./tooltip-container"
import { SongSelectionNumCell } from "./song-selection-num-cell"

interface PicksDisplayCardProps {
  songPicks: SongPick[]
  actualSetlist: SetlistEntry[]
  viewMode: boolean
  show_scored?: boolean
  isSelectionClosed?: boolean
  onRemoveSong: (index: number) => void
  onMoveSongUp: (pickId: string) => void
  onMoveSongDown: (pickId: string) => void
  onRemoveSet: (setId: string) => void
  wlHomeV2Chrome?: boolean
}

export function PicksDisplayCard({
  songPicks,
  actualSetlist,
  viewMode,
  show_scored,
  isSelectionClosed,
  onRemoveSong,
  onMoveSongUp,
  onMoveSongDown,
  onRemoveSet,
  wlHomeV2Chrome = false,
}: PicksDisplayCardProps) {
  const uniqueSets = (viewMode && show_scored)
    ? getAllUniqueSets(songPicks, actualSetlist)
    : getUniqueSets(songPicks)

  const resultsGridLayout = viewMode && show_scored

  const emptyBody = (
    <p
      className={cn(
        "text-center py-6 text-sm",
        wlHomeV2Chrome ? "song-selection-muted-caption" : "text-muted-foreground",
      )}
    >
      No songs selected yet. Add songs to begin.
    </p>
  )

  if (songPicks.length === 0 && !(viewMode && show_scored && actualSetlist.length > 0)) {
    if (wlHomeV2Chrome) {
      return (
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural song-selection-tour-panel">
          <div className="wl-home-v2-years-table-scroll min-h-0 px-1 py-2">
            {emptyBody}
          </div>
        </div>
      )
    }
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Your picks</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">{emptyBody}</CardContent>
      </Card>
    )
  }

  const picksBody = (
    <div
      className={cn(
        wlHomeV2Chrome ? "song-selection-sets-stack px-0 py-1" : "space-y-2",
      )}
    >
      {uniqueSets.map((setId) => {
        const songRows = getSongsForSet(songPicks, setId).map((pick, index) => {
          const placementColors = wlHomeV2Chrome
            ? null
            : getPlacementBarPillColors(pick.placement)
          return (
            <div
              key={pick.id}
              className={cn(
                "flex items-center gap-2 px-2 transition-colors",
                wlHomeV2Chrome ?
                  "song-selection-tour-row"
                : "rounded-md py-0 hover:bg-muted/40",
                !wlHomeV2Chrome && !resultsGridLayout && "justify-between",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {wlHomeV2Chrome ?
                  <SongSelectionNumCell placement={pick.placement} n={index + 1} />
                : placementColors && (
                    <TourShowsStatPill
                      fill={placementColors.fill}
                      border={placementColors.border}
                      className="shrink-0 tabular-nums min-w-[1.25rem] text-center"
                    >
                      {index + 1}
                    </TourShowsStatPill>
                  )}
                <span
                  className={cn(
                    "font-medium truncate text-xs min-w-0",
                    wlHomeV2Chrome && "song-selection-song-title",
                  )}
                >
                  {pick.song}
                </span>
                {pick.placement &&
                  (!viewMode || !isSelectionClosed) &&
                  !pick.placement.startsWith("Main Set") &&
                  (wlHomeV2Chrome ?
                    <SongSelectionPlacementPill placement={pick.placement}>
                      {pick.placement}
                    </SongSelectionPlacementPill>
                  : placementColors && (
                      <TourShowsStatPill
                        fill={placementColors.fill}
                        border={placementColors.border}
                        className="shrink-0 !text-[10px] leading-tight"
                      >
                        {pick.placement}
                      </TourShowsStatPill>
                    ))}
              </div>
              {!viewMode ? (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onMoveSongUp(pick.id)}
                    className={cn(
                      "h-6 w-6",
                      wlHomeV2Chrome &&
                        "song-selection-row-icon-btn song-selection-row-icon-btn--muted",
                    )}
                  >
                    <ChevronUp className="size-3.5" />
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onMoveSongDown(pick.id)}
                    className={cn(
                      "h-6 w-6",
                      wlHomeV2Chrome &&
                        "song-selection-row-icon-btn song-selection-row-icon-btn--muted",
                    )}
                  >
                    <ChevronDown className="size-3.5" />
                    <span className="sr-only">Move down</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      const idx = songPicks.findIndex((p) => p.id === pick.id)
                      if (idx !== -1) onRemoveSong(idx)
                    }}
                    className={cn(
                      "h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10",
                      wlHomeV2Chrome &&
                        "song-selection-row-icon-btn song-selection-row-icon-btn--danger",
                    )}
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ) : resultsGridLayout ? (
                <div
                  className={
                    wlHomeV2Chrome ?
                      "song-selection-score-cell"
                    : "flex w-11 shrink-0 items-center justify-end"
                  }
                >
                  {pick.result !== undefined || pick.score !== undefined ? (
                    <TooltipContainer
                      result={pick.result}
                      score={pick.score ?? 0}
                      pick={pick}
                      wlHomeV2Chrome={wlHomeV2Chrome}
                    />
                  ) : (
                    <span className="inline-block size-5 shrink-0" aria-hidden />
                  )}
                </div>
              ) : null}
            </div>
          )
        })

        if (wlHomeV2Chrome) {
          return (
            <div key={setId} className="song-selection-set-group">
              <div className="song-selection-set-title-row">
                <span className="song-selection-set-title-mono">
                  {getSetDisplayName(setId)}
                </span>
                {!viewMode && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveSet(setId)}
                    className={cn(
                      "h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                      "song-selection-row-icon-btn song-selection-row-icon-btn--danger",
                    )}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Remove set</span>
                  </Button>
                )}
              </div>
              <div className="song-selection-set-block">
                <div className="bg-transparent">{songRows}</div>
              </div>
            </div>
          )
        }

        return (
          <div
            key={setId}
            className="rounded-md border border-border overflow-hidden"
          >
            {resultsGridLayout ?
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 min-h-8 px-2 py-1 bg-muted/60">
                <span className="min-w-0 font-medium text-xs">
                  {getSetDisplayName(setId)}
                </span>
                <div className="flex shrink-0 justify-end" />
              </div>
            : (
              <div className="flex min-h-8 items-center justify-between gap-2 px-2 py-1 bg-muted/60">
                <span className="font-medium text-xs min-w-0">
                  {getSetDisplayName(setId)}
                </span>
                {!viewMode && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveSet(setId)}
                    className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Remove set</span>
                  </Button>
                )}
              </div>
            )}
            <div className="p-2">{songRows}</div>
          </div>
        )
      })}
    </div>
  )

  if (wlHomeV2Chrome) {
    return (
      <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural song-selection-tour-panel">
        <div className="wl-home-v2-years-table-scroll min-h-0">{picksBody}</div>
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-medium">Your picks</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">{picksBody}</CardContent>
    </Card>
  )
}
