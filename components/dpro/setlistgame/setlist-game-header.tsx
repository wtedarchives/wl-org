"use client"

import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SetlistGameHeaderProps {
  isAdminUser: boolean
  onShowRules: () => void
  onShowScoring: () => void
}

export function SetlistGameHeader({
  isAdminUser,
  onShowRules,
  onShowScoring,
}: SetlistGameHeaderProps) {
  return (
    <div className="flex flex-row justify-between items-center bg-muted/60 border border-border rounded-lg px-4 py-2">
      <h1 className="text-sm font-semibold">Setlist Game</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onShowRules}>
          <HelpCircle className="size-4" />
          <span>How to Play</span>
        </Button>
        {isAdminUser && (
          <Button variant="destructive" size="sm" onClick={onShowScoring}>
            Score Show
          </Button>
        )}
      </div>
    </div>
  )
}
