"use client"

import { Button } from "@/components/ui/button"

interface ToggleSwitchProps {
  showActualSetlist: boolean
  setShowActualSetlist: (show: boolean) => void
  /** Default "My Picks". */
  leftLabel?: string
  /** Default "Actual Setlist". */
  rightLabel?: string
}

export function ToggleSwitch({
  showActualSetlist,
  setShowActualSetlist,
  leftLabel = "My Picks",
  rightLabel = "Actual Setlist",
}: ToggleSwitchProps) {
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
