"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSetlistScoring } from "@/hooks/use-setlist-scoring"
import type { GameShow } from "@/hooks/use-game-shows"
import { formatSetlistDate } from "@/lib/setlist-utils"

interface ScoringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameShows: GameShow[]
  onScoringComplete: () => void
}

export function ScoringDialog({
  open,
  onOpenChange,
  gameShows,
  onScoringComplete,
}: ScoringDialogProps) {
  const [selectedShowToScore, setSelectedShowToScore] = useState<string | null>(
    null
  )
  const { isScoring, scoringComplete, scoringError, scoreSubmissions } =
    useSetlistScoring()

  const handleScoreSubmissions = async () => {
    if (!selectedShowToScore) return

    await scoreSubmissions(selectedShowToScore, () => {
      onScoringComplete()
      onOpenChange(false)
      setSelectedShowToScore(null)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px]" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Score Setlist Game</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {scoringComplete ? (
            <div className="bg-green-500/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg border border-green-500/30 text-xs">
              Scoring completed successfully!
            </div>
          ) : scoringError ? (
            <div className="bg-destructive/20 text-destructive px-3 py-2 rounded-lg border border-destructive/30 text-xs">
              <p className="font-semibold">Error occurred:</p>
              <p>{scoringError}</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Select a show to score all submissions for:
              </p>

              <Select
                value={selectedShowToScore ?? ""}
                onValueChange={setSelectedShowToScore}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a show..." />
                </SelectTrigger>
                <SelectContent>
                  {gameShows.map((show) => (
                    <SelectItem key={show.show_id} value={show.show_id}>
                      {formatSetlistDate(show.show_date)} - [{show.show_canonid}] -{" "}
                      {show.show_subvenue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleScoreSubmissions}
                  disabled={!selectedShowToScore || isScoring}
                >
                  {isScoring ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      <span>Scoring...</span>
                    </>
                  ) : (
                    "Score Submissions"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
