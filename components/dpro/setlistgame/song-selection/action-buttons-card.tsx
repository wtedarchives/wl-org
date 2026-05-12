"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ActionButtonsCardProps {
  onAddSetBreak: () => void
  onAddEncoreBreak: () => void
  onAddNewOriginalSong: () => void
  onAddNewCoverSong: () => void
  canAddSetBreak: boolean
  canAddEncoreBreak: boolean
  wlHomeV2Chrome?: boolean
}

export function ActionButtonsCard({
  onAddSetBreak,
  onAddEncoreBreak,
  onAddNewOriginalSong,
  onAddNewCoverSong,
  canAddSetBreak,
  canAddEncoreBreak,
  wlHomeV2Chrome = false,
}: ActionButtonsCardProps) {
  if (wlHomeV2Chrome) {
    return (
      <div className="widget-panel song-selection-tour-panel song-selection-form-panel">
        <div className="wp-head song-selection-form-panel-head">
          <span>Add to setlist</span>
        </div>
        <div className="song-selection-action-grid">
          <button
            type="button"
            className="song-selection-action-tile song-selection-action-tile--amber"
            disabled={!canAddSetBreak}
            onClick={onAddSetBreak}
          >
            Add Set Break
          </button>
          <button
            type="button"
            className="song-selection-action-tile song-selection-action-tile--rose"
            disabled={!canAddEncoreBreak}
            onClick={onAddEncoreBreak}
          >
            Add Encore Break
          </button>
          <button
            type="button"
            className="song-selection-action-tile song-selection-action-tile--emerald"
            onClick={onAddNewOriginalSong}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            New Original Song
          </button>
          <button
            type="button"
            className="song-selection-action-tile song-selection-action-tile--sky"
            onClick={onAddNewCoverSong}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            New Cover Song
          </button>
        </div>
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm font-medium">Add to setlist</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={onAddSetBreak}
            disabled={!canAddSetBreak}
            className="h-auto text-xs py-1 border-amber-500/60 bg-amber-500/20 text-amber-800 hover:bg-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/30"
          >
            Add Set Break
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddEncoreBreak}
            disabled={!canAddEncoreBreak}
            className="h-auto text-xs py-1 border-red-400/60 bg-red-400/20 text-red-800 hover:bg-red-400/30 dark:text-red-200 dark:hover:bg-red-400/30"
          >
            Add Encore Break
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddNewOriginalSong}
            className="h-auto text-xs py-1 border-green-400/60 bg-green-400/20 text-green-800 hover:bg-green-400/30 dark:text-green-200 dark:hover:bg-green-400/30"
          >
            <Plus className="size-3" />
            New Original Song
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddNewCoverSong}
            className="h-auto text-xs py-1 border-blue-400/60 bg-blue-400/20 text-blue-800 hover:bg-blue-400/30 dark:text-blue-200 dark:hover:bg-blue-400/30"
          >
            <Plus className="size-3" />
            New Cover Song
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
