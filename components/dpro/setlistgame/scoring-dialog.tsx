"use client"

import { useEffect, useId, useState } from "react"
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
import { cn } from "@/lib/utils"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  WL_HOME_V2_SETLIST_SELECT_CONTENT,
  WL_HOME_V2_SETLIST_SELECT_TRIGGER,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.constants"
import { useSetlistScoring } from "@/hooks/use-setlist-scoring"
import type { GameShow } from "@/hooks/use-game-shows"
import { formatSetlistDate } from "@/lib/setlist-utils"

import "./scoring-dialog.css"

interface ScoringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameShows: GameShow[]
  onScoringComplete: () => void
  /** Use WL Home v2 portal + `modal--wted-request` (Request a Song) chrome. */
  wlHomeV2?: boolean
}

export function ScoringDialog({
  open,
  onOpenChange,
  gameShows,
  onScoringComplete,
  wlHomeV2 = false,
}: ScoringDialogProps) {
  const headingId = useId()
  const subtextId = useId()
  const [selectedShowToScore, setSelectedShowToScore] = useState<string | null>(
    null,
  )
  const { isScoring, scoringComplete, scoringError, scoreSubmissions } =
    useSetlistScoring()

  useWlHomeV2ScrollLock(open && wlHomeV2)

  useEffect(() => {
    if (!open) setSelectedShowToScore(null)
  }, [open])

  useEffect(() => {
    if (!open || !wlHomeV2) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, wlHomeV2, onOpenChange])

  const handleScoreSubmissions = async () => {
    if (!selectedShowToScore) return

    await scoreSubmissions(selectedShowToScore, () => {
      onScoringComplete()
      onOpenChange(false)
      setSelectedShowToScore(null)
    })
  }

  const onClose = () => onOpenChange(false)

  const v2BodyInner =
    scoringComplete ?
      <div
        className="setlist-game-scoring-alert setlist-game-scoring-alert--success"
        role="status"
      >
        Scoring completed successfully!
      </div>
    : scoringError ?
      <div
        className="setlist-game-scoring-alert setlist-game-scoring-alert--error"
        role="alert"
      >
        <strong>Error</strong>
        <span>{scoringError}</span>
      </div>
    : (
      <Select
        value={selectedShowToScore ?? ""}
        onValueChange={setSelectedShowToScore}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            WL_HOME_V2_SETLIST_SELECT_TRIGGER,
            "h-auto w-full min-h-0 justify-between gap-1.5 tabular-nums shadow-none",
          )}
        >
          <SelectValue placeholder="Select a show…" />
        </SelectTrigger>
        <SelectContent className={WL_HOME_V2_SETLIST_SELECT_CONTENT}>
          {gameShows.map((show) => (
            <SelectItem
              key={show.show_id}
              value={show.show_id}
              className="text-xs font-medium tabular-nums"
            >
              {`${formatSetlistDate(show.show_date)} - [${show.show_canonid}] - ${show.show_subvenue}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )

  if (wlHomeV2) {
    if (!open) return null

    return (
      <WlHomeV2ModalPortal open={open}>
        <div
          className="modal-backdrop open"
          id="setlist-game-scoring-modal"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div
            className="modal modal--wted-request modal--setlist-game-scoring"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={scoringComplete || scoringError ? undefined : subtextId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-request-head">
              <div className="modal-request-head-text">
                <h3 id={headingId}>Score Setlist Game</h3>
                {!scoringComplete && !scoringError ?
                  <p id={subtextId} className="modal-request-sub">
                    Choose a show, then score every submission for that show.
                  </p>
                : null}
              </div>
              <button
                type="button"
                className="modal-request-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-request-body">
              <div className="setlist-game-scoring-stack">{v2BodyInner}</div>
              {!scoringComplete ?
                <div className="modal-setlist-song-footer">
                  <button
                    type="button"
                    className="modal-setlist-song-footer-close"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="setlist-game-scoring-submit"
                    onClick={handleScoreSubmissions}
                    disabled={!selectedShowToScore || isScoring}
                  >
                    {isScoring ?
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        <span>Scoring…</span>
                      </>
                    : (
                      "Score submissions"
                    )}
                  </button>
                </div>
              : null}
            </div>
          </div>
        </div>
      </WlHomeV2ModalPortal>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px]" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Score Setlist Game</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {scoringComplete ?
            <div className="rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2 text-xs text-green-700 dark:text-green-400">
              Scoring completed successfully!
            </div>
          : scoringError ?
            <div className="rounded-lg border border-destructive/30 bg-destructive/20 px-3 py-2 text-xs text-destructive">
              <p className="font-semibold">Error occurred:</p>
              <p>{scoringError}</p>
            </div>
          : (
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
                      {`${formatSetlistDate(show.show_date)} - [${show.show_canonid}] - ${show.show_subvenue}`}
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
                  {isScoring ?
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      <span>Scoring...</span>
                    </>
                  : (
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
