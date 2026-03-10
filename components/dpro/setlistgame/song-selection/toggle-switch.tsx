"use client"

import { Button } from "@/components/ui/button"

interface ToggleSwitchProps {
  showActualSetlist: boolean
  setShowActualSetlist: (show: boolean) => void
}

export function ToggleSwitch({
  showActualSetlist,
  setShowActualSetlist,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-center my-3 gap-0">
      <Button
        variant={!showActualSetlist ? "default" : "outline"}
        size="sm"
        onClick={() => setShowActualSetlist(false)}
      >
        My Picks
      </Button>
      <Button
        variant={showActualSetlist ? "default" : "outline"}
        size="sm"
        onClick={() => setShowActualSetlist(true)}
      >
        Actual Setlist
      </Button>
    </div>
  )
}
