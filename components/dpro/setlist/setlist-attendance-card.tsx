"use client"

import { cn } from "@/lib/utils"
import { SetlistAttendButton } from "./setlist-attend-button"

interface SetlistAttendanceCardProps {
  attendeeCount: number
  attended?: boolean
  toggling?: boolean
  onToggle?: () => void
  showAttendButton?: boolean
}

const CARD_PADDING = "p-2"
const CARD_MIN_HEIGHT = "min-h-[64px]"

export function SetlistAttendanceCard({
  attendeeCount,
  attended = false,
  toggling = false,
  onToggle,
  showAttendButton = false,
}: SetlistAttendanceCardProps) {
  return (
    <div className="w-full rounded-lg border border-border/60 bg-card/80">
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1",
          CARD_PADDING,
          CARD_MIN_HEIGHT
        )}
      >
        {showAttendButton && onToggle && (
          <SetlistAttendButton
            attended={attended}
            toggling={toggling}
            onToggle={onToggle}
            className="w-full"
          />
        )}
        <span className="text-xs text-muted-foreground">
          {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"}
        </span>
      </div>
    </div>
  )
}
