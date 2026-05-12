"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { getPlacementBarPillColors } from "@/lib/placement-bar-color"
import { cn } from "@/lib/utils"
import type { SetlistEntry } from "./types"
import { getSetDisplayName, getSongsForActualSet } from "./utils"
import { SongSelectionNumCell } from "./song-selection-num-cell"

interface ActualSetlistCardProps {
  actualSetlist: SetlistEntry[]
  songPicks: { set: string }[]
  wlHomeV2Chrome?: boolean
}

function getUniqueSetsFromPicksAndActual(
  picks: { set: string }[],
  actual: SetlistEntry[],
): string[] {
  const pickSets = new Set(picks.map((p) => p.set))
  const actualSets = new Set(actual.map((e) => e.entry_set))
  const all = new Set([...pickSets, ...actualSets])
  const numeric = Array.from(all)
    .filter((s) => !s.startsWith("E"))
    .sort((a, b) => parseInt(a) - parseInt(b))
  const encore = Array.from(all)
    .filter((s) => s.startsWith("E"))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
  return [...numeric, ...encore]
}

export function ActualSetlistCard({
  actualSetlist,
  songPicks,
  wlHomeV2Chrome = false,
}: ActualSetlistCardProps) {
  const uniqueSets = getUniqueSetsFromPicksAndActual(songPicks, actualSetlist)

  const emptyMessage = (
    <p
      className={cn(
        "text-center py-6 text-sm",
        wlHomeV2Chrome ? "song-selection-muted-caption" : "text-muted-foreground",
      )}
    >
      No setlist available yet.
    </p>
  )

  if (actualSetlist.length === 0) {
    if (wlHomeV2Chrome) {
      return (
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural song-selection-tour-panel">
          <div className="wl-home-v2-years-table-scroll min-h-0 px-1 py-2">
            {emptyMessage}
          </div>
        </div>
      )
    }
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Actual setlist</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">{emptyMessage}</CardContent>
      </Card>
    )
  }

  const body = (
    <div
      className={cn(
        wlHomeV2Chrome ? "song-selection-sets-stack px-0 py-1" : "space-y-2",
      )}
    >
      {uniqueSets.map((setId) => {
        const entries = getSongsForActualSet(actualSetlist, setId)
        if (entries.length === 0) return null

        const entryRows = entries.map((entry, index) => {
          const placementColors = getPlacementBarPillColors(entry.entry_placement)
          return (
            <div
              key={entry.entry_id}
              className={cn(
                "flex items-center gap-2 px-2 transition-colors",
                wlHomeV2Chrome ?
                  "song-selection-tour-row"
                : "rounded-md hover:bg-muted/40",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {wlHomeV2Chrome ?
                  <SongSelectionNumCell
                    placement={entry.entry_placement ?? undefined}
                    n={index + 1}
                  />
                : <TourShowsStatPill
                    fill={placementColors.fill}
                    border={placementColors.border}
                    className="shrink-0 tabular-nums min-w-[1.25rem] text-center"
                  >
                    {index + 1}
                  </TourShowsStatPill>
                }
                <span
                  className={cn(
                    "min-w-0 truncate font-medium",
                    wlHomeV2Chrome ? "song-selection-song-title" : "text-xs",
                  )}
                >
                  {entry.entry_song}
                </span>
              </div>
              <div
                className={
                  wlHomeV2Chrome ?
                    "song-selection-score-cell"
                  : "flex w-11 shrink-0 items-center justify-end"
                }
                aria-hidden={true}
              />
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
              </div>
              <div className="song-selection-set-block">
                <div className="bg-transparent">{entryRows}</div>
              </div>
            </div>
          )
        }

        return (
          <div
            key={setId}
            className="rounded-md border border-border overflow-hidden"
          >
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 min-h-8 px-2 py-1 bg-muted/60">
              <span className="font-medium text-xs min-w-0">
                {getSetDisplayName(setId)}
              </span>
              <div className="flex shrink-0 justify-end" />
            </div>
            <div className="p-2">{entryRows}</div>
          </div>
        )
      })}
    </div>
  )

  if (wlHomeV2Chrome) {
    return (
      <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural song-selection-tour-panel">
        <div className="wl-home-v2-years-table-scroll min-h-0">{body}</div>
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-medium">Actual setlist</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">{body}</CardContent>
    </Card>
  )
}
