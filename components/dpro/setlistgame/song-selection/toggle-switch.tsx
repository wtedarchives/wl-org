"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToggleSwitchProps {
  showActualSetlist: boolean
  setShowActualSetlist: (show: boolean) => void
  /** Default "My Picks". */
  leftLabel?: string
  /** Default "Actual Setlist". */
  rightLabel?: string
  /**
   * WL Home v2 song-selection modal: bordered control matching footer Close;
   * selected state uses stronger fill/border (mobile-only usage in dialog).
   */
  wlV2Chrome?: boolean
}

export function ToggleSwitch({
  showActualSetlist,
  setShowActualSetlist,
  leftLabel = "My Picks",
  rightLabel = "Actual Setlist",
  wlV2Chrome = false,
}: ToggleSwitchProps) {
  if (wlV2Chrome) {
    return (
      <div
        className="song-selection-view-toggle-track"
        role="group"
        aria-label="Switch between picks and actual setlist"
      >
        <button
          type="button"
          className={cn(
            "song-selection-view-toggle-btn",
            !showActualSetlist ?
              "song-selection-view-toggle-btn--active"
            : "song-selection-view-toggle-btn--inactive",
          )}
          aria-pressed={!showActualSetlist}
          onClick={() => setShowActualSetlist(false)}
        >
          {leftLabel}
        </button>
        <button
          type="button"
          className={cn(
            "song-selection-view-toggle-btn",
            showActualSetlist ?
              "song-selection-view-toggle-btn--active"
            : "song-selection-view-toggle-btn--inactive",
          )}
          aria-pressed={showActualSetlist}
          onClick={() => setShowActualSetlist(true)}
        >
          {rightLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center my-3 gap-2">
      <Button
        variant={!showActualSetlist ? "default" : "outline"}
        size="sm"
        onClick={() => setShowActualSetlist(false)}
      >
        {leftLabel}
      </Button>
      <Button
        variant={showActualSetlist ? "default" : "outline"}
        size="sm"
        onClick={() => setShowActualSetlist(true)}
      >
        {rightLabel}
      </Button>
    </div>
  )
}
