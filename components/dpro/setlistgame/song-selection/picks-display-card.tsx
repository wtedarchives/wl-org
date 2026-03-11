"use client"

import { X, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SongPick, SetlistEntry } from "./types"
import {
  getPlacementColor,
  getSetDisplayName,
  getUniqueSets,
  getAllUniqueSets,
  getSongsForSet,
  getSongsForActualSet,
} from "./utils"
import { TooltipContainer } from "./tooltip-container"

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
}: PicksDisplayCardProps) {
  const uniqueSets = (viewMode && show_scored)
    ? getAllUniqueSets(songPicks, actualSetlist)
    : getUniqueSets(songPicks)

  if (songPicks.length === 0 && !(viewMode && show_scored && actualSetlist.length > 0)) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Your picks</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm text-muted-foreground text-center py-6">
            No songs selected yet. Add songs to begin.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-medium">Your picks</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {uniqueSets.map((setId) => (
            <div key={setId} className="rounded-md border border-border overflow-hidden">
              <div className="flex justify-between items-center px-2 py-1 bg-muted/60">
                <span className="text-xs font-medium">{getSetDisplayName(setId)}</span>
                {!viewMode && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveSet(setId)}
                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Remove set</span>
                  </Button>
                )}
              </div>
              <div className="space-y-0.5 p-2">
                {getSongsForSet(songPicks, setId).map((pick, index) => (
                  <div
                    key={pick.id}
                    className="flex justify-between items-center rounded-md py-0.5 px-2 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="shrink-0 text-xs text-white px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: getPlacementColor(pick.placement) }}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`font-medium truncate ${viewMode ? "text-xs" : "text-sm"}`}
                      >
                        {pick.song}
                      </span>
                      {pick.placement &&
                        (!viewMode || !isSelectionClosed) &&
                        !pick.placement.startsWith("Main Set") && (
                          <span
                            className="shrink-0 text-[10px] text-white px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: getPlacementColor(pick.placement) }}
                          >
                            {pick.placement}
                          </span>
                        )}
                    </div>
                    {!viewMode ? (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onMoveSongUp(pick.id)}
                          className="h-6 w-6"
                        >
                          <ChevronUp className="size-3.5" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onMoveSongDown(pick.id)}
                          className="h-6 w-6"
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
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="size-3.5" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ) : (
                      show_scored &&
                      (pick.result !== undefined || pick.score !== undefined) && (
                        <TooltipContainer
                          result={pick.result}
                          score={pick.score ?? 0}
                          pick={pick}
                        />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
